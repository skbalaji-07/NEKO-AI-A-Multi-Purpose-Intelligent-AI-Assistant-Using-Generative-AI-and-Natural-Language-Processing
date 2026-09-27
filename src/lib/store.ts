import { useCallback, useState } from 'react'
import type { Activity, Card, Conversation, Deck, Fact, Note, Task } from './types'

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full — ignore */
  }
}

export const userKey = (userId: string, coll: string) => `neko:${userId}:${coll}`

/** React state synced to localStorage, namespaced per user. */
export function useCollection<T>(
  userId: string,
  coll: string,
  initial: T,
): [T, (v: T | ((p: T) => T)) => void] {
  const key = userKey(userId, coll)
  const [state, setState] = useState<T>(() => load(key, initial))
  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setState((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
        save(key, next)
        return next
      })
    },
    [key],
  )
  return [state, set]
}

export function logActivity(userId: string, kind: string, label: string) {
  const key = userKey(userId, 'activity')
  const list = load<Activity[]>(key, [])
  list.unshift({ id: uid(), kind, label, ts: Date.now() })
  save(key, list.slice(0, 60))
}

export function addFacts(userId: string, facts: Fact[]) {
  if (!facts.length) return
  const key = userKey(userId, 'memory')
  const list = load<Fact[]>(key, [])
  for (const f of facts) {
    if (!list.some((x) => x.text.toLowerCase() === f.text.toLowerCase())) {
      list.unshift(f)
    }
  }
  save(key, list.slice(0, 100))
}

export function quickAddTask(userId: string, title: string) {
  const key = userKey(userId, 'tasks')
  const list = load<Task[]>(key, [])
  list.unshift({
    id: uid(),
    title,
    done: false,
    priority: 'medium',
    subtasks: [],
    created: Date.now(),
  })
  save(key, list)
  logActivity(userId, 'task', `Task added from chat: “${title.slice(0, 48)}”`)
}

export function quickAddNote(userId: string, body: string, title?: string) {
  const key = userKey(userId, 'notes')
  const list = load<Note[]>(key, [])
  list.unshift({
    id: uid(),
    title: title ?? body.slice(0, 42) + (body.length > 42 ? '…' : ''),
    body,
    tags: ['from-chat'],
    created: Date.now(),
    updated: Date.now(),
  })
  save(key, list)
  logActivity(userId, 'note', `Note saved from chat`)
}

/* ------------------------------- demo seed ------------------------------- */

const SEED_DOC = `Transformers are a neural network architecture introduced in the 2017 paper "Attention Is All You Need". Unlike recurrent networks, transformers process entire sequences in parallel using a mechanism called self-attention. Self-attention allows every token in a sequence to weigh the relevance of every other token, capturing long-range dependencies efficiently. A transformer block combines multi-head attention, feed-forward layers, residual connections and layer normalization. Positional encodings inject information about token order, since attention itself is permutation-invariant. Transformers scale remarkably well with data and compute, which led directly to large language models such as GPT and BERT. BERT uses only the encoder stack and is trained with masked language modeling, making it strong at understanding tasks. GPT-style models use the decoder stack and are trained autoregressively to predict the next token, making them strong at generation. Fine-tuning adapts a pretrained transformer to a specific task with a small labelled dataset. Retrieval-augmented generation combines a language model with an external knowledge store to reduce hallucination and keep answers grounded in real documents.`

