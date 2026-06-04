'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import styles from './ResultsBar.module.css'

interface Props {
  id: string
  name: string
  party: string
  image?: string | null
  votes: number
  total: number
  isLeading: boolean
  votedFor: boolean
}

// Party colors for accents - solid colors only
const PARTY_COLORS: Record<string, string> = {
  npp: '#1a7a4a', udp: '#2563eb', gdc: '#c9a84c', pdois: '#7c3aed',
  aprc: '#059669', nup: '#0891b2', ca: '#ea580c', gfa: '#dc2626',
  gmc: '#4f46e5', ppp: '#be123c', nrp: '#0369a1', ncp: '#a16207',
  gpdp: '#4338ca', app: '#0d9488', anrd: '#9f1239', gap: '#65a30d',
  add: '#1e40af', ganu: '#b45309', pap: '#15803d', dp: '#7c2d12',
  apc: '#3730a3', gpap: '#991b1b', umc: '#3f6212', other: '#6b7280',
}

function getLocalImagePath(id: string): string {
  return `/${id}.png`
}

export default function ResultsBar({ id, name, party, votes, total, isLeading, votedFor }: Props) {
  const pct = total > 0 ? Math.round((votes / total) * 100) : 0
  const barRef = useRef<HTMLDivElement>(null)
  const accentColor = PARTY_COLORS[id] ?? PARTY_COLORS.other
  const localImage = getLocalImagePath(id)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    el.style.width = '0%'
    requestAnimationFrame(() => {
      el.style.transition = 'width 0.7s cubic-bezier(0.4,0,0.2,1)'
      el.style.width = `${pct}%`
    })
  }, [pct])

  return (
    <div className={`${styles.row} ${isLeading ? styles.leading : ''}`}>
      <div className={styles.header}>
        <div className={styles.partyInfo}>
          <div 
            className={styles.imageWrapper} 
            style={{ 
              borderColor: accentColor,
              backgroundColor: imageError ? accentColor : '#f3f4f6'
            }}
          >
            {!imageError && (
              <Image
                src={localImage}
                alt={party}
                width={48}
                height={48}
                className={styles.partyLogo}
                onError={() => setImageError(true)}
              />
            )}
            {imageError && (
              <div className={styles.fallback}>
                {id.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.text}>
            <span className={styles.partyName}>{party.split('–')[0].trim()}</span>
            <div className={styles.metaRow}>
              <span className={styles.candidateName}>{name}</span>
              {votedFor && <span className={styles.badge}>You</span>}
              {isLeading && <span className={styles.badgeLead}>Leading</span>}
            </div>
          </div>
        </div>
        <span className={styles.percentage}>{pct}%</span>
      </div>
      
      <div className={styles.progressTrack}>
        <div 
          ref={barRef} 
          className={styles.progressFill} 
          style={{ backgroundColor: accentColor }} 
        />
      </div>
      
      <span className={styles.voteCount}>{votes.toLocaleString()} votes</span>
    </div>
  )
}
