import { Link } from 'react-router-dom'
import {
  Activity as ActivityIcon, ArrowRight, BarChart3, Brain, Briefcase, CheckSquare, Code2,
  FileText, Flag, GraduationCap, Layers, MessagesSquare, PenLine, StickyNote, Timer,
} from 'lucide-react'
import { useUser } from '../App'
import { load, userKey } from '../lib/store'
import type { Activity, Conversation, Deck, Doc, Fact, Note, Task } from '../lib/types'
import { Badge, Card, Stat } from '../components/ui'

const QUICK = [
  { to: '/app/chat', icon: <MessagesSquare size={16} />, label: 'Ask NEKO', desc: 'Intent-routed AI chat', tone: 'text-accent bg-accent/12' },
  { to: '/app/documents', icon: <FileText size={16} />, label: 'Analyse a document', desc: 'Summary · keywords · Q&A', tone: 'text-blue bg-blue/12' },
  { to: '/app/study', icon: <GraduationCap size={16} />, label: 'Study session', desc: 'Flashcards · quiz · Pomodoro', tone: 'text-green bg-green/12' },
  { to: '/app/data', icon: <BarChart3 size={16} />, label: 'Explore data', desc: 'CSV stats & correlations', tone: 'text-pink bg-pink/12' },
  { to: '/app/career', icon: <Briefcase size={16} />, label: 'Career boost', desc: 'Resume · interviews · letters', tone: 'text-teal bg-teal/12' },
  { to: '/app/writing', icon: <PenLine size={16} />, label: 'Writing studio', desc: 'Tone · readability · outlines', tone: 'text-gold bg-gold/12' },
]

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Dashboard() {
  const user = useUser()
  const uidKey = (c: string) => userKey(user.userId, c)
  const chats = load<Conversation[]>(uidKey('chats'), [])
  const notes = load<Note[]>(uidKey('notes'), [])
  const tasks = load<Task[]>(uidKey('tasks'), [])
  const docs = load<Doc[]>(uidKey('docs'), [])
  const decks = load<Deck[]>(uidKey('decks'), [])
  const memory = load<Fact[]>(uidKey('memory'), [])
  const activity = load<Activity[]>(uidKey('activity'), [])
  const study = load<{ sessions: number; minutes: number }>(uidKey('study'), { sessions: 0, minutes: 0 })

  const messages = chats.reduce((a, c) => a + c.messages.length, 0)
  const cards = decks.reduce((a, d) => a + d.cards.length, 0)
  const openTasks = tasks.filter((t) => !t.done)
  const doneTasks = tasks.length - openTasks.length

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.name.split(' ')[0]

  const focus = [...openTasks]
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      const byP = p[a.priority] - p[b.priority]
      if (byP !== 0) return byP
      return (a.due ?? '9999').localeCompare(b.due ?? '9999')
    })
    .slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="fade-up mb-6">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-widest text-mut">
          <span className="h-1.5 w-1.5 rounded-full bg-green" /> workspace online
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
          {greeting}, <span className="text-accent">{firstName}</span> 🐾
        </h1>
        <p className="mt-1 text-[13.5px] text-mut">
          {openTasks.length > 0
            ? `You have ${openTasks.length} open task${openTasks.length > 1 ? 's' : ''} and ${cards} flashcard${cards === 1 ? '' : 's'} ready for review.`
            : 'All clear. Ask NEKO anything, or start a study session.'}
        </p>
      </div>

      {/* stats */}
      <div className="fade-up grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" style={{ animationDelay: '80ms' }}>
        <Stat label="Conversations" value={chats.length} icon={<MessagesSquare size={17} />} tone="accent" />
        <Stat label="Messages" value={messages} icon={<Layers size={17} />} tone="blue" />
        <Stat label="Notes" value={notes.length} icon={<StickyNote size={17} />} tone="green" />
        <Stat label="Tasks done" value={`${doneTasks}/${tasks.length}`} icon={<CheckSquare size={17} />} tone="pink" />
        <Stat label="Flashcards" value={cards} icon={<GraduationCap size={17} />} tone="teal" />
        <Stat label="Focus mins" value={study.minutes} icon={<Timer size={17} />} tone="accent" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* quick actions */}
        <div className="fade-up lg:col-span-2" style={{ animationDelay: '140ms' }}>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-bold">Quick actions</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK.map((q) => (
              <Link key={q.to} to={q.to} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition hover:border-accent/50 hover:shadow-md">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${q.tone}`}>{q.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold">{q.label}</div>
                  <div className="truncate text-[12px] text-mut">{q.desc}</div>
                </div>
                <ArrowRight size={15} className="text-mut/50 transition group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            ))}
          </div>

          {/* today's focus */}
          <div className="mt-5">
            <h2 className="mb-2.5 font-display text-[15px] font-bold">Today's focus</h2>
            {focus.length ? (
              <div className="space-y-2">
                {focus.map((t) => (
                  <Link to="/app/tasks" key={t.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 transition hover:border-accent/50">
                    <Flag size={14} className={t.priority === 'high' ? 'text-red' : t.priority === 'medium' ? 'text-accent' : 'text-mut'} />
                    <span className="flex-1 truncate text-[13px] font-semibold">{t.title}</span>
                    {t.due && <Badge tone="blue">{t.due}</Badge>}
                    <Badge tone={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'accent' : 'mut'}>{t.priority}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="text-[13px] text-mut">No open tasks. Add one in the Tasks module — or just tell NEKO: “Add task: …”</Card>
            )}
          </div>
        </div>

        {/* right column */}
        <div className="fade-up space-y-4" style={{ animationDelay: '200ms' }}>
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-[14px] font-bold"><Brain size={15} className="text-accent" /> AI memory</div>
              <Link to="/app/settings" className="text-[11.5px] font-bold text-accent hover:underline">manage</Link>
            </div>
            {memory.length ? (
              <ul className="space-y-1.5">
                {memory.slice(0, 4).map((f) => (
                  <li key={f.id} className="rounded-lg bg-surface2/60 px-2.5 py-1.5 text-[12px] text-mut">{f.text}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-mut">Nothing yet. Tell NEKO “Remember that…” and it personalises every module.</p>
            )}
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2 font-display text-[14px] font-bold"><ActivityIcon size={15} className="text-blue" /> Recent activity</div>
            {activity.length ? (
              <ul className="space-y-2">
                {activity.slice(0, 7).map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-[12px]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                    <span className="flex-1 text-mut">{a.label}</span>
                    <span className="shrink-0 text-[10.5px] text-mut/60">{timeAgo(a.ts)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-mut">Your actions across modules will appear here.</p>
            )}
          </Card>

          <Card className="border-accent/30 bg-accent/5">
            <div className="flex items-center gap-2 font-display text-[13.5px] font-bold"><Code2 size={14} className="text-accent" /> Engine status</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-mut">
              Running the <strong className="text-ink">local intelligence engine</strong>: 9 intent routes, {memory.length} memory facts,
              45-concept knowledge base. In production, unmatched intents fall through to a cloud LLM configured server-side.
            </p>
            <Link to="/app/docs" className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-accent hover:underline">
              Read the architecture <ArrowRight size={12} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
