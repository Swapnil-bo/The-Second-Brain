// Description: Left sidebar — 240px fixed width. Navigation buttons for Upload, Chat, Gaps,
// and Stats panels. Shows active panel highlight. Animated icons and labels.
// Bottom section: graph stats summary.

import { motion } from 'framer-motion'
import {
  Upload,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Brain,
  ChevronRight,
} from 'lucide-react'
import { useBrain } from '../../context/BrainContext'

const navItems = [
  { id: 'ingest', label: 'Upload', icon: Upload, description: 'Ingest documents' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, description: 'Query your brain' },
  { id: 'gaps', label: 'Gaps', icon: Lightbulb, description: 'Find knowledge gaps' },
]

export default function Sidebar() {
  const { state, setActivePanel } = useBrain()

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col flex-shrink-0 h-full"
      style={{
        width: 240,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-dim)',
      }}
    >
      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        <span
          className="text-[10px] uppercase tracking-widest mb-2 px-2"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-dim)',
          }}
        >
          Panels
        </span>

        {navItems.map((item, i) => {
          const isActive = state.activePanel === item.id
          const Icon = item.icon

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.25 }}
              onClick={() => setActivePanel(item.id)}
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 w-full"
              style={{
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                border: isActive
                  ? '1px solid rgba(124, 58, 237, 0.15)'
                  : '1px solid transparent',
              }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'var(--accent-bright)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div
                className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 transition-colors duration-150"
                style={{
                  background: isActive ? `rgba(124, 58, 237, 0.15)` : 'var(--bg-elevated)',
                  border: `1px solid ${isActive ? 'rgba(124, 58, 237, 0.2)' : 'var(--border-dim)'}`,
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={2}
                  style={{
                    color: isActive ? 'var(--accent-bright)' : 'var(--text-secondary)',
                    transition: 'color 0.15s ease',
                  }}
                />
              </div>

              <div className="flex flex-col min-w-0">
                <span
                  className="text-[13px] font-medium"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {item.label}
                </span>
                <span
                  className="text-[10px] truncate"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-dim)',
                  }}
                >
                  {item.description}
                </span>
              </div>

              <ChevronRight
                size={12}
                className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                  color: isActive ? 'var(--accent-bright)' : 'var(--text-dim)',
                }}
              />
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom: Graph summary */}
      <div
        className="p-3 mx-3 mb-3 rounded-lg"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-dim)',
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Brain size={14} style={{ color: 'var(--accent-bright)' }} />
          <span
            className="text-[11px] font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            Graph Overview
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatPill label="Nodes" value={state.stats?.total_nodes || 0} />
          <StatPill label="Edges" value={state.stats?.total_edges || 0} />
          {state.stats?.types && Object.entries(state.stats.types).map(([type, count]) => (
            <StatPill key={type} label={type} value={count} />
          ))}
        </div>
      </div>
    </motion.aside>
  )
}

function StatPill({ label, value }) {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 rounded"
      style={{ background: 'var(--bg-surface)' }}
    >
      <span
        className="text-[9px] uppercase tracking-wider"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-dim)',
        }}
      >
        {label}
      </span>
      <span
        className="text-[11px] font-medium"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
        }}
      >
        {value}
      </span>
    </div>
  )
}
