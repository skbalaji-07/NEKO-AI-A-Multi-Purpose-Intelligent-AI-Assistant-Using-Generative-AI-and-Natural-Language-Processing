import { useEffect, useRef, useState } from 'react'
import { BookOpenCheck, Check, GraduationCap, Layers, Pause, Play, Plus, RotateCcw, Shuffle, Sparkles, Timer, Trash2, X } from 'lucide-react'
import { useUser } from '../App'
import { generateCards, generateQuiz, type QuizQ } from '../lib/study'
import { load, logActivity, save, uid, useCollection, userKey } from '../lib/store'
import type { Deck } from '../lib/types'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Segmented, Textarea, cn } from '../components/ui'

const SAMPLE_NOTES = `Overfitting: when a model memorises training noise and fails on unseen data.
Regularisation: L1/L2 penalties or dropout that constrain model complexity.
Gradient descent: iterative optimisation stepping against the loss gradient.
Learning rate: the step size of each gradient update.
Precision: fraction of predicted positives that are actually positive.
Recall: fraction of actual positives that the model successfully finds.`

export default function Study() {
  const user = useUser()
  const [tab, setTab] = useState<'cards' | 'quiz' | 'pomodoro'>('cards')
  const [decks, setDecks] = useCollection<Deck[]>(user.userId, 'decks', [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Study"
        subtitle="Paste notes → get flashcards → get quizzed on your own material. Plus a focus timer that feeds the dashboard."
        actions={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'cards', label: <span className="flex items-center gap-1.5"><Layers size={13} /> Flashcards</span> },
              { value: 'quiz', label: <span className="flex items-center gap-1.5"><BookOpenCheck size={13} /> Quiz</span> },
              { value: 'pomodoro', label: <span className="flex items-center gap-1.5"><Timer size={13} /> Pomodoro</span> },
            ]}
          />
        }
      />
      {tab === 'cards' && <Flashcards decks={decks} setDecks={setDecks} />}
      {tab === 'quiz' && <Quiz decks={decks} />}
      {tab === 'pomodoro' && <Pomodoro />}
    </div>
  )
}

/* -------------------------------- flashcards ------------------------------- */

