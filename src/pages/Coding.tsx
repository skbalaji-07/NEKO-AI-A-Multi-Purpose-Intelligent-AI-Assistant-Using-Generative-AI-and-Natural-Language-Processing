import { useState } from 'react'
import { Check, Code2, Copy, Play, ScanSearch, Search, Terminal } from 'lucide-react'
import { useUser } from '../App'
import { SNIPPETS, explainCodeMarkdown, runJS, type RunResult } from '../lib/coding'
import { Markdown } from '../lib/markdown'
import { logActivity } from '../lib/store'
import { Badge, Button, Card, Input, PageHeader, Segmented, Textarea, cn } from '../components/ui'

const SAMPLE_EXPLAIN = `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)

print(quicksort([9, 2, 7, 1, 8, 3]))`

const SAMPLE_RUN = `// Live JavaScript sandbox — console output is captured below.
function fib(n) {
  const memo = [0, 1];
  for (let i = 2; i <= n; i++) memo[i] = memo[i - 1] + memo[i - 2];
  return memo[n];
}

for (let i = 1; i <= 10; i++) console.log('fib(' + i + ') =', fib(i));`

export default function Coding() {
  const user = useUser()
  const [tab, setTab] = useState<'explain' | 'run' | 'snippets'>('explain')

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Coding Assistant"
        subtitle="Static analysis & code review, a live JavaScript runner, and a curated snippet library."
        actions={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'explain', label: <span className="flex items-center gap-1.5"><ScanSearch size={13} /> Explain</span> },
              { value: 'run', label: <span className="flex items-center gap-1.5"><Terminal size={13} /> Run JS</span> },
              { value: 'snippets', label: <span className="flex items-center gap-1.5"><Code2 size={13} /> Snippets</span> },
            ]}
          />
        }
      />
      {tab === 'explain' && <Explain onRun={() => logActivity(user.userId, 'code', 'Analysed a code snippet')} />}
      {tab === 'run' && <Runner onRun={() => logActivity(user.userId, 'code', 'Executed JavaScript in the sandbox')} />}
      {tab === 'snippets' && <Snippets />}
    </div>
  )
}

function Explain({ onRun }: { onRun: () => void }) {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<string | null>(null)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-[14px] font-bold">Paste code</div>
          <button className="text-[11.5px] font-bold text-accent hover:underline" onClick={() => setCode(SAMPLE_EXPLAIN)}>Load sample</button>
        </div>
        <Textarea rows={14} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste Python, JavaScript, TypeScript, SQL, Java…" className="font-mono text-[12.5px]" spellCheck={false} />
        <Button className="mt-3 w-full" disabled={!code.trim()} onClick={() => { setResult(explainCodeMarkdown(code)); onRun() }}>
          <ScanSearch size={14} /> Analyse & review
        </Button>
      </Card>
      <Card>
        <div className="mb-2 font-display text-[14px] font-bold">Analysis</div>
        {result ? (
          <div className="fade-up"><Markdown text={result} /></div>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-mut">
            NEKO detects the language, maps functions / classes / imports / control flow, and runs a heuristic review:
            <br /><br />• injection-risk patterns (<code className="font-mono">eval</code>, hardcoded secrets)
            <br />• style issues (<code className="font-mono">var</code>, loose equality, bare <code className="font-mono">except</code>)
            <br />• complexity smells (nested loops → O(n²) warnings)
          </p>
        )}
      </Card>
    </div>
  )
}

function Runner({ onRun }: { onRun: () => void }) {
  const [code, setCode] = useState(SAMPLE_RUN)
  const [out, setOut] = useState<RunResult | null>(null)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <div className="mb-2 font-display text-[14px] font-bold">JavaScript sandbox</div>
        <Textarea rows={14} value={code} onChange={(e) => setCode(e.target.value)} className="font-mono text-[12.5px]" spellCheck={false} />
        <Button className="mt-3 w-full" onClick={() => { setOut(runJS(code)); onRun() }}>
          <Play size={14} /> Run code
        </Button>
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-[14px] font-bold">Console output</div>
          {out && <Badge tone={out.error ? 'red' : 'green'}>{out.error ? 'error' : 'ok'} · {out.ms}ms</Badge>}
        </div>
        <div className="min-h-[280px] rounded-xl bg-[#101014] p-3 font-mono text-[12px] leading-relaxed text-[#c8e39a]">
          {!out && <span className="text-[#6b6b78]">// output appears here — console.log is captured</span>}
          {out?.logs.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap border-b border-white/5 py-0.5 last:border-0">{l}</div>
          ))}
          {out?.error && <div className="mt-2 whitespace-pre-wrap text-[#ff8087]">✖ {out.error}</div>}
          {out && !out.logs.length && !out.error && <span className="text-[#6b6b78]">// ran successfully with no output</span>}
        </div>
        <p className="mt-2 text-[11px] text-mut">Runs in a strict-mode function scope with a captured console — demo-grade sandboxing. Production would use a Web Worker with a timeout.</p>
      </Card>
    </div>
  )
}

function Snippets() {
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const list = SNIPPETS.filter((s) => !q || (s.title + s.lang + s.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
        <Input className="pl-9" placeholder="Filter: sort, fetch, react, sql…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((s) => (
          <Card key={s.id} className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-display text-[13.5px] font-bold">{s.title}</div>
              <div className="flex items-center gap-1.5">
                <Badge tone="blue">{s.lang}</Badge>
                <button
                  className={cn('flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-bold', copied === s.id ? 'text-green' : 'text-mut hover:text-accent')}
                  onClick={() => {
                    navigator.clipboard.writeText(s.code)
                    setCopied(s.id)
                    setTimeout(() => setCopied(null), 1500)
                  }}
                >
                  {copied === s.id ? <Check size={11} /> : <Copy size={11} />} {copied === s.id ? 'copied' : 'copy'}
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-x-auto rounded-xl bg-surface2/60 p-3 font-mono text-[11.5px] leading-relaxed">{s.code}</pre>
            <p className="mt-2 text-[11.5px] text-mut">💡 {s.note}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
