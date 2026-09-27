/** Lightweight NLP toolkit — tokenisation, extractive summarisation,
 *  keyword extraction, TF-IDF question answering and readability. */

export const STOP = new Set(
  'a an the and or but if then else when while of to in on at by for with about as into from is are was were be been being do does did have has had i you he she it we they them his her its our your their this that these those not no yes so such can could should would will shall may might must there here what which who whom whose why how all any both each few more most other some only own same than too very s t just don now'.split(
    ' ',
  ),
)

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter(Boolean)
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function wordFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of tokens) {
    if (STOP.has(t) || t.length < 3) continue
    m.set(t, (m.get(t) ?? 0) + 1)
  }
  return m
}

export function topKeywords(text: string, n = 8): string[] {
  const freq = wordFreq(tokenize(text))
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w)
}

/** Frequency-based extractive summariser with position bonus. */
export function summarize(text: string, maxSentences = 3): string {
  const sentences = splitSentences(text)
  if (sentences.length <= maxSentences) return text.trim()
  const freq = wordFreq(tokenize(text))
  const maxF = Math.max(...freq.values(), 1)
  const scored = sentences.map((s, i) => {
    const toks = tokenize(s).filter((t) => !STOP.has(t) && t.length >= 3)
    if (!toks.length) return { i, s, score: 0 }
    const base = toks.reduce((acc, t) => acc + (freq.get(t) ?? 0) / maxF, 0) / Math.sqrt(toks.length)
    const posBonus = i === 0 ? 0.35 : i === sentences.length - 1 ? 0.12 : 0
    return { i, s, score: base + posBonus }
  })
  return scored
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s)
    .join(' ')
}

export interface QAResult {
  answer: string
  score: number
}

/** TF-IDF style sentence retrieval to answer a question over a document. */
export function answerFromText(text: string, question: string): QAResult {
  const sentences = splitSentences(text)
  const qTokens = [...new Set(tokenize(question).filter((t) => !STOP.has(t) && t.length >= 3))]
  if (!qTokens.length || !sentences.length) return { answer: '', score: 0 }

  // document frequency per token
  const df = new Map<string, number>()
  const sentTokens = sentences.map((s) => new Set(tokenize(s)))
  for (const t of qTokens) {
    df.set(t, sentTokens.filter((st) => st.has(t)).length)
  }

  const scored = sentences.map((s, i) => {
    const st = sentTokens[i]
    let score = 0
    for (const t of qTokens) {
      if (st.has(t)) score += 1 / Math.log(2 + (df.get(t) ?? 0))
    }
    return { s, score: score / qTokens.length, i }
  })
  scored.sort((a, b) => b.score - a.score)
  const best = scored.slice(0, 2).filter((x) => x.score > 0.12)
  if (!best.length) return { answer: '', score: 0 }
  best.sort((a, b) => a.i - b.i)
  return { answer: best.map((x) => x.s).join(' '), score: Math.min(1, best[0].score * 1.6) }
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) return 1
  const m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)
  return Math.max(1, m ? m.length : 1)
}

export interface Readability {
  words: number
  sentences: number
  chars: number
  readingMins: number
  flesch: number
  level: string
}

export function readability(text: string): Readability {
  const words = tokenize(text)
  const sents = splitSentences(text)
  const nWords = Math.max(1, words.length)
  const nSents = Math.max(1, sents.length)
  const nSyll = words.reduce((a, w) => a + syllables(w), 0)
  const flesch = Math.round(206.835 - 1.015 * (nWords / nSents) - 84.6 * (nSyll / nWords))
  const level =
    flesch >= 80 ? 'Very easy' : flesch >= 60 ? 'Plain English' : flesch >= 40 ? 'Fairly difficult' : flesch >= 20 ? 'Difficult' : 'Very difficult'
  return {
    words: text.trim() ? words.length : 0,
    sentences: text.trim() ? sents.length : 0,
    chars: text.length,
    readingMins: Math.max(1, Math.round(nWords / 220)),
    flesch: Math.max(0, Math.min(100, flesch)),
    level,
  }
}
