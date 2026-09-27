import { useMemo, useState } from 'react'
import { AlignLeft, Check, Copy, Gauge, ListTree, PenLine, Wand2 } from 'lucide-react'
import { useUser } from '../App'
import { readability, splitSentences } from '../lib/nlp'
import { findFillers, findPassive, generateOutline, rewriteTone, type Tone } from '../lib/writing'
import { logActivity } from '../lib/store'
import { Badge, Button, Card, Input, PageHeader, Textarea } from '../components/ui'

const SAMPLE = `I think our project is really very good. The system was built by our team in just four months and it can't be denied that a lot of features were added. Maybe the best part is the intent engine, which was designed to route messages. We hope to basically improve it more in the future.`

export default function Writing() {
  const user = useUser()
  const [text, setText] = useState('')
  const [tone, setTone] = useState<Tone | null>(null)
  const [rewritten, setRewritten] = useState('')
  const [topic, setTopic] = useState('')
  const [outline, setOutline] = useState('')
  const [copied, setCopied] = useState(false)

  const stats = useMemo(() => readability(text), [text])
  const fillers = useMemo(() => findFillers(text), [text])
  const passive = useMemo(() => findPassive(splitSentences(text)), [text])

  function doRewrite(t: Tone) {
    setTone(t)
    setRewritten(rewriteTone(text, t))
    logActivity(user.userId, 'writing', `Rewrote text in ${t} tone`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader title="Writing Studio" subtitle="Live readability analysis, weak-language detection, tone rewriting and outline generation." />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* editor */}
        <div className="lg:col-span-3">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-[14px] font-bold"><PenLine size={15} className="text-accent" /> Draft</div>
              <button className="text-[11.5px] font-bold text-accent hover:underline" onClick={() => setText(SAMPLE)}>Load sample</button>
            </div>
            <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or write your paragraph, essay intro, email…" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] font-bold uppercase tracking-widest text-mut">Rewrite tone:</span>
              {(['formal', 'casual', 'confident'] as Tone[]).map((t) => (
                <Button key={t} variant={tone === t ? 'primary' : 'outline'} disabled={!text.trim()} onClick={() => doRewrite(t)} className="px-3 py-1.5 capitalize">
                  <Wand2 size={12} /> {t}
                </Button>
              ))}
            </div>
            {rewritten && (
              <div className="fade-up mt-3 rounded-xl border-l-2 border-accent bg-surface2/50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-widest text-mut">{tone} rewrite</span>
                  <button className="flex items-center gap-1 text-[11px] font-bold text-mut hover:text-accent" onClick={() => { navigator.clipboard.writeText(rewritten); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
                    {copied ? <Check size={11} className="text-green" /> : <Copy size={11} />} {copied ? 'copied' : 'copy'}
                  </button>
                </div>
                <p className="text-[13px] leading-relaxed">{rewritten}</p>
              </div>
            )}
          </Card>

          <Card className="mt-4">
            <div className="mb-2 flex items-center gap-2 font-display text-[14px] font-bold"><ListTree size={15} className="text-blue" /> Outline generator</div>
            <div className="flex gap-2">
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Essay / report topic, e.g. Ethics of generative AI" onKeyDown={(e) => e.key === 'Enter' && topic.trim() && setOutline(generateOutline(topic))} />
              <Button className="shrink-0" disabled={!topic.trim()} onClick={() => { setOutline(generateOutline(topic)); logActivity(user.userId, 'writing', `Generated outline: ${topic.slice(0, 36)}`) }}>Generate</Button>
            </div>
            {outline && <pre className="fade-up mt-3 whitespace-pre-wrap rounded-xl bg-surface2/50 p-3.5 font-body text-[12.5px] leading-relaxed">{outline}</pre>}
          </Card>
        </div>

        {/* analysis */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center gap-2 font-display text-[14px] font-bold"><Gauge size={15} className="text-green" /> Readability</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { l: 'Words', v: stats.words },
                { l: 'Sentences', v: stats.sentences },
                { l: 'Characters', v: stats.chars },
                { l: 'Read time', v: `${stats.readingMins}m` },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-surface2/60 py-2.5">
                  <div className="font-display text-[16px] font-bold">{s.v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-mut">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[12px] font-semibold">
                <span className="text-mut">Flesch reading ease</span>
                <span className="text-accent">{stats.flesch}/100 · {stats.level}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-gradient-to-r from-red via-accent to-green transition-all" style={{ width: `${stats.flesch}%` }} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2 font-display text-[14px] font-bold"><AlignLeft size={15} className="text-pink" /> Weak language</div>
            {text.trim() ? (
              <>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-mut">Filler words</div>
                {fillers.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {fillers.map((f) => <Badge key={f.word} tone="red">{f.word} ×{f.count}</Badge>)}
                  </div>
                ) : (
                  <Badge tone="green">none found ✓</Badge>
                )}
                <div className="mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-widest text-mut">Passive voice ({passive.length})</div>
                {passive.length ? (
                  <ul className="space-y-1.5">
                    {passive.slice(0, 4).map((s, i) => (
                      <li key={i} className="rounded-lg bg-surface2/60 px-2.5 py-1.5 text-[11.5px] italic text-mut">“{s.slice(0, 90)}{s.length > 90 ? '…' : ''}”</li>
                    ))}
                  </ul>
                ) : (
                  <Badge tone="green">active voice throughout ✓</Badge>
                )}
              </>
            ) : (
              <p className="text-[12.5px] text-mut">Write something and NEKO flags filler words and passive-voice sentences in real time.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