function Flashcards({ decks, setDecks }: { decks: Deck[]; setDecks: (f: (p: Deck[]) => Deck[]) => void }) {
  const user = useUser()
  const [source, setSource] = useState('')
  const [deckName, setDeckName] = useState('')
  const [activeDeck, setActiveDeck] = useState<string | null>(decks[0]?.id ?? null)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [notice, setNotice] = useState('')

  const deck = decks.find((d) => d.id === activeDeck) ?? null
  const card = deck?.cards[idx % Math.max(1, deck.cards.length)]

  function generate() {
    const cards = generateCards(source)
    if (!cards.length) {
      setNotice('Could not extract cards — try “Term: definition” lines or longer sentences.')
      return
    }
    const d: Deck = { id: uid(), name: deckName.trim() || `Deck ${decks.length + 1}`, cards, created: Date.now() }
    setDecks((p) => [d, ...p])
    setActiveDeck(d.id)
    setIdx(0)
    setFlipped(false)
    setSource('')
    setDeckName('')
    setNotice(`Generated ${cards.length} cards — detected ${cards.some((c) => c.front.startsWith('Fill the blank')) ? 'cloze deletions' : 'term–definition pairs'}.`)
    logActivity(user.userId, 'study', `Generated deck “${d.name}” (${cards.length} cards)`)
  }

  function mark(known: boolean) {
    if (!deck || !card) return
    setDecks((p) =>
      p.map((d) =>
        d.id === deck.id
          ? { ...d, cards: d.cards.map((c) => (c.id === card.id ? { ...c, score: c.score + (known ? 1 : -1) } : c)) }
          : d,
      ),
    )
    setFlipped(false)
    setIdx((i) => i + 1)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* generator */}
      <Card className="lg:col-span-2">
        <div className="mb-2 flex items-center gap-2 font-display text-[14px] font-bold"><Sparkles size={15} className="text-accent" /> Flashcard generator</div>
        <p className="mb-2 text-[12px] text-mut">Paste study notes. NEKO detects <code className="font-mono text-accent">Term: definition</code> pairs or auto-builds cloze (fill-the-blank) cards from informative sentences.</p>
        <Textarea rows={8} value={source} onChange={(e) => setSource(e.target.value)} placeholder={'Overfitting: when a model memorises training noise…\nRecall: fraction of actual positives found…'} />
        <div className="mt-2 flex gap-2">
          <Input value={deckName} onChange={(e) => setDeckName(e.target.value)} placeholder="Deck name" />
          <Button onClick={generate} disabled={!source.trim()} className="shrink-0"><Plus size={14} /> Generate</Button>
        </div>
        <button className="mt-2 text-[11.5px] font-bold text-accent hover:underline" onClick={() => setSource(SAMPLE_NOTES)}>Load sample notes</button>
        {notice && <div className="mt-2 rounded-xl border border-line bg-surface2/60 px-3 py-2 text-[12px] text-mut">{notice}</div>}

        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-mut">Your decks</div>
          <div className="space-y-1">
            {decks.map((d) => (
              <div key={d.id} className={cn('group flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] font-semibold', d.id === activeDeck ? 'bg-accent/12 text-accent' : 'text-mut hover:bg-surface2')} onClick={() => { setActiveDeck(d.id); setIdx(0); setFlipped(false) }}>
                <GraduationCap size={13} />
                <span className="flex-1 truncate">{d.name}</span>
                <Badge tone="mut">{d.cards.length}</Badge>
                <button className="hidden text-mut hover:text-red group-hover:block" onClick={(e) => { e.stopPropagation(); setDecks((p) => p.filter((x) => x.id !== d.id)); if (activeDeck === d.id) setActiveDeck(null) }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {!decks.length && <div className="text-[12px] text-mut">No decks yet.</div>}
          </div>
        </div>
      </Card>

      {/* review */}
      <div className="lg:col-span-3">
        {deck && card ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-mut">
              <span>{deck.name} · card {(idx % deck.cards.length) + 1}/{deck.cards.length}</span>
              <button className="flex items-center gap-1 hover:text-accent" onClick={() => { setDecks((p) => p.map((d) => d.id === deck.id ? { ...d, cards: [...d.cards].sort(() => Math.random() - 0.5) } : d)); setIdx(0); setFlipped(false) }}>
                <Shuffle size={12} /> shuffle
              </button>
            </div>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center shadow-sm transition hover:border-accent/50"
            >
              <div className="mb-2 text-[10.5px] font-bold uppercase tracking-widest text-mut">{flipped ? 'Answer' : 'Prompt · click to flip'}</div>
              <div className={cn('max-w-lg text-[15px] leading-relaxed', flipped ? 'text-accent font-semibold' : 'font-display font-bold text-lg')}>
                {flipped ? card.back : card.front}
              </div>
              {card.score !== 0 && (
                <div className="mt-3"><Badge tone={card.score > 0 ? 'green' : 'red'}>{card.score > 0 ? `known ×${card.score}` : `needs work ×${-card.score}`}</Badge></div>
              )}
            </button>
            <div className="mt-3 flex justify-center gap-3">
              <Button variant="danger" onClick={() => mark(false)}><X size={14} /> Again</Button>
              <Button variant="outline" onClick={() => { setFlipped(false); setIdx((i) => i + 1) }}>Skip</Button>
              <Button onClick={() => mark(true)}><Check size={14} /> Got it</Button>
            </div>
          </div>
        ) : (
          <EmptyState icon={<Layers size={20} />} title="No deck selected" body="Generate a deck from your notes on the left — or load the sample notes to see the pipeline in action." />
        )}
      </div>
    </div>
  )
}

/* ----------------------------------- quiz ---------------------------------- */

function Quiz({ decks }: { decks: Deck[] }) {
  const user = useUser()
  const [deckId, setDeckId] = useState<string>(decks[0]?.id ?? '')
  const [quiz, setQuiz] = useState<QuizQ[] | null>(null)
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  const deck = decks.find((d) => d.id === deckId)

  function start() {
    if (!deck) return
    setQuiz(generateQuiz(deck.cards, Math.min(6, deck.cards.length)))
    setQi(0)
    setPicked(null)
    setScore(0)
  }

  if (!decks.length) {
    return <EmptyState icon={<BookOpenCheck size={20} />} title="No decks to quiz from" body="Create a flashcard deck first — the quiz engine turns your own cards into multiple-choice questions with distractors." />
  }

  const q = quiz?.[qi]
  const finished = quiz && qi >= quiz.length

  return (
    <div className="mx-auto max-w-2xl">
      {!quiz && (
        <Card className="text-center">
          <div className="font-display text-lg font-bold">Generated quiz</div>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-mut">NEKO builds multiple-choice questions from your deck — the correct definition hidden among distractors sampled from your other cards.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px]">
              {decks.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.cards.length} cards)</option>)}
            </select>
            <Button onClick={start}><Play size={14} /> Start quiz</Button>
          </div>
        </Card>
      )}

      {quiz && !finished && q && (
        <Card>
          <div className="mb-3 flex items-center justify-between text-[12px] font-semibold text-mut">
            <span>Question {qi + 1} of {quiz.length}</span>
            <Badge tone="accent">score {score}</Badge>
          </div>
          <div className="font-display text-[16px] font-bold leading-snug">{q.question}</div>
          <div className="mt-4 space-y-2">
            {q.options.map((o, oi) => {
              const state = picked === null ? 'idle' : oi === q.answer ? 'correct' : oi === picked ? 'wrong' : 'dim'
              return (
                <button
                  key={oi}
                  disabled={picked !== null}
                  onClick={() => {
                    setPicked(oi)
                    if (oi === q.answer) setScore((s) => s + 1)
                  }}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition',
                    state === 'idle' && 'border-line bg-surface hover:border-accent/60',
                    state === 'correct' && 'border-green bg-green/12 text-green',
                    state === 'wrong' && 'border-red bg-red/12 text-red',
                    state === 'dim' && 'border-line bg-surface opacity-50',
                  )}
                >
                  {o}
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => { setQi((i) => i + 1); setPicked(null) }}>
                {qi + 1 === quiz.length ? 'See results' : 'Next question'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {finished && quiz && (
        <Card className="text-center">
          <div className="font-display text-3xl font-bold text-accent">{score}/{quiz.length}</div>
          <div className="mt-1 text-[13.5px] font-semibold">{score === quiz.length ? 'Purr-fect score! 🐾' : score >= quiz.length * 0.7 ? 'Strong — review the misses and re-run.' : 'Good start — hit the flashcards again, then retry.'}</div>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => setQuiz(null)}><RotateCcw size={14} /> New quiz</Button>
            <Button onClick={() => { start(); logActivity(user.userId, 'study', `Quiz completed: ${score}/${quiz.length}`) }}>Retry deck</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

/* --------------------------------- pomodoro -------------------------------- */

const FOCUS_SECS = 25 * 60
const BREAK_SECS = 5 * 60

function Pomodoro() {
  const user = useUser()
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [left, setLeft] = useState(FOCUS_SECS)
  const [running, setRunning] = useState(false)
  const statsKey = userKey(user.userId, 'study')
  const [stats, setStats] = useState(() => load<{ sessions: number; minutes: number }>(statsKey, { sessions: 0, minutes: 0 }))
  const modeRef = useRef(mode)
  modeRef.current = mode

  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1
        // session complete
        if (modeRef.current === 'focus') {
          setStats((prev) => {
            const next = { sessions: prev.sessions + 1, minutes: prev.minutes + 25 }
            save(statsKey, next)
            return next
          })
          logActivity(user.userId, 'study', 'Completed a 25-min focus session')
          setMode('break')
          return BREAK_SECS
        }
        setMode('focus')
        return FOCUS_SECS
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [running, statsKey, user.userId])

  const total = mode === 'focus' ? FOCUS_SECS : BREAK_SECS
  const pct = ((total - left) / total) * 100
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <div className="mx-auto max-w-md">
      <Card className="text-center">
        <Segmented
          value={mode}
          onChange={(m) => { setMode(m); setRunning(false); setLeft(m === 'focus' ? FOCUS_SECS : BREAK_SECS) }}
          options={[{ value: 'focus', label: 'Focus · 25m' }, { value: 'break', label: 'Break · 5m' }]}
        />
        <div className="relative mx-auto mt-6 flex h-48 w-48 items-center justify-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6" className="stroke-line" />
            <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-accent transition-all" strokeDasharray={`${(pct / 100) * 276.5} 276.5`} />
          </svg>
          <div>
            <div className="font-mono text-4xl font-bold tabular-nums">{mm}:{ss}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-mut">{mode}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start</>}</Button>
          <Button variant="outline" onClick={() => { setRunning(false); setLeft(mode === 'focus' ? FOCUS_SECS : BREAK_SECS) }}><RotateCcw size={14} /> Reset</Button>
        </div>
        <div className="mt-5 flex justify-center gap-6 border-t border-line pt-4 text-[12.5px] text-mut">
          <span><strong className="text-ink">{stats.sessions}</strong> sessions</span>
          <span><strong className="text-ink">{stats.minutes}</strong> focus minutes</span>
        </div>
      </Card>
    </div>
  )
}
