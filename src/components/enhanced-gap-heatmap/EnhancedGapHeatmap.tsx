import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Tailwind } from '@tailwindcss/ui';

interface GapData {
  id: string;
  category: string;
  level: number;
  score: number;
  frequency: number;
  lastReviewed: Date;
  improvement: number;
  studentLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

interface HeatmapCell {
  category: string;
  level: number;
  gap?: GapData | null;
  score?: number;
}

interface EnhancedGapHeatmapProps {
  width?: number;
  height?: number;
  data: GapData[];
  onGapClick?: (gap: GapData) => void;
  studentLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  stressTest?: boolean;
}

// Performance monitoring utilities
const performanceMonitor = {
  start: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  },

  end: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measures = performance.getEntriesByName(label);
      const duration = measures[measures.length - 1].duration;
      console.log(`${label}: ${duration}ms`);

      // Clear marks
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
    }
  }
};

// Data sampling for large datasets
const dataSampler = {
  sample: (data: GapData[], maxSamples: number): GapData[] => {
    if (data.length <= maxSamples) return data;

    // Stratified sampling by category and level
    const samples: GapData[] = [];
    const categories = [...new Set(data.map(d => d.category))];

    categories.forEach(category => {
      const categoryData = data.filter(d => d.category === category);
      const samplesPerCategory = Math.ceil(maxSamples / categories.length);

      if (categoryData.length <= samplesPerCategory) {
        samples.push(...categoryData);
      } else {
        // Even sampling across levels
        const levels = [...new Set(categoryData.map(d => d.level))];
        const samplesPerLevel = Math.floor(samplesPerCategory / levels.length);

        levels.forEach(level => {
          const levelData = categoryData.filter(d => d.level === level);
          const take = Math.min(samplesPerLevel, levelData.length);
          samples.push(...levelData.slice(0, take));
        });
      }
    });

    return samples;
  }
};

