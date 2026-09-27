import { ArrowDown, BookOpen, Cpu, Database, GitBranch, Globe2, Layers, Lock, Rocket, Server, TestTube2, Workflow } from 'lucide-react'
import { Badge, Card, PageHeader } from '../components/ui'

const OBJECTIVES = [
  'Design a multi-purpose AI assistant that goes beyond single-turn chat: document intelligence, study tooling, coding help, data analysis, career and writing support in one workspace.',
  'Implement an explainable intent-routing layer so every response can be traced to a deterministic or model-backed handler.',
  'Demonstrate applied NLP techniques — extractive summarisation, TF-IDF retrieval Q&A, keyword extraction, readability scoring — without depending on paid APIs.',
  'Build an AI memory system with full user transparency: view, edit and erase everything the assistant knows.',
  'Ship a production-grade full-stack architecture: React SPA, FastAPI REST backend, PostgreSQL persistence, JWT auth, and environment-based LLM configuration.',
  'Publish as a portfolio-quality open-source repository with documentation suitable for final-year evaluation.',
]

const STACK = [
  ['Frontend', 'React 19 · Vite · TypeScript · Tailwind CSS v4 · lucide-react · react-router'],
  ['Backend', 'Python 3.11 · FastAPI · Pydantic v2 · Uvicorn (in /backend, deploy to Render/Railway)'],
  ['Database', 'PostgreSQL · SQLAlchemy ORM · per-user row ownership'],
  ['Auth', 'JWT (HS256, expiry claims) · bcrypt password hashing · salted iterated hashing in demo mode'],
  ['AI layer', 'Local intelligence engine (intents + NLP + KB) with env-configured cloud-LLM fallthrough adapter'],
  ['External data', 'Wikipedia REST API for grounded research retrieval'],
  ['Deployment', 'Vercel (frontend) · Render/Railway (API) · Neon/Supabase (PostgreSQL)'],
]

const METHODOLOGY = [
  { t: 'Intent classification', d: 'Each utterance is scored against ordered pattern-and-rule routes (action, memory, math, units, summarise, code, study, knowledge, smalltalk). Highest-confidence route wins; every reply displays its route and confidence — an explainability feature most chatbots lack. Production systems replace rules with embedding classifiers; the interface is identical.' },
  { t: 'Memory & personalisation', d: 'A lightweight information-extraction pass (regex-based slot filling) captures name, studies, goals, preferences and explicit “remember…” facts. Facts are deduplicated, persisted per-user, injected into response generation, and fully user-manageable — the transparency pattern behind modern assistant memory.' },
  { t: 'Extractive summarisation', d: 'Sentences are scored by normalised term-frequency of non-stopword tokens with a position bonus (lead bias), then the top-k are re-ordered by original position — the classical Luhn/TextRank family. Used in Documents, Notes and chat.' },
  { t: 'Retrieval Q&A (mini-RAG)', d: 'Document questions are answered by TF-IDF-weighted sentence retrieval: question tokens are matched against sentence sets with inverse-document-frequency weighting, and the best passages are returned with a confidence score — the retrieval half of a RAG pipeline, grounded and hallucination-free.' },
  { t: 'Statistical analytics', d: 'The Data Lab computes descriptive statistics (mean, median, σ, missingness, cardinality), binned histograms and Pearson correlation coefficients with plain-language interpretation — the exploratory-data-analysis loop of any ML workflow.' },
  { t: 'Content generation', d: 'Flashcards (term–definition parsing + TF-weighted cloze deletion), MCQ quizzes with distractor sampling, study plans, outlines, cover letters and resume rewrites are template-and-heuristic generators — deterministic, auditable, and swappable for LLM generation via the adapter layer.' },
]

const ENDPOINTS = [
  ['POST', '/api/auth/register', 'Create account (bcrypt hash), returns JWT'],
  ['POST', '/api/auth/login', 'Verify credentials, returns JWT'],
  ['GET', '/api/auth/me', 'Current user from Bearer token'],
  ['POST', '/api/chat/message', 'Intent-routed chat; LLM fallthrough if configured'],
  ['GET/POST', '/api/conversations', 'List / create conversations'],
  ['GET/POST/PUT/DELETE', '/api/notes', 'Notes CRUD (owner-scoped)'],
  ['GET/POST/PATCH/DELETE', '/api/tasks', 'Tasks CRUD + AI breakdown'],
  ['POST', '/api/documents/analyze', 'Summary, keywords, stats for uploaded text'],
  ['GET/POST/DELETE', '/api/memory', 'Inspect & manage AI memory facts'],
]

