import { useMemo, useRef, useState } from 'react'
import { BarChart3, Database, Lightbulb, Table2, Upload } from 'lucide-react'
import { useUser } from '../App'
import { SAMPLE_CSV, colStats, corrLabel, histogram, isNumericCol, numericValues, parseCSV, pearson, type Dataset } from '../lib/csv'
import { logActivity } from '../lib/store'
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'

export default function DataLab() {
  const user = useUser()
  const [ds, setDs] = useState<Dataset | null>(null)
  const [histCol, setHistCol] = useState(0)
  const [xCol, setXCol] = useState(0)
  const [yCol, setYCol] = useState(1)
  const fileRef = useRef<HTMLInputElement>(null)

  const numericCols = useMemo(() => (ds ? ds.headers.map((_, i) => i).filter((i) => isNumericCol(ds, i)) : []), [ds])

  function loadDataset(d: Dataset) {
    setDs(d)
    const nums = d.headers.map((_, i) => i).filter((i) => isNumericCol(d, i))
    setHistCol(nums[0] ?? 0)
    setXCol(nums[0] ?? 0)
    setYCol(nums[1] ?? nums[0] ?? 0)
    logActivity(user.userId, 'data', `Analysed dataset “${d.name}” (${d.rows.length} rows)`)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCSV(String(reader.result ?? ''), f.name)
      if (parsed) loadDataset(parsed)
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  const stats = useMemo(() => (ds ? ds.headers.map((_, i) => colStats(ds, i)) : []), [ds])

  const insights = useMemo(() => {
    if (!ds) return []
    const out: string[] = []
    out.push(`Dataset has ${ds.rows.length} rows × ${ds.headers.length} columns (${numericCols.length} numeric).`)
    const missing = stats.reduce((a, s) => a + s.missing, 0)
    out.push(missing === 0 ? 'No missing values detected — clean dataset.' : `${missing} missing value(s) detected — consider imputation before modelling.`)
    // strongest correlation pair
    let best: { a: number; b: number; r: number } | null = null
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const r = pearson(numericValues(ds, numericCols[i]), numericValues(ds, numericCols[j]))
        if (r !== null && (!best || Math.abs(r) > Math.abs(best.r))) best = { a: numericCols[i], b: numericCols[j], r }
      }
    }
    if (best && Math.abs(best.r) >= 0.3) {
      out.push(`Strongest relationship: ${ds.headers[best.a]} ↔ ${ds.headers[best.b]} — ${corrLabel(best.r)} correlation (r = ${best.r.toFixed(2)}).`)
    }
    const hiVar = stats.filter((s) => s.numeric && s.mean && s.std && s.std / Math.abs(s.mean) > 0.5)
    if (hiVar.length) out.push(`High relative variance in: ${hiVar.map((s) => s.name).join(', ')} — expect wide spread.`)
    return out
  }, [ds, stats, numericCols])

  const hist = ds && numericCols.includes(histCol) ? histogram(numericValues(ds, histCol)) : []
  const maxCount = Math.max(1, ...hist.map((h) => h.count))

  const scatter = useMemo(() => {
    if (!ds || !numericCols.includes(xCol) || !numericCols.includes(yCol)) return null
    const xs = ds.rows.map((r) => parseFloat(r[xCol])).filter((_, i) => Number.isFinite(parseFloat(ds.rows[i][xCol])) && Number.isFinite(parseFloat(ds.rows[i][yCol])))
    const ys = ds.rows.map((r) => parseFloat(r[yCol])).filter((_, i) => Number.isFinite(parseFloat(ds.rows[i][xCol])) && Number.isFinite(parseFloat(ds.rows[i][yCol])))
    if (xs.length < 3) return null
    const r = pearson(xs, ys)
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    const pts = xs.map((x, i) => ({
      cx: 8 + ((x - minX) / (maxX - minX || 1)) * 84,
      cy: 92 - ((ys[i] - minY) / (maxY - minY || 1)) * 84,
    }))
    return { pts, r }
  }, [ds, xCol, yCol, numericCols])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Data Lab"
        subtitle="Upload a CSV for instant descriptive statistics, distributions, correlation analysis and auto-generated insights."
        actions={
          <>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            <Button variant="outline" onClick={() => loadDataset(parseCSV(SAMPLE_CSV, 'student-performance.csv')!)}><Database size={14} /> Sample dataset</Button>
            <Button onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload CSV</Button>
          </>
        }
      />

      {!ds ? (
        <EmptyState
          icon={<BarChart3 size={20} />}
          title="No dataset loaded"
          body="Upload any CSV — NEKO parses it (quoted fields supported), infers column types, and computes mean / median / σ / correlations. Or load the bundled student-performance sample."
          action={<Button onClick={() => loadDataset(parseCSV(SAMPLE_CSV, 'student-performance.csv')!)}><Database size={14} /> Load sample dataset</Button>}
        />
      ) : (
        <div className="space-y-4">
          {/* insights */}
          <Card className="border-accent/30 bg-accent/5">
            <div className="mb-2 flex items-center gap-2 font-display text-[14px] font-bold"><Lightbulb size={15} className="text-accent" /> Auto insights · {ds.name}</div>
            <ul className="space-y-1">
              {insights.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-mut"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{s}</li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* histogram */}
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <div className="font-display text-[14px] font-bold">Distribution</div>
                <select value={histCol} onChange={(e) => setHistCol(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] font-semibold">
                  {numericCols.map((i) => <option key={i} value={i}>{ds.headers[i]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                {hist.map((h) => (
                  <div key={h.label} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-right font-mono text-[10.5px] text-mut">{h.label}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded bg-surface2/70">
                      <div className="flex h-full items-center rounded bg-accent/80 pl-1.5 font-mono text-[10px] font-bold text-accent-ink transition-all" style={{ width: `${(h.count / maxCount) * 100}%`, minWidth: h.count ? 18 : 0 }}>
                        {h.count > 0 && h.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* scatter + correlation */}
            <Card>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="font-display text-[14px] font-bold">Correlation</div>
                <div className="flex items-center gap-1.5 text-[12px]">
                  <select value={xCol} onChange={(e) => setXCol(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-2 py-1 font-semibold">
                    {numericCols.map((i) => <option key={i} value={i}>{ds.headers[i]}</option>)}
                  </select>
                  <span className="text-mut">vs</span>
                  <select value={yCol} onChange={(e) => setYCol(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-2 py-1 font-semibold">
                    {numericCols.map((i) => <option key={i} value={i}>{ds.headers[i]}</option>)}
                  </select>
                </div>
              </div>
              {scatter ? (
                <>
                  <svg viewBox="0 0 100 100" className="h-52 w-full rounded-xl border border-line bg-surface2/40">
                    {scatter.pts.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r="1.6" className="fill-accent/80" />)}
                  </svg>
                  {scatter.r !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone={Math.abs(scatter.r) >= 0.6 ? 'green' : Math.abs(scatter.r) >= 0.3 ? 'accent' : 'mut'}>Pearson r = {scatter.r.toFixed(3)}</Badge>
                      <span className="text-[12px] text-mut">{corrLabel(scatter.r)} correlation</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[12.5px] text-mut">Select two numeric columns with at least 3 valid rows.</p>
              )}
            </Card>
          </div>

          {/* column stats */}
          <Card>
            <div className="mb-2 flex items-center gap-2 font-display text-[14px] font-bold"><Table2 size={15} className="text-blue" /> Column statistics</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-line text-[10.5px] uppercase tracking-wider text-mut">
                    <th className="px-2 py-2">Column</th><th className="px-2 py-2">Type</th><th className="px-2 py-2">Count</th><th className="px-2 py-2">Missing</th><th className="px-2 py-2">Unique</th><th className="px-2 py-2">Mean</th><th className="px-2 py-2">Median</th><th className="px-2 py-2">σ</th><th className="px-2 py-2">Min</th><th className="px-2 py-2">Max</th><th className="px-2 py-2">Top</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.name} className="border-b border-line/50 font-mono last:border-0">
                      <td className="px-2 py-1.5 font-body font-bold">{s.name}</td>
                      <td className="px-2 py-1.5"><Badge tone={s.numeric ? 'blue' : 'pink'}>{s.numeric ? 'numeric' : 'category'}</Badge></td>
                      <td className="px-2 py-1.5">{s.count}</td>
                      <td className="px-2 py-1.5">{s.missing}</td>
                      <td className="px-2 py-1.5">{s.unique}</td>
                      <td className="px-2 py-1.5">{s.mean?.toFixed(2) ?? '—'}</td>
                      <td className="px-2 py-1.5">{s.median?.toFixed(2) ?? '—'}</td>
                      <td className="px-2 py-1.5">{s.std?.toFixed(2) ?? '—'}</td>
                      <td className="px-2 py-1.5">{s.min?.toFixed(1) ?? '—'}</td>
                      <td className="px-2 py-1.5">{s.max?.toFixed(1) ?? '—'}</td>
                      <td className="max-w-[100px] truncate px-2 py-1.5">{s.top ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* preview */}
          <Card>
            <div className="mb-2 font-display text-[14px] font-bold">Data preview <span className="text-[11px] font-normal text-mut">(first 12 of {ds.rows.length} rows)</span></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11.5px]">
                <thead>
                  <tr className="border-b border-line bg-surface2/50">
                    {ds.headers.map((h) => <th key={h} className="px-2 py-1.5 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ds.rows.slice(0, 12).map((r, ri) => (
                    <tr key={ri} className="border-b border-line/40 font-mono last:border-0">
                      {r.map((c, ci) => <td key={ci} className="max-w-[140px] truncate px-2 py-1">{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
