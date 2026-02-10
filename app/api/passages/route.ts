import { NextResponse } from 'next/server'

// MVP stub: passages are not persisted in the current Prisma schema.
export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    pagination: { first: 0, skip: 0, total: 0 },
  })
}

