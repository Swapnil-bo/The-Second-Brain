// Description: Individual knowledge gap card — topic name, type badge, "Why you're missing
// this" explanation, connected entity pills (clickable), expandable LearningPath, and
// priority badge (HIGH=red, MEDIUM=amber, LOW=green). Spring entrance animation.

import { motion } from 'framer-motion'
import { AlertCircle, Link2 } from 'lucide-react'
import { getEntityConfig } from '../../utils/entityColors'
import LearningPath from './LearningPath'

const priorityColors = {
  HIGH: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
  MEDIUM: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
  LOW: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
}

export default function GapCard({ gap, index, onEntityClick }) {
  const config = getEntityConfig(gap.type)
  const priority = priorityColors[gap.priority] || priorityColors.MEDIUM

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 25 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-dim)',
      }}
    >
      {/* Top color bar */}
      <div className="h-0.5 w-full" style={{ background: config.raw }} />

      <div className="p-3.5 flex flex-col gap-3">
        {/* Header: topic + priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <h3
              className="text-sm font-semibold"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              {gap.topic}
            </h3>
            <span
              className="inline-flex items-center self-start px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-mono)',
                background: `${config.raw}20`,
                color: config.raw,
              }}
            >
              {config.label}
            </span>
          </div>

          {/* Priority badge */}
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
            style={{
              fontFamily: 'var(--font-mono)',
              background: priority.bg,
              border: `1px solid ${priority.border}`,
              color: priority.text,
            }}
          >
            <AlertCircle size={10} />
            {gap.priority}
          </span>
        </div>

        {/* Why you're missing this */}
        {gap.why_missing && (
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
              }}
            >
              Why you're missing this
            </span>
            <p
              className="text-xs leading-relaxed"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--text-secondary)',
              }}
            >
              {gap.why_missing}
            </p>
          </div>
        )}

        {/* Connected to what you know */}
        {gap.connection_to_known?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
              }}
            >
              <Link2 size={10} />
              Connected to
            </span>
            <div className="flex flex-wrap gap-1">
              {gap.connection_to_known.map((name, i) => (
                <motion.button
                  key={i}
                  onClick={() => onEntityClick?.(name)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-150 cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent-bright)',
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                  }}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(124, 58, 237, 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  {name}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Learning path */}
        <LearningPath steps={gap.learning_path} totalTime={gap.total_time} />
      </div>
    </motion.div>
  )
}
