import mongoose, { Schema, Document } from 'mongoose'

// Connection caching for Next.js hot reload
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gambia-poll'

interface Cached {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseCache: Cached | undefined
}

const cached: Cached = global.mongooseCache || { conn: null, promise: null }
if (!global.mongooseCache) global.mongooseCache = cached

const MONGODB_OPTIONS = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 5,
  retryWrites: true,
  w: 'majority' as const,
  // Fix for SRV timeout issues
  family: 4, // Force IPv4
  maxIdleTimeMS: 10000,
}

async function connectDb(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
    console.log('[MongoDB] Connecting to:', safeUri)
    cached.promise = mongoose.connect(MONGODB_URI, MONGODB_OPTIONS).then((conn) => {
      console.log('[MongoDB] Connected successfully')
      return conn
    }).catch((err) => {
      console.error('[MongoDB] Connection error:', err.message)
      cached.promise = null
      throw err
    })
  }
  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (err) {
    cached.promise = null
    throw err
  }
}

// Candidate Schema
interface ICandidate {
  _id: string
  name: string
  party: string
  sort_order: number
}

const CandidateSchema = new Schema<ICandidate & { image?: string }>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  party: { type: String, required: true },
  sort_order: { type: Number, required: true, default: 0 },
  image: { type: String, required: false }
}, { _id: false })

const Candidate = mongoose.models.Candidate || mongoose.model<ICandidate & Document>('Candidate', CandidateSchema)

// Vote Schema
interface IVote extends Document {
  candidate_id: string
  fingerprint: string
  ip: string
  voted_at: Date
}

const VoteSchema = new Schema<IVote>({
  candidate_id: { type: String, required: true },
  fingerprint: { type: String, required: true, unique: true },
  ip: { type: String, required: true },
  voted_at: { type: Date, default: Date.now }
})

const Vote = mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema)

// Seed candidates - all IEC registered parties (2025) and maybe (2026)
// Source: https://iec.gm/political-parties/registered-parties/
// Party logos from IEC website
const CANDIDATES_SEED = [
  // Major parties (most prominent based on 2021 election)
  // Add party images to public folder: /npp.png, /udp.png, etc.
  { _id: 'npp', name: "NPP Candidate", party: "NPP – National People's Party", sort_order: 1, image: null },
  { _id: 'udp', name: "UDP Candidate", party: "UDP – United Democratic Party", sort_order: 2, image: null },
  { _id: 'gdc', name: "GDC Candidate", party: "GDC – Gambia Democratic Congress", sort_order: 3, image: null },
  { _id: 'pdois', name: "PDOIS Candidate", party: "PDOIS – People's Democratic Organisation for Independence and Socialism", sort_order: 4, image: null },
  
  // Other established parties
  { _id: 'aprc', name: "APRC Candidate", party: "APRC – Alliance for Patriotic Reorientation and Construction", sort_order: 5, image: null },
  { _id: 'nup', name: "NUP Candidate", party: "NUP – National Unity Party", sort_order: 6, image: null },
  { _id: 'ca', name: "CA Candidate", party: "CA – Citizens' Alliance", sort_order: 7, image: null },
  { _id: 'gfa', name: "GFA Candidate", party: "GFA – Gambia For All Party", sort_order: 8, image: null },
  { _id: 'gmc', name: "GMC Candidate", party: "GMC – Gambia Moral Congress", sort_order: 9, image: null },
  
  // Historical and smaller parties
  { _id: 'ppp', name: "PPP Candidate", party: "PPP – People's Progressive Party", sort_order: 10, image: null },
  { _id: 'nrp', name: "NRP Candidate", party: "NRP – National Reconciliation Party", sort_order: 11, image: null },
  { _id: 'ncp', name: "NCP Candidate", party: "NCP – National Convention Party", sort_order: 12, image: null },
  { _id: 'gpdp', name: "GPDP Candidate", party: "GPDP – Gambia Party for Democracy and Progress", sort_order: 13, image: null },
  { _id: 'app', name: "APP Candidate", party: "APP – All Peoples Party (Sobeyaa)", sort_order: 14, image: null },
  { _id: 'anrd', name: "ANRD Candidate", party: "ANRD – Alliance for National Re-orientation and Development", sort_order: 15, image: null },
  { _id: 'gap', name: "GAP Candidate", party: "GAP – Gambia Action Party", sort_order: 16, image: null },
  { _id: 'add', name: "ADD Candidate", party: "ADD – Alliance for Democracy and Development", sort_order: 17, image: null },
  { _id: 'ganu', name: "GANU Candidate", party: "GANU – Gambia Alliance for National Unity", sort_order: 18, image: null },
  { _id: 'pap', name: "PAP Candidate", party: "PAP – People's Alliance Party", sort_order: 19, image: null },
  { _id: 'dp', name: "DP Candidate", party: "DP – Democratic Party", sort_order: 20, image: null },
  { _id: 'apc', name: "APC Candidate", party: "APC – Alliance of Progressive Citizens", sort_order: 21, image: null },
  { _id: 'gpap', name: "GPAP Candidate", party: "GPAP – Gambia People's Advancement Party", sort_order: 22, image: null },
  
  // New/emerging parties
  { _id: 'umc', name: "UMC Candidate", party: "UMC – Unite Movement for Change", sort_order: 23, image: null },
  
  // Independent/other option
  { _id: 'other', name: "Independent Candidate", party: "Independent / Other", sort_order: 24, image: null }
]

