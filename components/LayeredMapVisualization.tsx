/**
 * EduOntology 3-Layer Map Visualization Component
 * Interactive visualization of Elementary → Middle → College layers
 */

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Vocabulary, Theme, Passage } from '@/types'

interface Layer {
  id: string
  name: string
  color: string
  y: number
  nodes: (Vocabulary | Theme | Passage)[]
}

interface LayeredMapVisualizationProps {
  vocabularies?: Vocabulary[]
  themes?: Theme[]
  passages?: Passage[]
  width?: number
  height?: number
  onNodeClick?: (node: Vocabulary | Theme | Passage) => void
}

export const LayeredMapVisualization: React.FC<LayeredMapVisualizationProps> = ({
  vocabularies = [],
  themes = [],
  passages = [],
  width = 1000,
  height = 800,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedLayer, setSelectedLayer] = useState<string>('all')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    if (!svgRef.current || (!vocabularies.length && !themes.length && !passages.length)) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create main group
    const g = svg.append('g')

    // Define layers
    const layerHeight = height / 4
    const layers: Layer[] = [
      {
        id: 'elementary',
        name: 'Elementary',
        color: '#4CAF50',
        y: layerHeight,
        nodes: vocabularies.filter(v => v.difficultyLevel <= 3)
          .concat(themes.filter(t => t.complexity <= 3))
          .concat(passages.filter(p => p.readingLevel <= 3))
      },
      {
        id: 'middle',
        name: 'Middle',
        color: '#2196F3',
        y: layerHeight * 2,
        nodes: vocabularies.filter(v => v.difficultyLevel >= 4 && v.difficultyLevel <= 7)
          .concat(themes.filter(t => t.complexity >= 4 && t.complexity <= 7))
          .concat(passages.filter(p => p.readingLevel >= 4 && p.readingLevel <= 7))
      },
      {
        id: 'college',
        name: 'College',
        color: '#9C27B0',
        y: layerHeight * 3,
        nodes: vocabularies.filter(v => v.difficultyLevel >= 8)
          .concat(themes.filter(t => t.complexity >= 8))
          .concat(passages.filter(p => p.readingLevel >= 8))
      }
    ]

    // Draw layer backgrounds
    layers.forEach(layer => {
      g.append('rect')
        .attr('x', 0)
        .attr('y', layer.y - layerHeight / 2)
        .attr('width', width)
        .attr('height', layerHeight)
        .attr('fill', layer.color)
        .attr('opacity', 0.1)
        .attr('rx', 10)
    })

    // Draw layer labels
    layers.forEach(layer => {
      g.append('text')
        .attr('x', 20)
        .attr('y', layer.y)
        .attr('text-anchor', 'start')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', layer.color)
        .text(layer.name)
    })

    // Prepare nodes for visualization
    const allNodes = layers.flatMap(layer =>
      layer.nodes.map(node => ({
        ...node,
        layer: layer.id,
        layerColor: layer.color,
        x: Math.random() * (width - 100) + 50,
        y: layer.y + (Math.random() - 0.5) * (layerHeight * 0.6),
      }))
    )

    // Create simulation
    const simulation = d3.forceSimulation(allNodes)
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      .force('y', d3.forceY((d: any) => d.y).strength(0.5))

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(allNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onNodeClick) onNodeClick(d)
      })
      .on('mouseover', (event, d) => {
        setHoveredNode(d.id)
        // Highlight connections
        g.selectAll('.node circle')
          .attr('opacity', (nodeData: any) =>
            nodeData.layer === d.layer || nodeData.id === d.id ? 1 : 0.3
          )
      })
      .on('mouseout', (event, d) => {
        setHoveredNode(null)
        g.selectAll('.node circle')
          .attr('opacity', 1)
      })

    // Add circles
    node.append('circle')
      .attr('r', (d: any) => {
        if ('difficultyLevel' in d) return 15 + d.difficultyLevel * 2
        if ('complexity' in d) return 15 + d.complexity * 2
        if ('readingLevel' in d) return 15 + d.readingLevel * 2
        return 15
      })
      .attr('fill', (d: any) => d.layerColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8)
      .attr('filter', (d: any) =>
        hoveredNode === d.id ? 'url(#glow)' : 'none'
      )

    // Add labels
    node.append('text')
      .text((d: any) => {
        if ('term' in d) return d.term
        if ('name' in d) return d.name
        if ('title' in d) return d.title
        return d.id
      })
      .attr('x', 0)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#333')

    // Add difficulty/complexity labels
    node.append('text')
      .text((d: any) => {
        if ('difficultyLevel' in d) return d.difficultyLevel
        if ('complexity' in d) return d.complexity
        if ('readingLevel' in d) return d.readingLevel
        return '?'
      })
      .attr('x', 0)
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')

    // Add glow effect
    const defs = svg.append('defs')
    defs.append('filter')
      .attr('id', 'glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur')

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('3-Layer EduOntology Map')

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 200}, 60)`)

    legend.append('rect')
      .attr('width', 180)
      .attr('height', 120)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#ddd')
      .attr('rx', 5)

    legend.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Legend')

    // Add legend items
    const legendItems = [
      { color: '#4CAF50', label: 'Elementary (1-3)' },
      { color: '#2196F3', label: 'Middle (4-7)' },
      { color: '#9C27B0', label: 'College (8-10)' }
    ]

    legendItems.forEach((item, index) => {
      legend.append('circle')
        .attr('cx', 20)
        .attr('cy', 40 + index * 25)
        .attr('r', 8)
        .attr('fill', item.color)

      legend.append('text')
        .attr('x', 35)
        .attr('y', 45 + index * 25)
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .text(item.label)
    })

    // Add statistics
    const stats = g.append('g')
      .attr('transform', `translate(20, 60)`)

    stats.append('rect')
      .attr('width', 150)
      .attr('height', 100)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#ddd')
      .attr('rx', 5)

    stats.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Statistics')

    stats.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(`Vocabularies: ${vocabularies.length}`)

    stats.append('text')
      .attr('x', 10)
      .attr('y', 55)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(`Themes: ${themes.length}`)

    stats.append('text')
      .attr('x', 10)
      .attr('y', 70)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(`Passages: ${passages.length}`)

    stats.append('text')
      .attr('x', 10)
      .attr('y', 85)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(`Total: ${vocabularies.length + themes.length + passages.length}`)

    // Update positions on tick
    simulation.on('tick', () => {
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // Add layer filter controls
    const controls = svg.append('g')
      .attr('transform', `translate(${width - 200}, 200)`)

    controls.append('rect')
      .attr('width', 180)
      .attr('height', 100)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#ddd')
      .attr('rx', 5)

    controls.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Layer Filter')

    // Add filter buttons
    const layerButtons = ['all', 'elementary', 'middle', 'college']
    layerButtons.forEach((layer, index) => {
      const btn = controls.append('g')
        .attr('transform', `translate(10, 30 + index * 20)`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setSelectedLayer(layer)
          // Filter nodes
          node.style('display', (nodeData: any) => {
            if (layer === 'all') return ''
            return nodeData.layer === layer ? '' : 'none'
          })
        })

      btn.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', layer === selectedLayer ? '#333' : '#ddd')

      btn.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .text(layer.charAt(0).toUpperCase() + layer.slice(1))
    })

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [vocabularies, themes, passages, width, height, selectedLayer, hoveredNode, onNodeClick])

  return (
    <div className="layered-map-visualization">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}

export default LayeredMapVisualization
