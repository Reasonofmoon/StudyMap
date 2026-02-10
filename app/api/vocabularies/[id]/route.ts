import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z
  .object({
    term: z.string().min(1).max(100).optional(),
    definition: z.string().min(1).max(2000).optional(),
    partOfSpeech: z.string().optional(),
    difficultyLevel: z.number().int().min(1).max(10).optional(),
    exampleSentence: z.string().max(500).optional(),
    synonyms: z.array(z.string()).max(50).optional(),
    antonyms: z.array(z.string()).max(50).optional(),
  })
  .strict()

function safeJsonParse(value: string | null): any {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function toVocabularyResponse(gap: any) {
  const meta = safeJsonParse(gap.metadata)
  return {
    id: gap.id,
    term: meta.term || gap.description || '',
    definition: meta.definition || gap.description || '',
    partOfSpeech: meta.partOfSpeech || 'NOUN',
    difficultyLevel: gap.level,
    exampleSentence: meta.exampleSentence || undefined,
    synonyms: Array.isArray(meta.synonyms) ? meta.synonyms : [],
    antonyms: Array.isArray(meta.antonyms) ? meta.antonyms : [],
    createdAt: gap.createdAt.toISOString(),
    updatedAt: gap.updatedAt.toISOString(),
    relationships: { appearsInCount: 0, prerequisitesCount: 0, requiredByCount: 0 },
  }
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const gap = await prisma.gap.findFirst({ where: { id, category: 'vocabulary' } })
    if (!gap) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: toVocabularyResponse(gap) })
  } catch (error) {
    console.error('Error fetching vocabulary:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch vocabulary' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await prisma.gap.findFirst({ where: { id, category: 'vocabulary' } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const patch = UpdateSchema.parse(await request.json())
    const meta = safeJsonParse(existing.metadata)
    const nextMeta = {
      ...meta,
      ...patch,
      difficultyLevel: patch.difficultyLevel ?? meta.difficultyLevel ?? existing.level,
    }

    const updated = await prisma.gap.update({
      where: { id },
      data: {
        level: patch.difficultyLevel ?? existing.level,
        description: patch.definition ?? existing.description,
        metadata: JSON.stringify(nextMeta),
      },
    })

    return NextResponse.json({ success: true, data: toVocabularyResponse(updated) })
  } catch (error) {
    console.error('Error updating vocabulary:', error)
    return NextResponse.json({ success: false, error: 'Failed to update vocabulary' }, { status: 400 })
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await prisma.gap.findFirst({ where: { id, category: 'vocabulary' } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    await prisma.gap.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vocabulary:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete vocabulary' }, { status: 500 })
  }
}

