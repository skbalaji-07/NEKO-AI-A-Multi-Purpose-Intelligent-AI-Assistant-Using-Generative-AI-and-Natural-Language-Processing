/** Coding assistant: language detection, static explanation, JS sandbox runner,
 *  and a generation template library. */

export function detectLanguage(code: string): string {
  if (/^\s*#include\b/m.test(code)) return 'C/C++'
  if (/\b(public|private)\s+(static\s+)?(void|int|String|class)\b/.test(code)) return 'Java'
  if (/^\s*(def |import |from \w+ import|class \w+.*:|if __name__)/m.test(code)) return 'Python'
  if (/\b(SELECT|INSERT INTO|CREATE TABLE|UPDATE)\b/i.test(code) && /\bFROM\b|\bVALUES\b|\bSET\b/i.test(code)) return 'SQL'
  if (/<\/?[a-z][^>]*>/i.test(code) && /className|<div|<span|<html/i.test(code)) return /useState|useEffect|=>/.test(code) ? 'React (JSX/TSX)' : 'HTML'
  if (/\b(interface|type)\s+\w+\s*=?\s*\{|:\s*(string|number|boolean)\b/.test(code)) return 'TypeScript'
  if (/\b(function|const|let|var|=>|console\.log)\b/.test(code)) return 'JavaScript'
  if (/^[\s\S]*\{[\s\S]*:[\s\S]*;[\s\S]*\}/.test(code) && /(color|margin|padding|display)\s*:/.test(code)) return 'CSS'
  return 'Unknown'
}

export interface CodeAnalysis {
  language: string
  lines: number
  functions: string[]
  classes: string[]
  imports: string[]
  loops: number
  conditionals: number
  notes: string[]
}

export function analyzeCode(code: string): CodeAnalysis {
  const language = detectLanguage(code)
  const lines = code.split('\n').filter((l) => l.trim()).length
  const functions: string[] = []
  const classes: string[] = []
  const imports: string[] = []

  for (const m of code.matchAll(/def\s+(\w+)\s*\(/g)) functions.push(m[1] + '()')
  for (const m of code.matchAll(/function\s+(\w+)\s*\(/g)) functions.push(m[1] + '()')
  for (const m of code.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(?[\w\s,{}:]*\)?\s*=>/g)) functions.push(m[1] + '()')
  for (const m of code.matchAll(/class\s+(\w+)/g)) classes.push(m[1])
  for (const m of code.matchAll(/^\s*(?:import\s+.+|from\s+[\w.]+\s+import\s+.+)$/gm)) imports.push(m[0].trim().slice(0, 60))

  const loops = (code.match(/\b(for|while)\b/g) ?? []).length
  const conditionals = (code.match(/\b(if|elif|else if|switch|case)\b/g) ?? []).length

  const notes: string[] = []
  if (/\beval\s*\(/.test(code)) notes.push('⚠️ `eval()` detected — a common injection risk. Prefer parsing or a safe evaluator.')
  if (/\bvar\s+/.test(code) && language.includes('Script')) notes.push('Uses `var` — prefer `const`/`let` for block scoping.')
  if (/except\s*:/.test(code)) notes.push('Bare `except:` swallows all errors — catch specific exceptions.')
  if (/==[^=]/.test(code) && language === 'JavaScript') notes.push('Loose equality `==` found — prefer strict `===`.')
  if (loops >= 2 && /for[\s\S]{0,120}for/.test(code)) notes.push('Nested loops detected — likely O(n²). Consider hashing/sorting if n is large.')
  if (/password|secret|api[_-]?key/i.test(code) && /['"][A-Za-z0-9_\-]{12,}['"]/.test(code)) notes.push('🔒 Possible hardcoded secret — move to environment variables.')
  if (!notes.length) notes.push('No obvious anti-patterns detected. Structure looks clean.')

  return { language, lines, functions: [...new Set(functions)].slice(0, 12), classes, imports: imports.slice(0, 8), loops, conditionals, notes }
}

export function explainCodeMarkdown(code: string): string {
  const a = analyzeCode(code)
  const parts: string[] = []
  parts.push(`**Language detected:** ${a.language} · **${a.lines}** non-empty lines`)
  if (a.imports.length) parts.push(`**Imports/dependencies:**\n${a.imports.map((i) => `- \`${i}\``).join('\n')}`)
  if (a.classes.length) parts.push(`**Classes:** ${a.classes.map((c) => `\`${c}\``).join(', ')}`)
  if (a.functions.length) parts.push(`**Functions defined:** ${a.functions.map((f) => `\`${f}\``).join(', ')}`)
  parts.push(`**Control flow:** ${a.loops} loop(s), ${a.conditionals} conditional branch(es).`)
  parts.push(`**Review notes:**\n${a.notes.map((n) => `- ${n}`).join('\n')}`)
  return parts.join('\n\n')
}

/* ------------------------------- JS runner ------------------------------- */

export interface RunResult {
  logs: string[]
  error?: string
  ms: number
}

export function runJS(code: string): RunResult {
  const logs: string[] = []
  const fake = {
    log: (...a: unknown[]) => logs.push(a.map(fmt).join(' ')),
    warn: (...a: unknown[]) => logs.push('⚠️ ' + a.map(fmt).join(' ')),
    error: (...a: unknown[]) => logs.push('❌ ' + a.map(fmt).join(' ')),
    info: (...a: unknown[]) => logs.push(a.map(fmt).join(' ')),
  }
  function fmt(v: unknown): string {
    if (typeof v === 'object') {
      try {
        return JSON.stringify(v, null, 1)
      } catch {
        return String(v)
      }
    }
    return String(v)
  }
  const start = performance.now()
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function('console', `"use strict";\n${code}`)
    const ret = fn(fake)
    if (ret !== undefined) logs.push('↩ ' + fmt(ret))
    return { logs, ms: Math.round(performance.now() - start) }
  } catch (e) {
    return { logs, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e), ms: Math.round(performance.now() - start) }
  }
}

/* ----------------------------- template library ---------------------------- */

export interface Snippet {
  id: string
  title: string
  lang: string
  tags: string[]
  code: string
  note: string
}

export const SNIPPETS: Snippet[] = [
  {
    id: 'py-fib', title: 'Fibonacci (memoised)', lang: 'python', tags: ['fibonacci', 'recursion', 'dp'],
    code: `from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fib(n: int) -> int:\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint([fib(i) for i in range(10)])`,
    note: 'lru_cache turns the O(2ⁿ) recursion into O(n) via memoisation.',
  },
  {
    id: 'py-quicksort', title: 'Quicksort', lang: 'python', tags: ['sort', 'quicksort', 'algorithm'],
    code: `def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    mid = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + mid + quicksort(right)\n\nprint(quicksort([9, 2, 7, 1, 8, 3]))`,
    note: 'Average O(n log n); readable functional style (not in-place).',
  },
  {
    id: 'js-binary-search', title: 'Binary search', lang: 'javascript', tags: ['search', 'binary', 'algorithm'],
    code: `function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}\n\nconsole.log(binarySearch([1, 3, 5, 7, 9, 11], 7)); // 3`,
    note: 'O(log n) on a sorted array. `>> 1` is a fast integer halve.',
  },
  {
    id: 'js-debounce', title: 'Debounce', lang: 'javascript', tags: ['debounce', 'performance', 'events'],
    code: `function debounce(fn, delay = 300) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\n\nconst onSearch = debounce((q) => console.log('searching:', q), 400);\nonSearch('n'); onSearch('ne'); onSearch('neko'); // logs once: "neko"`,
    note: 'Collapses rapid calls into one — essential for search inputs.',
  },
  {
    id: 'js-fetch', title: 'Fetch with error handling', lang: 'javascript', tags: ['fetch', 'api', 'http', 'async'],
    code: `async function getJSON(url, options = {}) {\n  const res = await fetch(url, {\n    headers: { 'Content-Type': 'application/json' },\n    ...options,\n  });\n  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);\n  return res.json();\n}\n\n// getJSON('/api/notes').then(console.log).catch(console.error);`,
    note: 'fetch() does NOT reject on 4xx/5xx — always check res.ok.',
  },
  {
    id: 'js-palindrome', title: 'Palindrome check', lang: 'javascript', tags: ['palindrome', 'string'],
    code: `function isPalindrome(str) {\n  const s = str.toLowerCase().replace(/[^a-z0-9]/g, '');\n  let i = 0, j = s.length - 1;\n  while (i < j) {\n    if (s[i++] !== s[j--]) return false;\n  }\n  return true;\n}\n\nconsole.log(isPalindrome('A man, a plan, a canal: Panama')); // true`,
    note: 'Two-pointer approach: O(n) time, O(1) extra space after cleaning.',
  },
  {
    id: 'react-hook', title: 'React useLocalStorage hook', lang: 'tsx', tags: ['react', 'hook', 'component', 'localstorage'],
    code: `import { useState } from 'react';\n\nexport function useLocalStorage<T>(key: string, initial: T) {\n  const [value, setValue] = useState<T>(() => {\n    const raw = localStorage.getItem(key);\n    return raw ? (JSON.parse(raw) as T) : initial;\n  });\n  const set = (v: T) => {\n    setValue(v);\n    localStorage.setItem(key, JSON.stringify(v));\n  };\n  return [value, set] as const;\n}`,
    note: 'Lazy initialiser reads storage once; writes stay in sync.',
  },
  {
    id: 'fastapi-endpoint', title: 'FastAPI CRUD endpoint', lang: 'python', tags: ['fastapi', 'api', 'backend', 'endpoint'],
    code: `from fastapi import APIRouter, Depends, HTTPException\nfrom pydantic import BaseModel\n\nrouter = APIRouter(prefix="/notes", tags=["notes"])\n\nclass NoteIn(BaseModel):\n    title: str\n    body: str = ""\n\n@router.post("/", status_code=201)\ndef create_note(payload: NoteIn, user=Depends(get_current_user)):\n    note = Note(**payload.model_dump(), owner_id=user.id)\n    db.add(note); db.commit(); db.refresh(note)\n    return note`,
    note: 'Pydantic validates the body; Depends() injects the authed user.',
  },
  {
    id: 'sql-topn', title: 'SQL: top-N per group', lang: 'sql', tags: ['sql', 'query', 'window'],
    code: `SELECT *\nFROM (\n  SELECT s.*,\n         ROW_NUMBER() OVER (\n           PARTITION BY category\n           ORDER BY revenue DESC\n         ) AS rn\n  FROM sales s\n) ranked\nWHERE rn <= 3;`,
    note: 'Window functions beat correlated subqueries for top-N-per-group.',
  },
  {
    id: 'py-csv-stats', title: 'CSV stats with pandas', lang: 'python', tags: ['data', 'csv', 'pandas', 'analysis'],
    code: `import pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.info())\nprint(df.describe())\nprint(df.isna().sum())            # missing values\nprint(df.corr(numeric_only=True)) # correlations`,
    note: 'The four commands that start every exploratory data analysis.',
  },
]

export function matchSnippet(query: string): Snippet | null {
  const q = query.toLowerCase()
  let best: { s: Snippet; score: number } | null = null
  for (const s of SNIPPETS) {
    let score = 0
    for (const t of s.tags) if (q.includes(t)) score += 2
    if (q.includes(s.lang)) score += 1
    if (score > 0 && (!best || score > best.score)) best = { s, score }
  }
  return best && best.score >= 2 ? best.s : null
}
