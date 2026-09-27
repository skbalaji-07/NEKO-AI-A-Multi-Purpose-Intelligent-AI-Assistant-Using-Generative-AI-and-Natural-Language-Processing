export interface Fact {
  id: string
  kind: 'name' | 'study' | 'work' | 'like' | 'dislike' | 'goal' | 'fact'
  text: string
  ts: number
}

export interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: string
  confidence?: number
  ts: number
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMsg[]
  created: number
  updated: number
}

export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  summary?: string
  created: number
  updated: number
}

export interface SubTask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  done: boolean
  priority: 'low' | 'medium' | 'high'
  due?: string
  subtasks: SubTask[]
  created: number
}

export interface Doc {
  id: string
  name: string
  text: string
  created: number
}

export interface Card {
  id: string
  front: string
  back: string
  score: number
}

export interface Deck {
  id: string
  name: string
  cards: Card[]
  created: number
}

export interface Activity {
  id: string
  kind: string
  label: string
  ts: number
}

export interface Session {
  token: string
  userId: string
  name: string
  email: string
  exp: number
}
