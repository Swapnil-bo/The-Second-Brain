// Description: Hover card that appears when a graph node is selected. Shows entity name,
// type badge, description, confidence score, occurrence count, and source list.
// Positioned as a floating card near the sidebar. Framer Motion enter/exit.

import { motion, AnimatePresence } from 'framer-motion'
import { Brain, User, Cpu, BookOpen, Building2, Calendar, HelpCircle, X, Hash, FileText, Zap } from 'lucide-react'
import { getEntityConfig } from '../../utils/entityColors'
import { formatConfidence } from '../../utils/formatters'
import { useBrain } from '../../context/BrainContext'

const iconMap = {
  Brain,
  User,
  Cpu,
  BookOpen,
  Building2,
  Calendar,
  HelpCircle,
}

export default function NodeTooltip() {
  const { state, clearSelection } = useBrain()
  const node = state.selectedNode

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute top-4 left-4 z-30 w-72 rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-dim)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(124, 58, 237, 0.08)',
          }}
        >
          <TooltipContent node={node} onClose={clearSelection} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TooltipContent({ node, onClose }) {
  const config = getEntityConfig(node.type)
  const Icon = iconMap[config.icon] || HelpCircle

  return (
    <>
      {/* Header bar with entity color */}
      <div
        className="h-1 w-full"
        style={{ background: config.raw }}
      />

      <div className="p-4">
        {/* Top row: icon + name + close */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
              style={{
                background: `${config.raw}15`,
                border: `1px solid ${config.raw}30`,
              }}
            >
              <Icon size={18} style={{ color: config.raw }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3
                className="text-sm font-semibold truncate"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                }}
              >
                {node.name}
              </h3>
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider mt-0.5"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: `${config.raw}20`,
                  color: config.raw,
                }}
              >
                {config.label}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 transition-colors duration-150"
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
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        {node.description && (
          <p
            className="text-xs leading-relaxed mb-3"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
            }}
          >
            {node.description}
          </p>
        )}

        {/* Stats row */}
        <div
          className="flex items-center gap-4 pt-3"
          style={{ borderTop: '1px solid var(--border-dim)' }}
        >
          <StatItem
            icon={<Zap size={11} />}
            label="Confidence"
            value={formatConfidence(node.confidence)}
            color="var(--accent-bright)"
          />
          <StatItem
            icon={<Hash size={11} />}
            label="Occurrences"
            value={node.occurrence_count || 0}
            color="var(--entity-concept)"
          />
          <StatItem
            icon={<FileText size={11} />}
            label="Sources"
            value={node.source_ids?.length || 0}
            color="var(--entity-technology)"
          />
        </div>
      </div>
    </>
  )
}

function StatItem({ icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span
          className="text-xs font-medium"
          style={{ fontFamily: 'var(--font-mono)', color }}
        >
          {value}
        </span>
      </div>
      <span
        className="text-[9px]"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--text-dim)',
        }}
      >
        {label}
      </span>
    </div>
  )
}
