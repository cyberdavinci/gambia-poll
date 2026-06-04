import { NextResponse } from 'next/server'
import { getResults, getTotalVotes } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const results = await getResults()
    const total = await getTotalVotes()
    return NextResponse.json({ results, total })
  } catch (err) {
    console.error('[api/results]', err)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
