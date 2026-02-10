import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Tailwind } from '@tailwindcss/ui';

interface WordNode {
  id: string;
  word: string;
  x: number;
  y: number;
  radius: number;
  group: string;
  connections: string[];
  difficulty: number;
  frequency: number;
}

interface WordGalaxyProps {
  width?: number;
  height?: number;
  nodes: WordNode[];
  onNodeClick?: (node: WordNode) => void;
  onNodeHover?: (node: WordNode | null) => void;
}

export const WordGalaxy: React.FC<WordGalaxyProps> = ({
  width = 800,
  height = 600,
  nodes,
  onNodeClick,
  onNodeHover
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<WordNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Color scheme for different word groups
  const colorScale = d3.scaleOrdinal()
    .domain(['vocabulary', 'grammar', 'expression', 'idiom'])
    .range(['#3B82F6', '#10B981', '#F59E0B', '#EF4444']);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        setZoomLevel(event.transform.k);
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create main group
    const g = svg.append('g');

    // Add background
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#0F172A');

    // Create force simulation
    const simulation = d3.forceSimulation<WordNode>(nodes)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 5))
      .force('link', d3.forceLink()
        .id(d => d.id)
        .links(nodes.flatMap(node =>
          node.connections.map(targetId => ({ source: node.id, target: targetId }))
        ))
        .distance(d => 150 / zoomLevel)
        .strength(0.1));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(nodes.flatMap(node =>
        node.connections.map(targetId => ({ source: node, target: nodes.find(n => n.id === targetId) }))
      ))
      .enter().append('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, WordNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => colorScale(d.group))
      .attr('opacity', d => 0.8 + (d.frequency / 100))
      .on('click', (event, d) => {
        setSelectedNode(d);
        onNodeClick?.(d);
      })
      .on('mouseover', (event, d) => {
        onNodeHover?.(d);
      })
      .on('mouseout', () => {
        onNodeHover?.(null);
      });

    // Add text labels
    node.append('text')
      .text(d => d.word)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(10, d.radius / 2))
      .attr('font-weight', '500');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Cleanup on unmount
    return () => {
      simulation.stop();
    };
  }, [width, height, nodes, onNodeClick, onNodeHover]);

  return (
    <div className="relative bg-slate-900 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Word Galaxy</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Zoom: {zoomLevel.toFixed(1)}x</span>
          <button
            onClick={() => setZoomLevel(1)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Reset
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="border border-gray-700 rounded-lg"
      />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {['vocabulary', 'grammar', 'expression', 'idiom'].map(group => (
          <div key={group} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colorScale(group) }}
            />
            <span className="text-sm text-gray-300 capitalize">{group}</span>
          </div>
        ))}
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-gray-700">
          <h4 className="font-semibold text-white mb-2">{selectedNode.word}</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Category:</span>
              <span className="text-white ml-2 capitalize">{selectedNode.group}</span>
            </div>
            <div>
              <span className="text-gray-400">Difficulty:</span>
              <span className="text-white ml-2">{selectedNode.difficulty}/10</span>
            </div>
            <div>
              <span className="text-gray-400">Frequency:</span>
              <span className="text-white ml-2">{selectedNode.frequency}</span>
            </div>
            <div>
              <span className="text-gray-400">Connections:</span>
              <span className="text-white ml-2">{selectedNode.connections.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};