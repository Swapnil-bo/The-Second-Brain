// Description: Reusable loading spinner — pulsing neural orb with optional label.
// Uses accent color glow. Configurable size (sm, md, lg).

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const sizes = {
  sm: { orb: 32, icon: 14, label: '11px' },
  md: { orb: 48, icon: 20, label: '12px' },
  lg: { orb: 64, icon: 24, label: '13px' },
}

export default function LoadingSpinner({ size = 'md', label }) {
  const s = sizes[size] || sizes.md

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: s.orb, height: s.orb }}>
        {/* Pulsing glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Spinner icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2
            size={s.icon}
            style={{ color: 'var(--accent-bright)' }}
            strokeWidth={2}
          />
        </motion.div>
      </div>

      {label && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: s.label,
            fontFamily: 'var(--font-body)',
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </motion.p>
      )}
    </div>
  )
}