export function seedDemo(userId: string) {
  const flag = userKey(userId, 'seeded')
  if (load<boolean>(flag, false)) return
  save(flag, true)

  const now = Date.now()
  const facts: Fact[] = [
    { id: uid(), kind: 'study', text: 'Studying: final-year AI & ML engineering', ts: now },
    { id: uid(), kind: 'goal', text: 'Goal: build a standout GitHub portfolio', ts: now },
    { id: uid(), kind: 'like', text: 'Likes: clean architecture and cats', ts: now },
  ]
  save(userKey(userId, 'memory'), facts)

  const notes: Note[] = [
    {
      id: uid(),
      title: 'Why intent routing matters',
      body: 'A single monolithic prompt cannot serve every task well. NEKO classifies each message into an intent (math, knowledge, code, memory, summarize…) and routes it to a specialised handler. This mirrors how production assistants use tool-calling and skills.\n\n- Cheaper: trivial intents never hit the LLM\n- Safer: deterministic handlers for math/units\n- Explainable: every reply is tagged with its route',
      tags: ['architecture', 'ai'],
      created: now - 86400000 * 2,
      updated: now - 86400000 * 2,
    },
    {
      id: uid(),
      title: 'Viva prep — questions to expect',
      body: '1. Why FastAPI over Flask? (async, Pydantic validation, OpenAPI docs)\n2. How is the JWT verified? (HMAC signature, expiry claim)\n3. What is extractive vs abstractive summarization?\n4. How does TF-IDF retrieval answer document questions?\n5. How would you swap the local engine for GPT-4? (LLM adapter layer, env-configured)',
      tags: ['exam', 'study'],
      created: now - 86400000,
      updated: now - 86400000,
    },
    {
      id: uid(),
      title: 'Feature backlog',
      body: '- Voice input via Web Speech API\n- PDF parsing with pdf.js\n- Vector embeddings for semantic document search\n- Team workspaces + sharing',
      tags: ['ideas'],
      created: now - 3600000,
      updated: now - 3600000,
    },
  ]
  save(userKey(userId, 'notes'), notes)

  const tasks: Task[] = [
    {
      id: uid(),
      title: 'Record 3-minute project demo video',
      done: false,
      priority: 'high',
      due: new Date(now + 86400000 * 2).toISOString().slice(0, 10),
      subtasks: [
        { id: uid(), title: 'Write demo script', done: true },
        { id: uid(), title: 'Screen-record core flows', done: false },
        { id: uid(), title: 'Edit + upload', done: false },
      ],
      created: now - 86400000,
    },
    {
      id: uid(),
      title: 'Finish system architecture diagram',
      done: true,
      priority: 'medium',
      subtasks: [],
      created: now - 86400000 * 3,
    },
    {
      id: uid(),
      title: 'Deploy FastAPI backend to Render',
      done: false,
      priority: 'high',
      subtasks: [],
      created: now - 7200000,
    },
    {
      id: uid(),
      title: 'Revise transformer attention math',
      done: false,
      priority: 'low',
      subtasks: [],
      created: now - 3600000,
    },
  ]
  save(userKey(userId, 'tasks'), tasks)

  const deck: Deck = {
    id: uid(),
    name: 'ML Fundamentals',
    created: now,
    cards: (
      [
        ['Overfitting', 'When a model memorises training data noise and fails to generalise to unseen data. Fix with regularisation, dropout, more data or early stopping.'],
        ['Gradient descent', 'Iterative optimisation that updates parameters in the direction of the negative gradient of the loss, scaled by a learning rate.'],
        ['Precision vs Recall', 'Precision = TP/(TP+FP): how many predicted positives are correct. Recall = TP/(TP+FN): how many actual positives were found.'],
        ['Self-attention', 'Mechanism where each token computes weighted relevance over all other tokens, enabling parallel long-range context modelling.'],
        ['TF-IDF', 'Term frequency × inverse document frequency. Scores how important a word is to a document relative to a corpus.'],
        ['Regularisation', 'Techniques (L1, L2, dropout) that constrain model complexity to reduce overfitting.'],
      ] as const
    ).map(([front, back]) => ({ id: uid(), front, back, score: 0 })),
  }
  save(userKey(userId, 'decks'), [deck])

  save(userKey(userId, 'docs'), [
    { id: uid(), name: 'transformers-primer.txt', text: SEED_DOC, created: now },
  ])

  const conv: Conversation = {
    id: uid(),
    title: 'Welcome to NEKO',
    created: now,
    updated: now,
    messages: [
      {
        id: uid(),
        role: 'assistant',
        content:
          "**Nyaa~ welcome to NEKO AI!** 🐾 I'm your multi-purpose assistant.\n\nTry asking me things like:\n- `Explain gradient descent`\n- `Calculate 15% of 2400`\n- `Convert 5 km to miles`\n- `Remember that my exam is on March 3`\n- `Add task: submit final report`\n\nEvery reply is routed through my **intent classifier** — you'll see the route tag under each answer.",
        intent: 'system.welcome',
        confidence: 1,
        ts: now,
      },
    ],
  }
  save(userKey(userId, 'chats'), [conv])

  const activity: Activity[] = [
    { id: uid(), kind: 'system', label: 'Workspace created — demo data seeded', ts: now },
  ]
  save(userKey(userId, 'activity'), activity)

  save(userKey(userId, 'study'), { sessions: 3, minutes: 75 })
}

export type { Card }
