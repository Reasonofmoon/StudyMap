/**
 * MVP Vocabularies API
 *
 * This project originally targeted Neo4j for ontology storage, but the MVP
 * uses the existing Prisma/SQLite schema. We store vocabularies as `Gap`
 * rows with `category = 'vocabulary'` and JSON in `metadata`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const VocabularySchema = z.object({
  term: z.string().min(1).max(100),
  definition: z.string().min(1).max(2000),
  partOfSpeech: z
    .enum([
      'NOUN',
      'VERB',
      'ADJECTIVE',
      'ADVERB',
      'PREPOSITION',
      'CONJUNCTION',
      'INTERJECTION',
      'PRONOUN',
      'DETERMINER',
    ])
    .default('NOUN'),
  difficultyLevel: z.number().int().min(1).max(10),
  exampleSentence: z.string().max(500).optional(),
  synonyms: z.array(z.string()).max(50).default([]),
  antonyms: z.array(z.string()).max(50).default([]),
})

const VocabularyQuerySchema = z.object({
  first: z.number().int().min(1).max(1000).default(50),
  skip: z.number().int().min(0).default(0),
  term_contains: z.string().optional(),
  partOfSpeech: z.string().optional(),
  difficultyLevel_gte: z.number().int().min(1).max(10).optional(),
  difficultyLevel_lte: z.number().int().min(1).max(10).optional(),
  orderBy: z.enum(['TERM', 'DIFFICULTYLEVEL', 'CREATEDAT']).default('TERM'),
  orderDirection: z.enum(['ASC', 'DESC']).default('ASC'),
})

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
  const term = meta.term || gap.description || ''
  const definition = meta.definition || gap.description || ''

  return {
    id: gap.id,
    term,
    definition,
    partOfSpeech: meta.partOfSpeech || 'NOUN',
    difficultyLevel: gap.level,
    exampleSentence: meta.exampleSentence || undefined,
    synonyms: Array.isArray(meta.synonyms) ? meta.synonyms : [],
    antonyms: Array.isArray(meta.antonyms) ? meta.antonyms : [],
    createdAt: gap.createdAt.toISOString(),
    updatedAt: gap.updatedAt.toISOString(),
    relationships: {
      appearsInCount: 0,
      prerequisitesCount: 0,
      requiredByCount: 0,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const query = VocabularyQuerySchema.parse({
      first: parseInt(url.searchParams.get('first') || '50', 10),
      skip: parseInt(url.searchParams.get('skip') || '0', 10),
      term_contains: url.searchParams.get('term_contains') || undefined,
      partOfSpeech: url.searchParams.get('partOfSpeech') || undefined,
      difficultyLevel_gte: url.searchParams.get('difficultyLevel_gte')
        ? parseInt(url.searchParams.get('difficultyLevel_gte')!, 10)
        : undefined,
      difficultyLevel_lte: url.searchParams.get('difficultyLevel_lte')
        ? parseInt(url.searchParams.get('difficultyLevel_lte')!, 10)
        : undefined,
      orderBy: (url.searchParams.get('orderBy') as any) || 'TERM',
      orderDirection: (url.searchParams.get('orderDirection') as any) || 'ASC',
    })

    const where: any = {
      category: 'vocabulary',
    }

    if (query.term_contains) {
      where.OR = [
        { description: { contains: query.term_contains, mode: 'insensitive' } },
        { metadata: { contains: query.term_contains } },
      ]
    }

    if (query.difficultyLevel_gte || query.difficultyLevel_lte) {
      where.level = {}
      if (query.difficultyLevel_gte) where.level.gte = query.difficultyLevel_gte
      if (query.difficultyLevel_lte) where.level.lte = query.difficultyLevel_lte
    }

    // partOfSpeech is stored in metadata JSON; for MVP we do a simple substring match.
    if (query.partOfSpeech) {
      where.metadata = { contains: `"partOfSpeech":"${query.partOfSpeech}"` }
    }

    const orderBy: any =
      query.orderBy === 'CREATEDAT'
        ? { createdAt: query.orderDirection.toLowerCase() }
        : query.orderBy === 'DIFFICULTYLEVEL'
          ? { level: query.orderDirection.toLowerCase() }
          : { description: query.orderDirection.toLowerCase() }

    const [items, total] = await Promise.all([
      prisma.gap.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.first,
      }),
      prisma.gap.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: items.map(toVocabularyResponse),
      pagination: {
        first: query.first,
        skip: query.skip,
        total,
      },
    })
  } catch (error) {
    console.error('Error fetching vocabularies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vocabularies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = VocabularySchema.parse(body)

    const student = await prisma.student.upsert({
      where: { email: 'mvp@example.com' },
      update: {},
      create: { name: 'MVP User', email: 'mvp@example.com' },
    })

    const created = await prisma.gap.create({
      data: {
        category: 'vocabulary',
        level: validated.difficultyLevel,
        description: validated.definition,
        metadata: JSON.stringify({
          term: validated.term,
          definition: validated.definition,
          partOfSpeech: validated.partOfSpeech,
          difficultyLevel: validated.difficultyLevel,
          exampleSentence: validated.exampleSentence || null,
          synonyms: validated.synonyms,
          antonyms: validated.antonyms,
        }),
        studentId: student.id,
      },
    })

    return NextResponse.json(
      { success: true, data: toVocabularyResponse(created) },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating vocabulary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create vocabulary' },
      { status: 400 }
    )
  }
}
