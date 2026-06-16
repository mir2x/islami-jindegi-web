import { NextResponse } from 'next/server'
import { getMushafs } from '@/lib/public-api'

// Cache per edition — survives across requests in the same process
const cache = new Map<string, { data: unknown; ts: number }>()
const TTL = 24 * 60 * 60 * 1000 // 24 h

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ editionId: string }> }
) {
  const { editionId } = await params

  const editions = await getMushafs()
  const edition = editions.find(e => e.id === editionId)
  if (!edition) return NextResponse.json({ error: 'Unknown edition' }, { status: 404 })

  const cached = cache.get(editionId)
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data)
  }

  const res = await fetch(edition.ayahBoxesUrl)
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 502 })

  const data = await res.json()
  cache.set(editionId, { data, ts: Date.now() })

  return NextResponse.json(data)
}
