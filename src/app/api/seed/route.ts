import { NextResponse } from 'next/server'
import { seedCandidatesManual } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await seedCandidatesManual()
    return NextResponse.json({ success: true, message: 'Candidates seeded successfully' })
  } catch (err) {
    console.error('[api/seed]', err)
    return NextResponse.json({ error: 'Failed to seed candidates' }, { status: 500 })
  }
}
