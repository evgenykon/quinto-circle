export interface Note {
  name: string
  altName?: string
}

export interface PositionedNote {
  note: Note
  index: number
}

export type Mode = 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'

export interface ScaleDegree {
  roman: string
  semitones: number
  chordType: string
  chordNotes: string[]
}

export type Selection =
  | { type: 'key' }
  | { type: 'degree'; index: number }
  | { type: 'mode' }
  | { type: 'non-scale'; circleIndex: number }

const CHROMATIC_NOTES: Note[] = [
  { name: 'C' },
  { name: 'C#', altName: 'Db' },
  { name: 'D' },
  { name: 'D#', altName: 'Eb' },
  { name: 'E' },
  { name: 'F' },
  { name: 'F#', altName: 'Gb' },
  { name: 'G' },
  { name: 'G#', altName: 'Ab' },
  { name: 'A' },
  { name: 'A#', altName: 'Bb' },
  { name: 'B', altName: 'Cb' },
]

const CIRCLE_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]

const MODE_INTERVALS: Record<Mode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
}

const MAJOR_CHORD_TYPES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
const MINOR_CHORD_TYPES = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

const CHORD_FUNCTIONS: Record<string, string[]> = {
  major: ['Тоника', 'Субдоминанта', 'Тоника', 'Субдоминанта', 'Доминанта', 'Тоника', 'Доминанта'],
  minor: ['Тоника', 'Субдоминанта', 'Тоника', 'Субдоминанта', 'Доминанта', 'Субдоминанта', 'Доминанта'],
}

const DEGREE_NAMES = [
  'Тоника',
  'Верхняя медианта (супертоника)',
  'Медианта',
  'Субдоминанта',
  'Доминанта',
  'Нижняя медианта (субмедианта)',
  'Вводный тон',
]

const MODE_DESCRIPTION: Record<Mode, string> = {
  major: 'Мажорный лад — светлое, устойчивое звучание. Интервальная структура: тон–тон–полутон–тон–тон–тон–полутон.',
  natural_minor: 'Натуральный минор — мягкое, минорное звучание. Интервальная структура: тон–полутон–тон–тон–полутон–тон–тон.',
  harmonic_minor: 'Гармонический минор — отличается от натурального повышенной VII ступенью (♮), создающей тяготение в тонику и характерное «арабское» звучание.',
  melodic_minor: 'Мелодический минор — при движении вверх повышаются VI и VII ступени, вниз — как натуральный. Используется в мелодиях для плавности голосоведения.',
}

const MODE_CHAR_INTERVAL: Record<Mode, string> = {
  major: 'Большая терция (4 полутона) между I и III ступенями',
  natural_minor: 'Малая терция (3 полутона) между I и III ступенями',
  harmonic_minor: 'Увеличенная секунда (3 полутона) между VI и VII ступенями',
  melodic_minor: 'Повышенные VI и VII ступени при движении вверх',
}

function getChordIntervals(chordType: string): number[] {
  switch (chordType) {
    case 'maj': return [0, 4, 7]
    case 'min': return [0, 3, 7]
    case 'dim': return [0, 3, 6]
    default: return [0, 4, 7]
  }
}

function getKeySignature(circlePos: number): { sharps: number; flats: number; names: string[] } {
  const pos = ((circlePos % 12) + 12) % 12
  const sharpKeys = [0, 1, 2, 3, 4, 5, 6]
  const sharpNames = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#']
  const flatNames = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb']

  if (pos <= 6) {
    const count = pos
    return { sharps: count, flats: 0, names: sharpNames.slice(0, count) }
  } else {
    const count = 12 - pos
    return { sharps: 0, flats: count, names: flatNames.slice(0, count) }
  }
}

function getRelativeKey(circlePos: number, mode: Mode): string {
  if (mode === 'major') {
    const relPos = (circlePos + 9) % 12
    return `${CHROMATIC_NOTES[CIRCLE_ORDER[relPos]].name} min`
  }
  const relPos = (circlePos + 3) % 12
  return `${CHROMATIC_NOTES[CIRCLE_ORDER[relPos]].name} maj`
}

function getParallelKey(circlePos: number, mode: Mode): string {
  if (mode === 'major') {
    return `${CHROMATIC_NOTES[CIRCLE_ORDER[circlePos]].name} min`
  }
  return `${CHROMATIC_NOTES[CIRCLE_ORDER[circlePos]].name} maj`
}

const sharedTonic = ref(0)
const sharedMode = ref<Mode>('major')
const sharedSelection = ref<Selection>({ type: 'key' })

