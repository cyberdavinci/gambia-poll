# Gambia Poll 🇬🇲

An anonymous public opinion poll for the upcoming Gambian presidential election.
Built with Next.js 15, SWR, and MongoDB (via Mongoose). No auth, no sign-up.

---

## Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, CSS Modules
- **Data fetching**: SWR with 5s `refreshInterval` for live results
- **Database**: MongoDB (local or Atlas) — flexible document storage
- **Anti-duplicate**: Browser fingerprint (SHA-256 of browser characteristics) + localStorage flag

---

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Create a `.env.local` file with your MongoDB connection string (see `.env.example`). The database and candidates are auto-created on first run.

---

## Project structure

```
src/
  app/
    api/
      results/route.ts   # GET  – returns vote counts per candidate
      vote/route.ts      # POST – casts a vote; GET checks if fingerprint voted
    page.tsx             # Main poll page (client component)
    page.module.css
    layout.tsx
    globals.css
  components/
    PollCard.tsx          # Individual candidate card
    PollCard.module.css
    ResultsBar.tsx        # Animated results bar
    ResultsBar.module.css
  lib/
    db.ts                 # MongoDB helpers (init, getResults, castVote, hasVoted)
```

---

## API

### `GET /api/results`
Returns current vote tallies.
```json
{
  "results": [
    { "id": "barrow", "name": "Adama Barrow", "party": "NPP", "votes": 142 },
    ...
  ],
  "total": 320
}
```

### `GET /api/vote?fp=<fingerprint>`
Check if a fingerprint has already voted.
```json
{ "voted": true }
```

### `POST /api/vote`
Cast a vote.
```json
// Request
{ "candidateId": "barrow", "fingerprint": "abc123..." }

// Response 200
{ "success": true }

// Response 409 – already voted
{ "error": "Already voted" }
```

---

## Adding/editing candidates

Edit the seed in `src/lib/db.ts` (`seedCandidates` function) and clear the `candidates` collection in MongoDB to re-seed.

---

## Deployment

### Option 1: MongoDB Atlas (Recommended)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string and set it as `MONGODB_URI` environment variable
3. Deploy to Vercel, Coolify, or any VPS with `pnpm start`

### Option 2: Self-hosted MongoDB
1. Install MongoDB on your server
2. Set `MONGODB_URI` to your local MongoDB instance
3. Deploy with `pnpm start`

> Ensure your MongoDB instance is accessible from your deployment environment.

---

## Limitations & future ideas

- Fingerprinting is not foolproof — a determined person can spoof it. Good enough for a public poll.
- Add a **region selector** (West Coast, North Bank, LRR, URR, CRR, NBR) to show regional breakdowns.
- Add a **WhatsApp share button** — huge for Gambia's social media landscape.
- Export results to CSV for journalists / researchers.
