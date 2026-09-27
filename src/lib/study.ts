/** Flashcard + quiz generation from raw notes. */

import { splitSentences, tokenize, wordFreq, STOP } from './nlp'
import { uid } from './store'
import type { Card } from './types'

/** Parse "Term: definition" / "Term - definition" / "Q: ... A: ..." pairs;
 *  fall back to cloze deletion on informative sentences. */
export function generateCards(text: string, maxCards = 20): Card[] {
  const cards: Card[] = []
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // Q/A pairs
  for (let i = 0; i < lines.length - 1; i++) {
    const q = lines[i].match(/^q[:.)]\s*(.+)/i)
    const a = lines[i + 1].match(/^a[:.)]\s*(.+)/i)
    if (q && a) {
      cards.push({ id: uid(), front: q[1], back: a[1], score: 0 })
      i++
    }
  }

  // Term : definition
  for (const line of lines) {
    if (cards.length >= maxCards) break
    const m = line.replace(/^[-*•\d.)\s]+/, '').match(/^([A-Za-z][\w\s()/&+-]{1,48}?)\s*[:—–-]\s+(.{8,})$/)
    if (m && !/^https?/i.test(m[1])) {
      const front = m[1].trim()
      if (!cards.some((c) => c.front.toLowerCase() === front.toLowerCase())) {
        cards.push({ id: uid(), front, back: m[2].trim(), score: 0 })
      }
    }
  }

  // Cloze fallback
  if (cards.length < 4) {
    const sentences = splitSentences(text).filter((s) => s.split(' ').length >= 6)
    const freq = wordFreq(tokenize(text))
    for (const s of sentences) {
      if (cards.length >= maxCards) break
      const words = s.split(/\s+/)
      let bestWord = ''
      let bestScore = 0
      for (const w of words) {
        const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (cleanW.length < 4 || STOP.has(cleanW)) continue
        const score = (freq.get(cleanW) ?? 0) + cleanW.length * 0.1
        if (score > bestScore) {
          bestScore = score
          bestWord = w
        }
      }
      if (bestWord) {
        const front = s.replace(bestWord, '_____')
        const answer = bestWord.replace(/[^a-zA-Z0-9-]/g, '')
        if (front !== s && !cards.some((c) => c.back.toLowerCase() === answer.toLowerCase())) {
          cards.push({ id: uid(), front: `Fill the blank: “${front}”`, back: answer, score: 0 })
        }
      }
    }
  }

  return cards.slice(0, maxCards)
}

export interface QuizQ {
  question: string
  options: string[]
  answer: number
}

const GENERIC_DISTRACTORS = [
  'A technique for compressing model weights after training',
  'The process of normalising inputs before the first layer',
  'A metric that only applies to unsupervised problems',
  'A deprecated approach no longer used in practice',
]

export function generateQuiz(cards: Card[], n = 6): QuizQ[] {
  const pool = [...cards].sort(() => Math.random() - 0.5).slice(0, n)
  return pool.map((card) => {
    const others = cards.filter((c) => c.id !== card.id).map((c) => c.back)
    const distractors = [...others].sort(() => Math.random() - 0.5).slice(0, 3)
    while (distractors.length < 3) {
      const g = GENERIC_DISTRACTORS[distractors.length % GENERIC_DISTRACTORS.length]
      if (!distractors.includes(g)) distractors.push(g)
    }
    const options = [...distractors, card.back].sort(() => Math.random() - 0.5)
    return {
      question: card.front,
      options,
      answer: options.indexOf(card.back),
    }
  })
}
