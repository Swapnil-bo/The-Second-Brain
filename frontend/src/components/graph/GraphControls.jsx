// Description: Floating graph control bar — layout direction toggle (LR/TB), refresh button,
// node/edge count display, and entity type filter legend. Positioned top-right over the canvas.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRightLeft,
  ArrowDownUp,
  RefreshCw,
  GitFork,
  Circle,
  Filter,
} from 'lucide-react'
import { entityConfig, entityTypes } from '../../utils/entityColors'

export default function GraphControls({
  direction,
  onDirectionChange,
  onRefresh,
  nodeCount,
  edgeCount,
}) {
  const [showLegend, setShowLegend] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 600)
  }

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
      {/* Main control bar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-dim)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Node / Edge counts */}
        <div
          className="flex items-center gap-3 px-2 mr-1"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
        >
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Circle size={8} fill="var(--accent)" stroke="none" />
            {nodeCount}
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <GitFork size={10} style={{ color: 'var(--text-dim)' }} />
            {edgeCount}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-dim)' }} />

        {/* Direction toggle */}
        <ControlButton
          onClick={() => onDirectionChange(direction === 'LR' ? 'TB' : 'LR')}
          title={direction === 'LR' ? 'Switch to top-down' : 'Switch to left-right'}
        >
          {direction === 'LR' ? (
            <ArrowRightLeft size={14} />
          ) : (
            <ArrowDownUp size={14} />
          )}
        </ControlButton>

        {/* Legend toggle */}
        <ControlButton
          onClick={() => setShowLegend(!showLegend)}
          active={showLegend}
          title="Toggle legend"
        >
          <Filter size={14} />
        </ControlButton>

        {/* Refresh */}
        <ControlButton onClick={handleRefresh} title="Refresh graph">
          <motion.div
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <RefreshCw size={14} />
          </motion.div>
        </ControlButton>
      </motion.div>

      {/* Legend dropdown */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-1 px-3 py-2.5 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-dim)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
              minWidth: 160,
            }}
          >
            <span
              className="text-[10px] uppercase tracking-wider mb-1"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
              }}
            >
              Entity Types
            </span>
            {entityTypes.map((type) => {
              const config = entityConfig[type]
              return (
                <div key={type} className="flex items-center gap-2.5 py-0.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: config.raw }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {config.label}
                  </span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ControlButton({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150"
      style={{
        color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
        background: active ? 'var(--accent-subtle)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)'
        e.currentTarget.style.color = 'var(--accent-bright)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? 'var(--accent-subtle)' : 'transparent'
        e.currentTarget.style.color = active ? 'var(--accent-bright)' : 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}
