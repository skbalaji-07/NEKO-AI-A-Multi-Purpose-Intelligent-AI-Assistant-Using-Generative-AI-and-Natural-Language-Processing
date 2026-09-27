<div align="center">

# 🐱‍💻 NEKO AI

### *Neural Engine for Knowledge & Organisation*

**“Your second brain, with claws.”**

A production-style, full-stack, multi-purpose AI assistant — built as a final-year AI/ML project.
Not a ChatGPT clone: every message flows through a real **intent-classification engine**, and twelve
fully functional modules cover chat, documents, study, notes, tasks, coding, data analysis, career,
writing, live research and personalised AI memory.

`React 19` · `TypeScript` · `Vite` · `Tailwind v4` · `FastAPI` · `Pydantic` · `SQLAlchemy` · `PostgreSQL` · `JWT`

</div>

---

## ✨ Feature matrix (everything works — no fake buttons)

| Module | What it actually does |
|---|---|
| 💬 **Chat** | Conversational assistant with 9 intent routes (math, units, knowledge, summarise, code, study, actions, memory, smalltalk). Every reply is tagged with its route + confidence. Chat can create tasks & notes (“Add task: …”). |
| 🧠 **AI Memory** | Regex slot-filling extracts facts (“I'm studying…”, “Remember that…”), dedupes, persists, personalises responses. Fully viewable & erasable in Settings. |
| 📄 **Documents** | Upload `.txt`/`.md` → reading stats, tunable extractive summary, keyword extraction, and **TF-IDF question answering** over the text (mini-RAG). |
| 🎓 **Study** | Flashcard generator (term–definition parsing + TF-weighted cloze deletion), auto-generated MCQ quizzes with distractor sampling, Pomodoro timer that logs to the dashboard. |
| 🗒️ **Notes** | Tagged notes with search, filters and one-click AI summarisation. |
| ✅ **Tasks** | Priorities, due dates, progress, and heuristic **AI task breakdown** into subtasks. |
| 💻 **Coding** | Language detection + static analysis & review (security/style/complexity flags), **live JavaScript sandbox** with captured console, curated snippet library. |
| 📊 **Data Lab** | CSV parser (quoted fields), column type inference, mean/median/σ/missingness, histograms, **Pearson correlation** with scatter plots, auto-generated insights. Bundled sample dataset. |
| 💼 **Career** | Resume bullet enhancer (verb upgrades + metric coaching), role-specific interview banks with answer guides, cover-letter generator. |
| ✍️ **Writing** | Flesch readability, filler-word & passive-voice detection, tone rewriting (formal/casual/confident), outline generator. |
| 🌐 **Research** | **Live Wikipedia API** search + grounded summaries with save-to-notes — real external-service integration. |
| ⚙️ **Settings** | Theme, AI engine config, memory management, full JSON data export, workspace erase. |

## 🏗️ Architecture

```
┌───────────────────────────┐      ┌──────────────────────────┐
│  React SPA (Vercel)         │      │  FastAPI (Render/Railway)  │
│  • 13 module pages          │ REST │  • JWT auth · bcrypt       │
│  • Local Intelligence       ◄─────►  • Pydantic validation     │
│    Engine (intents/NLP/KB)  │      │  • LLM adapter (env keys)  │
│  • API adapter layer        │      └───────────┬──────────────┘
└───────────────────────────┘             │ SQLAlchemy
         │ fetch                     ┌───────────▼─────────────┐
┌───────────────────────┐      │  PostgreSQL (Neon)         │
│  Wikipedia REST API     │      │  users · chats · notes      │
│  (grounded research)    │      │  tasks · docs · memory      │
└───────────────────────┘      └──────────────────────────┘
```

**Dual-mode design.** The deployed demo runs the *Local Intelligence Engine* fully in-browser
(localStorage persistence, zero API keys client-side) so every feature is demonstrable without
infrastructure. The same UI talks to the included FastAPI backend when a URL is configured in
*Settings → AI engine* — at which point unmatched chat intents fall through to a cloud LLM whose
key lives **only** in server environment variables.

## 🧠 AI/ML methodology

- **Intent classification** — scored pattern/rule routing with per-reply route + confidence tags (explainable AI).
- **Extractive summarisation** — frequency-scored sentence extraction with lead bias (Luhn/TextRank family).
- **Retrieval Q&A** — TF-IDF-weighted sentence retrieval with confidence scoring (the retrieval half of RAG).
- **Information extraction** — slot-filling for the memory system (name/study/goal/preference facts).
- **Statistics** — descriptive stats, histogram binning, Pearson correlation with plain-language interpretation.
- **Generation** — template + heuristic generators (flashcards, quizzes, plans, letters), swappable for LLM output via the adapter.

## 🔐 Security

- Passwords hashed — bcrypt (backend) / salted 600-round iterated SHA-256 via WebCrypto (demo mode)
- JWT (HS256) with expiry; identical login errors to prevent email enumeration
- **No secrets in frontend code or bundle** — LLM keys are server-side env vars only
- Injection-safe math (recursive-descent parser — no `eval` on user input)
- Owner-scoped DB queries on every endpoint · Pydantic validation · CORS allow-list
- User data rights: one-click JSON export, granular memory deletion, workspace erase

## 🚀 Getting started

### Frontend
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build
```

### Backend (optional — demo works without it)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # set DATABASE_URL, JWT_SECRET, LLM_API_KEY…
uvicorn app.main:app --reload   # OpenAPI docs at /docs
```

### Deployment
| Layer | Where | Notes |
|---|---|---|
| Frontend | Vercel | SPA rewrite in `vercel.json` |
| API | Render / Railway | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Database | Neon / Supabase / Railway PG | set `DATABASE_URL` |

## 🧪 Testing

- Engine fixtures: representative utterances per intent route (math, units, memory, knowledge, actions, fallback)
- Deterministic NLP: stable summaries/retrieval for fixed inputs
- Auth negative paths: duplicate email, wrong password, expired token
- CSV parser: quoted fields, ragged rows, missing values, type inference
- Backend: `pytest` + FastAPI `TestClient` per router
- Manual E2E: all modules × mobile/desktop × dark/light

## 🗺️ Future enhancements

Sentence-embedding semantic search (pgvector) · PDF/DOCX parsing · full RAG with citations ·
SM-2 spaced repetition · voice I/O · team workspaces · fine-tuned intent classifier · LLM eval harness.

## 📄 License

MIT — built for learning, portfolios and demos. 🐾
