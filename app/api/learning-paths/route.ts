/**
 * MVP Learning Paths API
 *
 * The full product would compute graph paths in Neo4j. For the MVP we return a
 * simple path between two existing `Gap` nodes (by id) so the UI can function.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  startNodeId: z.string().min(1),
  endNodeId: z.string().min(1),
  maxSteps: z.number().int().min(1).max(20).default(10),
})

function safeJsonParse(value: string | null): any {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function toNode(gap: any) {
  const meta = safeJsonParse(gap.metadata)
  return {
    id: gap.id,
    type: 'Vocabulary',
    term: meta.term || gap.description || null,
    name: null,
    difficultyLevel: gap.level,
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const query = QuerySchema.parse({
      startNodeId: url.searchParams.get('startNodeId') || '',
      endNodeId: url.searchParams.get('endNodeId') || '',
      maxSteps: parseInt(url.searchParams.get('maxSteps') || '10', 10),
    })

    const [start, end] = await Promise.all([
      prisma.gap.findUnique({ where: { id: query.startNodeId } }),
      prisma.gap.findUnique({ where: { id: query.endNodeId } }),
    ])

    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: 'Start or end node not found' },
        { status: 404 }
      )
    }

    const startNode = toNode(start)
    const endNode = toNode(end)

    const steps = [
      {
        currentNode: startNode,
        nextNode: endNode,
        relationshipType: 'NEXT',
        confidence: 100,
      },
    ]

    const learningPath = {
      id: `path_${Date.now()}`,
      startNode,
      endNode,
      steps,
      totalDifficulty: (start.level || 0) + (end.level || 0),
      estimatedTime: steps.length * 30,
    }

    return NextResponse.json({ success: true, data: learningPath })
  } catch (error) {
    console.error('Error generating learning path:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate learning path' },
      { status: 500 }
    )
  }
}
