/** Writing studio: tone rewriting, weak-language detection, outlines. */

const FORMAL_MAP: [RegExp, string][] = [
  [/\bcan't\b/gi, 'cannot'], [/\bwon't\b/gi, 'will not'], [/\bdon't\b/gi, 'do not'],
  [/\bdoesn't\b/gi, 'does not'], [/\bdidn't\b/gi, 'did not'], [/\bisn't\b/gi, 'is not'],
  [/\bit's\b/gi, 'it is'], [/\bI'm\b/g, 'I am'], [/\bwe're\b/gi, 'we are'],
  [/\bthey're\b/gi, 'they are'], [/\byou're\b/gi, 'you are'], [/\bwe've\b/gi, 'we have'],
  [/\bI've\b/g, 'I have'], [/\bwanna\b/gi, 'want to'], [/\bgonna\b/gi, 'going to'],
  [/\bgotta\b/gi, 'have to'], [/\bkids\b/gi, 'children'], [/\ba lot of\b/gi, 'a considerable amount of'],
  [/\blots of\b/gi, 'numerous'], [/\bget\b/gi, 'obtain'], [/\bgot\b/gi, 'received'],
  [/\bbig\b/gi, 'significant'], [/\bhuge\b/gi, 'substantial'], [/\bshow(s)?\b/gi, 'demonstrate$1'],
  [/\bso\b(?=\s+(?:we|i|they|it|the))/gi, 'therefore'], [/\bbut\b/gi, 'however,'],
  [/\balso\b/gi, 'furthermore'], [/\bstuff\b/gi, 'material'], [/\bthings\b/gi, 'elements'],
  [/\bok(ay)?\b/gi, 'acceptable'], [/\bhelp(s)? out\b/gi, 'assist$1'],
]

const CASUAL_MAP: [RegExp, string][] = [
  [/\bcannot\b/gi, "can't"], [/\bwill not\b/gi, "won't"], [/\bdo not\b/gi, "don't"],
  [/\bdoes not\b/gi, "doesn't"], [/\bit is\b/gi, "it's"], [/\bI am\b/g, "I'm"],
  [/\bwe are\b/gi, "we're"], [/\btherefore\b/gi, 'so'], [/\bhowever,?\b/gi, 'but'],
  [/\bfurthermore\b/gi, 'plus'], [/\bmoreover\b/gi, 'also'], [/\butili[sz]e\b/gi, 'use'],
  [/\bobtain\b/gi, 'get'], [/\bdemonstrate(s)?\b/gi, 'show$1'], [/\bsignificant\b/gi, 'big'],
  [/\bsubstantial\b/gi, 'huge'], [/\bcommence\b/gi, 'start'], [/\bin addition\b/gi, 'also'],
  [/\bnumerous\b/gi, 'lots of'], [/\bassist\b/gi, 'help'], [/\bregarding\b/gi, 'about'],
]

const HEDGES: [RegExp, string][] = [
  [/\bI think (that )?/gi, ''], [/\bI believe (that )?/gi, ''], [/\bI feel like /gi, ''],
  [/\bmaybe\b\s*/gi, ''], [/\bperhaps\b\s*/gi, ''], [/\bpossibly\b\s*/gi, ''],
  [/\bsort of\b\s*/gi, ''], [/\bkind of\b\s*/gi, ''], [/\ba little bit\b\s*/gi, ''],
  [/\bjust\b\s*/gi, ''], [/\bquite\b\s*/gi, ''], [/\bmight\b/gi, 'will'],
  [/\bcould\b(?=\s+\w+)/gi, 'can'], [/\bshould be able to\b/gi, 'will'],
  [/\bwe hope to\b/gi, 'we will'], [/\btry to\b/gi, ''], [/\bseems? to\b\s*/gi, ''],
]

function applyMap(text: string, map: [RegExp, string][]): string {
  let out = text
  for (const [re, rep] of map) out = out.replace(re, rep)
  return out.replace(/\s{2,}/g, ' ').replace(/\s+([.,;!?])/g, '$1').trim()
}

export type Tone = 'formal' | 'casual' | 'confident'

export function rewriteTone(text: string, tone: Tone): string {
  if (tone === 'formal') return applyMap(text, FORMAL_MAP)
  if (tone === 'casual') return applyMap(text, CASUAL_MAP)
  const stripped = applyMap(text, HEDGES)
  // Re-capitalise sentence starts after hedge removal
  return stripped.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase())
}

export const FILLER_WORDS = ['very', 'really', 'just', 'actually', 'basically', 'literally', 'quite', 'perhaps', 'maybe', 'somewhat', 'rather', 'simply', 'totally', 'definitely', 'honestly']

export function findFillers(text: string): { word: string; count: number }[] {
  const lower = text.toLowerCase()
  return FILLER_WORDS.map((word) => ({
    word,
    count: (lower.match(new RegExp(`\\b${word}\\b`, 'g')) ?? []).length,
  })).filter((f) => f.count > 0)
}

export function findPassive(sentences: string[]): string[] {
  const re = /\b(am|is|are|was|were|be|been|being)\s+(\w+(?:ed|en|own|ung|one))\b/i
  return sentences.filter((s) => re.test(s))
}

export function generateOutline(topic: string): string {
  const t = topic.trim()
  return [
    `# ${t}`,
    ``,
    `## 1. Introduction`,
    `- Hook: why ${t} matters right now`,
    `- Context & background the reader needs`,
    `- Thesis: the single claim this piece defends`,
    ``,
    `## 2. Background / Literature`,
    `- Key definitions and prior work on ${t}`,
    `- Where current approaches fall short`,
    ``,
    `## 3. Core Argument / Body`,
    `- Point 1 — strongest evidence first`,
    `- Point 2 — supporting data, example or case study`,
    `- Point 3 — address the strongest counter-argument`,
    ``,
    `## 4. Implications`,
    `- What changes if the thesis is true`,
    `- Practical recommendations`,
    ``,
    `## 5. Conclusion`,
    `- Restate thesis in the light of the evidence`,
    `- Call to action / open question for future work`,
  ].join('\n')
}
