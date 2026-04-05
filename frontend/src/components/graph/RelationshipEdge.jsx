// Description: Custom React Flow edge — animated dashed stroke when confidence < 0.7,
// solid when >= 0.7. Shows relationship type label and confidence % on hover.
// Small filled arrowhead. Edge brightens on hover.

import { memo, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import { formatConfidence } from '../../utils/formatters'

function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) {
  const [hovered, setHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const isWeak = (data?.confidence || 0) < 0.7
  const strokeColor = hovered ? 'var(--edge-hover)' : 'var(--edge-default)'
  const strokeWidth = hovered ? 2.5 : 1.5

  return (
    <>
      {/* Invisible wider path for easier hover targeting */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isWeak ? '6 4' : undefined,
          animation: isWeak ? 'dash-flow 1.5s linear infinite' : undefined,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
        }}
      />

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            transition: 'transform 0.15s ease, opacity 0.15s ease',
          }}
        >
          {/* Relationship type label */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: hovered ? '10px' : '9px',
              color: hovered ? 'var(--text-primary)' : 'var(--text-dim)',
              background: hovered ? 'var(--bg-elevated)' : 'transparent',
              border: hovered ? '1px solid var(--border-dim)' : '1px solid transparent',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{data?.relationship_type?.replace(/_/g, ' ') || 'RELATED TO'}</span>
            {hovered && data?.confidence > 0 && (
              <span
                style={{
                  color: 'var(--accent-bright)',
                  fontSize: '9px',
                }}
              >
                {formatConfidence(data.confidence)}
              </span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(RelationshipEdge)
