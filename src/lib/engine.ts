/** NEKO Intelligence Engine — intent classification, memory extraction,
 *  and specialised response handlers. Every reply is tagged with its route. */

import { convertUnits, evaluateExpr, formatNumber } from './matheval'
import { findConcept, relatedConcepts } from './knowledge'
import { summarize, topKeywords } from './nlp'
import { explainCodeMarkdown, matchSnippet } from './coding'
import { uid } from './store'
import type { Fact } from './types'

export interface EngineAction {
  type: 'add_task' | 'add_note'
  payload: string
}

export interface EngineResult {
  text: string
  intent: string
  confidence: number
  memoryAdds: Fact[]
  action?: EngineAction
}

export interface EngineContext {
  memory: Fact[]
  userName?: string
}

/* ---------------------------- memory extraction ---------------------------- */

const clean = (s: string) => s.trim().replace(/[.!?,;]+$/, '').slice(0, 90)

export function extractFacts(input: string): Fact[] {
  const facts: Fact[] = []
  const now = Date.now()
  const push = (kind: Fact['kind'], text: string) => facts.push({ id: uid(), kind, text, ts: now })

  let m = input.match(/(?:my name is|i am called|call me)\s+([a-zA-Z][a-zA-Z'-]{1,24})/i)
  if (m) push('name', `Name: ${m[1][0].toUpperCase() + m[1].slice(1)}`)

  m = input.match(/i(?:'m| am)\s+(?:currently\s+)?(?:studying|learning|majoring in|revising)\s+(.{2,60})/i)
  if (m) push('study', `Studying: ${clean(m[1])}`)

  m = input.match(/i\s+(?:work|am working)\s+(?:as|at|on)\s+(.{2,60})/i)
  if (m) push('work', `Work: ${clean(m[1])}`)

  m = input.match(/i\s+(?:like|love|enjoy|prefer)\s+(.{2,60})/i)
  if (m) push('like', `Likes: ${clean(m[1])}`)

  m = input.match(/i\s+(?:hate|dislike|can't stand)\s+(.{2,60})/i)
  if (m) push('dislike', `Dislikes: ${clean(m[1])}`)

  m = input.match(/(?:my goal is(?: to)?|i want to)\s+(.{2,80})/i)
  if (m) push('goal', `Goal: ${clean(m[1])}`)

  m = input.match(/^remember(?:\s+that)?\s+(.{3,140})/i)
  if (m) push('fact', clean(m[1]))

  return facts
}

function memoryName(memory: Fact[], fallback?: string): string | undefined {
  const f = memory.find((x) => x.kind === 'name')
  if (f) return f.text.replace(/^Name:\s*/i, '')
  return fallback?.split(' ')[0]
}

function personalNote(memory: Fact[]): string {
  const interesting = memory.filter((f) => f.kind === 'study' || f.kind === 'goal')
  if (!interesting.length) return ''
  const f = interesting[0]
  return `\n\n_🐾 Remembering: ${f.text.toLowerCase()} — I tailor answers with that in mind._`
}

/* -------------------------------- handlers -------------------------------- */

const JOKES = [
  "Why don't neural networks ever get lost? Because they always follow the *gradient*. 🐾",
  'I asked a cat to review my code. It said it had *purr-formance issues*.',
  "Why was the transformer so popular at parties? It paid **attention** to everyone at once.",
  'My model isn’t overfitting — it just has *strong opinions about the training set*.',
  "There are 10 kinds of people: those who understand binary, and those who don't.",
  'Schrödinger’s bug: it only exists when the professor is watching your demo.',
]

function studyPlan(topic: string): string {
  const t = topic.trim() || 'your subject'
  return [
    `Here's a focused **4-week study plan for ${t}**:`,
    ``,
    `**Week 1 — Foundations**`,
    `- Map the syllabus: list every sub-topic of ${t}`,
    `- 2× 45-min deep-work blocks daily (Pomodoro in the Study module)`,
    `- Turn each concept into a flashcard as you read`,
    ``,
    `**Week 2 — Active recall**`,
    `- Review flashcards daily — mark weak cards, re-test them next day`,
    `- Teach one concept aloud per day (Feynman technique)`,
    `- Solve 5 past-paper / practice problems per session`,
    ``,
    `**Week 3 — Application**`,
    `- Build a tiny project or worked example using ${t}`,
    `- Attempt problems *without* notes; review only after committing to an answer`,
    ``,
    `**Week 4 — Simulation & gaps**`,
    `- 2 full timed mock exams`,
    `- Triage: spend 80% of time on your 20% weakest topics`,
    `- Light review + sleep before the real thing`,
    ``,
    `💡 Paste your notes into **Study → Flashcard generator** and I'll build a quiz deck automatically.`,
  ].join('\n')
}

/* --------------------------------- engine --------------------------------- */

export function nekoRespond(rawInput: string, ctx: EngineContext): EngineResult {
  const input = rawInput.trim()
  const lower = input.toLowerCase()
  const memoryAdds = extractFacts(input)
  const name = memoryName(ctx.memory, ctx.userName)
  const R = (intent: string, confidence: number, text: string, action?: EngineAction): EngineResult => ({
    text, intent, confidence, memoryAdds, action,
  })

  /* -- productivity actions -- */
  let m = input.match(/^(?:add|create|new)\s+(?:a\s+)?task[:\s]+(.+)/i) ?? input.match(/^remind me to\s+(.+)/i)
  if (m) {
    const title = clean(m[1])
    return R('action.add_task', 0.97, `✅ Task created: **${title}**\n\nYou'll find it in the **Tasks** module — I set priority to medium. Want a breakdown into subtasks? Open the task and hit *AI breakdown*.`, { type: 'add_task', payload: title })
  }
  m = input.match(/^(?:add|create|new|save)\s+(?:a\s+)?note[:\s]+(.+)/i)
  if (m) {
    const body = m[1].trim()
    return R('action.add_note', 0.97, `📝 Note saved: “${body.slice(0, 80)}${body.length > 80 ? '…' : ''}”\n\nIt's in your **Notes** module, tagged \`from-chat\`.`, { type: 'add_note', payload: body })
  }

  /* -- memory -- */
  if (/what do you know about me|what('s| is) my name|show (my )?memory|my profile/i.test(lower)) {
    if (!ctx.memory.length && !memoryAdds.length) {
      return R('memory.recall', 0.9, `I don't have any memories about you yet. Tell me things like:\n- \`My name is Alex\`\n- \`I'm studying computer science\`\n- \`Remember that my thesis deadline is May 10\``)
    }
    const facts = [...memoryAdds, ...ctx.memory].slice(0, 10)
    return R('memory.recall', 0.95, `Here's what I remember about you:\n\n${facts.map((f) => `- ${f.text}`).join('\n')}\n\nYou can manage or erase these anytime in **Settings → AI Memory**.`)
  }
  if (memoryAdds.length && /^(remember|my name is|call me|i like|i love|i enjoy|i hate|i dislike|i'?m studying|i am studying|i'?m learning|i am learning|my goal is|i want to|i work)/i.test(lower)) {
    return R('memory.store', 0.95, `Got it — stored to memory 🧠\n\n${memoryAdds.map((f) => `- ${f.text}`).join('\n')}\n\nI'll use this to personalise future answers. Manage memories in **Settings**.`)
  }

  /* -- smalltalk -- */
  if (/^(hi|hiya|hello|hey|yo|sup|good\s+(morning|afternoon|evening)|konnichiwa|namaste|hola)\b/i.test(lower) && input.length < 40) {
    return R('smalltalk.greeting', 0.96, `Nyaa~ hello${name ? ` **${name}**` : ''}! 🐾\n\nI'm ready to help. Try:\n- \`Explain overfitting\` — knowledge base\n- \`sqrt(144) * 12\` — math engine\n- \`Convert 68 f to c\` — unit converter\n- \`Create a study plan for DBMS\`\n- \`Add task: finish literature review\``)
  }
  if (/^(thanks|thank you|thx|ty)\b/i.test(lower)) {
    return R('smalltalk.thanks', 0.95, `You're welcome${name ? `, ${name}` : ''}! *purrs contentedly* 🐱 Anything else — documents, code, data, career — I'm all ears (literally, they're on top of my head).`)
  }
  if (/^(bye|goodbye|see you|cya|good night)\b/i.test(lower)) {
    return R('smalltalk.farewell', 0.95, `Sayonara${name ? `, ${name}` : ''}! 🐾 I'll keep your workspace warm. Your data stays safely stored — pick up right where you left off.`)
  }
  if (/how are you|how's it going|how are things/i.test(lower)) {
    return R('smalltalk.checkin', 0.9, `Running at a purr-fect 100% — all 9 intent routes online, memory engaged, zero hairballs in the pipeline. 🐱‍💻\n\nHow can I help you today?`)
  }
  if (/\bjoke\b/i.test(lower)) {
    return R('smalltalk.joke', 0.92, JOKES[Math.floor(Math.random() * JOKES.length)])
  }
  if (/^(help|what can you do|capabilities|features)\b/i.test(lower)) {
    return R('system.help', 0.97, [
      `Here's my skill map — each message is routed to a specialised handler:`,
      ``,
      `| Intent | Try |`, `|---|---|`,
      `| 🧠 Knowledge | \`Explain transformers\` · \`What is RAG?\` |`,
      `| 🔢 Math | \`(1200 * 1.18) / 4\` · \`sqrt(2)^10\` |`,
      `| 📏 Units | \`Convert 10 km to miles\` |`,
      `| ✍️ Summarise | \`Summarize: <paste text>\` |`,
      `| 💻 Code | \`Write a debounce function\` · paste code to explain |`,
      `| 📚 Study | \`Study plan for operating systems\` |`,
      `| ✅ Actions | \`Add task: …\` · \`Save note: …\` |`,
      `| 👤 Memory | \`Remember that…\` · \`What do you know about me?\` |`,
      ``,
      `Beyond chat, explore the sidebar: **Documents** (summarise + Q&A), **Data Lab** (CSV analytics), **Career**, **Writing**, **Research** (live Wikipedia) and more.`,
    ].join('\n'))
  }
  if (/what time|what.*date|what day is/i.test(lower) || /^(time|date)\??$/.test(lower)) {
    const d = new Date()
    return R('utility.datetime', 0.94, `🕒 It's **${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}** on **${d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}** (your local time).`)
  }
  if (/who are you|what are you|your name\??$/i.test(lower)) {
    return R('system.identity', 0.95, `I'm **NEKO** — *Neural Engine for Knowledge & Organisation* 🐱‍💻\n\nA multi-purpose assistant built as a final-year AI/ML project. I combine a rule-and-retrieval intelligence engine (intent routing, TF-IDF, extractive summarisation, a curated knowledge base) with productivity tooling — and I'm architected so a cloud LLM can be swapped in server-side via one adapter. Type \`help\` to see everything I do.`)
  }

  /* -- unit conversion -- */
  m = lower.match(/(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*(?:degrees\s+)?([a-z]+)\s+(?:to|in|into|as)\s+(?:degrees\s+)?([a-z]+)/)
  if (m) {
    const val = parseFloat(m[1])
    const out = convertUnits(val, m[2], m[3])
    if (out !== null) {
      return R('utility.convert', 0.96, `📏 **${formatNumber(val)} ${m[2]}** = **${formatNumber(parseFloat(out.toFixed(4)))} ${m[3]}**\n\n_Handled deterministically by the unit engine — no LLM guessing, no rounding drift._`)
    }
  }

  /* -- math -- */
  const mathCandidate = (() => {
    if (/^[\d\s+\-*/^%.()×÷−]+$/.test(input) && /\d/.test(input)) return input
    const mm = input.match(/^(?:calc(?:ulate)?|compute|solve|evaluate|what is|what's)\s+(.+?)\??$/i)
    if (mm && /[\d]/.test(mm[1]) && /^[\d\s+\-*/^%.()×÷−a-z]+$/i.test(mm[1])) return mm[1]
    if (/^[a-z]+\(.+\)[\d\s+\-*/^%.()]*$/i.test(input)) return input
    return null
  })()
  if (mathCandidate) {
    const pct = mathCandidate.match(/(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i) ?? lower.match(/(-?\d+(?:\.\d+)?)\s*(?:percent|%)\s*of\s*(-?\d+(?:\.\d+)?)/i)
    if (pct) {
      const v = (parseFloat(pct[1]) / 100) * parseFloat(pct[2])
      return R('utility.math', 0.97, `🧮 **${pct[1]}% of ${formatNumber(parseFloat(pct[2]))}** = **${formatNumber(parseFloat(v.toFixed(6)))}**`)
    }
    const v = evaluateExpr(mathCandidate)
    if (v !== null) {
      return R('utility.math', 0.97, `🧮 \`${mathCandidate.trim()}\` = **${formatNumber(parseFloat(v.toPrecision(12)))}**\n\n_Parsed by a recursive-descent evaluator (no \`eval\`, injection-safe). Supports \`+ - * / % ^\`, parentheses and \`sqrt sin cos tan log ln abs round pi e\`._`)
    }
  }
  const pctLoose = lower.match(/(-?\d+(?:\.\d+)?)\s*(?:percent|%)\s*of\s*(-?\d+(?:\.\d+)?)/)
  if (pctLoose) {
    const v = (parseFloat(pctLoose[1]) / 100) * parseFloat(pctLoose[2])
    return R('utility.math', 0.95, `🧮 **${pctLoose[1]}% of ${formatNumber(parseFloat(pctLoose[2]))}** = **${formatNumber(parseFloat(v.toFixed(6)))}**`)
  }

  /* -- summarisation -- */
  m = input.match(/^(?:summari[sz]e|tl;?dr)[:\s]+([\s\S]+)/i)
  if (m) {
    const body = m[1].trim()
    if (body.length < 200) {
      return R('nlp.summarize', 0.8, `That text is quite short (${body.length} chars) — a summary wouldn't compress much. Paste a longer passage after \`summarize:\`, or upload a full document in the **Documents** module for summarisation, keywords and Q&A.`)
    }
    const sum = summarize(body, Math.max(2, Math.min(4, Math.round(body.length / 500))))
    const kws = topKeywords(body, 6)
    return R('nlp.summarize', 0.93, `**📄 Extractive summary** (${body.split(/\s+/).length} → ${sum.split(/\s+/).length} words):\n\n> ${sum}\n\n**Key terms:** ${kws.map((k) => `\`${k}\``).join(' ')}\n\n_Method: frequency-scored sentence extraction with position bonus — same family of algorithms as TextRank._`)
  }

  /* -- coding -- */
  const codeBlock = input.match(/```(?:\w+)?\n?([\s\S]+?)```/)
  if (codeBlock || (/\n/.test(input) && /\b(def |function |const |class |import |#include|print\(|console\.log)/.test(input))) {
    const code = codeBlock ? codeBlock[1] : input
    return R('code.explain', 0.9, `Let me read through this… 🐾\n\n${explainCodeMarkdown(code)}\n\n_Want deeper help? The **Coding** module has a live JS runner and a snippet library._`)
  }
  if (/\b(write|generate|create|give me|show me)\b.*\b(function|code|script|snippet|program|component|query|endpoint|hook)\b/i.test(lower) || /debounce|fibonacci|quicksort|binary search|palindrome/.test(lower)) {
    const snip = matchSnippet(lower)
    if (snip) {
      return R('code.generate', 0.88, `Here's a **${snip.title}** (${snip.lang}):\n\n\`\`\`${snip.lang}\n${snip.code}\n\`\`\`\n\n💡 ${snip.note}${personalNote(ctx.memory)}`)
    }
    return R('code.generate', 0.7, `I can generate from my template library — try asking for: **fibonacci**, **quicksort**, **binary search**, **debounce**, **fetch wrapper**, **palindrome check**, **React hook**, **FastAPI endpoint**, **SQL top-N query**, or **pandas CSV stats**.\n\nOr paste any code (in triple backticks) and I'll analyse and review it. The **Coding** module also runs JavaScript live.`)
  }

  /* -- study -- */
  m = input.match(/(?:study plan|revision plan|learning plan|prepare)\s*(?:for|on)?\s*(.*)/i)
  if (/study plan|revision plan|learning plan/i.test(lower)) {
    return R('study.plan', 0.92, studyPlan(m?.[1] ?? '') + personalNote(ctx.memory))
  }
  if (/quiz me|flashcard|make.*quiz/i.test(lower)) {
    return R('study.route', 0.88, `Let's do it 📚 Head to the **Study** module → paste your notes into the *Flashcard generator*. I'll detect term–definition pairs (or auto-create cloze deletions), build a deck, and quiz you with multiple-choice questions generated from your own material.\n\nThere's also a Pomodoro timer that logs your focus sessions to the dashboard.`)
  }

  /* -- knowledge -- */
  m = input.match(/^(?:what\s+(?:is|are)|define|explain|describe|tell me about|meaning of)\s+(?:a\s+|an\s+|the\s+)?(.+?)\??$/i)
  const conceptQuery = m ? m[1] : null
  if (conceptQuery) {
    const c = findConcept(conceptQuery)
    if (c) {
      const rel = c.related.slice(0, 3).join(' · ')
      return R('knowledge.define', 0.94, `**${c.term}**\n\n${c.def}\n\n**Related concepts:** ${rel}\n\n_Ask me about any of those next — or generate flashcards on this topic in the Study module._${personalNote(ctx.memory)}`)
    }
  }

  /* -- fallback with soft retrieval -- */
  const near = relatedConcepts(input, 3)
  const kws = topKeywords(input, 4)
  const moduleHint = (() => {
    if (/resume|cv|interview|job|career|cover letter/i.test(lower)) return 'The **Career** module rewrites resume bullets, preps interviews by role, and drafts cover letters.'
    if (/essay|paragraph|grammar|tone|rewrite|paraphrase/i.test(lower)) return 'The **Writing** studio analyses readability, flags passive voice, and rewrites tone.'
    if (/csv|dataset|data|chart|statistics|correlation/i.test(lower)) return 'The **Data Lab** ingests CSVs and produces stats, histograms and correlations.'
    if (/pdf|document|file|summar/i.test(lower)) return 'The **Documents** module summarises text files and answers questions about them.'
    if (/wikipedia|research|search|look up/i.test(lower)) return 'The **Research** module runs live Wikipedia search with save-to-notes.'
    return ''
  })()

  const parts: string[] = []
  if (kws.length) {
    parts.push(`I parsed your message (topics: ${kws.map((k) => `\`${k}\``).join(' ')}) but it didn't match a high-confidence route in my local engine.`)
  } else {
    parts.push(`Hmm, that didn't match a high-confidence route in my local engine. 🐾`)
  }
  if (near.length) {
    parts.push(`**Closest concepts I can explain:** ${near.map((c) => `\`${c.term}\``).join(' · ')} — try \`Explain ${near[0].term}\`.`)
  }
  if (moduleHint) parts.push(moduleHint)
  parts.push(`_In production mode, unmatched intents fall through to the configured cloud LLM (server-side key) — see Settings → Engine._ Type \`help\` for my full skill map.`)
  return R('fallback.general', 0.42, parts.join('\n\n'))
}

export const CHAT_SUGGESTIONS = [
  'Explain gradient descent',
  'Calculate 15% of 2400',
  'Convert 5 km to miles',
  'Write a debounce function',
  'Study plan for machine learning',
  'Remember that my exam is on March 3',
  'Add task: finish project report',
  'What do you know about me?',
]
