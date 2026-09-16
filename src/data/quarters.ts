import type { QuarterId } from '../types'

export type Quarter = {
  id: QuarterId
  label: string
  range: string
  theme: string
  start: string
  end: string
}

export const quarters: Quarter[] = [
  {
    id: 'q1',
    label: 'Q1 2026',
    range: '01. Jan – 31. Mär',
    theme: 'frost',
    start: '2026-01-01',
    end: '2026-03-31',
  },
  {
    id: 'q2',
    label: 'Q2 2026',
    range: '01. Apr – 30. Jun',
    theme: 'spring',
    start: '2026-04-01',
    end: '2026-06-30',
  },
  {
    id: 'q3',
    label: 'Q3 2026',
    range: '01. Jul – 30. Sep',
    theme: 'summer',
    start: '2026-07-01',
    end: '2026-09-30',
  },
  {
    id: 'q4',
    label: 'Q4 2026',
    range: '01. Okt – 31. Dez',
    theme: 'dusk',
    start: '2026-10-01',
    end: '2026-12-31',
  },
]
