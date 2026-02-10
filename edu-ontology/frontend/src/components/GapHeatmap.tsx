import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GapData {
  word: string;
  gap: number; // 0-1 scale (0 = no gap, 1 = critical gap)
  pos: string;
  frequency: number;
  lastSeen: string;
}

interface GapHeatmapProps {
  data: GapData[];
  width?: number;
  height?: number;
  onWordClick?: (word: string, gap: number) => void;
  showLegend?: boolean;
  showTooltips?: boolean;
}

export const GapHeatmap: React.FC<GapHeatmapProps> = ({
  data,
  width = 800,
  height = 600,
  onWordClick,
  showLegend = true,
  showTooltips = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const container = svg.append('g');

    // Calculate grid dimensions
    const gridSize = Math.ceil(Math.sqrt(data.length));
    const cellSize = Math.min(width, height) / gridSize;

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([1, 0]); // Reverse so red = high gap

    // Create tooltip
    const tooltip = showTooltips ? d3.select('body').append('div')
      .attr('class', 'absolute bg-gray-800 text-white p-2 rounded shadow-lg text-sm pointer-events-none opacity-0 z-50')
      .style('padding', '8px')
      .style('border-radius', '4px') : null;

    // Create cells
    const cells = container.selectAll('.gap-cell')
      .data(data)
      .enter().append('g')
      .attr('class', 'gap-cell')
      .attr('transform', (d, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        return `translate(${col * cellSize}, ${row * cellSize})`;
      })
      .on('click', (event, d) => {
        if (onWordClick) {
          onWordClick(d.word, d.gap);
        }
      })
      .on('mouseover', (event, d) => {
        if (tooltip) {
          tooltip.transition()
            .duration(200)
            .style('opacity', 1);
          tooltip.html(`
            <strong>${d.word}</strong><br/>
            Part of Speech: ${d.pos}<br/>
            Gap Level: ${Math.round(d.gap * 100)}%<br/>
            Frequency: ${d.frequency}<br/>
            Last Seen: ${new Date(d.lastSeen).toLocaleDateString()}
          `)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        }
      })
      .on('mouseout', () => {
        if (tooltip) {
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        }
      });

    // Add background rectangles
    cells.append('rect')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', d => colorScale(d.gap))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .attr('rx', 2)
      .attr('ry', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .on('mouseover', function() {
        d3.select(this)
          .attr('stroke', '#4f46e5')
          .attr('stroke-width', 3)
          .attr('transform', `scale(1.1)`)
          .attr('transform-origin', `${cellSize/2}px ${cellSize/2}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1)
          .attr('transform', 'scale(1)');
      });

    // Add text labels (only if cell is large enough)
    if (cellSize > 40) {
      cells.append('text')
        .attr('x', cellSize / 2)
        .attr('y', cellSize / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', d => d.gap > 0.5 ? 'white' : 'black')
        .attr('font-size', `${Math.min(cellSize / 4, 12)}px`)
        .attr('font-weight', 'bold')
        .text(d => d.word.length > 8 ? d.word.substring(0, 8) + '...' : d.word);
    }

    // Add gap percentage if cell is large enough
    if (cellSize > 60) {
      cells.append('text')
        .attr('x', cellSize / 2)
        .attr('y', cellSize * 0.8)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', d => d.gap > 0.5 ? 'white' : 'black')
        .attr('font-size', `${Math.min(cellSize / 6, 10)}px`)
        .text(d => `${Math.round(d.gap * 100)}%`);
    }

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text('Experience Gap Heatmap');

    // Add legend if requested
    if (showLegend) {
      const legendWidth = 200;
      const legendHeight = 20;
      const legendX = width - legendWidth - 40;
      const legendY = height - legendHeight - 20;

      // Legend background
      svg.append('rect')
        .attr('x', legendX - 10)
        .attr('y', legendY - 10)
        .attr('width', legendWidth + 20)
        .attr('height', legendHeight + 30)
        .attr('fill', 'white')
        .attr('stroke', '#ddd')
        .attr('rx', 5);

      // Color gradient
      const gradient = svg.append('defs').append('linearGradient')
        .attr('id', 'heatmap-gradient')
        .attr('x1', '0%')
        .attr('x2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.interpolateRdYlBu(1));

      gradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', d3.interpolateRdYlBu(0.5));

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.interpolateRdYlBu(0));

      svg.append('rect')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('fill', 'url(#heatmap-gradient)');

      // Legend labels
      svg.append('text')
        .attr('x', legendX)
        .attr('y', legendY + legendHeight + 20)
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .text('No Gap');

      svg.append('text')
        .attr('x', legendX + legendWidth)
        .attr('y', legendY + legendHeight + 20)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .text('Critical Gap');
    }

  }, [data, width, height, onWordClick, showLegend, showTooltips]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg shadow-sm"
      />
      {showTooltips && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded shadow-md text-xs">
          <p className="font-semibold mb-1">Instructions:</p>
          <p>• Click on a word for details</p>
          <p>• Hover for information</p>
          <p>• Color intensity = Gap level</p>
        </div>
      )}
    </div>
  );
};