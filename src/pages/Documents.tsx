import { useMemo, useRef, useState } from 'react'
import { FileText, HelpCircle, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import { useUser } from '../App'
import { answerFromText, readability, summarize, topKeywords } from '../lib/nlp'
import { logActivity, uid, useCollection } from '../lib/store'
import type { Doc } from '../lib/types'
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Textarea, cn } from '../components/ui'

export default function Documents() {
  const user = useUser()
  const [docs, setDocs] = useCollection<Doc[]>(user.userId, 'docs', [])
  const [activeId, setActiveId] = useState<string | null>(docs[0]?.id ?? null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteName, setPasteName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [sumLen, setSumLen] = useState(3)
  const [question, setQuestion] = useState('')
  const [qa, setQa] = useState<{ q: string; a: string; score: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const doc = docs.find((d) => d.id === activeId) ?? null

  const analysis = useMemo(() => {
    if (!doc) return null
    return {
      stats: readability(doc.text),
      summary: summarize(doc.text, sumLen),
      keywords: topKeywords(doc.text, 10),
    }
  }, [doc, sumLen])

  function addDoc(name: string, text: string) {
    const d: Doc = { id: uid(), name, text, created: Date.now() }
    setDocs((p) => [d, ...p])
    setActiveId(d.id)
    setQa(null)
    logActivity(user.userId, 'doc', `Analysed document “${name}”`)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => addDoc(f.name, String(reader.result ?? ''))
    reader.readAsText(f)
    e.target.value = ''
  }

  function ask() {
    if (!doc || !question.trim()) return
    const res = answerFromText(doc.text, question)
    setQa({
      q: question,
      a: res.answer || 'I could not find a relevant passage for that question in this document. Try rephrasing with keywords that appear in the text.',
      score: res.score,
    })
    setQuestion('')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Document Intelligence"
        subtitle="Upload .txt / .md files (or paste text) — extractive summarisation, keyword extraction and TF-IDF question answering."
        actions={
          <>
            <input ref={fileRef} type="file" accept=".txt,.md,.markdown,.csv,.log,.json,text/plain" className="hidden" onChange={onFile} />
            <Button variant="outline" onClick={() => setPasteOpen(true)}><Plus size={14} /> Paste text</Button>
            <Button onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload file</Button>
          </>
        }
      />

      {!docs.length ? (
        <EmptyState
          icon={<FileText size={20} />}
          title="No documents yet"
          body="Upload a text file or paste content. NEKO will compute reading stats, build a tunable extractive summary, surface keywords, and answer questions grounded in the text."
          action={<Button onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload your first document</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {/* list */}
          <div className="space-y-1.5 lg:col-span-1">
            {docs.map((d) => (
              <div key={d.id} className={cn('group flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold transition', d.id === activeId ? 'border-accent/50 bg-accent/10 text-accent' : 'border-line bg-surface text-mut hover:border-accent/40')} onClick={() => { setActiveId(d.id); setQa(null) }}>
                <FileText size={13} className="shrink-0" />
                <span className="flex-1 truncate">{d.name}</span>
                <button className="hidden text-mut hover:text-red group-hover:block" onClick={(e) => { e.stopPropagation(); setDocs((p) => p.filter((x) => x.id !== d.id)); if (activeId === d.id) setActiveId(null) }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* detail */}
          <div className="space-y-4 lg:col-span-3">
            {doc && analysis ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { l: 'Words', v: analysis.stats.words.toLocaleString() },
                    { l: 'Sentences', v: analysis.stats.sentences },
                    { l: 'Read time', v: `${analysis.stats.readingMins} min` },
                    { l: 'Readability', v: `${analysis.stats.flesch}/100` },
                  ].map((s) => (
                    <Card key={s.l} className="py-3 text-center">
                      <div className="font-display text-lg font-bold">{s.v}</div>
                      <div className="text-[10.5px] font-bold uppercase tracking-widest text-mut">{s.l}</div>
                    </Card>
                  ))}
                </div>

                <Card>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-display text-[14px] font-bold"><Sparkles size={15} className="text-accent" /> AI summary</div>
                    <label className="flex items-center gap-2 text-[11.5px] font-semibold text-mut">
                      length
                      <input type="range" min={1} max={6} value={sumLen} onChange={(e) => setSumLen(Number(e.target.value))} className="accent-[var(--accent)]" />
                      {sumLen} sent.
                    </label>
                  </div>
                  <p className="rounded-xl border-l-2 border-accent bg-surface2/50 p-3 text-[13px] leading-relaxed">{analysis.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {analysis.keywords.map((k) => <Badge key={k} tone="accent">{k}</Badge>)}
                  </div>
                </Card>

                <Card>
                  <div className="mb-2 flex items-center gap-2 font-display text-[14px] font-bold"><HelpCircle size={15} className="text-blue" /> Ask this document</div>
                  <div className="flex gap-2">
                    <Input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="e.g. What is self-attention?" />
                    <Button onClick={ask} disabled={!question.trim()} className="shrink-0">Ask</Button>
                  </div>
                  {qa && (
                    <div className="fade-up mt-3 rounded-xl border border-line bg-surface2/50 p-3">
                      <div className="text-[11.5px] font-bold text-mut">Q: {qa.q}</div>
                      <p className="mt-1.5 text-[13px] leading-relaxed">{qa.a}</p>
                      <div className="mt-2"><Badge tone={qa.score > 0.4 ? 'green' : qa.score > 0 ? 'accent' : 'red'}>retrieval confidence {Math.round(qa.score * 100)}%</Badge></div>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-mut">Method: question tokens are matched against sentences with inverse-document-frequency weighting — the same retrieval principle behind RAG pipelines.</p>
                </Card>

                <Card>
                  <div className="mb-2 font-display text-[14px] font-bold">Raw text</div>
                  <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-surface2/50 p-3 font-body text-[12.5px] leading-relaxed text-mut">{doc.text.slice(0, 6000)}{doc.text.length > 6000 ? '…' : ''}</pre>
                </Card>
              </>
            ) : (
              <EmptyState icon={<FileText size={20} />} title="Select a document" body="Pick a document from the list to see its analysis." />
            )}
          </div>
        </div>
      )}

      <Modal open={pasteOpen} onClose={() => setPasteOpen(false)} title="Paste text as document" wide>
        <div className="space-y-3">
          <Input value={pasteName} onChange={(e) => setPasteName(e.target.value)} placeholder="Document name (e.g. lecture-notes.txt)" />
          <Textarea rows={10} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste article, lecture notes, report…" />
          <Button
            className="w-full"
            disabled={!pasteText.trim()}
            onClick={() => {
              addDoc(pasteName.trim() || `pasted-${docs.length + 1}.txt`, pasteText)
              setPasteOpen(false)
              setPasteName('')
              setPasteText('')
            }}
          >
            Analyse document
          </Button>
        </div>
      </Modal>
    </div>
  )
}
