'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useSWR from 'swr'
import PollCard from '@/components/PollCard'
import ResultsBar from '@/components/ResultsBar'
import NetworkStatus from '@/components/NetworkStatus'
import styles from './page.module.css'
import Image from 'next/image'

// Confetti particle for celebration
interface Particle {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
  velocity: { x: number; y: number }
}

function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])
  
  useEffect(() => {
    if (!active) {
      setParticles([])
      return
    }
    
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']
    const newParticles: Particle[] = []
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        velocity: {
          x: (Math.random() - 0.5) * 20,
          y: -10 - Math.random() * 15
        }
      })
    }
    
    setParticles(newParticles)
    
    const timer = setTimeout(() => setParticles([]), 2000)
    return () => clearTimeout(timer)
  }, [active])
  
  if (particles.length === 0) return null
  
  return (
    <div className={styles.confettiContainer}>
      {particles.map(p => (
        <div
          key={p.id}
          className={styles.confetti}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            '--velocity-x': `${p.velocity.x}vw`,
            '--velocity-y': `${p.velocity.y}vh`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

interface ResultRow {
  id: string
  name: string
  party: string
  image?: string | null
  votes: number
}

interface PollData {
  results: ResultRow[]
  total: number
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STORAGE_KEY = 'gm_poll_voted'

export default function PollPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [phase, setPhase] = useState<'vote' | 'results'>('vote')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { data, mutate } = useSWR<PollData>('/api/results', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  })

  // Generate browser fingerprint on mount
  useEffect(() => {
    async function getFingerprint() {
      // Check localStorage first
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setHasVoted(true)
        setVotedFor(parsed.candidateId)
        setPhase('results')
      }

      // Build a lightweight fingerprint from browser characteristics
      const nav = window.navigator
      const raw = [
        nav.language,
        nav.platform,
        nav.hardwareConcurrency,
        screen.width,
        screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        nav.userAgent,
      ].join('|')

      // Hash it
      const encoder = new TextEncoder()
      const data = encoder.encode(raw)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const fp = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setFingerprint(fp)

      // Double-check server side
      const res = await fetch(`/api/vote?fp=${fp}`)
      const json = await res.json()
      if (json.voted && !stored) {
        setHasVoted(true)
        setPhase('results')
      }
    }
    getFingerprint()
  }, [])

  const handleVote = useCallback(async () => {
    if (!selected || !fingerprint || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selected, fingerprint }),
      })

      if (res.status === 409) {
        setError('Looks like you\'ve already voted.')
        setHasVoted(true)
        setPhase('results')
        return
      }

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ candidateId: selected }))
      setHasVoted(true)
      setVotedFor(selected)
      setPhase('results')
      setShowConfetti(true)
      mutate() // Immediately refresh results
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [selected, fingerprint, submitting, mutate])

  const results = Array.isArray(data?.results) ? data.results : []
  const total = data?.total ?? 0
  const maxVotes = Math.max(...results.map(r => r.votes), 1)
  
  // Filter results based on search query
  const filteredResults = searchQuery.trim()
    ? results.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.party.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : results

  return (
    <main className={styles.main}>
      <NetworkStatus />
      {/* Header */}
      <header className={styles.header}>
        <Image
          src="/gambialogo.jpg"
          alt="Gambia Votes Logo"
          width={120}
          height={120}
          className={styles.logo}
          priority
        />
        <h1 className={styles.title}>Gambia Votes</h1>
        <p className={styles.subtitle}>
          Who do you think will win the next presidential election?
        </p>
        <p className={styles.anon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Completely anonymous · No sign-up required
        </p>
      </header>

      <div className={styles.container}>
        {/* Vote phase */}
        {phase === 'vote' && (
          <section className={styles.voteSection} aria-label="Cast your vote">
            <h2 className={styles.sectionLabel}>Cast your vote</h2>
            {/* Search input */}
            <div className={styles.searchContainer}>
              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search by party or candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button 
                    className={styles.clearSearch}
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>
              <span className={styles.searchCount}>
                {filteredResults.length} option{filteredResults.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Mobile swipe hint */}
            {isMobile && filteredResults.length > 4 && (
              <div className={styles.swipeHint}>
                <span>👆 Swipe to explore</span>
                <div className={styles.swipeDots}>
                  {Array.from({ length: Math.min(5, Math.ceil(filteredResults.length / 4)) }).map((_, i) => (
                    <span key={i} className={styles.dot} />
                  ))}
                </div>
              </div>
            )}

            <div 
              ref={cardContainerRef}
              className={styles.candidateList}
              onTouchStart={(e) => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
              onTouchEnd={(e) => {
                if (!touchStart) return
                const diffX = touchStart.x - e.changedTouches[0].clientX
                const diffY = touchStart.y - e.changedTouches[0].clientY
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                  // Horizontal swipe detected
                  setIsAnimating(true)
                  setTimeout(() => setIsAnimating(false), 300)
                }
                setTouchStart(null)
              }}
            >
              {results.length === 0
                ? Array.from({ length: isMobile ? 4 : 8 }).map((_, i) => (
                    <div key={i} className={styles.skeleton}>
                      <div className={styles.skeletonImage} />
                      <div className={styles.skeletonText} />
                      <div className={styles.skeletonTextShort} />
                    </div>
                  ))
                : filteredResults.map((c, index) => (
                    <PollCard
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      party={c.party}
                      image={c.image}
                      selected={selected === c.id}
                      disabled={hasVoted}
                      onSelect={setSelected}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    />
                  ))}
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <button
              className={`${styles.voteBtn} ${selected ? styles.voteBtnReady : ''}`}
              onClick={handleVote}
              disabled={!selected || submitting || hasVoted}
              aria-busy={submitting}
            >
              {submitting ? 'Submitting…' : selected ? 'Submit my vote' : 'Select a candidate above'}
            </button>

            <button
              className={styles.viewResults}
              onClick={() => setPhase('results')}
            >
              View current results without voting →
            </button>
          </section>
        )}

        {/* Results phase */}
        {phase === 'results' && (
          <section className={styles.resultsSection} aria-label="Poll results">
            <div className={styles.resultsHeader}>
              <h2 className={styles.sectionLabel}>
                {hasVoted ? 'Thank you for voting!' : 'Current results'}
              </h2>
              {hasVoted && votedFor && (
                <p className={styles.confirmedMsg}>
                  Your vote for <strong>{results.find(r => r.id === votedFor)?.name ?? votedFor}</strong> has been recorded.
                </p>
              )}
              <p className={styles.totalCount}>
                {total.toLocaleString()} {total === 1 ? 'person has' : 'people have'} voted · updates every 5s
              </p>
            </div>

            {/* Search in results */}
            <div className={styles.searchContainer}>
              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search results by party..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button 
                    className={styles.clearSearch}
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className={styles.resultsList}>
              {results.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.skeleton} style={{ flexDirection: 'row', alignItems: 'center', padding: '16px 20px' }}>
                      <div className={styles.skeletonImage} style={{ width: '52px', height: '52px', marginBottom: 0, marginRight: '14px' }} />
                      <div style={{ flex: 1 }}>
                        <div className={styles.skeletonText} style={{ marginBottom: '8px' }} />
                        <div className={styles.skeletonTextShort} style={{ width: '40%' }} />
                      </div>
                    </div>
                  ))
                : [...filteredResults]
                    .sort((a, b) => b.votes - a.votes)
                    .map(r => (
                      <ResultsBar
                        key={r.id}
                        id={r.id}
                        name={r.name}
                        party={r.party}
                        image={r.image}
                        votes={r.votes}
                        total={total}
                        isLeading={r.votes === maxVotes && r.votes > 0}
                        votedFor={r.id === votedFor}
                      />
                    ))}
            </div>

            {!hasVoted && (
              <button className={styles.viewResults} onClick={() => setPhase('vote')}>
                ← Go back and vote
              </button>
            )}
          </section>
        )}
      </div>

      {/* Floating action button for mobile */}
      {isMobile && phase === 'vote' && selected && (
        <button 
          className={styles.floatingVoteBtn}
          onClick={handleVote}
          disabled={submitting}
        >
          {submitting ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <span>Vote</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </>
          )}
        </button>
      )}

      <footer className={styles.footer}>
        <div className={styles.disclaimer}>
          <p><strong>Disclaimer:</strong> This poll is for informational and entertainment purposes only. The results shown here do not predict election outcomes and should not be interpreted as representative of the actual electorate. This is simply an analysis of visitors' thoughts and opinions.</p>
        </div>
        <div className={styles.footerMeta}>
          <p>This is an unofficial public opinion poll · Results are not scientifically representative</p>
          <p className={styles.developer}>Developed by <a href="https://github.com/cyberdavinci" target="_blank" rel="noopener noreferrer">@cyberdavinci</a></p>
        </div>
      </footer>

      {/* Confetti celebration */}
      <Confetti active={showConfetti} />
    </main>
  )
}