export function useCircleOfFifths() {
  const tonic = sharedTonic
  const mode = sharedMode
  const selection = sharedSelection

  const circleNotes = computed<PositionedNote[]>(() =>
    CIRCLE_ORDER.map((chromaticIndex, i) => ({
      note: CHROMATIC_NOTES[chromaticIndex],
      index: i,
    }))
  )

  const getChromaticIndex = (circlePosition: number): number =>
    CIRCLE_ORDER[((circlePosition % 12) + 12) % 12]

  const scaleNotes = computed(() => {
    const intervals = MODE_INTERVALS[mode.value]
    const tonicChromatic = CIRCLE_ORDER[tonic.value]
    return intervals.map((interval) => {
      const idx = (tonicChromatic + interval) % 12
      return CHROMATIC_NOTES[idx]
    })
  })

  const scaleDegrees = computed<ScaleDegree[]>(() => {
    const intervals = MODE_INTERVALS[mode.value]
    const tonicChromatic = CIRCLE_ORDER[tonic.value]
    const chordTypes = mode.value === 'major' ? MAJOR_CHORD_TYPES : MINOR_CHORD_TYPES

    return ROMAN_NUMERALS.map((roman, i) => {
      const semitones = intervals[i]
      const tonicIdx = (tonicChromatic + semitones) % 12
      const chordIntervals = getChordIntervals(chordTypes[i])
      const chordNotes = chordIntervals.map((ci) => {
        const noteIdx = (tonicIdx + ci) % 12
        return CHROMATIC_NOTES[noteIdx].name
      })

      return {
        roman: mode.value !== 'major' && i === 0 ? roman.toLowerCase() : roman,
        semitones,
        chordType: chordTypes[i],
        chordNotes,
      }
    })
  })

  const isInScale = (circlePosition: number): boolean => {
    const chromatic = getChromaticIndex(circlePosition)
    const intervals = MODE_INTERVALS[mode.value]
    const tonicChromatic = CIRCLE_ORDER[tonic.value]
    return intervals.some((iv) => (tonicChromatic + iv) % 12 === chromatic)
  }

  const getDegreeInfo = (circlePosition: number) => {
    const chromatic = getChromaticIndex(circlePosition)
    const intervals = MODE_INTERVALS[mode.value]
    const tonicChromatic = CIRCLE_ORDER[tonic.value]
    const step = intervals.findIndex((iv) => (tonicChromatic + iv) % 12 === chromatic)
    if (step === -1) return null
    return scaleDegrees.value[step]
  }

  const keyName = computed(() => {
    const note = CHROMATIC_NOTES[CIRCLE_ORDER[tonic.value]]
    const modeLabel = mode.value === 'major' ? 'мажор' : 'минор'
    return `${note.name} ${modeLabel}`
  })

  const keySignature = computed(() => getKeySignature(tonic.value))

  const relativeKey = computed(() => getRelativeKey(tonic.value, mode.value))

  const getDegreeIndexFromCircle = (circlePosition: number): number | null => {
    const chromatic = getChromaticIndex(circlePosition)
    const intervals = MODE_INTERVALS[mode.value]
    const tonicChromatic = CIRCLE_ORDER[tonic.value]
    const step = intervals.findIndex((iv) => (tonicChromatic + iv) % 12 === chromatic)
    return step !== -1 ? step : null
  }

  const selectKey = () => { selection.value = { type: 'key' } }
  const selectDegree = (index: number) => { selection.value = { type: 'degree', index } }
  const selectMode = () => { selection.value = { type: 'mode' } }
  const selectNonScale = (circleIndex: number) => { selection.value = { type: 'non-scale', circleIndex } }

  return {
    tonic: readonly(tonic),
    mode: readonly(mode),
    selection,
    setTonic: (i: number) => { tonic.value = ((i % 12) + 12) % 12 },
    setMode: (m: Mode) => { mode.value = m },
    selectKey,
    selectDegree,
    selectMode,
    selectNonScale,
    getDegreeIndexFromCircle,
    circleNotes,
    scaleNotes,
    scaleDegrees,
    keyName,
    keySignature,
    relativeKey,
    isInScale,
    getDegreeInfo,
    getChromaticIndex,
    CHORD_FUNCTIONS,
    DEGREE_NAMES,
    MODE_DESCRIPTION,
    MODE_CHAR_INTERVAL,
    CHROMATIC_NOTES,
    CIRCLE_ORDER,
  }
}
