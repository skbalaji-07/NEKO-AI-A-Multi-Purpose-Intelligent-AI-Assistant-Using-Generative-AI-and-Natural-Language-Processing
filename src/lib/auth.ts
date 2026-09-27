import { load, save, uid } from './store'
import type { Session } from './types'

interface StoredUser {
  id: string
  name: string
  email: string
  salt: string
  hash: string
  created: number
}

const USERS_KEY = 'neko:users'
const SESSION_KEY = 'neko:session'
const SECRET_KEY = 'neko:device-secret'
const WEEK = 7 * 24 * 3600 * 1000

function deviceSecret(): string {
  let s = localStorage.getItem(SECRET_KEY)
  if (!s) {
    s = uid() + uid() + uid()
    localStorage.setItem(SECRET_KEY, s)
  }
  return s
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Salted, iterated SHA-256 (demo-mode analogue of bcrypt on the FastAPI backend). */
async function hashPassword(password: string, salt: string): Promise<string> {
  let h = `${salt}:${password}`
  for (let i = 0; i < 600; i++) h = await sha256Hex(h)
  return h
}

async function signToken(payload: object): Promise<string> {
  const body = btoa(JSON.stringify(payload))
  const sig = await sha256Hex(body + deviceSecret())
  return `${body}.${sig.slice(0, 32)}`
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<Session> {
  const users = load<Record<string, StoredUser>>(USERS_KEY, {})
  const key = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) throw new Error('Enter a valid email address.')
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')
  if (users[key]) throw new Error('An account with this email already exists.')
  const salt = uid() + uid()
  const user: StoredUser = {
    id: uid(),
    name: name.trim() || key.split('@')[0],
    email: key,
    salt,
    hash: await hashPassword(password, salt),
    created: Date.now(),
  }
  users[key] = user
  save(USERS_KEY, users)
  return createSession(user)
}

export async function login(email: string, password: string): Promise<Session> {
  const users = load<Record<string, StoredUser>>(USERS_KEY, {})
  const user = users[email.trim().toLowerCase()]
  if (!user) throw new Error('No account found for this email.')
  const hash = await hashPassword(password, user.salt)
  if (hash !== user.hash) throw new Error('Incorrect password.')
  return createSession(user)
}

async function createSession(user: StoredUser): Promise<Session> {
  const exp = Date.now() + WEEK
  const token = await signToken({ sub: user.id, exp })
  const session: Session = {
    token,
    userId: user.id,
    name: user.name,
    email: user.email,
    exp,
  }
  save(SESSION_KEY, session)
  return session
}

export function getSession(): Session | null {
  const s = load<Session | null>(SESSION_KEY, null)
  if (!s) return null
  if (Date.now() > s.exp) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  return s
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export async function demoSession(): Promise<Session> {
  const users = load<Record<string, StoredUser>>(USERS_KEY, {})
  const email = 'demo@neko.ai'
  if (!users[email]) {
    return register('Demo Explorer', email, 'neko-demo-2026')
  }
  return login(email, 'neko-demo-2026')
}
