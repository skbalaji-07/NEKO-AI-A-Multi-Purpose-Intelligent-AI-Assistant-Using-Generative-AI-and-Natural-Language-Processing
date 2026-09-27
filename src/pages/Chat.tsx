import { useEffect, useRef, useState } from 'react'
import { Brain, MessagesSquare, Plus, Send, Sparkles, Trash2, Zap } from 'lucide-react'
import { useUser } from '../App'
import { CHAT_SUGGESTIONS, nekoRespond, type EngineResult } from '../lib/engine'
import { buildSystemPrompt, streamChat, type LLMMsg } from '../lib/llm'
import { Markdown } from '../lib/markdown'
import { addFacts, load, logActivity, quickAddNote, quickAddTask, uid, useCollection, userKey } from '../lib/store'
import type { ChatMsg, Conversation, Fact } from '../lib/types'
import { Button, NekoLogo, cn } from '../components/ui'

interface TypingState {
  convId: string
  full: string
  shown: string
  intent: string
  confidence: number
}

/** Intents kept on the deterministic local router (side-effects & exact math);
 *  everything else streams in real time from the LLM. */
const LOCAL_INTENTS = /^(action\.|memory\.|utility\.|nlp\.summarize|system\.help)/

export default function Chat() {
  const user = useUser()
  const [convs, setConvs] = useCollection<Conversation[]>(user.userId, 'chats', [])
  const [activeId, setActiveId] = useState<string | null>(convs[0]?.id ?? null)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState<TypingState | null>(null)
  const timerRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const memCount = load<Fact[]>(userKey(user.userId, 'memory'), []).length

  const active = convs.find((c) => c.id === activeId) ?? null

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    abortRef.current?.abort()
  }, [])

  function commitAssistant(convId: string, content: string, intent: string, confidence: number) {
    const aMsg: ChatMsg = { id: uid(), role: 'assistant', content, intent, confidence, ts: Date.now() }
    setConvs((prev) => prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, aMsg], updated: Date.now() } : c)))
    setTyping(null)
  }

  /** Word-by-word reveal for instant local-engine answers. */
  function typewrite(convId: string, res: EngineResult) {
    const words = res.text.split(/(\s+)/)
    let idx = 0
    setTyping({ convId, full: res.text, shown: '', intent: res.intent, confidence: res.confidence })
    timerRef.current = window.setInterval(() => {
      idx += 4
      if (idx >= words.length) {
        if (timerRef.current) window.clearInterval(timerRef.current)
        timerRef.current = null
        commitAssistant(convId, res.text, res.intent, res.confidence)
      } else {
        setTyping((t) => (t ? { ...t, shown: words.slice(0, idx).join('') } : t))
      }
    }, 28)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length, typing?.shown])

  function send(textArg?: string) {
    const text = (textArg ?? input).trim()
    if (!text || typing) return
    setInput('')

    const userMsg: ChatMsg = { id: uid(), role: 'user', content: text, ts: Date.now() }
    let convId = activeId
    let priorMessages: ChatMsg[] = []
    if (!convId || !convs.some((c) => c.id === convId)) {
      convId = uid()
      const conv: Conversation = {
        id: convId,
        title: text.slice(0, 44) + (text.length > 44 ? '…' : ''),
        messages: [userMsg],
        created: Date.now(),
        updated: Date.now(),
      }
      setConvs((prev) => [conv, ...prev])
      setActiveId(convId)
    } else {
      priorMessages = convs.find((c) => c.id === convId)?.messages ?? []
      setConvs((prev) => prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, userMsg], updated: Date.now() } : c)))
    }

    const memory = load<Fact[]>(userKey(user.userId, 'memory'), [])
    const res = nekoRespond(text, { memory, userName: user.name })
    if (res.memoryAdds.length) addFacts(user.userId, res.memoryAdds)
    if (res.action?.type === 'add_task') quickAddTask(user.userId, res.action.payload)
    if (res.action?.type === 'add_note') quickAddNote(user.userId, res.action.payload)
    logActivity(user.userId, 'chat', `Asked NEKO: “${text.slice(0, 44)}${text.length > 44 ? '…' : ''}”`)

    // Deterministic routes (actions, memory, math, units, summarise, help)
    // answer instantly from the local intent engine.
    if (LOCAL_INTENTS.test(res.intent)) {
      typewrite(convId, res)
      return
    }

    // Everything else is a real conversation → stream live from the LLM with
    // full context (recent history + memory facts). No key in the browser.
    const history: LLMMsg[] = [
      { role: 'system', content: buildSystemPrompt(memory, user.name) },
      ...[...priorMessages, userMsg].slice(-12).map((m) => ({
        role: m.role,
        content: m.content.slice(0, 4000),
      })),
    ]
    setTyping({ convId, full: '', shown: '', intent: 'llm.stream', confidence: 0.92 })
    const ctrl = new AbortController()
    abortRef.current = ctrl
    streamChat({
      messages: history,
      signal: ctrl.signal,
      onToken: (soFar) => setTyping((t) => (t ? { ...t, shown: soFar } : t)),
    })
      .then((full) => commitAssistant(convId, full, 'llm.stream', 0.92))
      .catch(() => {
        // Offline / provider failure → graceful fallback to the local engine.
        typewrite(convId, { ...res, intent: `${res.intent} · offline-fallback` })
      })
  }

  function removeConv(id: string) {
    setConvs((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const showEmpty = !active || active.messages.length === 0

  return (
    <div className="flex h-full">
      {/* conversation list — desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface/60 md:flex">
        <div className="p-3">
          <Button variant="outline" className="w-full" onClick={() => setActiveId(null)}>
            <Plus size={14} /> New chat
          </Button>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {convs.map((c) => (
            <div
              key={c.id}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] font-semibold transition',
                c.id === activeId ? 'bg-accent/12 text-accent' : 'text-mut hover:bg-surface2 hover:text-ink',
              )}
              onClick={() => setActiveId(c.id)}
            >
              <MessagesSquare size={13} className="shrink-0" />
              <span className="flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeConv(c.id)
                }}
                className="hidden rounded p-0.5 text-mut hover:text-red group-hover:block"
                title="Delete conversation"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {!convs.length && <div className="px-2 py-4 text-[12px] text-mut">No conversations yet.</div>}
        </div>
      </aside>

      {/* main thread */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <div className="flex items-center gap-2 border-b border-line bg-surface/60 px-4 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Sparkles size={15} className="shrink-0 text-accent" />
            <span className="truncate text-[13px] font-bold">{active ? active.title : 'New conversation'}</span>
          </div>
          {/* mobile conv switcher */}
          <select
            className="max-w-[130px] rounded-lg border border-line bg-surface px-2 py-1 text-[12px] md:hidden"
            value={activeId ?? ''}
            onChange={(e) => setActiveId(e.target.value || null)}
          >
            <option value="">+ New chat</option>
            {convs.map((c) => (
              <option key={c.id} value={c.id}>{c.title.slice(0, 24)}</option>
            ))}
          </select>
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-mut sm:inline-flex">
            <Brain size={12} className="text-accent" /> {memCount} memories
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-mut sm:inline-flex">
            <Zap size={12} className="text-green" /> live · streaming
          </span>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mx-auto max-w-2xl space-y-5">
            {showEmpty && !typing && (
              <div className="fade-up flex flex-col items-center pt-10 text-center">
                <NekoLogo size={54} />
                <h2 className="mt-4 font-display text-xl font-bold">What are we working on?</h2>
                <p className="mt-1 max-w-sm text-[13px] text-mut">
                  Every message is classified into an intent and routed to a specialised handler — watch the route tag under each reply.
                </p>
                <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {CHAT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-mut transition hover:border-accent/50 hover:text-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active?.messages.map((m) => (
              <div key={m.id} className={cn('fade-up flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                {m.role === 'assistant' ? (
                  <div className="mt-0.5 shrink-0"><NekoLogo size={28} /></div>
                ) : (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue/15 text-[11px] font-bold text-blue">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className={cn('min-w-0 max-w-[85%]', m.role === 'user' && 'text-right')}>
                  <div
                    className={cn(
                      'inline-block rounded-2xl px-4 py-2.5 text-left',
                      m.role === 'user'
                        ? 'rounded-tr-sm bg-accent text-accent-ink'
                        : 'rounded-tl-sm border border-line bg-surface',
                    )}
                  >
                    {m.role === 'assistant' ? <Markdown text={m.content} /> : <span className="whitespace-pre-wrap text-[13.5px]">{m.content}</span>}
                  </div>
                  {m.role === 'assistant' && m.intent && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-mut/80">
                      <Zap size={10} className="text-accent" />
                      <span className="font-mono">{m.intent}</span>
                      <span>· {Math.round((m.confidence ?? 0) * 100)}% confidence</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && typing.convId === activeId && (
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0"><NekoLogo size={28} /></div>
                <div className="min-w-0 max-w-[85%]">
                  <div className="inline-block rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-2.5">
                    {typing.shown ? (
                      <Markdown text={typing.shown} />
                    ) : (
                      <div className="flex items-center gap-1 py-1">
                        <span className="type-dot" />
                        <span className="type-dot" style={{ animationDelay: '0.15s' }} />
                        <span className="type-dot" style={{ animationDelay: '0.3s' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* composer */}
        <div className="border-t border-line bg-surface/60 p-3">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Message NEKO…  (Enter to send, Shift+Enter for newline)"
              rows={Math.min(5, Math.max(1, input.split('\n').length))}
              className="flex-1 resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] outline-none transition placeholder:text-mut/60 focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
            />
            <Button onClick={() => send()} disabled={!input.trim() || !!typing} className="h-[42px] w-[42px] shrink-0 rounded-xl p-0">
              <Send size={16} />
            </Button>
          </div>
          <div className="mx-auto mt-1.5 max-w-2xl text-center text-[10.5px] text-mut/70">
            Hybrid engine · conversation streams token-by-token from a live LLM with full context &amp; memory · math, units &amp; actions run on deterministic local routes · no API key in the browser
          </div>
        </div>
      </div>
    </div>
  )
}
