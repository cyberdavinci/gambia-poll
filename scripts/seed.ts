import { seedCandidatesManual } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding candidates...')
  try {
    await seedCandidatesManual()
    console.log('✅ Seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

main()
