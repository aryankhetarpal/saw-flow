/**
 * Day keys are "YYYY-MM-DD" built from LOCAL date parts.
 * toISOString() is deliberately never used here: it converts to UTC and
 * shifts the calendar day for anyone in a negative-offset timezone.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function today(): string {
  return dayKey(new Date())
}

export function addDays(key: string, n: number): string {
  const d = parseDayKey(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export function isBefore(a: string, b: string): boolean {
  return a < b
}

export function isSameDay(a: string, b: string): boolean {
  return a === b
}

/**
 * Where an unfinished SF rolls to: next calendar day, skipping Sunday.
 * Clamped to today so a stale chain (app not opened for a week) can never
 * fabricate SFs dated in the past.
 */
export function nextPlanningDay(key: string): string {
  let next = addDays(key, 1)
  if (parseDayKey(next).getDay() === 0) next = addDays(next, 1)
  const t = today()
  if (isBefore(next, t)) return t
  return next
}

export function formatLong(key: string): string {
  return parseDayKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatShort(key: string): string {
  return parseDayKey(key).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })
}

export function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })
}

export type MonthCell = { key: string; inMonth: boolean }

/** 6x7 Monday-first grid of day keys covering the given month. */
export function monthMatrix(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1)
  // getDay(): 0=Sun..6=Sat -> shift so Monday is column 0
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)

  const cells: MonthCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push({ key: dayKey(d), inMonth: d.getMonth() === month })
  }
  return cells
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
