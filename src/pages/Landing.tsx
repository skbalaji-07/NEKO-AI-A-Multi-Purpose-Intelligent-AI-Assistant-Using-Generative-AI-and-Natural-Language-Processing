import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BarChart3, BookOpen, Brain, Briefcase, CheckSquare, Code2,
  FileText, Globe2, GraduationCap, Lock, MessagesSquare, PenLine, Route,
  Server, ShieldCheck, Sparkles, StickyNote, Zap,
} from 'lucide-react'
import { useAuth } from '../App'
import { demoSession, login, register } from '../lib/auth'
import { seedDemo } from '../lib/store'
import { Button, Input, Modal, NekoLogo } from '../components/ui'

const MODULES = [
  { icon: <MessagesSquare size={17} />, title: 'AI Chat', desc: 'Conversational assistant with intent routing & memory' },
  { icon: <FileText size={17} />, title: 'Documents', desc: 'Summarise, extract keywords, ask questions over files' },
  { icon: <GraduationCap size={17} />, title: 'Study', desc: 'Auto flashcards, generated quizzes, Pomodoro focus' },
  { icon: <StickyNote size={17} />, title: 'Notes', desc: 'Tagged markdown notes with AI summarisation' },
  { icon: <CheckSquare size={17} />, title: 'Tasks', desc: 'Priorities, due dates & AI task breakdown' },
  { icon: <Code2 size={17} />, title: 'Coding', desc: 'Code explainer, live JS runner, snippet library' },
  { icon: <BarChart3 size={17} />, title: 'Data Lab', desc: 'CSV analytics — stats, histograms, correlations' },
  { icon: <Briefcase size={17} />, title: 'Career', desc: 'Resume enhancement, interview prep, cover letters' },
  { icon: <PenLine size={17} />, title: 'Writing', desc: 'Readability, tone rewriting, outline generation' },
  { icon: <Globe2 size={17} />, title: 'Research', desc: 'Live Wikipedia search with save-to-notes' },
  { icon: <Brain size={17} />, title: 'AI Memory', desc: 'Learns facts about you to personalise answers' },
  { icon: <BookOpen size={17} />, title: 'Project Docs', desc: 'Architecture, methodology & viva-ready docs' },
]

const PIPELINE = [
  { icon: <MessagesSquare size={15} />, label: 'User message' },
  { icon: <Route size={15} />, label: 'Intent classifier' },
  { icon: <Brain size={15} />, label: 'Memory + context' },
  { icon: <Zap size={15} />, label: 'Specialised handler' },
  { icon: <Sparkles size={15} />, label: 'Tagged response' },
]

