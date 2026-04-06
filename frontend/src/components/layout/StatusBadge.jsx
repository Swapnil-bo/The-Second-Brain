// Description: Backend health indicator — pulsing dot + label. Green when connected,
// red when disconnected. Polls /api/health every 15 seconds. Updates global state.

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff } from 'lucide-react'
import { useBrain } from '../../context/BrainContext'
import { checkHealth } from '../../api/client'

export default function StatusBadge() {
  const { state, dispatch } = useBrain()
  const intervalRef = useRef(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await checkHealth()
        dispatch({ type: 'SET_BACKEND_HEALTH', payload: res.status === 200 })
      } catch {
        dispatch({ type: 'SET_BACKEND_HEALTH', payload: false })
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 15000)
    return () => clearInterval(intervalRef.current)
  }, [dispatch])

  const healthy = state.backendHealthy

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-2 px-2.5 py-1 rounded-lg"
      style={{
        background: healthy
          ? 'rgba(16, 185, 129, 0.06)'
          : 'rgba(239, 68, 68, 0.06)',
        border: `1px solid ${healthy
          ? 'rgba(16, 185, 129, 0.15)'
          : 'rgba(239, 68, 68, 0.15)'}`,
      }}
    >
      {/* Pulsing dot */}
      <div className="relative flex items-center justify-center w-3 h-3">
        {healthy && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'var(--status-success)' }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div
          className="w-2 h-2 rounded-full relative z-10"
          style={{
            background: healthy ? 'var(--status-success)' : 'var(--status-error)',
          }}
        />
      </div>

      <span
        className="text-[10px] font-medium"
        style={{
          fontFamily: 'var(--font-mono)',
          color: healthy ? 'var(--status-success)' : 'var(--status-error)',
        }}
      >
        {healthy ? 'Online' : 'Offline'}
      </span>
    </motion.div>
  )
}