async function seedCandidates() {
  console.log('[seedCandidates] Starting seeding...')
  try {
    // Use upsert to handle existing documents gracefully
    let count = 0
    for (const candidate of CANDIDATES_SEED) {
      const result = await Candidate.findOneAndUpdate(
        { _id: candidate._id },
        candidate,
        { upsert: true, new: true }
      )
      if (result) count++
    }
    console.log(`[seedCandidates] Seeded ${count} candidates`)
  } catch (err) {
    console.error('[seedCandidates] Error seeding candidates:', err)
  }
}

// Manual seed function for scripts
export async function seedCandidatesManual() {
  await connectDb()
  console.log('[seedCandidatesManual] Starting seed...')
  let inserted = 0
  let updated = 0
  for (const candidate of CANDIDATES_SEED) {
    const result = await Candidate.findOneAndUpdate(
      { _id: candidate._id },
      candidate,
      { upsert: true, new: true }
    )
    if (result) {
      const existing = await Candidate.findById(candidate._id).lean()
      if (existing) {
        updated++
      } else {
        inserted++
      }
    }
  }
  console.log(`[seedCandidatesManual] Complete: ${inserted} inserted, ${updated} updated`)
}

// Initialize on first use
let initialized = false
async function init() {
  if (initialized) return
  console.log('[init] Starting initialization...')
  await connectDb()
  await seedCandidates()
  const count = await Candidate.countDocuments()
  console.log(`[init] Candidates in DB: ${count}`)
  initialized = true
  console.log('[init] Initialization complete')
}

export interface Candidate {
  id: string
  name: string
  party: string
  sort_order: number
  image?: string | null
}

export interface ResultRow extends Candidate {
  votes: number
}

export async function getResults(): Promise<ResultRow[]> {
  console.log('[getResults] Starting...')
  await init()
  const candidates = await Candidate.find().sort({ sort_order: 1 }).lean()
  console.log(`[getResults] Found ${candidates.length} candidates`)
  
  if (candidates.length === 0) {
    console.log('[getResults] WARNING: No candidates found in database!')
  }
  
  const results: ResultRow[] = []
  
  for (const c of candidates) {
    const votes = await Vote.countDocuments({ candidate_id: c._id })
    results.push({
      id: c._id as string,
      name: c.name as string,
      party: c.party as string,
      sort_order: c.sort_order as number,
      image: (c.image as string | null | undefined) || null,
      votes
    })
  }
  
  console.log(`[getResults] Returning ${results.length} results`)
  return results
}

export async function getTotalVotes(): Promise<number> {
  await init()
  return Vote.countDocuments()
}

export async function hasVoted(fingerprint: string): Promise<boolean> {
  await init()
  const vote = await Vote.findOne({ fingerprint }).lean()
  return !!vote
}

export async function castVote(candidateId: string, fingerprint: string, ip: string): Promise<'ok' | 'duplicate' | 'invalid'> {
  await init()
  
  const candidate = await Candidate.findById(candidateId).lean()
  if (!candidate) return 'invalid'
  
  if (await hasVoted(fingerprint)) return 'duplicate'
  
  await Vote.create({
    candidate_id: candidateId,
    fingerprint,
    ip
  })
  
  return 'ok'
}
