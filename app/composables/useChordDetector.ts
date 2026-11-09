export const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export interface TuningPreset {
  id: string
  label: string
  /** MIDI notes from the 6th (lowest) string to the 1st. */
  midi: number[]
}

export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]

export const TUNINGS: TuningPreset[] = [
  { id: 'standard', label: 'Стандартный — E A D G B E', midi: [40, 45, 50, 55, 59, 64] },
  { id: 'drop-d', label: 'Drop D — D A D G B E', midi: [38, 45, 50, 55, 59, 64] },
  { id: 'half-step-down', label: 'На полтона ниже — Eb Ab Db Gb Bb Eb', midi: [39, 44, 49, 54, 58, 63] },
  { id: 'full-step-down', label: 'На тон ниже — D G C F A D', midi: [38, 43, 48, 53, 57, 62] },
  { id: 'drop-c', label: 'Drop C — C G C F A D', midi: [36, 43, 48, 53, 57, 62] },
  { id: 'open-g', label: 'Open G — D G D G B D', midi: [38, 43, 50, 55, 59, 62] },
  { id: 'open-d', label: 'Open D — D A D F# A D', midi: [38, 45, 50, 54, 57, 62] },
  { id: 'dadgad', label: 'DADGAD — D A D G A D', midi: [38, 45, 50, 55, 57, 62] },
]

export const midiToName = (midi: number): string => NOTE_NAMES[((midi % 12) + 12) % 12]

export const midiToLabel = (midi: number): string => `${midiToName(midi)}${Math.floor(midi / 12) - 1}`

const INTERVAL_DEGREES: Record<number, string> = {
  0: '1',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7',
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const LETTER_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11]
const INTERVAL_DEGREE_NUMBER: Record<number, number> = {
  0: 1,
  1: 2,
  2: 2,
  3: 3,
  4: 3,
  5: 4,
  6: 5,
  7: 5,
  8: 6,
  9: 6,
  10: 7,
  11: 7,
}

const normalizePc = (value: number): number => ((value % 12) + 12) % 12

/**
 * Spells a chord tone with proper letter names (e.g. `Bb` in C7, `F#` in D/F#)
 * instead of the generic flat/sharp table.
 */
function spellTone(rootPitchClass: number, interval: number): string {
  const rootName = NOTE_NAMES[rootPitchClass]!
  const rootLetterIndex = LETTERS.indexOf(rootName[0]!)
  const degree = INTERVAL_DEGREE_NUMBER[normalizePc(interval)] ?? 1
  const letterIndex = (rootLetterIndex + degree - 1) % 7
  const basePitchClass = LETTER_PITCH_CLASSES[letterIndex]!
  const targetPitchClass = normalizePc(rootPitchClass + interval)
  const diff = normalizePc(targetPitchClass - basePitchClass)

  const accidental = diff === 0 ? '' : diff === 1 ? '#' : diff === 2 ? '##' : diff === 10 ? 'bb' : diff === 11 ? 'b' : ''
  return `${LETTERS[letterIndex]}${accidental}`
}

interface ChordTemplate {
  suffix: string
  intervals: number[]
}

/**
 * Ordered from the most common / simplest shapes to the most exotic ones:
 * the order is used as a tie-breaker between equally good matches.
 */
const CHORD_TEMPLATES: ChordTemplate[] = [
  { suffix: '', intervals: [0, 4, 7] },
  { suffix: 'm', intervals: [0, 3, 7] },
  { suffix: '7', intervals: [0, 4, 7, 10] },
  { suffix: 'm7', intervals: [0, 3, 7, 10] },
  { suffix: 'maj7', intervals: [0, 4, 7, 11] },
  { suffix: 'sus4', intervals: [0, 5, 7] },
  { suffix: 'sus2', intervals: [0, 2, 7] },
  { suffix: '5', intervals: [0, 7] },
  { suffix: 'dim', intervals: [0, 3, 6] },
  { suffix: 'aug', intervals: [0, 4, 8] },
  { suffix: '6', intervals: [0, 4, 7, 9] },
  { suffix: 'm6', intervals: [0, 3, 7, 9] },
  { suffix: 'add9', intervals: [0, 2, 4, 7] },
  { suffix: 'm7b5', intervals: [0, 3, 6, 10] },
  { suffix: 'dim7', intervals: [0, 3, 6, 9] },
  { suffix: 'mMaj7', intervals: [0, 3, 7, 11] },
  { suffix: '7sus4', intervals: [0, 5, 7, 10] },
  { suffix: '9', intervals: [0, 2, 4, 7, 10] },
  { suffix: 'maj9', intervals: [0, 2, 4, 7, 11] },
  { suffix: 'm9', intervals: [0, 2, 3, 7, 10] },
  { suffix: '6/9', intervals: [0, 2, 4, 7, 9] },
  { suffix: '11', intervals: [0, 2, 4, 5, 7, 10] },
  { suffix: 'm11', intervals: [0, 2, 3, 5, 7, 10] },
  { suffix: '13', intervals: [0, 2, 4, 7, 9, 10] },
]

export interface PlayedNote {
  stringIndex: number
  fret: number
  midi: number
  pitchClass: number
  name: string
}

