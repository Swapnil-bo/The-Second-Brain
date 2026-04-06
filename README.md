# 🧠 SecondBrain

<div align="center">

**Drop in your notes. Get a map of your mind.**

*A local-first Personal Knowledge Graph Engine that turns scattered knowledge artifacts into a living, queryable graph — and tells you not just what you know, but what you don't.*

<br/>

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5.23-FF6B35?style=flat-square)](https://chromadb.com)
[![Groq](https://img.shields.io/badge/Groq-Free_Tier-F55036?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-7c3aed?style=flat-square)](LICENSE)

<br/>

![SecondBrain Demo](https://raw.githubusercontent.com/Swapnil-bo/The-Second-Brain/master/assets/demo.gif)

</div>

---

## The Problem with PKM Tools

Obsidian stores your notes. Notion organizes them. Roam links them.

**None of them synthesize them.**

You study transformers for weeks. You read papers on RAG. You take notes on attention mechanisms. But nobody tells you that you've never touched RLHF — the missing piece that would make everything click.

SecondBrain does.

---

## What It Does

```
You drop in:                    You get back:
─────────────────               ──────────────────────────────────────
📄 PDF papers                   🕸️  A live knowledge graph
📝 Markdown notes               💬  Conversational search over YOUR notes
🔗 URLs / bookmarks             🔍  Gap detection with learning paths
📋 Raw text / pastes            ✨  Surprising connections you missed
```

The system extracts entities and relationships from everything you feed it, builds a visual graph you can explore, and then **reasons over the topology** to find what's missing.

---

## Features

### 🕸️ Live Knowledge Graph
React Flow canvas with color-coded entity nodes, animated relationship edges, confidence scores on hover, and automatic dagre layout. The graph is the hero — everything else is scaffolding around it.

### 📥 Multi-Format Ingestion
Drop in `.pdf`, `.md`, `.txt`, scrape any URL, or paste raw text. A 10-step pipeline handles parsing → chunking → embedding → LLM extraction → vector storage → graph persistence — end-to-end, automated.

### 💬 Semantic Chat (SSE Streaming)
Ask "What do I know about attention mechanisms?" and get answers grounded in *your own notes*, with source citations. Token-by-token streaming via Server-Sent Events. Cite your own artifacts. Click a cited entity → graph highlights it.

### 🔍 Gap Detection Engine
The killer feature. An LLM reasons over your entire graph topology to identify what's *conspicuously absent*. Returns 3–5 prioritized gaps with curated 4-step learning paths and estimated time. Cached by graph hash — instant on repeat calls.

### ✨ Surprising Connections
"Your note on Hebbian learning connects to your bookmark on backprop." Non-obvious bridges between things you already know but haven't connected.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│     Vite · React Flow · Framer Motion · Tailwind        │
│   Neural Dark UI · SSE Stream Consumer · BrainContext   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP + SSE
┌──────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend                        │
│          Routers: ingest · query · graph · gaps         │
└────┬─────────────────┬────────────────┬─────────────────┘
     │                 │                │
┌────▼────┐     ┌──────▼──────┐  ┌─────▼──────────────┐
│ ChromaDB │     │  Groq API   │  │ sentence-transformers│
│          │     │             │  │                      │
│ ·chunks  │     │ ·8b: extract│  │ · all-MiniLM-L6-v2  │
│ ·entities│     │ ·70b: chat  │  │ · local, 384-dim     │
│ ·rels ←──┼─────┼─────────────┼──► · no API cost        │
└────┬─────┘     │    +gaps    │  └──────────────────────┘
     │           └─────────────┘
┌────▼──────────────┐
│  networkx DiGraph  │
│  rebuilt on start  │
│  from ChromaDB     │
└────────────────────┘
```

### Two-Tier LLM Routing

| Task | Model | Reason |
|------|-------|--------|
| Entity + relationship extraction | `llama-3.1-8b-instant` | Structured JSON task — fast, cheap, stays within free tier for bulk ingestion |
| Chat responses + gap detection | `llama-3.3-70b-versatile` | Genuine reasoning required — reserved for quality-critical operations only |

> A 20-page PDF generates ~40 extraction calls. Using 8b for extraction cuts token cost by ~85% vs using 70b for everything. The free tier stays viable.

### Three ChromaDB Collections

| Collection | Purpose |
|------------|---------|
| `knowledge_chunks` | Raw text chunks + embeddings for semantic search |
| `knowledge_entities` | Deduplicated entity nodes with descriptions |
| `knowledge_relationships` | **Persisted graph edges** — survives server restarts |

The third collection is the key architectural decision. An in-memory networkx graph dies on restart. Persisting edges in ChromaDB with a startup rebuild event makes relationships first-class citizens in the data model.

---

## Tech Stack

**Backend**
- `FastAPI 0.115.0` + `Python 3.11+` — async API server
- `ChromaDB 0.5.23` — local persistent vector database (3 collections)
- `Groq API` — LLM inference, free tier compatible with two-tier routing
- `sentence-transformers 3.3.1` — `all-MiniLM-L6-v2`, fully local, no API cost
- `networkx 3.4.2` — in-memory DiGraph rebuilt from ChromaDB on startup
- `PyMuPDF 1.24.0` — PDF text extraction
- `httpx 0.27.0` + `BeautifulSoup4 4.12.3` — URL scraping
- `langchain-text-splitters 0.3.0` — 512-token chunks, 50-token overlap

**Frontend**
- `React 18.3.1` + `Vite 5.4.10`
- `@xyflow/react 12.3.5` — graph visualization (pinned — breaking changes between minors)
- `@dagrejs/dagre 1.1.4` — automatic LR/TB graph layout
- `Tailwind CSS 3.4.14` + CSS custom properties — Neural Dark design system
- `Framer Motion 11.11.17` — spring node animations, panel slide-ins, edge draws
- `react-markdown 9.0.1` — chat message rendering with syntax highlighting

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Free [Groq API key](https://console.groq.com) (takes 30 seconds)

### 1. Clone

```cmd
git clone https://github.com/Swapnil-bo/The-Second-Brain.git
cd The-Second-Brain
```

### 2. Backend

```cmd
cd backend
pip install -r requirements.txt
copy .env.example .env
```

Open `.env` and add your key:
```
GROQ_API_KEY=gsk_your_key_here
```

```cmd
uvicorn main:app --reload --port 8000
```

> **First run:** `sentence-transformers` downloads `all-MiniLM-L6-v2` (~80MB) on first import. One-time only, cached at `~/.cache/huggingface/`. Subsequent starts are instant.

### 3. Frontend

```cmd
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — your brain awaits.

---

## Ingestion Pipeline

Every document goes through 10 stages:

```
Input (PDF / MD / TXT / URL / paste)
  │
  ▼
[1] Parse      — extract raw text (PyMuPDF / BS4 / direct)
[2] Chunk      — 512-token windows, 50-token overlap
[3] Embed      — all-MiniLM-L6-v2 → 384-dim vectors
[4] Store      — ChromaDB knowledge_chunks collection
[5] Extract    — Groq 8b → entities + relationships JSON
[6] Validate   — Pydantic parse + confidence scoring + JSON repair
[7] Entities   — upsert to knowledge_entities (dedup by name hash)
[8] Relations  — write to knowledge_relationships (persisted edges)
[9] Rebuild    — sync in-memory networkx DiGraph from ChromaDB
[10] Return    — ingestion summary to frontend queue
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ingest/file` | Upload PDF, MD, or TXT |
| `POST` | `/api/ingest/url` | Scrape and ingest a URL |
| `POST` | `/api/ingest/text` | Ingest raw pasted text |
| `GET` | `/api/ingest/status` | Live ingestion queue status |
| `DELETE` | `/api/ingest/{source_id}` | Remove source + cascade delete entities + edges |
| `GET` | `/api/graph` | Full graph snapshot (nodes + edges) |
| `GET` | `/api/graph/stats` | Entity counts by type, total nodes/edges |
| `GET` | `/api/graph/entity/{name}` | Single entity + 2-hop neighborhood |
| `POST` | `/api/graph/search` | Semantic entity search |
| `POST` | `/api/chat` | Conversational query — **SSE streaming** |
| `POST` | `/api/gaps` | Gap detection (cached by graph hash) |
| `GET` | `/api/health` | Backend health + ChromaDB status + node count |

---

## Design System: Neural Dark

> *"Deep space observatory meets a hacker's second brain."*

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-void` | `#050508` | Deepest background |
| `--bg-surface` | `#0d0d14` | Panel backgrounds |
| `--accent` | `#7c3aed` | Electric violet — primary accent |
| `--accent-bright` | `#a855f7` | Hover states, glow rings |
| `--entity-concept` | `#6366f1` | Abstract ideas |
| `--entity-technology` | `#10b981` | Tools, frameworks |
| `--entity-person` | `#f59e0b` | People, researchers |
| `--entity-book` | `#ef4444` | Papers, courses |

Fonts: **Syne** (display) · **Instrument Sans** (body) · **JetBrains Mono** (data)

---

## Performance

| Metric | Target |
|--------|--------|
| 1-page PDF ingest | < 8s end-to-end |
| Graph load (100 nodes) | < 500ms |
| Chat first token (SSE) | < 1.5s |
| Gap detection (cold) | < 10s |
| Gap detection (cache hit) | < 50ms |
| Server restart + graph rebuild | < 3s (up to 1000 entities) |

---

## Project Structure

```
secondbrain/
├── backend/
│   ├── main.py                  # FastAPI app + CORS + startup rebuild
│   ├── config.py                # All constants, model names, collection IDs
│   ├── requirements.txt         # Pinned Python deps
│   ├── .env.example             # Safe template
│   ├── routers/
│   │   ├── ingest.py            # File / URL / text ingestion endpoints
│   │   ├── query.py             # SSE streaming chat endpoint
│   │   ├── graph.py             # Graph snapshot, stats, search
│   │   └── gaps.py              # Gap detection with hash cache
│   ├── services/
│   │   ├── extractor.py         # 8b LLM extraction + retry + JSON repair
│   │   ├── embedder.py          # sentence-transformers singleton
│   │   ├── chroma_service.py    # ChromaDB CRUD across 3 collections
│   │   ├── graph_service.py     # networkx DiGraph + startup rebuild
│   │   ├── ingestor.py          # 10-step pipeline orchestrator
│   │   ├── pdf_parser.py        # PyMuPDF with image-only detection
│   │   ├── url_scraper.py       # httpx + BS4 with auth detection
│   │   └── gap_detector.py      # 70b reasoning + module-level cache
│   └── models/
│       ├── schemas.py           # All Pydantic request/response models
│       └── graph_models.py      # Entity, Relationship, GraphSnapshot
│
├── frontend/
│   └── src/
│       ├── context/BrainContext.jsx   # Global state, 18 action types
│       ├── api/client.js             # Axios + CHAT_URL for SSE
│       ├── hooks/
│       │   ├── useChat.js            # SSE ReadableStream reader
│       │   ├── useGraph.js           # Graph fetch + filter
│       │   ├── useIngest.js          # Upload + queue polling
│       │   └── useGaps.js            # Gap trigger + cache check
│       ├── components/
│       │   ├── graph/                # KnowledgeGraph, EntityNode, edges
│       │   ├── layout/               # TopBar, Sidebar, StatusBadge
│       │   ├── ingest/               # FileDropzone, URLIngestor, TextPaste
│       │   ├── chat/                 # ChatPanel SSE consumer
│       │   ├── gaps/                 # GapPanel, GapCard, LearningPath
│       │   └── shared/               # LoadingSpinner, EmptyState, ErrorBoundary
│       └── styles/globals.css        # 28 CSS vars + Neural Dark tokens
│
├── .gitignore
└── README.md
```

---

## Built By

**Swapnil Hazra** — AI Engineer & Vibe Coder
`BWU/BTA/23/568` · Brainware University

[![GitHub](https://img.shields.io/badge/GitHub-Swapnil--bo-181717?style=flat-square&logo=github)](https://github.com/Swapnil-bo)
[![Twitter](https://img.shields.io/badge/X-@SwapnilHazra4-000000?style=flat-square&logo=x)](https://x.com/SwapnilHazra4)
[![Portfolio](https://img.shields.io/badge/Portfolio-swapnilhazra.vercel.app-7c3aed?style=flat-square)](https://swapnilhazra.vercel.app)

*Part of 100 Days of Vibe Coding.*

---

## License

MIT — use it, fork it, build on it.

---

<div align="center">

*Built with obsession. One file at a time.*

</div>