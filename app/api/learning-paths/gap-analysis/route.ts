import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const BodySchema = z.object({
  nodeId: z.string().min(1),
  targetLevel: z.number().int().min(1).max(10).optional(),
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

export async function POST(request: NextRequest) {
  try {
    const body = BodySchema.parse(await request.json())

    const current = await prisma.gap.findUnique({ where: { id: body.nodeId } })
    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Target node not found' },
        { status: 404 }
      )
    }

    // MVP heuristic:
    // Recommend other items in the same category that are "close" to the target level.
    const targetLevel = body.targetLevel ?? current.level ?? 5
    const candidates = await prisma.gap.findMany({
      where: {
        category: current.category,
        id: { not: current.id },
      },
      orderBy: [{ level: 'asc' }, { createdAt: 'desc' }],
      take: 10,
    })

    const recommended = candidates
      .filter((g) => (g.level ?? 0) <= targetLevel)
      .slice(0, 5)
      .map(toNode)

    // For MVP, missing prerequisites are empty because we don't have a graph.
    const missingPrerequisites: any[] = []

    const gapScore = Math.max(0, Math.min(100, (targetLevel - (current.level ?? 0)) * 10))

    return NextResponse.json({
      success: true,
      data: {
        currentNode: toNode(current),
        missingPrerequisites,
        recommendedPath: recommended,
        gapScore,
      },
    })
  } catch (error) {
    console.error('Error performing gap analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform gap analysis' },
      { status: 400 }
    )
  }
}

