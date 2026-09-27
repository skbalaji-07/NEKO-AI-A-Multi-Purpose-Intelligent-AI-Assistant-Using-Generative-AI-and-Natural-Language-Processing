/** Real-time LLM chat client with token streaming (SSE).
 *
 *  Demo deployment talks to a keyless, CORS-enabled OpenAI-compatible
 *  endpoint (text.pollinations.ai) so the hosted app needs NO secret in the
 *  browser. In production the same client points at the bundled FastAPI
 *  backend's /api/chat proxy, whose LLM key lives only in server env vars.
 */

import type { Fact } from './types'

export interface LLMMsg {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const ENDPOINT = 'https://text.pollinations.ai/openai'

export function buildSystemPrompt(memory: Fact[], userName?: string): string {
  const facts = memory.slice(0, 12).map((f) => `- ${f.text}`).join('\n')
  return [
    'You are NEKO — Neural Engine for Knowledge & Organisation — a friendly, sharp, multi-purpose AI assistant inside the NEKO AI web app (a final-year AI/ML portfolio project).',
    'App modules the user can open from the sidebar: Dashboard, Chat, Research, Documents, Notes, Tasks, Study, Coding, Data Lab, Career, Writing, Settings.',
    'Style: concise and genuinely helpful. Use markdown (headings, lists, tables, fenced code blocks) when it improves clarity. A light cat-themed touch (🐾, "nyaa~") is welcome occasionally, but stay substantive and professional.',
    'Maintain conversation context: refer back to earlier messages in this chat when relevant.',
    userName ? `The user's name is ${userName}.` : '',
    facts ? `Known facts about the user (use them to personalise answers; never invent new ones):\n${facts}` : '',
    'If the user wants to create a task or note, tell them to phrase it exactly as "Add task: ..." or "Save note: ..." — those commands are executed instantly by NEKO\'s deterministic action router.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** Stream a chat completion; calls onToken with the accumulated text after
 *  every token. Resolves with the full reply. Throws on network failure,
 *  timeout or empty output so the caller can fall back to the local engine. */
export async function streamChat({
  messages,
  onToken,
  signal,
}: {
  messages: LLMMsg[]
  onToken: (textSoFar: string) => void
  signal?: AbortSignal
}): Promise<string> {
  const ctrl = new AbortController()
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)
  // Abort if the first visible token hasn't arrived within 25s.
  let firstTokenTimer: number = window.setTimeout(() => ctrl.abort(), 25000)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages, stream: true, private: true }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`)

    let full = ''
    const push = (delta: string) => {
      if (!delta) return
      if (firstTokenTimer) {
        window.clearTimeout(firstTokenTimer)
        firstTokenTimer = 0
      }
      full += delta
      onToken(full)
    }

    const ctype = res.headers.get('content-type') ?? ''
    if (!res.body || (!ctype.includes('event-stream') && ctype.includes('json'))) {
      // Provider fell back to a non-streamed JSON completion.
      const data = await res.json()
      push(String(data?.choices?.[0]?.message?.content ?? ''))
    } else {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const raw of lines) {
          const line = raw.trim()
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (payload === '[DONE]') break
          try {
            const j = JSON.parse(payload)
            // NOTE: some models also stream `delta.reasoning` — deliberately
            // ignored; only user-visible `content` tokens are rendered.
            push(String(j?.choices?.[0]?.delta?.content ?? ''))
          } catch {
            /* partial JSON split across chunks — recovered on next line */
          }
        }
      }
    }

    if (!full.trim()) throw new Error('empty LLM response')
    return full.trim()
  } finally {
    if (firstTokenTimer) window.clearTimeout(firstTokenTimer)
    signal?.removeEventListener('abort', onAbort)
  }
}