const FUTURE = [
  'Semantic search with sentence embeddings + pgvector (upgrade TF-IDF retrieval to dense retrieval).',
  'PDF & DOCX parsing (pdf.js / python-docx) for the Documents module.',
  'Voice input/output via the Web Speech API.',
  'Full RAG pipeline: chunking, embedding store, cited answers across all user documents.',
  'Spaced-repetition scheduling (SM-2) for flashcards.',
  'Team workspaces with role-based access control and shared decks/notes.',
  'Fine-tuned intent classifier replacing rules (distilBERT), trained on logged, consented queries.',
  'Observability: token accounting, latency tracing and evaluation harness for LLM responses.',
]

function ArchBox({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="font-display text-[13px] font-bold uppercase tracking-wider">{title}</div>
      <ul className="mt-2 space-y-1">
        {items.map((i) => <li key={i} className="text-[12px] text-mut">• {i}</li>)}
      </ul>
    </div>
  )
}

export default function Docs() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader title="Project Documentation" subtitle="Final-year project reference: identity, objectives, architecture, AI/ML methodology, security and roadmap." />

      <div className="space-y-5">
        {/* identity */}
        <Card>
          <div className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold"><BookOpen size={16} className="text-accent" /> Project identity</div>
          <div className="grid gap-2 text-[13px] sm:grid-cols-2">
            <div className="rounded-xl bg-surface2/60 p-3"><span className="text-[10.5px] font-bold uppercase tracking-widest text-mut">Name</span><div className="mt-0.5 font-bold">NEKO AI — Neural Engine for Knowledge & Organisation</div></div>
            <div className="rounded-xl bg-surface2/60 p-3"><span className="text-[10.5px] font-bold uppercase tracking-widest text-mut">Tagline</span><div className="mt-0.5 font-bold">“Your second brain, with claws.”</div></div>
            <div className="rounded-xl bg-surface2/60 p-3"><span className="text-[10.5px] font-bold uppercase tracking-widest text-mut">Domain</span><div className="mt-0.5 font-mono text-[12.5px] font-bold">neko-ai.app</div></div>
            <div className="rounded-xl bg-surface2/60 p-3"><span className="text-[10.5px] font-bold uppercase tracking-widest text-mut">Category</span><div className="mt-0.5 font-bold">Full-stack AI SaaS · Final-year AI/ML project</div></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Intent Classification', 'NLP', 'TF-IDF', 'Extractive Summarisation', 'RAG (retrieval)', 'AI Memory', 'JWT', 'REST', 'Statistics'].map((c) => <Badge key={c} tone="accent">{c}</Badge>)}
          </div>
        </Card>

        {/* objectives */}
        <Card>
          <div className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold"><Workflow size={16} className="text-blue" /> Objectives</div>
          <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-mut">
            {OBJECTIVES.map((o) => <li key={o}>{o}</li>)}
          </ol>
        </Card>

        {/* architecture */}
        <Card>
          <div className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold"><Server size={16} className="text-teal" /> System architecture</div>
          <div className="space-y-2">
            <ArchBox title="Client · React SPA (Vercel)" tone="border-blue/30 bg-blue/5" items={['13 module pages · responsive · dark/light themes', 'Local Intelligence Engine (intents, NLP, KB, memory)', 'API adapter — switches localStorage ↔ REST backend']} />
            <div className="flex justify-center text-mut"><ArrowDown size={15} /></div>
            <ArchBox title="API · FastAPI (Render / Railway)" tone="border-accent/30 bg-accent/5" items={['REST endpoints · Pydantic validation · OpenAPI docs', 'JWT auth middleware · bcrypt hashing · CORS allow-list', 'LLM adapter — provider/key/model from environment only']} />
            <div className="flex justify-center text-mut"><ArrowDown size={15} /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ArchBox title="PostgreSQL (Neon/Supabase)" tone="border-green/30 bg-green/5" items={['users · conversations · messages', 'notes · tasks · documents · memory_facts', 'SQLAlchemy ORM · owner-scoped queries']} />
              <ArchBox title="External services" tone="border-pink/30 bg-pink/5" items={['Configurable LLM API (OpenAI-compatible)', 'Wikipedia REST API (research retrieval)', 'Server-side keys — never shipped to browser']} />
            </div>
          </div>
        </Card>

        {/* stack */}
        <Card>
          <div className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold"><Layers size={16} className="text-pink" /> Technology stack</div>
          <div className="space-y-1.5">
            {STACK.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 rounded-xl bg-surface2/60 px-3 py-2 sm:flex-row sm:items-center">
                <span className="w-28 shrink-0 text-[11px] font-bold uppercase tracking-widest text-accent">{k}</span>
                <span className="text-[12.5px] text-mut">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* methodology */}
        <Card>
          <div className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold"><Cpu size={16} className="text-accent" /> AI / ML methodology</div>
          <div className="space-y-3">
            {METHODOLOGY.map((m) => (
              <div key={m.t}>
                <div className="text-[13px] font-bold">{m.t}</div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-mut">{m.d}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* api */}
        <Card>
          <div className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold"><Database size={16} className="text-blue" /> REST API design <span className="text-[11px] font-normal text-mut">(implemented in /backend)</span></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead><tr className="border-b border-line text-[10.5px] uppercase tracking-wider text-mut"><th className="px-2 py-1.5">Method</th><th className="px-2 py-1.5">Endpoint</th><th className="px-2 py-1.5">Purpose</th></tr></thead>
              <tbody>
                {ENDPOINTS.map(([m, e, p]) => (
                  <tr key={e} className="border-b border-line/50 last:border-0">
                    <td className="px-2 py-1.5"><Badge tone="teal">{m}</Badge></td>
                    <td className="px-2 py-1.5 font-mono text-[11.5px]">{e}</td>
                    <td className="px-2 py-1.5 text-mut">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* security & testing */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold"><Lock size={16} className="text-red" /> Security measures</div>
            <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-mut">
              <li>• Passwords: bcrypt (backend) / salted 600-round iterated SHA-256 (demo) — never plaintext.</li>
              <li>• JWT with expiry claims; signature verified on every request.</li>
              <li>• <strong className="text-ink">Zero secrets in the client</strong> — LLM keys live only in backend env vars.</li>
              <li>• Injection-safe math: recursive-descent parser, no <code className="font-mono">eval</code>.</li>
              <li>• Owner-scoped queries — every DB read/write filters by authenticated user id.</li>
              <li>• Pydantic validation on all request bodies; CORS origin allow-list.</li>
              <li>• User data rights: full JSON export + granular memory deletion.</li>
            </ul>
          </Card>
          <Card>
            <div className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold"><TestTube2 size={16} className="text-green" /> Testing strategy</div>
            <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-mut">
              <li>• Engine unit coverage: intent routes verified against a fixture set of utterances (math, units, memory, knowledge, actions, fallback).</li>
              <li>• NLP determinism: summariser & retrieval produce stable outputs for fixed inputs.</li>
              <li>• Auth paths: wrong password, duplicate email, expired session → correct errors.</li>
              <li>• CSV parser: quoted fields, ragged rows, missing values, type inference.</li>
              <li>• Manual E2E matrix: all 13 modules exercised on mobile & desktop, both themes.</li>
              <li>• Backend: pytest + httpx TestClient per router (see /backend).</li>
            </ul>
          </Card>
        </div>

        {/* future */}
        <Card>
          <div className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold"><Rocket size={16} className="text-accent" /> Future enhancements</div>
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-mut">
            {FUTURE.map((f) => <li key={f} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{f}</li>)}
          </ul>
        </Card>

        <Card className="border-accent/30 bg-accent/5">
          <div className="flex items-center gap-2 font-display text-[14px] font-bold"><GitBranch size={15} className="text-accent" /> Repository layout</div>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-surface2/60 p-3 font-mono text-[11.5px] leading-relaxed text-mut">{`neko-ai/
├─ src/                  # React frontend
│  ├─ lib/               # engine, nlp, auth, csv, study, career, writing
│  ├─ components/        # layout + UI kit
│  └─ pages/             # 13 modules
├─ backend/              # FastAPI + SQLAlchemy + JWT (deploy to Render)
│  ├─ app/routers/       # auth · chat · notes · tasks · memory
│  └─ requirements.txt
└─ README.md             # setup, env vars, architecture`}</pre>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-mut"><Globe2 size={13} /> Live research module calls the Wikipedia API — proof the app integrates real external services.</p>
        </Card>
      </div>
    </div>
  )
}