export interface ChordTone {
  name: string
  degree: string | null
}

export interface ChordResult {
  /** Display name, e.g. `Cmaj7/E`. */
  name: string
  root: string | null
  quality: string | null
  bass: string | null
  /** True when the played pitch classes match the chord template exactly. */
  exact: boolean
  unknown: boolean
  notes: ChordTone[]
  /** Tab-style fingering, e.g. `x32010`. */
  fingering: string
  played: PlayedNote[]
}

interface Candidate {
  root: number
  template: ChordTemplate
  score: number
}

const normalize = (value: number): number => ((value % 12) + 12) % 12

export function getPlayedNotes(strings: (number | null)[], tuning: number[]): PlayedNote[] {
  const played: PlayedNote[] = []
  strings.forEach((fret, stringIndex) => {
    if (fret === null) return
    const midi = tuning[stringIndex] + fret
    played.push({
      stringIndex,
      fret,
      midi,
      pitchClass: normalize(midi),
      name: midiToName(midi),
    })
  })
  return played.sort((a, b) => a.midi - b.midi)
}

function scoreCandidate(
  root: number,
  template: ChordTemplate,
  pitchClasses: number[],
  bassPitchClass: number,
  priority: number,
): number | null {
  const templatePitchClasses = template.intervals.map((interval) => normalize(root + interval))
  const missing = templatePitchClasses.filter((pc) => !pitchClasses.includes(pc))
  const extra = pitchClasses.filter((pc) => !templatePitchClasses.includes(pc))

  let base: number
  if (missing.length === 0 && extra.length === 0) {
    base = 1000
  } else if (extra.length === 0 && missing.length <= 2 && pitchClasses.length >= 3) {
    base = 700 - missing.length * 45
  } else if (missing.length === 0 && extra.length <= 2 && pitchClasses.length >= 3) {
    base = 640 - extra.length * 55
  } else if (missing.length <= 1 && extra.length <= 1 && pitchClasses.length >= 3) {
    base = 380 - missing.length * 60 - extra.length * 60
  } else {
    return null
  }

  let score = base
  if (normalize(bassPitchClass) === normalize(root)) score += 40
  score -= template.intervals.length * 4
  score -= priority * 0.5

  return score
}

/**
 * Detects a chord name from the fretted/played strings.
 *
 * Strings are given from the 6th (lowest) to the 1st; `null` means muted.
 */
export function detectChord(strings: (number | null)[], tuning: number[]): ChordResult | null {
  const played = getPlayedNotes(strings, tuning)
  if (played.length === 0) return null

  const pitchClasses = [...new Set(played.map((note) => note.pitchClass))]
  const bass = played[0]!
  const fingering = strings
    .map((fret) => (fret === null ? 'x' : fret > 9 ? `(${fret})` : String(fret)))
    .join('')

  const notes: ChordTone[] = []
  const seen = new Set<number>()
  for (const note of played) {
    if (seen.has(note.pitchClass)) continue
    seen.add(note.pitchClass)
    notes.push({ name: note.name, degree: null })
  }

  if (pitchClasses.length === 1) {
    return {
      name: bass.name,
      root: bass.name,
      quality: '',
      bass: bass.name,
      exact: false,
      unknown: false,
      notes,
      fingering,
      played,
    }
  }

  const candidates: Candidate[] = []
  for (let root = 0; root < 12; root++) {
    CHORD_TEMPLATES.forEach((template, priority) => {
      const score = scoreCandidate(root, template, pitchClasses, bass.pitchClass, priority)
      if (score !== null) candidates.push({ root, template, score })
    })
  }
  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]

  if (!best || best.score < 250) {
    return {
      name: 'Неизвестный аккорд',
      root: null,
      quality: null,
      bass: bass.name,
      exact: false,
      unknown: true,
      notes,
      fingering,
      played,
    }
  }

  const match: Candidate = best
  const rootName = NOTE_NAMES[match.root]!
  const bassInterval = normalize(bass.pitchClass - match.root)
  const bassName = spellTone(match.root, bassInterval)
  const isInversion = normalize(bass.pitchClass) !== match.root
  const exact = pitchClasses.length === match.template.intervals.length
    && pitchClasses.every((pc) => match.template.intervals.some((interval) => normalize(match.root + interval) === pc))

  const tones: ChordTone[] = []
  const seenTones = new Set<number>()
  for (const note of played) {
    if (seenTones.has(note.pitchClass)) continue
    seenTones.add(note.pitchClass)
    const interval = normalize(note.pitchClass - match.root)
    tones.push({ name: spellTone(match.root, interval), degree: INTERVAL_DEGREES[interval] ?? null })
  }

  return {
    name: `${rootName}${match.template.suffix}${isInversion ? `/${bassName}` : ''}`,
    root: rootName,
    quality: match.template.suffix,
    bass: bassName,
    exact,
    unknown: false,
    notes: tones,
    fingering,
    played,
  }
}

export function useChordDetector() {
  return {
    NOTE_NAMES,
    NOTE_NAMES_SHARP,
    TUNINGS,
    STANDARD_TUNING,
    midiToName,
    midiToLabel,
    getPlayedNotes,
    detectChord,
  }
}
