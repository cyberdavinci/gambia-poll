import { NextRequest, NextResponse } from 'next/server'
import { castVote, hasVoted } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fp') ?? ''
  if (!fp) return NextResponse.json({ voted: false })
  return NextResponse.json({ voted: await hasVoted(fp) })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { candidateId, fingerprint } = body

    if (!candidateId || !fingerprint) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    const result = await castVote(candidateId, fingerprint, ip)

    if (result === 'duplicate') {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 })
    }
    if (result === 'invalid') {
      return NextResponse.json({ error: 'Invalid candidate' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/vote]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
