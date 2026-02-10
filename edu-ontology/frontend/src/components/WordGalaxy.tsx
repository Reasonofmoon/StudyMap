import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface WordNode {
  id: string;
  text: string;
  pos: string;
  gap: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
  radius: number;
  color: string;
}

interface Link {
  source: WordNode;
  target: WordNode;
  type: string;
  weight: number;
}

interface WordGalaxyProps {
  words: string[];
  gaps: { [key: string]: number };
  width?: number;
  height?: number;
  onWordClick?: (word: string, gap: number) => void;
  semanticZoom?: boolean;
}

export const WordGalaxy: React.FC<WordGalaxyProps> = ({
  words,
  gaps,
  width = 1000,
  height = 700,
  onWordClick,
  semanticZoom = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<WordNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || !words.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const container = svg.append('g');

    // Set up zoom
    let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
    if (semanticZoom) {
      zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
          container.attr('transform', event.transform);
          setZoomLevel(event.transform.k);
        });
      svg.call(zoom);
    }

    // Generate nodes
    const nodes: WordNode[] = words.map((word, i) => {
      const gap = gaps[word] || Math.random();
      const angle = (i / words.length) * 2 * Math.PI;
      const radius = 100 + (gap * 200); // Gap affects distance from center

      return {
        id: `word-${i}`,
        text: word,
        pos: getPartOfSpeech(word),
        gap,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        radius: 5 + (gap * 15),
        color: getGapColor(gap)
      };
    });

    // Generate links (synonyms, antonyms, etc.)
    const links: Link[] = generateLinks(nodes);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-100))
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 5));

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.weight) * 2);

    // Create nodes
    const node = container.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onWordClick) {
          onWordClick(d.text, d.gap);
        }
        if (semanticZoom) {
          // Focus on clicked node
          const transform = d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(2)
            .translate(-d.x, -d.y);

          svg.transition()
            .duration(750)
            .call(zoom!.transform, transform);
        }
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.radius * 1.2)
          .attr('stroke', '#4f46e5')
          .attr('stroke-width', 3);

        // Show tooltip
        showTooltip(event, d);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d: any) => d.radius)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);

        hideTooltip();
      });

    // Add labels
    const labels = container.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text((d) => d.text.length > 10 ? d.text.substring(0, 10) + '...' : d.text)
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#333')
      .style('pointer-events', 'none');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Helper functions
    function getPartOfSpeech(word: string): string {
      const posMap: { [key: string]: string } = {
        'happy': 'adj', 'sad': 'adj', 'big': 'adj', 'small': 'adj',
        'run': 'v', 'walk': 'v', 'think': 'v', 'learn': 'v',
        'quickly': 'adv', 'slowly': 'adv', 'very': 'adv',
        'the': 'art', 'a': 'art', 'an': 'art',
        'and': 'conj', 'but': 'conj', 'or': 'conj'
      };
      return posMap[word] || 'noun';
    }

    function getGapColor(gap: number): string {
      const colors = ['#10b981', '#f59e0b', '#ef4444', '#7c3aed'];
      return colors[Math.floor(gap * colors.length)];
    }

    function generateLinks(nodes: WordNode[]): Link[] {
      const links: Link[] = [];

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];

          // Calculate distance
          const distance = Math.sqrt(
            Math.pow(node1.x - node2.x, 2) +
            Math.pow(node1.y - node2.y, 2)
          );

          // Create link if nodes are close enough
          if (distance < 150) {
            links.push({
              source: node1,
              target: node2,
              type: 'semantic',
              weight: Math.random()
            });
          }
        }
      }

      return links;
    }

    function showTooltip(event: MouseEvent, d: WordNode) {
      const tooltip = d3.select('body').append('div')
        .attr('class', 'absolute bg-gray-800 text-white p-2 rounded shadow-lg text-sm pointer-events-none')
        .style('opacity', 0)
        .style('z-index', 1000);

      tooltip.transition()
        .duration(200)
        .style('opacity', 1);

      tooltip.html(`
        <strong>${d.text}</strong><br/>
        Part of Speech: ${d.pos}<br/>
        Gap Level: ${Math.round(d.gap * 100)}%<br/>
        Radius: ${d.radius.toFixed(1)}px
      `)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 10}px`);
    }

    function hideTooltip() {
      d3.selectAll('div').filter('.absolute').remove();
    }

    // Cleanup on unmount
    return () => {
      simulation.stop();
    };

  }, [words, gaps, width, height, onWordClick, semanticZoom]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50"
      />

      {/* Zoom controls */}
      {semanticZoom && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-md">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const svg = d3.select(svgRef.current);
                svg.transition()
                  .duration(500)
                  .call(d3.zoom().transform as any, d3.zoomIdentity);
              }}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Reset
            </button>
            <span className="text-sm">Zoom: {zoomLevel.toFixed(1)}x</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md">
        <div className="text-sm font-semibold mb-1">Gap Levels:</div>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-1"></div>
            <span className="text-xs">Low</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-1"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-1"></div>
            <span className="text-xs">High</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded mr-1"></div>
            <span className="text-xs">Critical</span>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow-md text-xs">
        <div>Nodes: {words.length}</div>
        <div>FPS: {calculateFPS()}</div>
      </div>
    </div>
  );
};

// Simple FPS calculator
let lastTime = performance.now();
let frames = 0;

function calculateFPS(): number {
  frames++;
  const now = performance.now();
  if (now >= lastTime + 1000) {
    const fps = Math.round((frames * 1000) / (now - lastTime));
    frames = 0;
    lastTime = now;
    return fps;
  }
  return 0;
}