/**
 * EduOntology Gap Visualization Component
 * 3-Layer Map Gap 분석 결과를 시각화하는 React 컴포넌트
 */

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { GapAnalysisResult, Layer, GapLevel, GapMetrics } from '../types'

interface GapVisualizationProps {
  width?: number
  height?: number
  gapResults: GapAnalysisResult[]
  metrics?: GapMetrics
  onNodeClick?: (nodeId: string) => void
  className?: string
}

interface NodeData {
  id: string
  label: string
  difficulty: number
  layer: Layer
  gapScore?: number
  gapLevel?: GapLevel
  x: number
  y: number
  radius: number
  color: string
}

interface LinkData {
  source: string
  target: string
  type: 'prerequisite' | 'dependency'
  strength: number
  color: string
}

export const GapVisualization: React.FC<GapVisualizationProps> = ({
  width = 800,
  height = 600,
  gapResults = [],
  metrics,
  onNodeClick,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    if (!svgRef.current || gapResults.length === 0) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create main group
    const g = svg.append('g')

    // Prepare data
    const { nodes, links, layerPositions } = prepareVisualizationData(gapResults)

    // Create layer backgrounds
    drawLayerBackgrounds(g, layerPositions)

    // Create links
    drawLinks(g, links)

    // Create nodes
    drawNodes(g, nodes)

    // Add title
    drawTitle(svg, gapResults)

    // Add legend
    drawLegend(svg, gapResults)

    // Add metrics panel if available
    if (metrics) {
      drawMetricsPanel(svg, metrics)
    }

  }, [gapResults, width, height, metrics, selectedNode, hoveredNode])

  const prepareVisualizationData = (results: GapAnalysisResult[]) => {
    const nodes = new Map<string, NodeData>()
    const links: LinkData[] = []
    const layerPositions: Record<Layer, number> = { L1: height * 0.2, L2: height * 0.5, L3: height * 0.8 }

    // Add target nodes
    results.forEach(result => {
      const targetNode = result.targetNode

      // Add target node
      nodes.set(targetNode.id, {
        id: targetNode.id,
        label: targetNode.term || targetNode.name || targetNode.title || targetNode.id,
        difficulty: targetNode.difficulty,
        layer: targetNode.layer,
        gapScore: result.gapScore,
        gapLevel: getGapLevel(result.gapScore),
        x: width / 2,
        y: layerPositions[targetNode.layer],
        radius: 20 + result.gapScore * 0.3,
        color: getGapColor(result.gapScore, result.gapLevel),
      })

      // Add missing prerequisites
      result.missingPrerequisites.forEach(prereq => {
        nodes.set(prereq.id, {
          id: prereq.id,
          label: prereq.term || prereq.name || prereq.title || prereq.id,
          difficulty: prereq.difficulty,
          layer: prereq.layer,
          x: width / 2 + (Math.random() - 0.5) * 200,
          y: layerPositions[prereq.layer],
          radius: 15 + prereq.difficulty * 2,
          color: getLayerColor(prereq.layer),
        })

        // Add link
        links.push({
          source: prereq.id,
          target: targetNode.id,
          type: 'prerequisite',
          strength: result.gapScore / 100,
          color: getGapColor(result.gapScore, result.gapLevel),
        })
      })

      // Add recommended path
      result.recommendedPath.forEach((node, index) => {
        if (index > 0) {
          links.push({
            source: result.recommendedPath[index - 1].id,
            target: node.id,
            type: 'prerequisite',
            strength: 0.8,
            color: '#4CAF50',
          })
        }
      })
    })

    // Apply force simulation
    applyForceSimulation(Array.from(nodes.values()), links, width, height)

    return {
      nodes: Array.from(nodes.values()),
      links,
      layerPositions,
    }
  }

  const drawLayerBackgrounds = (g: d3.Selection<SVGSVGElement, unknown, null, undefined>, layerPositions: Record<Layer, number>) => {
    const layerColors = {
      L1: '#E8F5E9',  // Light green
      L2: '#E3F2FD',  // Light blue
      L3: '#F3E5F5',  // Light purple
    }

    Object.entries(layerPositions).forEach(([layer, y]) => {
      g.append('rect')
        .attr('x', 0)
        .attr('y', y - 100)
        .attr('width', width)
        .attr('height', 200)
        .attr('fill', layerColors[layer as Layer])
        .attr('opacity', 0.3)
        .attr('rx', 10)

      // Layer labels
      g.append('text')
        .attr('x', 20)
        .attr('y', y)
        .attr('text-anchor', 'start')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', getLayerColor(layer as Layer))
        .text(getLayerLabel(layer as Layer))
    })
  }

  const drawLinks = (g: d3.Selection<SVGSVGElement, unknown, null, undefined>, links: LinkData[]) => {
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => d.color)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => d.strength * 3)
      .attr('marker-end', 'url(#arrowhead)')

    // Add arrow markers
    const defs = g.append('defs')
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#666')
  }

  const drawNodes = (g: d3.Selection<SVGSVGElement, unknown, null, undefined>, nodes: NodeData[]) => {
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d.id)
        if (onNodeClick) onNodeClick(d.id)
      })
      .on('mouseover', (event, d) => {
        setHoveredNode(d.id)
        // Highlight connections
        g.selectAll('.node circle')
          .attr('opacity', (nodeData: NodeData) =>
            nodeData.id === d.id || nodeData.id === selectedNode ? 1 : 0.3
          )
      })
      .on('mouseout', (event, d) => {
        setHoveredNode(null)
        g.selectAll('.node circle')
          .attr('opacity', 1)
      })

    // Add circles
    node.append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', (d) =>
        selectedNode && d.id !== selectedNode ? 0.3 : 1
      )

    // Add labels
    node.append('text')
      .text((d) => d.label)
      .attr('x', 0)
      .attr('y', (d) => -(d.radius - 5))
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .attr('font-weight', (d) => selectedNode === d.id ? 'bold' : 'normal')

    // Add difficulty labels
    node.append('text')
      .text((d) => `L${d.difficulty}`)
      .attr('x', 0)
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')

    // Add gap score
    node.filter((d) => d.gapScore !== undefined)
      .append('text')
      .text((d) => `${Math.round(d.gapScore!)}%`)
      .attr('x', 0)
      .attr('y', d => d.radius + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
  }

  const drawTitle = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, results: GapAnalysisResult[]) => {
    const avgGap = results.reduce((sum, r) => sum + r.gapScore, 0) / results.length

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('3-Layer Gap Analysis')

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .text(`Average Gap Score: ${Math.round(avgGap)}%`)
  }

  const drawLegend = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, results: GapAnalysisResult[]) => {
    const legendX = width - 200
    const legendY = 60

    // Legend background
    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', 180)
      .attr('height', 120)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#ddd')
      .attr('rx', 5)

    // Legend title
    svg.append('text')
      .attr('x', legendX + 10)
      .attr('y', legendY + 20)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Gap Levels')

    // Gap level indicators
    const gapLevels = [
      { level: 'high', color: '#f44336', label: 'High (>66%)' },
      { level: 'medium', color: '#ff9800', label: 'Medium (33-66%)' },
      { level: 'low', color: '#4caf50', label: 'Low (<33%)' },
    ]

    gapLevels.forEach((gap, index) => {
      const y = legendY + 40 + index * 25

      // Color indicator
      svg.append('circle')
        .attr('cx', legendX + 15)
        .attr('cy', y)
        .attr('r', 6)
        .attr('fill', gap.color)

      // Label
      svg.append('text')
        .attr('x', legendX + 30)
        .attr('y', y + 4)
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .text(gap.label)
    })
  }

  const drawMetricsPanel = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, metrics: GapMetrics) => {
    const panelX = 20
    const panelY = height - 140

    // Panel background
    svg.append('rect')
      .attr('x', panelX)
      .attr('y', panelY)
      .attr('width', 200)
      .attr('height', 120)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#ddd')
      .attr('rx', 5)

    // Panel title
    svg.append('text')
      .attr('x', panelX + 10)
      .attr('y', panelY + 20)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Gap Metrics')

    // Metrics
    const metricsData = [
      { label: 'Average Gap', value: Math.round(metrics.averageGapScore) + '%' },
      { label: 'Low Gaps', value: metrics.gapDistribution.low },
      { label: 'Medium Gaps', value: metrics.gapDistribution.medium },
      { label: 'High Gaps', value: metrics.gapDistribution.high },
    ]

    metricsData.forEach((metric, index) => {
      const y = panelY + 40 + index * 20

      svg.append('text')
        .attr('x', panelX + 10)
        .attr('y', y)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text(metric.label)

      svg.append('text')
        .attr('x', panelX + 150)
        .attr('y', y)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(metric.value)
    })
  }

  const applyForceSimulation = (nodes: NodeData[], links: LinkData[], width: number, height: number) => {
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id((d: NodeData) => d.id)
        .distance(80)
        .strength((d: LinkData) => d.strength)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: NodeData) => d.radius + 5))
      .force('y', d3.forceY((d: NodeData) => d.y).strength(0.5))

    // Update positions on tick
    simulation.on('tick', () => {
      // The visualization is already drawn, positions are updated automatically
      // In a real implementation, you would update the SVG elements here
    })

    simulation.stop()
  }

  // Helper functions
  const getGapLevel = (gapScore: number): GapLevel => {
    if (gapScore <= 33) return 'low'
    if (gapScore <= 66) return 'medium'
    return 'high'
  }

  const getGapColor = (gapScore: number, gapLevel?: GapLevel): string => {
    if (gapLevel === 'high' || gapScore > 66) return '#f44336'
    if (gapLevel === 'medium' || gapScore > 33) return '#ff9800'
    return '#4caf50'
  }

  const getLayerColor = (layer: Layer): string => {
    const colors = {
      L1: '#4CAF50',
      L2: '#2196F3',
      L3: '#9C27B0',
    }
    return colors[layer]
  }

  const getLayerLabel = (layer: Layer): string => {
    const labels = {
      L1: 'Elementary (1-3)',
      L2: 'Middle (4-7)',
      L3: 'College (8-10)',
    }
    return labels[layer]
  }

  return (
    <div className={`gap-visualization ${className}`}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}

export default GapVisualization
