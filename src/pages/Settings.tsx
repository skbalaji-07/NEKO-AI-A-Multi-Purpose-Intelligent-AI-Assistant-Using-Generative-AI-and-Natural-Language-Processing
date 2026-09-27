import { useState } from 'react'
import { Brain, Cpu, Download, Moon, ShieldCheck, Sun, Trash2, UserRound } from 'lucide-react'
import { useAuth, useTheme, useUser } from '../App'
import { logout } from '../lib/auth'
import { load, save, useCollection, userKey } from '../lib/store'
import type { Fact } from '../lib/types'
import { Badge, Button, Card, Input, PageHeader } from '../components/ui'

const COLLECTIONS = ['chats', 'notes', 'tasks', 'docs', 'decks', 'memory', 'activity', 'study']

export default function SettingsPage() {
  const user = useUser()
  const { setSession } = useAuth()
  const { theme, toggle } = useTheme()
  const [memory, setMemory] = useCollection<Fact[]>(user.userId, 'memory', [])
  const [apiUrl, setApiUrl] = useState(() => load<string>('neko:apiurl', ''))
  const [confirmWipe, setConfirmWipe] = useState(false)

  function exportData() {
    const dump: Record<string, unknown> = { exportedAt: new Date().toISOString(), user: { name: user.name, email: user.email } }
    for (const c of COLLECTIONS) dump[c] = load(userKey(user.userId, c), null)
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'neko-ai-export.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function wipe() {
    for (const c of [...COLLECTIONS, 'seeded']) localStorage.removeItem(userKey(user.userId, c))
    logout()
    setSession(null)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PageHeader title="Settings" subtitle="Profile, appearance, AI engine configuration, memory and data controls." />

      <div className="space-y-4">
        {/* profile */}
        <Card>
          <div className="mb-3 flex items-center gap-2 font-display text-[14px] font-bold"><UserRound size={15} className="text-accent" /> Profile</div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 font-display text-lg font-bold text-accent">{user.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="text-[14px] font-bold">{user.name}</div>
              <div className="text-[12px] text-mut">{user.email}</div>
            </div>
            <div className="ml-auto"><Badge tone="green">JWT session active</Badge></div>
          </div>
          <p className="mt-3 text-[11.5px] text-mut">Signed token expires 7 days after issue. Password stored as a salted, 600-round iterated hash — never in plaintext.</p>
        </Card>

        {/* appearance */}
        <Card>
          <div className="mb-3 flex items-center gap-2 font-display text-[14px] font-bold">{theme === 'dark' ? <Moon size={15} className="text-blue" /> : <Sun size={15} className="text-accent" />} Appearance</div>
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-mut">Currently using the <strong className="text-ink">{theme}</strong> theme (Kanagawa-inspired palette).</div>
            <Button variant="outline" onClick={toggle}>{theme === 'dark' ? <><Sun size={14} /> Switch to light</> : <><Moon size={14} /> Switch to dark</>}</Button>
          </div>
        </Card>

        {/* engine */}
        <Card>
          <div className="mb-3 flex items-center gap-2 font-display text-[14px] font-bold"><Cpu size={15} className="text-teal" /> AI engine</div>
          <div className="rounded-xl border border-green/30 bg-green/8 px-3.5 py-2.5 text-[12.5px]">
            <strong className="text-green">Active: Local Intelligence Engine</strong> — intent routing, knowledge base, NLP toolkit and deterministic handlers running fully in-browser. Zero API keys client-side.
          </div>
          <div className="mt-3">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-mut">Remote backend (FastAPI)</div>
            <div className="flex gap-2">
              <Input placeholder="https://your-neko-api.onrender.com" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
              <Button variant="outline" className="shrink-0" onClick={() => save('neko:apiurl', apiUrl.trim())}>Save</Button>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-mut">
              The repo ships a complete FastAPI + SQLAlchemy + PostgreSQL backend (<code className="font-mono">/backend</code>). Deploy it to Render/Railway,
              set <code className="font-mono">LLM_API_KEY</code> / <code className="font-mono">LLM_MODEL</code> server-side, point this field at it, and unmatched chat intents
              fall through to the cloud LLM — the key never touches the browser.
            </p>
          </div>
        </Card>

        {/* memory */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-[14px] font-bold"><Brain size={15} className="text-pink" /> AI memory <Badge tone="accent">{memory.length}</Badge></div>
            {memory.length > 0 && <Button variant="danger" onClick={() => setMemory([])}><Trash2 size={13} /> Clear all</Button>}
          </div>
          {memory.length ? (
            <ul className="space-y-1.5">
              {memory.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-xl bg-surface2/60 px-3 py-2">
                  <Badge tone="blue">{f.kind}</Badge>
                  <span className="flex-1 text-[12.5px]">{f.text}</span>
                  <button className="text-mut hover:text-red" onClick={() => setMemory((p) => p.filter((x) => x.id !== f.id))}><Trash2 size={13} /></button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-mut">No memories stored. Chat naturally (“I'm studying…”, “Remember that…”) and NEKO extracts facts to personalise answers. Full transparency: everything it knows is listed here, deletable item-by-item — a GDPR-style right to be forgotten.</p>
          )}
        </Card>

        {/* data */}
        <Card>
          <div className="mb-3 flex items-center gap-2 font-display text-[14px] font-bold"><ShieldCheck size={15} className="text-green" /> Your data</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportData}><Download size={14} /> Export everything (JSON)</Button>
            {!confirmWipe ? (
              <Button variant="danger" onClick={() => setConfirmWipe(true)}><Trash2 size={14} /> Erase workspace & sign out</Button>
            ) : (
              <>
                <span className="text-[12.5px] font-bold text-red">Delete all chats, notes, tasks, docs & memory?</span>
                <Button variant="danger" onClick={wipe}>Yes, erase</Button>
                <Button variant="ghost" onClick={() => setConfirmWipe(false)}>Cancel</Button>
              </>
            )}
          </div>
          <p className="mt-2 text-[11.5px] text-mut">Demo mode keeps all data in your browser's localStorage, namespaced per user. Production persists to PostgreSQL with per-user row ownership enforced in every query.</p>
        </Card>
      </div>
    </div>
  )
}
