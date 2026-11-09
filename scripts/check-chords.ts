import { detectChord, TUNINGS } from '../app/composables/useChordDetector.ts'

const STD = TUNINGS[0]!.midi
const DROP_D = TUNINGS[1]!.midi

const cases: { name: string; strings: (number | null)[]; tuning?: number[]; expect: string }[] = [
  { name: 'C', strings: [null, 3, 2, 0, 1, 0], expect: 'C' },
  { name: 'G', strings: [3, 2, 0, 0, 0, 3], expect: 'G' },
  { name: 'Am', strings: [null, 0, 2, 2, 1, 0], expect: 'Am' },
  { name: 'F', strings: [1, 3, 3, 2, 1, 1], expect: 'F' },
  { name: 'E7', strings: [0, 2, 0, 1, 0, 0], expect: 'E7' },
  { name: 'Cmaj7', strings: [null, 3, 2, 0, 0, 0], expect: 'Cmaj7' },
  { name: 'Bm7b5', strings: [null, 2, 3, 2, 3, null], expect: 'Bm7b5' },
  { name: 'E5', strings: [0, 2, 2, null, null, null], expect: 'E5' },
  { name: 'Dsus4', strings: [null, null, 0, 2, 3, 3], expect: 'Dsus4' },
  { name: 'D/F#', strings: [2, 0, 0, 2, 3, 2], expect: 'D/F#' },
  { name: 'Cadd9', strings: [null, 3, 2, 0, 3, 0], expect: 'Cadd9' },
  { name: 'Em7', strings: [0, 2, 0, 0, 0, 0], expect: 'Em7' },
  { name: 'A7', strings: [null, 0, 2, 0, 2, 0], expect: 'A7' },
  { name: 'F#m', strings: [2, 4, 4, 2, 2, 2], expect: 'Gbm' },
  { name: 'C dim (нет b7)', strings: [null, 3, 4, 5, 4, null], expect: 'Cdim' },
  { name: 'A5', strings: [null, 0, 2, 2, 2, 0], expect: 'A' },
  { name: 'DropD D', strings: [0, 0, 0, 2, 3, 2], tuning: DROP_D, expect: 'D' },
  { name: 'one note', strings: [null, null, null, null, null, 0], expect: 'E' },
  { name: 'nothing', strings: [null, null, null, null, null, null], expect: '' },
]

let failed = 0
for (const c of cases) {
  const result = detectChord(c.strings, c.tuning ?? STD)
  const actual = result ? result.name : ''
  const ok = c.expect === '' ? actual === '' : actual === c.expect
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name.padEnd(10)} -> ${actual.padEnd(14)} (expect ${c.expect || '—'})`)
}
console.log(failed ? `\n${failed} failing` : '\nall passed')