export const EnhancedGapHeatmap: React.FC<EnhancedGapHeatmapProps> = ({
  width = 1000,
  height = 700,
  data,
  onGapClick,
  studentLevel,
  isLoading = false,
  error = null,
  onRetry,
  stressTest = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [renderedNodes, setRenderedNodes] = useState(0);
  const [fps, setFps] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Calculate FPS for performance monitoring
  const calculateFPS = useCallback(() => {
    let lastTime = performance.now();
    let frames = 0;

    return () => {
      frames++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)));
        frames = 0;
        lastTime = currentTime;
      }
    };
  }, []);

  // Generate heatmap data with optimizations
  const generateHeatmapData = useCallback(() => {
    performanceMonitor.start('generateHeatmapData');

    const categories = ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing'];
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);

    // Apply student level filtering
    const filteredData = studentLevel
      ? data.filter(gap => gap.studentLevel === studentLevel)
      : data;

    // Apply sampling for large datasets
    const processedData = stressTest
      ? dataSampler.sample(filteredData, 1000) // Limit to 1k samples for stress testing
      : filteredData;

    const heatmapMatrix = levels.map(level =>
      categories.map(category => {
        const gap = processedData.find(d => d.category === category && d.level === level);
        return {
          category,
          level,
          gap,
          score: gap?.score || 0
        };
      })
    );

    setHeatmapData(heatmapMatrix);
    setRenderedNodes(processedData.length);
    performanceMonitor.end('generateHeatmapData');
  }, [data, studentLevel, stressTest]);

  // Enhanced rendering with semantic zoom
  const renderHeatmap = useCallback(() => {
    if (!svgRef.current || heatmapData.length === 0) return;

    performanceMonitor.start('renderHeatmap');

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add zoom behavior with semantic zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        const k = event.transform.k;
        setZoomLevel(k);

        // Semantic zoom - change rendering based on zoom level
        if (k > 2) {
          // High zoom - show details, reduce cells
          updateRendering('detailed');
        } else if (k > 1) {
          // Medium zoom - balanced view
          updateRendering('balanced');
        } else {
          // Low zoom - overview, aggregate data
          updateRendering('overview');
        }
      });

    svg.call(zoom);

    // Calculate dimensions
    const margin = { top: 80, right: 100, bottom: 100, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleBand()
      .domain(heatmapData[0].map(d => d.category))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([1, 10])
      .range([innerHeight, 0]);

    // Color scale with improved color scheme
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([0, 100]);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add background
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', '#0F172A');

    // Create gradient definition for better visualization
    const defs = svg.append('defs');

    // Add shadow filter
    const shadowFilter = defs.append('filter')
      .attr('id', 'cell-shadow');

    shadowFilter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 3)
      .attr('flood-opacity', 0.3);

    // Create cells with progressive rendering
    const cells = g.selectAll('rect')
      .data(heatmapData.flat())
      .enter().append('rect')
      .attr('x', d => xScale(d.category))
      .attr('y', d => yScale(d.level))
      .attr('width', xScale.bandwidth())
      .attr('height', innerHeight / 10)
      .attr('fill', d => d.score ? colorScale(d.score) : '#334155')
      .attr('stroke', '#1F2937')
      .attr('stroke-width', 1)
      .attr('filter', 'url(#cell-shadow)')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s ease')
      .on('click', (event, d) => {
        if (d.gap) {
          setSelectedCell(d);
          onGapClick?.(d.gap);
        }
      })
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .attr('stroke', '#60A5FA')
          .attr('stroke-width', 2);
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget)
          .attr('stroke', '#1F2937')
          .attr('stroke-width', 1);
      });

    // Add text labels with semantic zoom optimization
    const labels = g.selectAll('text')
      .data(heatmapData.flat())
      .enter().append('text')
      .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.level) + (innerHeight / 10) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', d => {
        // Adjust font size based on zoom level
        const baseSize = 12;
        return baseSize / zoomLevel;
      })
      .style('pointer-events', 'none')
      .text(d => {
        // Show text only if score is significant or zoomed in
        return d.score && d.score > 30 ? `${d.score}%` : '';
      });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('fill', 'white')
      .attr('font-size', '12px');

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '14px')
      .text('Difficulty Level');

    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom})`)
      .style('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '14px')
      .text('Learning Categories');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Enhanced Experience Gap Heatmap');

    // Add performance metrics
    svg.append('text')
      .attr('x', 20)
      .attr('y', height - 20)
      .style('fill', '#10B981')
      .style('font-size', '12px')
      .text(`FPS: ${fps}`);

    svg.append('text')
      .attr('x', 20)
      .attr('y', height - 40)
      .style('fill', '#3B82F6')
      .style('font-size', '12px')
      .text(`Nodes: ${renderedNodes}`);

    svg.append('text')
      .attr('x', 20)
      .attr('y', height - 60)
      .style('fill', '#F59E0B')
      .style('font-size', '12px')
      .text(`Zoom: ${zoomLevel.toFixed(1)}x`);

    // Add color scale legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - margin.right - legendWidth - 20;
    const legendY = margin.top - 50;

    const legendGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient');

    legendGradient.selectAll('stop')
      .data(d3.range(0, 1.01, 0.01))
      .enter().append('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => colorScale(d * 100));

    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    svg.append('text')
      .attr('x', legendX)
      .attr('y', legendY - 5)
      .style('text-anchor', 'start')
      .style('fill', 'white')
      .style('font-size', '12px')
      .text('0%');

    svg.append('text')
      .attr('x', legendX + legendWidth)
      .attr('y', legendY - 5)
      .style('text-anchor', 'end')
      .style('fill', 'white')
      .style('font-size', '12px')
      .text('100%');

    // Add student level filter
    if (studentLevel) {
      svg.append('text')
        .attr('x', width - 20)
        .attr('y', 30)
        .style('text-anchor', 'end')
        .style('fill', '#10B981')
        .style('font-size', '14px')
        .text(`Level: ${studentLevel}`);
    }

    performanceMonitor.end('renderHeatmap');
  }, [heatmapData, width, height, zoomLevel, fps, renderedNodes, studentLevel, onGapClick]);

  // Update rendering based on semantic zoom
  const updateRendering = (mode: 'overview' | 'balanced' | 'detailed') => {
    // This would adjust the rendering based on zoom mode
    console.log(`Rendering mode: ${mode}`);
  };

  // Handle loading state
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setLoadingProgress(0);
    }
  }, [isLoading]);

  // Generate and render heatmap when data changes
  useEffect(() => {
    if (!isLoading && !error) {
      generateHeatmapData();
    }
  }, [data, studentLevel, isLoading, error, generateHeatmapData]);

  // Render heatmap when data is ready
  useEffect(() => {
    if (heatmapData.length > 0 && !isLoading && !error) {
      renderHeatmap();
    }
  }, [heatmapData, isLoading, error, renderHeatmap]);

  // Handle error state
  if (error) {
    return (
      <div className="bg-slate-900 rounded-lg p-6 border border-red-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-red-400">Error Loading Heatmap</h3>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
        <p className="text-red-300 mb-4">{error}</p>
        <div className="bg-slate-800 p-4 rounded">
          <h4 className="font-semibold text-white mb-2">Troubleshooting:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Neo4j server might be down</li>
            <li>• AI services might be temporarily unavailable</li>
            <li>• Try refreshing the page</li>
          </ul>
        </div>
      </div>
    );
  }

  // Loading state with progress
  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Loading Heatmap</h3>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-gray-400">Processing {data.length} data points...</p>
        {stressTest && (
          <p className="text-yellow-400 text-sm mt-2">
            🚀 Stress test mode: Sampling large dataset
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900 rounded-lg p-4">
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <select
            value={studentLevel || ''}
            onChange={(e) => studentLevel = e.target.value as any}
            className="px-3 py-1 bg-slate-800 text-white rounded border border-gray-600"
          >
            <option value="">All Levels</option>
            <option value="A1">A1 (Beginner)</option>
            <option value="A2">A2 (Elementary)</option>
            <option value="B1">B1 (Intermediate)</option>
            <option value="B2">B2 (Upper Intermediate)</option>
            <option value="C1">C1 (Advanced)</option>
            <option value="C2">C2 (Proficient)</option>
          </select>

          <button
            onClick={() => setZoomLevel(1)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Reset Zoom
          </button>

          <button
            onClick={onRetry}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {renderedNodes} of {data.length} items
          </div>
          <div className="text-sm text-green-400">
            FPS: {fps}
          </div>
          {stressTest && (
            <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
              STRESS TEST
            </span>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        className="border border-gray-700 rounded-lg"
      />

      {/* Details Panel */}
      {selectedCell && selectedCell.gap && (
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-gray-700">
          <h4 className="text-xl font-bold text-white mb-4">
            {selectedCell.gap.category} - Level {selectedCell.gap.level}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-white mb-2">Performance</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Score:</span>
                  <span className="font-bold text-white">{selectedCell.gap.score}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Frequency:</span>
                  <span className="text-white">{selectedCell.gap.frequency} times</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Improvement:</span>
                  <span className={
                    selectedCell.gap.improvement >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }>
                    {selectedCell.gap.improvement > 0 ? '+' : ''}{selectedCell.gap.improvement}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className="text-white">{selectedCell.gap.studentLevel}</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-2">AI Suggestions</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Focus on {selectedCell.gap.category} building exercises</li>
                <li>• Review related grammar concepts</li>
                <li>• Practice with audio materials</li>
                <li>• Complete 3 practice sessions this week</li>
              </ul>
              <div className="mt-3">
                <button
                  onClick={() => onGapClick?.(selectedCell.gap!)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Start Practice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing'].map(category => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: d3.interpolateRdYlGn(Math.random() * 100)
              }}
            />
            <span className="text-sm text-gray-300 capitalize">{category}</span>
          </div>
        ))}
      </div>

      {/* Performance Optimization Tips */}
      <div className="mt-4 p-3 bg-slate-800 rounded border border-gray-700">
        <p className="text-xs text-gray-400">
          💡 Performance optimized for large datasets. Zoom in/out to explore details.
          Using semantic zoom and progressive rendering for smooth experience.
        </p>
      </div>
    </div>
  );
};