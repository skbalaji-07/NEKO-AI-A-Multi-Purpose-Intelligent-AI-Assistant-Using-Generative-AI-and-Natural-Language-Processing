import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

/** Minimal markdown renderer: headings, bold/italic, inline code, fenced code
 *  blocks (with copy), lists, blockquotes, links, tables, hr. */

function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)|(\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const token = m[0]
    const key = `${keyBase}-${k++}`
    if (token.startsWith('`')) {
      nodes.push(
        <code key={key} className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={key} className="font-bold">{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('_')) {
      nodes.push(<em key={key} className="text-mut">{token.slice(1, -1)}</em>)
    } else if (m[6] && m[7]) {
      nodes.push(
        <a key={key} href={m[7]} target="_blank" rel="noreferrer" className="text-blue underline underline-offset-2 hover:text-accent">
          {m[6]}
        </a>,
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line bg-surface2/60">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-mut">{lang || 'code'}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-mut hover:bg-surface hover:text-ink"
        >
          {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // fenced code
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++
      blocks.push(<CodeBlock key={key++} lang={fence[1]} code={buf.join('\n')} />)
      continue
    }

    // table
    if (line.startsWith('|') && lines[i + 1]?.match(/^\|[\s:|-]+\|?\s*$/)) {
      const headerCells = line.split('|').slice(1, -1).map((c) => c.trim())
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()))
        i++
      }
      blocks.push(
        <div key={key++} className="my-3 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface2/60">
                {headerCells.map((c, ci) => (
                  <th key={ci} className="px-3 py-2 font-semibold">{inline(c, `th${key}-${ci}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-line/50 last:border-0">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-1.5 align-top">{inline(c, `td${key}-${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // hr
    if (/^---+\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="my-3 border-line" />)
      i++
      continue
    }

    // headings
    const h = line.match(/^(#{1,4})\s+(.+)/)
    if (h) {
      const level = h[1].length
      const cls = level === 1 ? 'text-lg font-bold font-display mt-3 mb-1.5' : level === 2 ? 'text-base font-bold font-display mt-3 mb-1' : 'text-sm font-bold mt-2 mb-1'
      blocks.push(<div key={key++} className={cls}>{inline(h[2], `h${key}`)}</div>)
      i++
      continue
    }

    // blockquote
    if (line.startsWith('> ')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <blockquote key={key++} className="my-2 border-l-2 border-accent bg-surface2/40 py-1.5 pl-3 pr-2 text-[13px] italic rounded-r-lg">
          {inline(buf.join(' '), `bq${key}`)}
        </blockquote>,
      )
      continue
    }

    // lists
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      const ordered = /^\s*\d+[.)]\s+/.test(line)
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+[.)]\s+/.test(lines[i]))) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+[.)])\s+/, ''))
        i++
      }
      blocks.push(
        ordered ? (
          <ol key={key++} className="my-1.5 list-decimal space-y-1 pl-5">
            {items.map((it, ii) => <li key={ii}>{inline(it, `ol${key}-${ii}`)}</li>)}
          </ol>
        ) : (
          <ul key={key++} className="my-1.5 list-disc space-y-1 pl-5 marker:text-accent">
            {items.map((it, ii) => <li key={ii}>{inline(it, `ul${key}-${ii}`)}</li>)}
          </ul>
        ),
      )
      continue
    }

    // blank
    if (!line.trim()) {
      i++
      continue
    }

    // paragraph
    const buf: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|[-*]\s|\d+[.)]\s|>\s|\||---)/.test(lines[i])) {
      buf.push(lines[i])
      i++
    }
    blocks.push(<p key={key++} className="my-1.5 leading-relaxed">{inline(buf.join(' '), `p${key}`)}</p>)
  }

  return <div className="text-[13.5px]">{blocks}</div>
}
