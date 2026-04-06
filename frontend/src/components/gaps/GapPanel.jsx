// Description: Gap detection results panel — "Analyze My Brain" button triggers POST /api/gaps.
// Shows cache_hit badge, animated neural loading state, gap cards sorted by priority,
// and surprising connections section. Slides in from right.

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb, Zap, RefreshCw, Sparkles, Loader2 } from 'lucide-react'
import { useBrain } from '../../context/BrainContext'
import { analyzeGaps } from '../../api/client'
import GapCard from './GapCard'

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }

export default function GapPanel() {
  const { state, dispatch, closePanel } = useBrain()

  const handleAnalyze = useCallback(async () => {
    dispatch({ type: 'SET_GAP_LOADING', payload: true })
    try {
      const res = await analyzeGaps()
      dispatch({ type: 'SET_GAP_RESULT', payload: res.data })
    } catch {
      dispatch({ type: 'SET_GAP_LOADING', payload: false })
    }
  }, [dispatch])

  const handleEntityClick = (name) => {
    dispatch({
      type: 'SELECT_NODE',
      payload: { name, type: 'CONCEPT' },
    })
  }

  const sortedGaps = state.gapResult?.gaps
    ? [...state.gapResult.gaps].sort(
        (a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
      )
    : []

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="panel-overlay flex flex-col"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-dim)' }}
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={15} style={{ color: 'var(--accent-bright)' }} />
          <h2
            className="text-sm font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            Knowledge Gaps
          </h2>
          {state.gapResult?.cache_hit && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)',
              }}
            >
              cached
            </span>
          )}
        </div>
        <button
          onClick={closePanel}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-150"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-dim)'
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Analyze button */}
        <motion.button
          onClick={handleAnalyze}
          disabled={state.gapLoading}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed w-full"
          style={{
            fontFamily: 'var(--font-display)',
            background: state.gapLoading
              ? 'var(--bg-elevated)'
              : 'linear-gradient(135deg, var(--accent), rgba(168, 85, 247, 0.9))',
            color: state.gapLoading ? 'var(--text-secondary)' : '#fff',
            border: `1px solid ${state.gapLoading ? 'var(--border-dim)' : 'var(--accent)'}`,
            boxShadow: state.gapLoading ? 'none' : '0 0 30px var(--accent-glow)',
          }}
          whileHover={!state.gapLoading ? { scale: 1.02, boxShadow: '0 0 40px rgba(124, 58, 237, 0.4)' } : {}}
          whileTap={!state.gapLoading ? { scale: 0.98 } : {}}
        >
          {state.gapLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={16} />
              </motion.div>
              Reasoning over your knowledge graph...
            </>
          ) : state.gapResult ? (
            <>
              <RefreshCw size={16} />
              Re-analyze My Brain
            </>
          ) : (
            <>
              <Zap size={16} />
              Analyze My Brain
            </>
          )}
        </motion.button>

        {/* Loading state — animated neural network */}
        <AnimatePresence>
          {state.gapLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <NeuralLoadingAnimation />
              <p
                className="text-xs text-center"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-dim)',
                }}
              >
                Analyzing entity connections and identifying gaps...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {!state.gapLoading && state.gapResult && (
          <>
            {/* Gaps */}
            {sortedGaps.length > 0 && (
              <div className="flex flex-col gap-3">
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-dim)',
                  }}
                >
                  Gaps Found ({sortedGaps.length})
                </span>
                {sortedGaps.map((gap, i) => (
                  <GapCard
                    key={i}
                    gap={gap}
                    index={i}
                    onEntityClick={handleEntityClick}
                  />
                ))}
              </div>
            )}

            {/* Surprising connections */}
            {state.gapResult.surprising_connections?.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <span
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-dim)',
                  }}
                >
                  <Sparkles size={11} style={{ color: 'var(--accent-bright)' }} />
                  Surprising Connections
                </span>
                {state.gapResult.surprising_connections.map((conn, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (sortedGaps.length + i) * 0.1 }}
                    className="p-3 rounded-lg"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-dim)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[11px] font-semibold"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: 'var(--accent-bright)',
                        }}
                      >
                        {conn.entity_a}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        &harr;
                      </span>
                      <span
                        className="text-[11px] font-semibold"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: 'var(--accent-bright)',
                        }}
                      >
                        {conn.entity_b}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed"
                      style={{
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {conn.connection}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty gaps */}
            {sortedGaps.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Sparkles size={24} style={{ color: 'var(--accent-bright)' }} />
                <p
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  No significant gaps detected. Your knowledge graph looks well-connected.
                </p>
              </div>
            )}
          </>
        )}

        {/* Initial empty state */}
        {!state.gapLoading && !state.gapResult && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid rgba(124, 58, 237, 0.15)',
              }}
            >
              <Lightbulb size={24} style={{ color: 'var(--accent-bright)' }} />
            </motion.div>
            <div className="space-y-1">
              <h3
                className="text-sm font-semibold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                }}
              >
                Discover What You Don't Know
              </h3>
              <p
                className="text-xs leading-relaxed max-w-[260px]"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-dim)',
                }}
              >
                Analyze your knowledge graph to find gaps, missing concepts, and surprising connections between your notes.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function NeuralLoadingAnimation() {
  const nodes = [
    { x: 40, y: 20 }, { x: 80, y: 10 }, { x: 60, y: 50 },
    { x: 20, y: 45 }, { x: 95, y: 42 }, { x: 50, y: 80 },
  ]

  return (
    <svg width="120" height="100" viewBox="0 0 120 100">
      {/* Edges */}
      {nodes.map((from, i) =>
        nodes.slice(i + 1).map((to, j) => (
          <motion.line
            key={`${i}-${j}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--accent)"
            strokeWidth={0.5}
            animate={{
              opacity: [0.1, 0.4, 0.1],
              strokeWidth: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: (i + j) * 0.3,
            }}
          />
        ))
      )}
      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.circle
          key={i}
          cx={node.x}
          cy={node.y}
          r={3}
          fill="var(--accent-bright)"
          animate={{
            r: [3, 5, 3],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.25,
          }}
        />
      ))}
    </svg>
  )
}
