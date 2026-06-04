'use client'

import { useState, useEffect } from 'react'
import styles from './NetworkStatus.module.css'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOnline, setShowOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOnline(true)
      setTimeout(() => setShowOnline(false), 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOnline(true)
    }

    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showOnline) return null

  return (
    <div className={`${styles.banner} ${isOnline ? styles.online : styles.offline}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          {isOnline ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12l5 5 9-9" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </span>
        <span className={styles.text}>
          {isOnline ? 'Back online' : 'You\'re offline. Check your connection.'}
        </span>
      </div>
    </div>
  )
}
