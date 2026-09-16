export function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

export function addMonths(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(1)
  nextDate.setMonth(nextDate.getMonth() + amount)
  return nextDate
}

export function startOfWeek(date: Date) {
  const weekday = date.getDay() || 7
  return addDays(date, 1 - weekday)
}

export function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6)
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)
}

export function getMonthDays(date: Date) {
  const gridStart = startOfWeek(startOfMonth(date))
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

export function isSameDate(first: Date, second: Date) {
  return toDateKey(first) === toDateKey(second)
}

export function isWithin(date: Date, start: Date, end: Date) {
  const value = date.getTime()
  return value >= start.getTime() && value <= end.getTime()
}

export function getQuarterStart(quarterStart: string) {
  return parseDate(quarterStart)
}

export function getInitialDate(quarterStart: string, quarterEnd: string) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const start = parseDate(quarterStart)
  const end = parseDate(quarterEnd)
  return isWithin(today, start, end) ? today : start
}

export function formatDay(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function formatLongDay(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatShortRange(start: Date, end: Date) {
  const startText = new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'short',
  }).format(start)
  const endText = new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(end)
  return `${startText} – ${endText}`
}
