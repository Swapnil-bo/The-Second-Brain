// Description: Floating graph legend — color key for all entity types. Shows as a compact
// pill bar at the bottom of the graph canvas. Each type is clickable to filter the graph.
// Framer Motion entrance and hover animations.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, User, Cpu, BookOpen, Building2, Calendar } from 'lucide-react'
import { entityConfig, entityTypes } from '../../utils/entityColors'

const iconMap = {
  Brain,
  User,
  Cpu,
  BookOpen,
  Building2,
  Calendar,
}

export default function GraphLegend({ activeFilters = [], onFilterToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1.5 rounded-xl"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-dim)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      {entityTypes.map((type, i) => {
        const config = entityConfig[type]
        const Icon = iconMap[config.icon]
        const isActive = activeFilters.length === 0 || activeFilters.includes(type)

        return (
          <motion.button
            key={type}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 + i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => onFilterToggle?.(type)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer"
            style={{
              background: isActive ? `${config.raw}12` : 'transparent',
              opacity: isActive ? 1 : 0.35,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {Icon && (
              <Icon
                size={12}
                style={{ color: config.raw }}
                strokeWidth={2}
              />
            )}
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-mono)',
                color: isActive ? config.raw : 'var(--text-dim)',
              }}
            >
              {config.label}
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
