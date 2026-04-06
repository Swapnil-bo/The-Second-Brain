// Description: Reusable empty state component — icon, title, description, and optional action
// button. Neural background gradient. Animated entrance with orbit ring decoration.

import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center px-6 py-12 neural-bg rounded-xl"
    >
      {/* Icon with orbit ring */}
      <div className="relative w-20 h-20 mb-5">
        {/* Orbit ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '1px solid var(--border-dim)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="absolute w-1.5 h-1.5 rounded-full -top-0.5 left-1/2 -translate-x-1/2"
            style={{ background: 'var(--accent-bright)' }}
          />
        </motion.div>

        {/* Center icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid rgba(124, 58, 237, 0.15)',
              boxShadow: '0 0 24px var(--accent-glow)',
            }}
          >
            {Icon && <Icon size={22} style={{ color: 'var(--accent-bright)' }} />}
          </div>
        </motion.div>
      </div>

      {/* Text */}
      <h3
        className="text-base font-semibold mb-1.5"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-xs leading-relaxed max-w-[280px]"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-dim)',
          }}
        >
          {description}
        </p>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <motion.button
          onClick={onAction}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{
            fontFamily: 'var(--font-display)',
            background: 'var(--accent)',
            color: '#fff',
            boxShadow: '0 0 20px var(--accent-glow)',
          }}
          whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)' }}
          whileTap={{ scale: 0.97 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}
