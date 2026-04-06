// Description: Live ingestion queue — shows each queued document with icon, name, stage
// progress bar (5 stages, color-coded), entity/relationship counts on completion,
// and delete button. Staggered entry animation with 80ms delay per item.

import { motion, AnimatePresence } from 'framer-motion'
import { FileText, FileCode, AlignLeft, Globe, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { useBrain } from '../../context/BrainContext'
import { deleteSource } from '../../api/client'
import { formatRelativeTime } from '../../utils/formatters'

const STAGES = ['parsing', 'chunking', 'embedding', 'extracting', 'storing_vectors', 'storing_entities', 'storing_relationships', 'rebuilding_graph', 'done']

const sourceIcons = {
  pdf: FileText,
  markdown: FileCode,
  text: AlignLeft,
  url: Globe,
}

function getStageProgress(stage) {
  const idx = STAGES.indexOf(stage)
  if (idx === -1) return 0
  if (stage === 'done') return 100
  if (stage === 'failed') return 0
  return Math.round(((idx + 1) / STAGES.length) * 100)
}

function getStageLabel(stage) {
  const labels = {
    parsing: 'Parsing...',
    chunking: 'Chunking...',
    embedding: 'Embedding...',
    extracting: 'Extracting entities...',
    storing_vectors: 'Storing vectors...',
    storing_entities: 'Storing entities...',
    storing_relationships: 'Storing relationships...',
    rebuilding_graph: 'Rebuilding graph...',
    done: 'Complete',
    failed: 'Failed',
  }
  return labels[stage] || stage
}

export default function IngestQueue() {
  const { state, dispatch } = useBrain()
  const queue = state.queue

  const handleDelete = async (sourceId) => {
    try {
      await deleteSource(sourceId)
      dispatch({
        type: 'SET_QUEUE',
        payload: queue.filter((q) => q.source_id !== sourceId),
      })
    } catch {
      // silently fail
    }
  }

  if (!queue.length) return null

  return (
    <div className="flex flex-col gap-1 mt-3">
      <span
        className="text-[10px] uppercase tracking-widest mb-1 px-1"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-dim)',
        }}
      >
        Queue ({queue.length})
      </span>

      <AnimatePresence>
        {queue.map((item, i) => {
          const Icon = sourceIcons[item.source_type] || FileText
          const progress = getStageProgress(item.stage)
          const isDone = item.stage === 'done'
          const isFailed = item.stage === 'failed'

          return (
            <motion.div
              key={item.source_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.08, duration: 0.25 }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{
                background: 'var(--bg-elevated)',
                border: `1px solid ${isFailed ? 'rgba(239, 68, 68, 0.2)' : isDone ? 'rgba(16, 185, 129, 0.15)' : 'var(--border-dim)'}`,
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                style={{
                  background: isDone
                    ? 'rgba(16, 185, 129, 0.1)'
                    : isFailed
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'var(--accent-subtle)',
                }}
              >
                {isDone ? (
                  <CheckCircle size={14} style={{ color: 'var(--status-success)' }} />
                ) : isFailed ? (
                  <AlertTriangle size={14} style={{ color: 'var(--status-error)' }} />
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 size={14} style={{ color: 'var(--accent-bright)' }} />
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0 flex-1 gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[11px] font-medium truncate"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.source_name || 'Untitled'}
                  </span>
                  <span
                    className="text-[9px] flex-shrink-0"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: isDone
                        ? 'var(--status-success)'
                        : isFailed
                        ? 'var(--status-error)'
                        : 'var(--text-dim)',
                    }}
                  >
                    {getStageLabel(item.stage)}
                  </span>
                </div>

                {/* Progress bar */}
                {!isDone && !isFailed && (
                  <div
                    className="w-full h-1 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'var(--accent-bright)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                )}

                {/* Completion stats */}
                {isDone && item.entity_count != null && (
                  <div
                    className="flex items-center gap-2 text-[9px]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>{item.entity_count} entities</span>
                    <span style={{ color: 'var(--text-dim)' }}>/</span>
                    <span>{item.relationship_count || 0} relationships</span>
                  </div>
                )}

                {/* Error message */}
                {isFailed && item.error && (
                  <span
                    className="text-[10px] truncate"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--status-error)',
                    }}
                  >
                    {item.error}
                  </span>
                )}
              </div>

              {/* Delete button */}
              {(isDone || isFailed) && (
                <button
                  onClick={() => handleDelete(item.source_id)}
                  className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 transition-colors duration-150"
                  style={{ color: 'var(--text-dim)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                    e.currentTarget.style.color = 'var(--status-error)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-dim)'
                  }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
