/** CSV parsing + descriptive statistics for the Data Lab. */

export interface Dataset {
  name: string
  headers: string[]
  rows: string[][]
}

export function parseCSV(text: string, name = 'dataset.csv'): Dataset | null {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((f) => f.trim() !== '')) rows.push(row)
  }
  if (rows.length < 2) return null
  const headers = rows[0].map((h, i) => h.trim() || `col_${i + 1}`)
  const width = headers.length
  const body = rows.slice(1).map((r) => {
    const out = r.slice(0, width)
    while (out.length < width) out.push('')
    return out
  })
  return { name, headers, rows: body }
}

export interface ColStats {
  name: string
  numeric: boolean
  count: number
  missing: number
  unique: number
  mean?: number
  median?: number
  std?: number
  min?: number
  max?: number
  top?: string
}

export function columnValues(ds: Dataset, col: number): string[] {
  return ds.rows.map((r) => r[col] ?? '')
}

export function numericValues(ds: Dataset, col: number): number[] {
  return columnValues(ds, col)
    .map((v) => parseFloat(v))
    .filter((v) => Number.isFinite(v))
}

export function isNumericCol(ds: Dataset, col: number): boolean {
  const vals = columnValues(ds, col).filter((v) => v.trim() !== '')
  if (!vals.length) return false
  const nums = vals.filter((v) => Number.isFinite(parseFloat(v)) && /^-?[\d.,e+\s%]+$/i.test(v.trim()))
  return nums.length / vals.length > 0.8
}

export function colStats(ds: Dataset, col: number): ColStats {
  const raw = columnValues(ds, col)
  const present = raw.filter((v) => v.trim() !== '')
  const missing = raw.length - present.length
  const unique = new Set(present).size
  const numeric = isNumericCol(ds, col)
  const base: ColStats = { name: ds.headers[col], numeric, count: present.length, missing, unique }
  if (!numeric) {
    const freq = new Map<string, number>()
    for (const v of present) freq.set(v, (freq.get(v) ?? 0) + 1)
    base.top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    return base
  }
  const nums = numericValues(ds, col).sort((a, b) => a - b)
  const n = nums.length
  const mean = nums.reduce((a, b) => a + b, 0) / n
  const median = n % 2 ? nums[(n - 1) / 2] : (nums[n / 2 - 1] + nums[n / 2]) / 2
  const std = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / n)
  return { ...base, mean, median, std, min: nums[0], max: nums[n - 1] }
}

export function histogram(values: number[], bins = 8): { label: string; count: number }[] {
  if (!values.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const width = span / bins
  const counts = new Array(bins).fill(0)
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width))
    counts[idx]++
  }
  const fmt = (x: number) => (Math.abs(x) >= 100 ? Math.round(x).toString() : x.toFixed(1))
  return counts.map((count, i) => ({ label: `${fmt(min + i * width)}–${fmt(min + (i + 1) * width)}`, count }))
}

export function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length)
  if (n < 3) return null
  const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n
  const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    dx += (xs[i] - mx) ** 2
    dy += (ys[i] - my) ** 2
  }
  const den = Math.sqrt(dx * dy)
  return den === 0 ? null : num / den
}

export function corrLabel(r: number): string {
  const a = Math.abs(r)
  const strength = a >= 0.8 ? 'very strong' : a >= 0.6 ? 'strong' : a >= 0.4 ? 'moderate' : a >= 0.2 ? 'weak' : 'negligible'
  return `${strength} ${r >= 0 ? 'positive' : 'negative'}`
}

/* ------------------------------ sample dataset ----------------------------- */

export const SAMPLE_CSV = `student_id,hours_studied,sleep_hours,attendance_pct,practice_tests,final_score,grade
S001,8.5,7.0,92,6,88,A
S002,3.2,5.5,64,1,52,D
S003,6.8,6.5,85,4,76,B
S004,9.1,7.5,96,7,93,A
S005,4.5,6.0,71,2,61,C
S006,7.2,8.0,88,5,81,B
S007,2.1,4.5,55,0,43,F
S008,5.9,6.8,79,3,69,C
S009,8.9,7.2,94,6,90,A
S010,4.0,5.0,68,2,58,D
S011,6.1,7.8,82,4,74,B
S012,7.8,6.9,90,5,84,B
S013,3.7,5.2,62,1,50,D
S014,9.5,8.1,98,8,96,A
S015,5.2,6.2,75,3,66,C
S016,6.5,7.1,84,4,78,B
S017,2.8,4.8,58,1,47,F
S018,8.1,7.6,91,6,87,A
S019,4.8,5.8,73,2,63,C
S020,7.5,7.3,89,5,82,B
S021,3.5,5.4,66,1,54,D
S022,6.9,6.7,86,4,79,B
S023,9.2,7.9,95,7,92,A
S024,5.5,6.4,77,3,68,C
S025,8.7,7.4,93,6,89,A
S026,4.2,5.6,70,2,60,C
S027,7.0,7.0,87,5,80,B
S028,2.5,4.6,52,0,41,F
S029,6.3,6.6,83,4,75,B
S030,8.3,7.7,92,6,86,A`
