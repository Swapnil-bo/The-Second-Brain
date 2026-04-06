// Description: Expandable source chunk card — shows source name, type badge, and chunk
// preview. Expands on click to show full chunk text. Used inside ChatMessage for citations.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { truncate, getSourceTypeLabel } from '../../utils/formatters'

export default function SourceCitation({ source, index }) {
  const [expanded, setExpanded] = useState(false)

  const sourceName = source?.source_name || source?.metadata?.source_name || `Source ${index + 1}`
  const sourceType = source?.source_type || source?.metadata?.source_type || 'text'
  const content = source?.content || source?.document || source?.text || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-dim)',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors duration-150"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <FileText size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />

        <span
          className="text-[11px] truncate flex-1"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-secondary)',
          }}
        >
          {sourceName}
        </span>

        <span
          className="text-[9px] uppercase px-1.5 py-0.5 rounded flex-shrink-0"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-dim)',
            background: 'var(--bg-elevated)',
          }}
        >
          {getSourceTypeLabel(sourceType)}
        </span>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown size={12} style={{ color: 'var(--text-dim)' }} />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-2.5 py-2 text-[11px] leading-relaxed"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-dim)',
                maxHeight: 150,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
