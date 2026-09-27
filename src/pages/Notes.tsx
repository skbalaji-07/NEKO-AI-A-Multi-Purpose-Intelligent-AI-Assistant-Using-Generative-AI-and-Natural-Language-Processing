import { useMemo, useState } from 'react'
import { Plus, Search, Sparkles, StickyNote, Trash2 } from 'lucide-react'
import { useUser } from '../App'
import { summarize } from '../lib/nlp'
import { logActivity, uid, useCollection } from '../lib/store'
import type { Note } from '../lib/types'
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Textarea, cn } from '../components/ui'

export default function Notes() {
  const user = useUser()
  const [notes, setNotes] = useCollection<Note[]>(user.userId, 'notes', [])
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [editing, setEditing] = useState<Note | null>(null)
  const [isNew, setIsNew] = useState(false)

  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].slice(0, 12), [notes])

  const filtered = notes.filter((n) => {
    const q = query.toLowerCase()
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    const matchT = !tagFilter || n.tags.includes(tagFilter)
    return matchQ && matchT
  })

  function openNew() {
    setIsNew(true)
    setEditing({ id: uid(), title: '', body: '', tags: [], created: Date.now(), updated: Date.now() })
  }

  function saveNote(n: Note) {
    if (!n.title.trim() && !n.body.trim()) return
    const withTitle = { ...n, title: n.title.trim() || n.body.slice(0, 40), updated: Date.now() }
    setNotes((p) => (isNew ? [withTitle, ...p] : p.map((x) => (x.id === n.id ? withTitle : x))))
    if (isNew) logActivity(user.userId, 'note', `Created note “${withTitle.title.slice(0, 40)}”`)
    setEditing(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Notes"
        subtitle="Tagged markdown-friendly notes with one-click AI summarisation."
        actions={<Button onClick={openNew}><Plus size={14} /> New note</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
          <Input className="pl-9" placeholder="Search notes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {allTags.map((t) => (
          <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)}>
            <Badge tone={tagFilter === t ? 'accent' : 'mut'} className="cursor-pointer">#{t}</Badge>
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <EmptyState icon={<StickyNote size={20} />} title={notes.length ? 'No matches' : 'No notes yet'} body={notes.length ? 'Try a different search or tag filter.' : 'Capture ideas, lecture notes, snippets — or say “Save note: …” in chat.'} action={!notes.length ? <Button onClick={openNew}><Plus size={14} /> Create a note</Button> : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <Card key={n.id} className="group flex cursor-pointer flex-col transition hover:border-accent/50">
              <button className="flex-1 text-left" onClick={() => { setIsNew(false); setEditing(n) }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-[14.5px] font-bold leading-snug">{n.title}</div>
                </div>
                <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-[12.5px] leading-relaxed text-mut">{n.summary ? `✨ ${n.summary}` : n.body}</p>
              </button>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                <div className="flex flex-wrap gap-1">{n.tags.slice(0, 3).map((t) => <Badge key={t}>#{t}</Badge>)}</div>
                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] text-mut/70">{new Date(n.updated).toLocaleDateString()}</span>
                  <button className="rounded p-1 text-mut opacity-0 transition hover:text-red group-hover:opacity-100" onClick={() => setNotes((p) => p.filter((x) => x.id !== n.id))}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'New note' : 'Edit note'} wide>
        {editing && (
          <div className="space-y-3">
            <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title" autoFocus />
            <Textarea rows={10} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder="Write anything… markdown-style lists work great." />
            <Input
              value={editing.tags.join(', ')}
              onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) })}
              placeholder="Tags (comma separated): ai, exam, ideas"
            />
            {editing.summary && (
              <div className="rounded-xl border border-accent/30 bg-accent/8 p-3 text-[12.5px]"><strong className="text-accent">AI summary:</strong> {editing.summary}</div>
            )}
            <div className="flex flex-wrap justify-between gap-2">
              <Button
                variant="outline"
                disabled={editing.body.trim().length < 120}
                title={editing.body.trim().length < 120 ? 'Write at least 120 characters to summarise' : ''}
                onClick={() => setEditing({ ...editing, summary: summarize(editing.body, 2) })}
              >
                <Sparkles size={14} /> AI summarise
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={() => saveNote(editing)}>Save note</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
