// Description: Main graph canvas — React Flow with custom EntityNode and RelationshipEdge,
// dagre layout, minimap, background dots, and beautiful empty/loading/error states.
// The graph IS the hero. Always visible behind panels.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Loader2, AlertTriangle, Sparkles } from 'lucide-react'
import { useBrain } from '../../context/BrainContext'
import { fetchGraph } from '../../api/client'
import { getLayoutedElements } from '../../utils/graphLayout'
import { getEntityRawColor } from '../../utils/entityColors'
import EntityNode from './EntityNode'
import RelationshipEdge from './RelationshipEdge'
import GraphControls from './GraphControls'

const nodeTypes = { entityNode: EntityNode }
const edgeTypes = { relEdge: RelationshipEdge }

export default function KnowledgeGraph() {
  const { state, dispatch, selectNode } = useBrain()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [direction, setDirection] = useState('LR')

  const loadGraph = useCallback(async () => {
    dispatch({ type: 'SET_GRAPH_LOADING' })
    try {
      const res = await fetchGraph()
      const data = res.data
      dispatch({
        type: 'SET_GRAPH',
        payload: {
          nodes: data.nodes,
          edges: data.edges,
          stats: data.stats,
        },
      })
    } catch (err) {
      dispatch({ type: 'SET_GRAPH_ERROR', payload: err.message || 'Failed to load graph' })
    }
  }, [dispatch])

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  // Transform raw graph data into React Flow nodes/edges with dagre layout
  useEffect(() => {
    if (!state.nodes.length) {
      setNodes([])
      setEdges([])
      return
    }

    const rfNodes = state.nodes.map((n) => ({
      id: n.id,
      type: 'entityNode',
      data: {
        name: n.name,
        type: n.type,
        description: n.description,
        confidence: n.confidence,
        occurrence_count: n.occurrence_count,
        source_ids: n.source_ids,
      },
      position: { x: 0, y: 0 },
    }))

    const rfEdges = state.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'relEdge',
      data: {
        relationship_type: e.relationship_type,
        description: e.description,
        confidence: e.confidence,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: 'var(--edge-default)',
      },
    }))

    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(
      rfNodes,
      rfEdges,
      direction
    )

    setNodes(layouted)
    setEdges(layoutedEdges)
  }, [state.nodes, state.edges, direction, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_, node) => {
      selectNode(node.data)
    },
    [selectNode]
  )

  const onPaneClick = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }, [dispatch])

  const minimapNodeColor = useCallback((node) => {
    return getEntityRawColor(node.data?.type)
  }, [])

  // ---- LOADING STATE ----
  if (state.graphLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full neural-bg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Animated neural orb */}
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                opacity: 0.3,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Loader2
              size={24}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ color: 'var(--accent-bright)' }}
              strokeWidth={2}
            />
          </div>
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            Loading your knowledge graph...
          </p>
        </motion.div>
      </div>
    )
  }

  // ---- ERROR STATE ----
  if (state.graphError) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full neural-bg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 max-w-xs text-center"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertTriangle size={24} style={{ color: 'var(--status-error)' }} />
          </div>
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            {state.graphError}
          </p>
          <button
            onClick={loadGraph}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-bright)',
              border: '1px solid var(--accent)',
            }}
          >
            Retry
          </button>
        </motion.div>
      </div>
    )
  }

  // ---- EMPTY STATE ----
  if (!state.nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full neural-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6 max-w-sm text-center px-6"
        >
          {/* Animated brain icon with orbit rings */}
          <div className="relative w-24 h-24">
            {/* Outer orbit ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: '1px solid var(--border-dim)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <div
                className="absolute w-2 h-2 rounded-full -top-1 left-1/2 -translate-x-1/2"
                style={{ background: 'var(--entity-concept)' }}
              />
            </motion.div>

            {/* Inner orbit ring */}
            <motion.div
              className="absolute inset-3 rounded-full"
              style={{
                border: '1px solid var(--border-glow)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            >
              <div
                className="absolute w-1.5 h-1.5 rounded-full -top-0.5 left-1/2 -translate-x-1/2"
                style={{ background: 'var(--entity-technology)' }}
              />
            </motion.div>

            {/* Center brain */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent)',
                  boxShadow: '0 0 30px var(--accent-glow)',
                }}
              >
                <Brain size={22} style={{ color: 'var(--accent-bright)' }} />
              </div>
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Your brain is empty
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              Drop in your first note, PDF, or URL to start building your
              personal knowledge graph.
            </p>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-bright)',
              border: '1px solid rgba(124, 58, 237, 0.15)',
            }}
          >
            <Sparkles size={14} />
            <span>Entities and relationships appear here automatically</span>
          </div>
        </motion.div>
      </div>
    )
  }

  // ---- GRAPH VIEW ----
  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'relEdge',
        }}
      >
        <Background variant="dots" gap={24} size={1} color="var(--border-dim)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(5,5,8,0.85)"
          style={{ background: 'var(--bg-surface)' }}
        />
      </ReactFlow>

      {/* Graph controls overlay */}
      <GraphControls
        direction={direction}
        onDirectionChange={setDirection}
        onRefresh={loadGraph}
        nodeCount={state.nodes.length}
        edgeCount={state.edges.length}
      />
    </div>
  )
}
