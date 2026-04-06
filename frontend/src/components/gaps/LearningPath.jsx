// Description: Step-by-step curriculum component — 4 numbered steps with action, resource,
// and time estimate. Expandable accordion with animated reveal. Vertical timeline connector.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookOpen, Clock, ExternalLink } from 'lucide-react'

export default function LearningPath({ steps, totalTime }) {
  const [expanded, setExpanded] = useState(false)

  if (!steps?.length) return null

  return (
    <div className="flex flex-col">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-colors duration-150"
        style={{ background: 'var(--bg-surface)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-surface)'
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={12} style={{ color: 'var(--accent-bright)' }} />
          <span
            className="text-[11px] font-medium"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            Learning Path
          </span>
          <span
            className="text-[10px]"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-dim)',
            }}
          >
            {steps.length} steps
          </span>
        </div>

        <div className="flex items-center gap-2">
          {totalTime && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
              }}
            >
              <Clock size={10} />
              {totalTime}
            </span>
          )}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={12} style={{ color: 'var(--text-dim)' }} />
          </motion.div>
        </div>
      </button>

      {/* Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0 pt-2 pl-1">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.2 }}
                  className="flex gap-3 relative"
                >
                  {/* Vertical timeline line */}
                  {i < steps.length - 1 && (
                    <div
                      className="absolute left-[11px] top-6 w-px"
                      style={{
                        background: 'var(--border-dim)',
                        height: 'calc(100% - 4px)',
                      }}
                    />
                  )}

                  {/* Step number circle */}
                  <div
                    className="flex items-center justify-center w-[22px] h-[22px] rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      background: 'var(--accent-subtle)',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                    }}
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent-bright)',
                      }}
                    >
                      {step.step || i + 1}
                    </span>
                  </div>

                  {/* Step content */}
                  <div className="flex flex-col gap-0.5 pb-3 min-w-0 flex-1">
                    <span
                      className="text-[11px] font-medium"
                      style={{
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {step.action}
                    </span>
                    {step.resource && (
                      <span
                        className="flex items-center gap-1 text-[10px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-bright)',
                        }}
                      >
                        <ExternalLink size={9} />
                        {step.resource}
                      </span>
                    )}
                    {step.time && (
                      <span
                        className="flex items-center gap-1 text-[9px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-dim)',
                        }}
                      >
                        <Clock size={8} />
                        {step.time}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
