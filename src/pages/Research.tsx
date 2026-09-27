import { useState } from 'react'
import { BookmarkPlus, Check, ExternalLink, Globe2, Loader2, Search } from 'lucide-react'
import { useUser } from '../App'
import { logActivity, quickAddNote } from '../lib/store'
import { Badge, Button, Card, EmptyState, Input, PageHeader } from '../components/ui'

interface SearchHit {
  title: string
  snippet: string
  pageid: number
}

interface Summary {
  title: string
  extract: string
  thumbnail?: { source: string }
  content_urls?: { desktop?: { page?: string } }
  description?: string
}

export default function Research() {
  const user = useUser()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [sumLoading, setSumLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSummary(null)
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=8`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHits(data?.query?.search ?? [])
      logActivity(user.userId, 'research', `Researched “${query.slice(0, 40)}”`)
    } catch {
      setError('Could not reach Wikipedia — check your connection and try again.')
      setHits(null)
    } finally {
      setLoading(false)
    }
  }

  async function openSummary(title: string) {
    setSumLoading(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSummary(await res.json())
    } catch {
      setError('Could not load that article summary.')
    } finally {
      setSumLoading(false)
    }
  }

  function saveToNotes() {
    if (!summary) return
    quickAddNote(user.userId, `${summary.extract}\n\nSource: Wikipedia — ${summary.content_urls?.desktop?.page ?? ''}`, `Research: ${summary.title}`)
    setSaved(true)
    logActivity(user.userId, 'research', `Saved “${summary.title}” to notes`)
  }

  const strip = (html: string) => html.replace(/<[^>]+>/g, '')

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Research"
        subtitle="Live knowledge retrieval from the Wikipedia API — search, read grounded summaries, and save findings straight into Notes."
      />

      <div className="mb-5 flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
          <Input className="pl-9" placeholder="e.g. attention mechanism, PostgreSQL, spaced repetition…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
        </div>
        <Button onClick={search} disabled={loading || !query.trim()}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
        </Button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red/30 bg-red/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-red">{error}</div>}

      {!hits && !summary && !error && (
        <EmptyState icon={<Globe2 size={20} />} title="Grounded research, zero hallucination" body="This module retrieves real content from a live external API — demonstrating the retrieval half of a RAG pipeline. Search any topic to begin." />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {hits && (
          <div className="space-y-2">
            {hits.length === 0 && <Card className="text-[13px] text-mut">No results — try different keywords.</Card>}
            {hits.map((h) => (
              <Card key={h.pageid} className="cursor-pointer transition hover:border-accent/50">
                <button className="w-full text-left" onClick={() => openSummary(h.title)}>
                  <div className="font-display text-[14px] font-bold text-accent">{h.title}</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-mut">{strip(h.snippet)}…</p>
                </button>
              </Card>
            ))}
          </div>
        )}

        {(summary || sumLoading) && (
          <div>
            <Card className="sticky top-4">
              {sumLoading ? (
                <div className="flex items-center gap-2 py-8 text-[13px] text-mut"><Loader2 size={15} className="animate-spin text-accent" /> Fetching article summary…</div>
              ) : summary && (
                <div className="fade-up">
                  <div className="flex items-start gap-3">
                    {summary.thumbnail?.source && <img src={summary.thumbnail.source} alt="" className="h-16 w-16 rounded-xl border border-line object-cover" />}
                    <div>
                      <div className="font-display text-lg font-bold">{summary.title}</div>
                      {summary.description && <Badge tone="blue" className="mt-1">{summary.description}</Badge>}
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed">{summary.extract}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={saveToNotes} disabled={saved}>
                      {saved ? <><Check size={14} /> Saved to Notes</> : <><BookmarkPlus size={14} /> Save to Notes</>}
                    </Button>
                    {summary.content_urls?.desktop?.page && (
                      <a href={summary.content_urls.desktop.page} target="_blank" rel="noreferrer">
                        <Button variant="outline"><ExternalLink size={14} /> Full article</Button>
                      </a>
                    )}
                  </div>
                  <p className="mt-3 text-[10.5px] text-mut">Source: Wikipedia (CC BY-SA). Retrieved live — content is grounded, not generated.</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