export default function Landing() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'in' | 'up'>('up')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const s = mode === 'up' ? await register(name, email, password) : await login(email, password)
      if (mode === 'up') seedDemo(s.userId)
      setSession(s)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function tryDemo() {
    setBusy(true)
    try {
      const s = await demoSession()
      seedDemo(s.userId)
      setSession(s)
      navigate('/app')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full bg-bg">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <NekoLogo size={32} />
          <span className="font-display text-lg font-bold tracking-tight">NEKO AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => { setMode('in'); setOpen(true) }}>Sign in</Button>
          <Button onClick={() => { setMode('up'); setOpen(true) }}>Get started</Button>
        </div>
      </header>

      {/* hero */}
      <section className="hero-glow relative overflow-hidden">
        <div className="paw-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 text-center sm:pt-20">
          <div className="fade-up mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-[12px] font-semibold text-mut backdrop-blur">
            <Sparkles size={13} className="text-accent" />
            Final-year AI/ML project · Full-stack · Open source
          </div>
          <h1 className="fade-up mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: '80ms' }}>
            Your second brain,
            <span className="text-accent"> with claws.</span>
          </h1>
          <p className="fade-up mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-mut sm:text-base" style={{ animationDelay: '160ms' }}>
            NEKO — <em>Neural Engine for Knowledge &amp; Organisation</em> — is a multi-purpose intelligent
            assistant that unifies AI chat, document intelligence, study tools, coding help, data analysis,
            career support and a writing studio into one personalised platform. Not a ChatGPT clone —
            every message is routed through a real intent-classification engine.
          </p>
          <div className="fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '240ms' }}>
            <Button onClick={tryDemo} disabled={busy} className="px-6 py-3 text-sm">
              {busy ? 'Preparing workspace…' : 'Launch live demo'} <ArrowRight size={15} />
            </Button>
            <Button variant="outline" className="px-6 py-3 text-sm" onClick={() => { setMode('up'); setOpen(true) }}>
              Create account
            </Button>
          </div>
          <div className="fade-up mt-4 text-[11.5px] text-mut" style={{ animationDelay: '300ms' }}>
            No API key needed — the demo runs NEKO's local intelligence engine entirely in your browser.
          </div>

          {/* pipeline strip */}
          <div className="fade-up mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-2" style={{ animationDelay: '360ms' }}>
            {PIPELINE.map((p, i) => (
              <div key={p.label} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-mut">
                  <span className="text-accent">{p.icon}</span>
                  {p.label}
                </div>
                {i < PIPELINE.length - 1 && <ArrowRight size={13} className="text-mut/50" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* modules */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">Twelve modules. One workspace.</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-[13.5px] text-mut">
          Every feature below is fully functional in the live demo — no fake buttons, no static mockups.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mo, i) => (
            <div key={mo.title} className="fade-up group rounded-2xl border border-line bg-surface p-4 transition hover:border-accent/50 hover:shadow-lg" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent transition group-hover:scale-110">{mo.icon}</div>
              <div className="font-display text-[15px] font-bold">{mo.title}</div>
              <div className="mt-1 text-[12.5px] leading-relaxed text-mut">{mo.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* architecture */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue/12 text-blue"><Server size={17} /></div>
            <div className="font-display text-[15px] font-bold">Production architecture</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-mut">
              React + Vite + Tailwind frontend · FastAPI + Pydantic REST backend · PostgreSQL via SQLAlchemy ·
              configurable LLM provider through server-side environment variables. The full backend ships in the repo.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green/12 text-green"><ShieldCheck size={17} /></div>
            <div className="font-display text-[15px] font-bold">Security first</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-mut">
              JWT authentication with expiry · salted &amp; iterated password hashing · zero API keys in the browser ·
              injection-safe math evaluator · per-user data isolation · exportable &amp; erasable memory.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-pink/12 text-pink"><Lock size={17} /></div>
            <div className="font-display text-[15px] font-bold">Real AI methodology</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-mut">
              Intent classification · TF-IDF retrieval Q&amp;A · extractive summarisation · knowledge-base grounding ·
              memory personalisation · Pearson correlation analytics · Flesch readability scoring.
            </p>
          </div>
        </div>
      </section>

      {/* footer / identity */}
      <footer className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <NekoLogo size={28} />
          <div className="text-[12.5px] text-mut">
            <strong className="text-ink">NEKO AI</strong> · Neural Engine for Knowledge &amp; Organisation · <span className="font-mono">neko-ai.app</span>
          </div>
          <div className="text-[11.5px] text-mut/80">
            React · TypeScript · Tailwind · FastAPI · Pydantic · PostgreSQL · SQLAlchemy · JWT · Vercel + Render
          </div>
        </div>
      </footer>

      {/* auth modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={mode === 'up' ? 'Create your account' : 'Welcome back'}>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'up' && (
            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          )}
          <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          {error && <div className="rounded-xl border border-red/30 bg-red/10 px-3 py-2 text-[12.5px] font-semibold text-red">{error}</div>}
          <Button type="submit" disabled={busy} className="w-full py-2.5">
            {busy ? 'Please wait…' : mode === 'up' ? 'Create account' : 'Sign in'}
          </Button>
          <div className="text-center text-[12px] text-mut">
            {mode === 'up' ? 'Already have an account?' : 'New to NEKO?'}{' '}
            <button type="button" className="font-bold text-accent hover:underline" onClick={() => { setMode(mode === 'up' ? 'in' : 'up'); setError('') }}>
              {mode === 'up' ? 'Sign in' : 'Create one'}
            </button>
          </div>
          <div className="rounded-xl border border-line bg-surface2/50 px-3 py-2 text-[11px] leading-relaxed text-mut">
            <Lock size={11} className="mr-1 inline" />
            Demo mode: credentials are salted, iteratively hashed and stored only in <em>your</em> browser.
            The production FastAPI backend (included in the repo) uses bcrypt + JWT over PostgreSQL.
          </div>
        </form>
      </Modal>
    </div>
  )
}
