// Description: Custom React Flow node — rounded rectangle with left color bar, Lucide icon,
// entity name, type badge, and animated glow ring on selection. Spring mount animation.

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Brain, User, Cpu, BookOpen, Building2, Calendar, HelpCircle } from 'lucide-react'
import { getEntityConfig } from '../../utils/entityColors'
import { formatConfidence } from '../../utils/formatters'

const iconMap = {
  Brain,
  User,
  Cpu,
  BookOpen,
  Building2,
  Calendar,
  HelpCircle,
}

function EntityNode({ data, selected }) {
  const config = getEntityConfig(data.type)
  const Icon = iconMap[config.icon] || HelpCircle

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      style={{
        '--node-color': config.color,
        '--node-raw': config.raw,
      }}
      className="group relative"
    >
      {/* Glow ring on selection */}
      {selected && (
        <motion.div
          layoutId="node-glow"
          className="absolute -inset-[3px] rounded-xl pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${config.raw}, 0 0 20px ${config.raw}66`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      <div
        className="relative flex items-center gap-2.5 rounded-lg overflow-hidden cursor-pointer"
        style={{
          width: 180,
          height: 60,
          background: 'var(--bg-elevated)',
          border: `1px solid ${selected ? config.raw : 'var(--border-dim)'}`,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Left color bar */}
        <div
          className="w-1 h-full flex-shrink-0"
          style={{ background: config.raw }}
        />

        {/* Icon */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
          style={{
            background: `${config.raw}15`,
          }}
        >
          <Icon size={16} style={{ color: config.raw }} strokeWidth={2} />
        </div>

        {/* Text content */}
        <div className="flex flex-col min-w-0 pr-2.5 py-1.5">
          <span
            className="text-[13px] font-medium leading-tight truncate"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            {data.name}
          </span>

          <div className="flex items-center gap-1.5 mt-1">
            {/* Type badge */}
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-mono)',
                background: `${config.raw}20`,
                color: config.raw,
              }}
            >
              {config.label}
            </span>

            {/* Confidence */}
            {data.confidence > 0 && (
              <span
                className="text-[9px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-dim)',
                }}
              >
                {formatConfidence(data.confidence)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
        style={{
          boxShadow: `0 0 20px ${config.raw}33`,
        }}
      />

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !rounded-full"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: config.raw,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !rounded-full"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: config.raw,
        }}
      />
    </motion.div>
  )
}

export default memo(EntityNode)
