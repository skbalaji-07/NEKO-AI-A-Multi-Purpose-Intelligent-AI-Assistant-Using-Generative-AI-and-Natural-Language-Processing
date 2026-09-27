import { useState } from 'react'
import { CheckSquare, ChevronDown, ChevronRight, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useUser } from '../App'
import { logActivity, uid, useCollection } from '../lib/store'
import type { SubTask, Task } from '../lib/types'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Segmented, cn } from '../components/ui'

function breakdown(title: string): string[] {
  const t = title.toLowerCase()
  if (/report|essay|thesis|documentation|paper|write|readme/.test(t))
    return ['Outline the structure & key sections', 'Gather sources / evidence', 'Draft section by section', 'Review, edit & tighten', 'Format, cite & final proofread']
  if (/deploy|deployment|release|ship|host/.test(t))
    return ['Prepare environment variables & secrets', 'Provision database / services', 'Run production build & tests', 'Deploy and verify health checks', 'Smoke-test critical user flows']
  if (/study|revise|exam|learn|course/.test(t))
    return ['Collect syllabus & materials', 'Create flashcards for key concepts', 'Daily active-recall session', 'Solve practice problems untimed', 'Timed mock test + review gaps']
  if (/video|demo|presentation|slides|pitch/.test(t))
    return ['Write the script / talking points', 'Prepare slides or screen flows', 'Record a full take', 'Edit and trim', 'Publish & share for feedback']
  if (/interview/.test(t))
    return ['Research the company & role', 'Review core technical concepts', 'Practice answers aloud (STAR)', 'Prepare questions to ask them', 'Do one full mock interview']
  if (/bug|fix|debug|issue/.test(t))
    return ['Reproduce the issue reliably', 'Isolate the failing component', 'Identify root cause with logs', 'Implement & test the fix', 'Add a regression test']
  return ['Define what “done” looks like', 'Identify the first concrete step', 'Schedule a focus block', 'Execute the core work', 'Review outcome & wrap up']
}

export default function Tasks() {
  const user = useUser()
  const [tasks, setTasks] = useCollection<Task[]>(user.userId, 'tasks', [])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const done = tasks.filter((t) => t.done).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const visible = tasks.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done))

  function add() {
    if (!title.trim()) return
    const t: Task = { id: uid(), title: title.trim(), done: false, priority, due: due || undefined, subtasks: [], created: Date.now() }
    setTasks((p) => [t, ...p])
    logActivity(user.userId, 'task', `Added task “${t.title.slice(0, 40)}”`)
    setTitle('')
    setDue('')
  }

  function update(id: string, patch: Partial<Task>) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function aiBreakdown(t: Task) {
    const subs: SubTask[] = breakdown(t.title).map((s) => ({ id: uid(), title: s, done: false }))
    update(t.id, { subtasks: subs })
    setExpanded(t.id)
    logActivity(user.userId, 'task', `AI breakdown for “${t.title.slice(0, 36)}”`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Tasks"
        subtitle="Priorities, due dates and AI-generated task breakdowns. Chat can add tasks too: “Add task: …”"
        actions={<Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'done', label: 'Done' }]} />}
      />

      {/* progress */}
      <Card className="mb-4">
        <div className="flex items-center justify-between text-[12.5px] font-semibold">
          <span className="text-mut">{done} of {tasks.length} complete</span>
          <span className="text-accent">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      {/* add row */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="min-w-[200px] flex-1" placeholder="Add a task…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <select value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])} className="rounded-xl border border-line bg-surface px-2.5 py-2 text-[12.5px] font-semibold">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl border border-line bg-surface px-2.5 py-2 text-[12.5px]" />
        <Button onClick={add} disabled={!title.trim()}><Plus size={14} /> Add</Button>
      </div>

      {!visible.length ? (
        <EmptyState icon={<CheckSquare size={20} />} title={filter === 'done' ? 'Nothing completed yet' : 'No tasks here'} body="Add a task above — then try the AI breakdown to split it into concrete subtasks." />
      ) : (
        <div className="space-y-2">
          {visible.map((t) => {
            const isOpen = expanded === t.id
            const subDone = t.subtasks.filter((s) => s.done).length
            return (
              <Card key={t.id} className={cn('transition', t.done && 'opacity-60')}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={(e) => update(t.id, { done: e.target.checked })}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
                  />
                  <button className="min-w-0 flex-1 text-left" onClick={() => setExpanded(isOpen ? null : t.id)}>
                    <span className={cn('text-[13.5px] font-semibold', t.done && 'line-through')}>{t.title}</span>
                    {t.subtasks.length > 0 && <span className="ml-2 text-[11px] font-bold text-mut">{subDone}/{t.subtasks.length}</span>}
                  </button>
                  {t.due && <Badge tone="blue">{t.due}</Badge>}
                  <Badge tone={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'accent' : 'mut'}>{t.priority}</Badge>
                  <button title="AI breakdown" className="rounded-lg p-1.5 text-mut hover:bg-accent/10 hover:text-accent" onClick={() => aiBreakdown(t)}>
                    <Sparkles size={14} />
                  </button>
                  <button className="rounded-lg p-1.5 text-mut hover:text-red" onClick={() => setTasks((p) => p.filter((x) => x.id !== t.id))}>
                    <Trash2 size={14} />
                  </button>
                  <button className="rounded-lg p-1 text-mut" onClick={() => setExpanded(isOpen ? null : t.id)}>
                    {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                </div>
                {isOpen && (
                  <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {t.subtasks.length ? (
                      t.subtasks.map((s) => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 text-[12.5px] hover:bg-surface2/60">
                          <input
                            type="checkbox"
                            checked={s.done}
                            onChange={(e) => update(t.id, { subtasks: t.subtasks.map((x) => (x.id === s.id ? { ...x, done: e.target.checked } : x)) })}
                            className="h-3.5 w-3.5 accent-[var(--accent)]"
                          />
                          <span className={cn(s.done && 'text-mut line-through')}>{s.title}</span>
                        </label>
                      ))
                    ) : (
                      <div className="flex items-center justify-between text-[12.5px] text-mut">
                        No subtasks yet.
                        <Button variant="outline" onClick={() => aiBreakdown(t)}><Sparkles size={13} /> AI breakdown</Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
