// Description: Root application component — BrainProvider wrapping everything,
// app shell layout with TopBar + Sidebar + graph canvas, AnimatePresence
// for panel overlays (Ingest, Chat, Gaps). ErrorBoundary for crash protection.

import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { BrainProvider, useBrain } from './context/BrainContext'
import ErrorBoundary from './components/shared/ErrorBoundary'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import KnowledgeGraph from './components/graph/KnowledgeGraph'
import IngestPanel from './components/ingest/IngestPanel'
import ChatPanel from './components/chat/ChatPanel'
import GapPanel from './components/gaps/GapPanel'

function AppLayout() {
  const { state } = useBrain()

  return (
    <div className="app-shell">
      <TopBar />
      <div className="main-layout">
        <Sidebar />
        <main className="graph-canvas-area">
          <KnowledgeGraph />
          <AnimatePresence mode="wait">
            {state.activePanel === 'ingest' && <IngestPanel key="ingest" />}
            {state.activePanel === 'chat' && <ChatPanel key="chat" />}
            {state.activePanel === 'gaps' && <GapPanel key="gaps" />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrainProvider>
        <AppLayout />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-dim)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            },
            success: {
              iconTheme: {
                primary: 'var(--status-success)',
                secondary: 'var(--bg-elevated)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--status-error)',
                secondary: 'var(--bg-elevated)',
              },
            },
          }}
        />
      </BrainProvider>
    </ErrorBoundary>
  )
}
