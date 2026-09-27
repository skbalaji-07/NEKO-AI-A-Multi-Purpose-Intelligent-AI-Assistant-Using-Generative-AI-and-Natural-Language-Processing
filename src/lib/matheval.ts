/** Safe recursive-descent math expression evaluator (no eval). */

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string }

const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  log: Math.log10,
  ln: Math.log,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  exp: Math.exp,
}

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E }

function lex(src: string): Tok[] | null {
  const toks: Tok[] = []
  let i = 0
  const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      const v = parseFloat(s.slice(i, j))
      if (Number.isNaN(v)) return null
      toks.push({ t: 'num', v })
      i = j
      continue
    }
    if (/[a-z]/i.test(c)) {
      let j = i
      while (j < s.length && /[a-z]/i.test(s[j])) j++
      toks.push({ t: 'id', v: s.slice(i, j).toLowerCase() })
      i = j
      continue
    }
    if ('+-*/%^()'.includes(c)) {
      toks.push({ t: 'op', v: c })
      i++
      continue
    }
    return null
  }
  return toks
}

export function evaluateExpr(src: string): number | null {
  const toks = lex(src)
  if (!toks || !toks.length) return null
  let pos = 0
  const peek = () => toks[pos]
  const eat = () => toks[pos++]

  function expr(): number {
    let v = term()
    while (peek()?.t === 'op' && (peek().v === '+' || peek().v === '-')) {
      const op = eat().v
      const r = term()
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  function term(): number {
    let v = unary()
    while (peek()?.t === 'op' && ['*', '/', '%'].includes(peek().v as string)) {
      const op = eat().v
      const r = unary()
      v = op === '*' ? v * r : op === '/' ? v / r : v % r
    }
    return v
  }
  function unary(): number {
    if (peek()?.t === 'op' && peek().v === '-') {
      eat()
      return -unary()
    }
    return power()
  }
  function power(): number {
    const base = primary()
    if (peek()?.t === 'op' && peek().v === '^') {
      eat()
      return Math.pow(base, unary())
    }
    return base
  }
  function primary(): number {
    const tok = eat()
    if (!tok) throw new Error('unexpected end')
    if (tok.t === 'num') return tok.v
    if (tok.t === 'id') {
      if (tok.v in CONSTS) return CONSTS[tok.v]
      if (tok.v in FUNCS) {
        if (peek()?.t === 'op' && peek().v === '(') {
          eat()
          const v = expr()
          if (!(peek()?.t === 'op' && peek().v === ')')) throw new Error('missing )')
          eat()
          return FUNCS[tok.v](v)
        }
        throw new Error('function needs (')
      }
      throw new Error('unknown identifier')
    }
    if (tok.t === 'op' && tok.v === '(') {
      const v = expr()
      if (!(peek()?.t === 'op' && peek().v === ')')) throw new Error('missing )')
      eat()
      return v
    }
    throw new Error('unexpected token')
  }

  try {
    const v = expr()
    if (pos !== toks.length) return null
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

export function formatNumber(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString('en-US')
  return parseFloat(n.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 8 })
}

/* ------------------------------ conversions ------------------------------ */

const ALIAS: Record<string, string> = {
  km: 'km', kilometer: 'km', kilometers: 'km', kilometre: 'km', kilometres: 'km',
  mi: 'mi', mile: 'mi', miles: 'mi',
  m: 'm', meter: 'm', meters: 'm', metre: 'm', metres: 'm',
  ft: 'ft', foot: 'ft', feet: 'ft',
  cm: 'cm', centimeter: 'cm', centimeters: 'cm', centimetres: 'cm',
  in: 'in', inch: 'in', inches: 'in',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  g: 'g', gram: 'g', grams: 'g',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  gal: 'gal', gallon: 'gal', gallons: 'gal',
  c: 'c', celsius: 'c', centigrade: 'c',
  f: 'f', fahrenheit: 'f',
  gb: 'gb', gigabyte: 'gb', gigabytes: 'gb',
  mb: 'mb', megabyte: 'mb', megabytes: 'mb',
  hr: 'hr', hrs: 'hr', hour: 'hr', hours: 'hr',
  min: 'min', mins: 'min', minute: 'min', minutes: 'min',
  day: 'day', days: 'day',
}

const LINEAR: Record<string, number> = {
  // canonical base units
  km: 1000, m: 1, cm: 0.01, in: 0.0254, ft: 0.3048, mi: 1609.344,
  kg: 1000, g: 1, lb: 453.59237, oz: 28.349523,
  l: 1, gal: 3.785411784,
  gb: 1024, mb: 1,
  hr: 60, min: 1, day: 1440,
}

const GROUP: Record<string, string> = {
  km: 'len', m: 'len', cm: 'len', in: 'len', ft: 'len', mi: 'len',
  kg: 'mass', g: 'mass', lb: 'mass', oz: 'mass',
  l: 'vol', gal: 'vol',
  gb: 'data', mb: 'data',
  hr: 'time', min: 'time', day: 'time',
  c: 'temp', f: 'temp',
}

export function convertUnits(value: number, fromRaw: string, toRaw: string): number | null {
  const from = ALIAS[fromRaw.toLowerCase()]
  const to = ALIAS[toRaw.toLowerCase()]
  if (!from || !to || GROUP[from] !== GROUP[to]) return null
  if (GROUP[from] === 'temp') {
    if (from === to) return value
    return from === 'c' ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9
  }
  return (value * LINEAR[from]) / LINEAR[to]
}

export function unitLabel(raw: string): string {
  return ALIAS[raw.toLowerCase()] ?? raw
}
