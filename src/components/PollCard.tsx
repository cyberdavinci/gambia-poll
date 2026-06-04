'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './PollCard.module.css'

interface Props {
  id: string
  name: string
  party: string
  image?: string | null
  selected: boolean
  disabled: boolean
  onSelect: (id: string) => void
  style?: React.CSSProperties
}

// Party colors for accents - solid colors only, no gradients
const PARTY_COLORS: Record<string, string> = {
  npp: '#1a7a4a', udp: '#2563eb', gdc: '#c9a84c', pdois: '#7c3aed',
  aprc: '#059669', nup: '#0891b2', ca: '#ea580c', gfa: '#dc2626',
  gmc: '#4f46e5', ppp: '#be123c', nrp: '#0369a1', ncp: '#a16207',
  gpdp: '#4338ca', app: '#0d9488', anrd: '#9f1239', gap: '#65a30d',
  add: '#1e40af', ganu: '#b45309', pap: '#15803d', dp: '#7c2d12',
  apc: '#3730a3', gpap: '#991b1b', umc: '#3f6212', other: '#6b7280',
}

// Get local image path from public folder
function getLocalImagePath(id: string): string {
  return `/${id}.png`
}

export default function PollCard({ id, name, party, selected, disabled, onSelect, style }: Props) {
  const accentColor = PARTY_COLORS[id] ?? PARTY_COLORS.other
  const localImage = getLocalImagePath(id)
  const [imageError, setImageError] = useState(false)

  return (
    <button
      className={`${styles.card} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      onClick={() => !disabled && onSelect(id)}
      aria-pressed={selected}
      aria-label={`Vote for ${name}`}
      disabled={disabled}
      style={style}
    >
      {/* Top accent bar */}
      <div className={styles.accentBar} style={{ backgroundColor: accentColor }} />
      
      {/* Check indicator */}
      <div className={`${styles.checkBadge} ${selected ? styles.checkVisible : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      {/* Image area */}
      <div className={styles.imageArea}>
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
              width={100}
              height={100}
              className={styles.partyLogo}
              onError={() => setImageError(true)}
            />
          )}
          {imageError && (
            <div className={styles.fallbackInitials}>
              {id.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Text content */}
      <div className={styles.content}>
        <h3 className={styles.partyName}>{party.split('–')[0].trim()}</h3>
        <p className={styles.candidateName}>{name}</p>
      </div>
    </button>
  )
}
