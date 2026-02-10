import React, { useEffect, useRef } from 'react';
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
}

interface GapHeatmapProps {
  width?: number;
  height?: number;
  data: GapData[];
  onGapClick?: (gap: GapData) => void;
}

export const GapHeatmap: React.FC<GapHeatmapProps> = ({
  width = 800,
  height = 600,
  data,
  onGapClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Set up dimensions
    const margin = { top: 60, right: 60, bottom: 80, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const categories = ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing'];
    const xScale = d3.scaleBand()
      .domain(categories)
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([1, 10])
      .range([innerHeight, 0])
      .nice();

    // Color scale for performance scores
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([0, 100]);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', '#1F2937')
      .style('border', '1px solid #374151')
      .style('border-radius', '4px')
      .style('color', 'white')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Prepare data for heatmap
    const heatmapData = categories.map(category => {
      const categoryData = data.filter(d => d.category === category);
      return Array(10).fill(null).map((_, level) => {
        const gap = categoryData.find(d => d.level === level + 1);
        return {
          category,
          level: level + 1,
          gap: gap || null
        };
      });
    }).flat();

    // Create cells
    const cells = g.selectAll('rect')
      .data(heatmapData)
      .enter().append('rect')
      .attr('x', d => xScale(d.category) || 0)
      .attr('y', d => yScale(d.level))
      .attr('width', xScale.bandwidth())
      .attr('height', innerHeight / 10)
      .attr('fill', d => d.gap ? colorScale(d.gap.score) : '#334155')
      .attr('stroke', '#1F2937')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.gap) {
          onGapClick?.(d.gap);
        }
      })
      .on('mouseover', (event, d) => {
        if (d.gap) {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html(`
            <div><strong>${d.gap.category}</strong> - Level ${d.gap.level}</div>
            <div>Score: ${d.gap.score}%</div>
            <div>Frequency: ${d.gap.frequency}</div>
            <div>Improvement: ${d.gap.improvement > 0 ? '+' : ''}${d.gap.improvement}%</div>
            <div>Last reviewed: ${new Date(d.gap.lastReviewed).toLocaleDateString()}</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        }
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
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
      .text('Experience Gap Heatmap');

    // Add color scale legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - margin.right - legendWidth - 20;
    const legendY = margin.top - 40;

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

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [width, height, data, onGapClick]);

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-xl font-bold text-white mb-4">Experience Gap Heatmap</h3>
      <svg
        ref={svgRef}
        className="border border-gray-700 rounded-lg"
      />
      <div className="mt-4 text-sm text-gray-400">
        <p>Click on any cell to view detailed gap information and improvement suggestions.</p>
        <p>Green areas indicate strong performance, red areas show areas for improvement.</p>
      </div>
    </div>
  );
};