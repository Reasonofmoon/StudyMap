/**
 * EduOntology Learning Path Visualization Component
 * D3.js based interactive learning path visualization
 */

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { LearningPathResponse, LearningPathStep } from '@/types/learning-path'

interface LearningPathVisualizationProps {
  learningPath: LearningPathResponse
  width?: number
  height?: number
  onStepClick?: (step: LearningPathStep) => void
}

interface Node {
  id: string
  label: string
  type: 'vocabulary' | 'theme'
  difficulty: number
  x: number
  y: number
}

interface Link {
  source: string
  target: string
  relationshipType: string
  confidence: number
}

export const LearningPathVisualization: React.FC<LearningPathVisualizationProps> = ({
  learningPath,
  width = 800,
  height = 600,
  onStepClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    if (!svgRef.current || !learningPath.steps.length) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create main group
    const g = svg.append('g')

    // Prepare data
    const nodes: Node[] = []
    const links: Link[] = []

    // Add start and end nodes
    nodes.push({
      id: learningPath.startNode.id,
      label: learningPath.startNode.term || learningPath.startNode.name || 'Start',
      type: learningPath.startNode.type.toLowerCase() as 'vocabulary' | 'theme',
      difficulty: 5, // Default difficulty
      x: 0,
      y: height / 2,
    })

    nodes.push({
      id: learningPath.endNode.id,
      label: learningPath.endNode.term || learningPath.endNode.name || 'End',
      type: learningPath.endNode.type.toLowerCase() as 'vocabulary' | 'theme',
      difficulty: 10, // Default difficulty
      x: width,
      y: height / 2,
    })

    // Add intermediate nodes
    learningPath.steps.forEach((step, index) => {
      const x = (index + 1) * (width / (learningPath.steps.length + 1))
      const y = height / 2

      nodes.push({
        id: step.nextNode.id,
        label: step.nextNode.term || step.nextNode.name || step.nextNode.id,
        type: step.nextNode.type.toLowerCase() as 'vocabulary' | 'theme',
        difficulty: 5 + index, // Simulated difficulty
        x,
        y,
      })

      links.push({
        source: step.currentNode.id,
        target: step.nextNode.id,
        relationshipType: step.relationshipType,
        confidence: step.confidence,
      })
    })

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: Node) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.confidence))
      .attr('marker-end', 'url(#arrowhead)')

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d.id)
        if (onStepClick) {
          // Find the step containing this node
          const step = learningPath.steps.find(s => s.nextNode.id === d.id)
          if (step) onStepClick(step)
        }
      })

    // Add circles for nodes
    node.append('circle')
      .attr('r', 20)
      .attr('fill', (d) => d.type === 'vocabulary' ? '#4CAF50' : '#2196F3')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', (d) => selectedNode ? (d.id === selectedNode ? 1 : 0.3) : 1)

    // Add labels
    node.append('text')
      .text((d) => d.label)
      .attr('x', 0)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')

    // Add difficulty badges
    node.append('text')
      .text((d) => d.difficulty)
      .attr('x', 0)
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')

    // Add relationship labels
    g.append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('x', (d) => {
        const source = nodes.find(n => n.id === d.source)
        const target = nodes.find(n => n.id === d.target)
        return source && target ? (source.x + target.x) / 2 : 0
      })
      .attr('y', (d) => {
        const source = nodes.find(n => n.id === d.source)
        const target = nodes.find(n => n.id === d.target)
        return source && target ? (source.y + target.y) / 2 : 0
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d) => `${d.relationshipType} (${d.confidence}%)`)

    // Add arrow markers
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none')

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Learning Path Visualization')

    // Add info panel
    const infoPanel = svg.append('g')
      .attr('transform', `translate(10, ${height - 100})`)

    infoPanel.append('rect')
      .attr('width', 200)
      .attr('height', 80)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#ddd')
      .attr('rx', 5)

    infoPanel.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Path Information')

    infoPanel.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(`Total Steps: ${learningPath.steps.length}`)

    infoPanel.append('text')
      .attr('x', 10)
      .attr('y', 55)
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(`Total Difficulty: ${learningPath.totalDifficulty}`)

    infoPanel.append('text')
      .attr('x', 10)
      .attr('y', 70)
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(`Est. Time: ${learningPath.estimatedTime} min`)

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: Node) => `translate(${d.x},${d.y})`)
    })

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [learningPath, width, height, selectedNode, onStepClick])

  return (
    <div className="learning-path-visualization">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}

export default LearningPathVisualization
