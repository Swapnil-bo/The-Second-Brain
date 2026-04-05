// Description: Global state provider — manages graph data, active panel, ingestion queue,
// chat history, selected node, and backend health via useReducer + React Context.

import { createContext, useContext, useReducer, useCallback } from 'react'

const BrainContext = createContext(null)

const initialState = {
  // Graph
  nodes: [],
  edges: [],
  stats: {},
  graphLoading: true,
  graphError: null,

  // Panels
  activePanel: null, // 'ingest' | 'chat' | 'gaps' | null

  // Selected node (for highlight / tooltip)
  selectedNode: null,
  highlightedNodes: [],

  // Ingestion queue
  queue: [],

  // Chat
  chatHistory: [],
  chatSources: [],
  chatGraphContext: [],
  chatStreaming: false,

  // Gaps
  gapResult: null,
  gapLoading: false,

  // Health
  backendHealthy: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_GRAPH':
      return {
        ...state,
        nodes: action.payload.nodes,
        edges: action.payload.edges,
        stats: action.payload.stats || state.stats,
        graphLoading: false,
        graphError: null,
      }
    case 'SET_GRAPH_LOADING':
      return { ...state, graphLoading: true, graphError: null }
    case 'SET_GRAPH_ERROR':
      return { ...state, graphLoading: false, graphError: action.payload }
    case 'SET_STATS':
      return { ...state, stats: action.payload }

    case 'SET_ACTIVE_PANEL':
      return {
        ...state,
        activePanel: state.activePanel === action.payload ? null : action.payload,
      }
    case 'CLOSE_PANEL':
      return { ...state, activePanel: null }

    case 'SELECT_NODE':
      return { ...state, selectedNode: action.payload }
    case 'CLEAR_SELECTION':
      return { ...state, selectedNode: null }
    case 'HIGHLIGHT_NODES':
      return { ...state, highlightedNodes: action.payload }
    case 'CLEAR_HIGHLIGHTS':
      return { ...state, highlightedNodes: [] }

    case 'SET_QUEUE':
      return { ...state, queue: action.payload }
    case 'UPDATE_QUEUE_ITEM': {
      const idx = state.queue.findIndex((q) => q.source_id === action.payload.source_id)
      if (idx === -1) return { ...state, queue: [...state.queue, action.payload] }
      const updated = [...state.queue]
      updated[idx] = action.payload
      return { ...state, queue: updated }
    }

    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] }
    case 'UPDATE_LAST_CHAT_MESSAGE': {
      const history = [...state.chatHistory]
      if (history.length > 0) {
        history[history.length - 1] = {
          ...history[history.length - 1],
          content: action.payload,
        }
      }
      return { ...state, chatHistory: history }
    }
    case 'SET_CHAT_SOURCES':
      return { ...state, chatSources: action.payload }
    case 'SET_CHAT_GRAPH_CONTEXT':
      return { ...state, chatGraphContext: action.payload }
    case 'SET_CHAT_STREAMING':
      return { ...state, chatStreaming: action.payload }
    case 'CLEAR_CHAT':
      return {
        ...state,
        chatHistory: [],
        chatSources: [],
        chatGraphContext: [],
        chatStreaming: false,
      }

    case 'SET_GAP_RESULT':
      return { ...state, gapResult: action.payload, gapLoading: false }
    case 'SET_GAP_LOADING':
      return { ...state, gapLoading: action.payload }

    case 'SET_BACKEND_HEALTH':
      return { ...state, backendHealthy: action.payload }

    default:
      return state
  }
}

export function BrainProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const setActivePanel = useCallback(
    (panel) => dispatch({ type: 'SET_ACTIVE_PANEL', payload: panel }),
    []
  )
  const closePanel = useCallback(() => dispatch({ type: 'CLOSE_PANEL' }), [])
  const selectNode = useCallback(
    (node) => dispatch({ type: 'SELECT_NODE', payload: node }),
    []
  )
  const clearSelection = useCallback(
    () => dispatch({ type: 'CLEAR_SELECTION' }),
    []
  )

  return (
    <BrainContext.Provider value={{ state, dispatch, setActivePanel, closePanel, selectNode, clearSelection }}>
      {children}
    </BrainContext.Provider>
  )
}

export function useBrain() {
  const ctx = useContext(BrainContext)
  if (!ctx) throw new Error('useBrain must be used within a BrainProvider')
  return ctx
}
