export const TREE_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export type ChordQuality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'maj7'
  | '7'
  | 'm7'
  | 'm7b5'
  | 'dim7'
  | 'mMaj7'
  | 'aug7'
export type TreeMode = 'major' | 'mixolydian' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor' | 'dorian'

export type ChordMood = 'light' | 'sad' | 'tense'

export interface TreeChord {
  /** Уникальный ключ: ступень + аккорд. */
  key: string
  rootPc: number
  quality: ChordQuality
  /** Ступень 0–6 (I–VII). */
  degree: number
  roman: string
  name: string
  color: string
  mood: ChordMood
}

export interface TreeNode {
  id: string
  chord: TreeChord
  level: number
  /** Полная последовательность от центрального аккорда. */
  path: TreeChord[]
  /** Из этого аккорда можно вернуться на центральный. */
  canReturn: boolean
  children: TreeNode[]
}

export const MODE_INTERVALS: Record<TreeMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
}

export const MODE_LABELS: Record<TreeMode, string> = {
  major: 'Ионийский (натуральный мажор)',
  mixolydian: 'Миксолидийский мажор',
  natural_minor: 'Натуральный минор',
  harmonic_minor: 'Гармонический минор',
  melodic_minor: 'Мелодический минор',
  dorian: 'Дорийский минор',
}

export const MAJOR_MODES: TreeMode[] = ['major', 'mixolydian']
export const MINOR_MODES: TreeMode[] = ['natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian']

export type StyleId = 'functional' | 'pop' | 'rock' | 'blues' | 'jazz'

export interface ChordDef {
  offset: number
  quality: ChordQuality
  roman: string
}

export interface StyleRules {
  id: StyleId
  label: string
  description: string
  /** 'sevenths' — стиль строит септаккорды (джаз), по умолчанию трезвучия. */
  chords?: 'triads' | 'sevenths'
  /**
   * Дополнительные (заимствованные) аккорды стиля: индексы 7, 8, … в правилах.
   * Ступени 0–6 — диатоника лада.
   */
  palette?: ChordDef[]
  /** Разрешённые переходы: индекс аккорда в палитре → список следующих индексов (0 = I). */
  rules: number[][]
}

export const STYLES: StyleRules[] = [
  {
    id: 'functional',
    label: 'Классика (функциональная)',
    description: 'T → S → D → T: тоника уходит в субдоминанту или доминанту, доминанта возвращается.',
    rules: [
      [3, 4, 5, 1], // I  → IV, V, VI, II
      [4, 6], //       II → V, VII
      [5, 3], //       III → VI, IV
      [4, 0, 1], //    IV → V, I, II
      [0, 5, 3], //    V  → I, VI, IV
      [1, 3, 4], //    VI → II, IV, V
      [0, 2], //       VII → I, III
    ],
  },
  {
    id: 'pop',
    label: 'Поп',
    description: 'Базовые обороты поп-музыки: I–V–vi–IV и родственные ходы.',
    rules: [
      [4, 5, 3, 1], // I  → V, VI, IV, II
      [4, 3], //       II → V, IV
      [3, 5], //       III → IV, VI
      [0, 4, 5], //    IV → I, V, VI
      [5, 0, 3], //    V  → VI, I, IV
      [3, 4, 1], //    VI → IV, V, II
      [0], //          VII → I
    ],
  },
  {
    id: 'rock',
    label: 'Рок',
    description: 'Кварто-квинтовые ходы, vi и заимствованные bVII и bIII — типичный рок-оборот.',
    palette: [
      { offset: 10, quality: 'maj', roman: 'bVII' },
      { offset: 3, quality: 'maj', roman: 'bIII' },
    ],
    rules: [
      [3, 4, 5, 7, 8], // I    → IV, V, VI, bVII, bIII
      [4, 3], //          II   → V, IV
      [3, 5], //          III  → IV, VI
      [0, 4, 5, 7], //    IV   → I, V, VI, bVII
      [0, 3, 5], //       V    → I, IV, VI
      [3, 4, 7, 0], //    VI   → IV, V, bVII, I
      [0, 2], //          VII  → I, III
      [0, 3, 8], //       bVII → I, IV, bIII
      [3, 7, 0], //       bIII → IV, bVII, I
    ],
  },
  {
    id: 'blues',
    label: 'Блюз',
    description: 'Блюзовый квадрат I–IV–V с быстрой сменой, ii–V и оборотом через bVII.',
    palette: [{ offset: 10, quality: 'maj', roman: 'bVII' }],
    rules: [
      [3, 4, 1, 5, 7], // I    → IV, V, II, VI, bVII
      [4, 3], //       II   → V, IV
      [5, 3], //       III  → VI, IV
      [0, 4, 1, 7], // IV   → I, V, II, bVII
      [0, 3, 5], //    V    → I, IV, VI
      [1, 4, 3, 7], // VI   → II, V, IV, bVII
      [2, 4], //       VII  → III, V
      [0, 3, 4], //    bVII → I, IV, V (оборот)
    ],
  },
  {
    id: 'jazz',
    label: 'Джаз',
    description: 'Септаккорды, ii–V–I, отклонения через III, VI и bVII7.',
    chords: 'sevenths',
    palette: [{ offset: 10, quality: '7', roman: 'bVII7' }],
    rules: [
      [5, 1, 3, 2, 6], // I   → VI, II, IV, III, VII
      [4, 6], //          II  → V, VII
      [5, 1, 7], //       III → VI, II, bVII7
      [4, 0, 1, 6], //    IV  → V, I, II, VII
      [0, 5, 2], //       V   → I, VI, III
      [1, 4, 7], //       VI  → II, V, bVII7
      [2, 0, 7], //    VII → III, I, bVII7
      [0, 3], //       bVII7 → I, IV
    ],
  },
]

const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

const normalize = (value: number): number => ((value % 12) + 12) % 12

/**
 * Цвет аккорда.
 *
 * Одинаковые аккорды во всех ветках красятся одинаково: оттенок задаётся
 * основным тоном (12 оттенков), а качество задаёт температуру палитры —
 * мажорные аккорды тёплые (красный → жёлтый), минорные холодные (бирюза → фиолетовый).
 */
const MAJOR_FAMILY: ChordQuality[] = ['maj', 'maj7', '7', 'aug', 'aug7']
const MINOR_FAMILY: ChordQuality[] = ['min', 'm7', 'mMaj7']

export function chordColor(rootPc: number, quality: ChordQuality): string {
  const pc = normalize(rootPc)
  if (MAJOR_FAMILY.includes(quality)) {
    const hue = (330 + pc * 10) % 360
    return `hsl(${hue} 85% ${pc % 2 === 0 ? 58 : 66}%)`
  }
  if (MINOR_FAMILY.includes(quality)) {
    return `hsl(${170 + pc * 10} ${pc % 2 === 0 ? 42 : 52}% ${pc % 2 === 0 ? 46 : 56}%)`
  }
  return 'hsl(265 20% 44%)'
}

function qualityFromIntervals(third: number, fifth: number, seventh?: number): ChordQuality {
  if (seventh !== undefined) {
    if (third === 4 && fifth === 7 && seventh === 11) return 'maj7'
    if (third === 4 && fifth === 7 && seventh === 10) return '7'
    if (third === 3 && fifth === 7 && seventh === 10) return 'm7'
    if (third === 3 && fifth === 6 && seventh === 10) return 'm7b5'
    if (third === 3 && fifth === 6 && seventh === 9) return 'dim7'
    if (third === 3 && fifth === 7 && seventh === 11) return 'mMaj7'
    if (third === 4 && fifth === 8 && seventh === 11) return 'aug7'
    if (third === 4 && fifth === 8 && seventh === 10) return 'aug7'
  }
  if (third === 4 && fifth === 7) return 'maj'
  if (third === 3 && fifth === 7) return 'min'
  if (third === 3 && fifth === 6) return 'dim'
  if (third === 4 && fifth === 8) return 'aug'
  return 'maj'
}

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  maj7: 'maj7',
  '7': '7',
  m7: 'm7',
  m7b5: 'm7b5',
  dim7: 'dim7',
  mMaj7: 'mMaj7',
  aug7: '7#5',
}

const ROMAN_SEVENTH: Partial<Record<ChordQuality, string>> = {
  maj7: 'maj7',
  '7': '7',
  m7: '7',
  m7b5: 'ø7',
  dim7: '°7',
  mMaj7: 'maj7',
  aug7: '7#5',
}

const MINOR_LIKE: ChordQuality[] = ['min', 'dim', 'm7', 'm7b5', 'dim7', 'mMaj7']

export const MOOD_BY_QUALITY: Record<ChordQuality, ChordMood> = {
  maj: 'light',
  maj7: 'light',
  min: 'sad',
  m7: 'sad',
  '7': 'tense',
  m7b5: 'sad',
  dim: 'tense',
  dim7: 'tense',
  aug: 'tense',
  aug7: 'tense',
  mMaj7: 'tense',
}

export const MOOD_LABELS: Record<ChordMood | 'any', string> = {
  any: 'Любое',
  light: 'Светлое',
  sad: 'Грустное',
  tense: 'Напряжённое',
}

export const moodOf = (quality: ChordQuality): ChordMood => MOOD_BY_QUALITY[quality] ?? 'light'

export function degreeChord(
  tonicPc: number,
  mode: TreeMode,
  degree: number,
  seventh = false,
): TreeChord {
  const intervals = MODE_INTERVALS[mode]
  const at = (step: number) => tonicPc + intervals[((step % 7) + 7) % 7]! + 12 * Math.floor(step / 7)

  const root = at(degree)
  const third = at(degree + 2)
  const fifth = at(degree + 4)
  const seventhInterval = seventh ? at(degree + 6) : undefined

  const quality = qualityFromIntervals(
    normalize(third - root),
    normalize(fifth - root),
    seventhInterval === undefined ? undefined : normalize(seventhInterval - root),
  )
  const rootPc = normalize(root)
  const romanBase = ROMAN_UPPER[degree]!
  const isMinorLike = MINOR_LIKE.includes(quality)
  const roman = isMinorLike ? romanBase.toLowerCase() : romanBase

  const romanSuffix = seventh
    ? (ROMAN_SEVENTH[quality] ?? '')
    : quality === 'dim'
      ? '°'
      : quality === 'aug'
        ? '+'
        : ''

  return {
    key: `${rootPc}-${quality}`,
    rootPc,
    quality,
    degree,
    roman: `${roman}${romanSuffix}`,
    name: `${TREE_NOTE_NAMES[rootPc]}${QUALITY_SUFFIX[quality]}`,
    color: chordColor(rootPc, quality),
    mood: moodOf(quality),
  }
}

export function tonicChord(tonicPc: number, mode: TreeMode): TreeChord {
  return degreeChord(tonicPc, mode, 0)
}

export interface BuildOptions {
  tonicPc: number
  mode: TreeMode
  style: StyleId
  /** Максимальная глубина последовательности (число аккордов после центрального). */
  maxDepth: number
  /** Строить септаккорды вместо трезвучий. */
  sevenths?: boolean
  /** Оставить только последовательности из аккордов этого настроения. */
  mood?: ChordMood | 'any'
  maxNodes?: number
}

export interface ChordTreeResult {
  root: TreeNode
  totalNodes: number
  maxLevel: number
}

/**
 * Строит дерево возможных последовательностей от центрального аккорда.
 *
 * Ветка обрывается, когда аккорд уже может вернуться на центральный
 * (`canReturn`, начиная со второго уровня) либо достигнута максимальная глубина.
 */
export function borrowedChord(tonicPc: number, def: ChordDef): TreeChord {
  const rootPc = normalize(tonicPc + def.offset)
  return {
    key: `${rootPc}-${def.quality}`,
    rootPc,
    quality: def.quality,
    degree: -1,
    roman: def.roman,
    name: `${TREE_NOTE_NAMES[rootPc]}${QUALITY_SUFFIX[def.quality]}`,
    color: chordColor(rootPc, def.quality),
    mood: moodOf(def.quality),
  }
}

export const styleRulesDefaults = Object.fromEntries(STYLES.map((item) => [item.id, item]))

export function buildChordTree(options: BuildOptions): ChordTreeResult {
  const { tonicPc, mode, style, maxDepth } = options
  const sevenths = options.sevenths ?? styleRulesDefaults[style]?.chords === 'sevenths'
  const mood = options.mood ?? 'any'
  const maxNodes = options.maxNodes ?? 320
  const styleRules = STYLES.find((item) => item.id === style) ?? STYLES[0]!
  const rules = styleRules.rules

  // Палитра стиля: 7 диатонических ступеней + заимствованные аккорды (bVII, bIII, …).
  const palette: TreeChord[] = Array.from({ length: 7 }, (_, degree) =>
    degreeChord(tonicPc, mode, degree, sevenths),
  )
  for (const def of styleRules.palette ?? []) palette.push(borrowedChord(tonicPc, def))

  let counter = 0
  let nodeSeq = 0
  let maxLevel = 0

  const makeNode = (chord: TreeChord, level: number, path: TreeChord[]): TreeNode => {
    nodeSeq++
    const node: TreeNode = { id: `n${nodeSeq}`, chord, level, path, canReturn: false, children: [] }
    maxLevel = Math.max(maxLevel, level)
    return node
  }

  const expand = (paletteIndex: number, level: number, path: TreeChord[]): TreeNode | null => {
    if (counter > maxNodes) return null
    counter++

    const chord = palette[paletteIndex]!
    const node = makeNode(chord, level, [...path, chord])
    const allowed = rules[paletteIndex] ?? []
    // Возврат на центральный аккорд доступен из этого узла — это возможная концовка.
    node.canReturn = level > 0 && allowed.includes(0)

    // maxDepth — длина последовательности в аккордах (уровень 0 — центральный).
    if (level + 1 >= maxDepth) {
      // Ветка обязана закончиться аккордом, из которого есть возврат.
      return node.canReturn ? node : null
    }

    const usedKeys = new Set(path.map((item) => item.key))
    const nextIndexes = allowed.filter((index) => {
      if (index === 0 || !palette[index]) return false
      const candidate = palette[index]!
      if (usedKeys.has(candidate.key)) return false
      if (mood !== 'any' && candidate.mood !== mood) return false
      return true
    })

    for (const index of nextIndexes) {
      const child = expand(index, level + 1, [...path, chord])
      if (child) node.children.push(child)
    }

    // Корень остаётся всегда, даже если фильтр не оставил ни одной ветки.
    if (!node.children.length && !node.canReturn && level > 0) return null
    return node
  }

  const root = expand(0, 0, [])
  if (!root) {
    const fallback = makeNode(degreeChord(tonicPc, mode, 0), 0, [])
    return { root: fallback, totalNodes: 1, maxLevel: 0 }
  }
  return { root, totalNodes: flattenTreeCount(root), maxLevel }
}

function flattenTreeCount(node: TreeNode): number {
  return 1 + node.children.reduce((sum, child) => sum + flattenTreeCount(child), 0)
}

export function countLeaves(node: TreeNode): number {
  if (!node.children.length) return 1
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0)
}

export function flattenTree(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node]
  for (const child of node.children) result.push(...flattenTree(child))
  return result
}

/** MIDI-ноты аккорда для проигрывания (около первой октавы). */
const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  mMaj7: [0, 3, 7, 11],
  aug7: [0, 4, 8, 10],
}

export function chordMidiNotes(chord: TreeChord, octave = 4): number[] {
  const intervals = CHORD_INTERVALS[chord.quality] ?? [0, 4, 7]
  const root = 12 * (octave + 1) + chord.rootPc
  return intervals.map((interval) => root + interval)
}

/** Аппликатура аккорда на гитаре: подбирает удобную позицию в первых ладах. */
export function chordFingering(chord: TreeChord, tuning: number[]): (number | null)[] {
  const tonePcs = CHORD_INTERVALS[chord.quality].map((interval) => normalize(chord.rootPc + interval))
  const has = (pc: number) => tonePcs.includes(normalize(pc))

  // Бас: корень на 6-й, 5-й или 4-й струне — берём самую низкую позицию.
  const bassOptions: { stringIndex: number; fret: number }[] = []
  for (const stringIndex of [0, 1, 2]) {
    for (let fret = 0; fret <= 11; fret++) {
      if (normalize(tuning[stringIndex]! + fret) === chord.rootPc) {
        bassOptions.push({ stringIndex, fret })
      }
    }
  }
  if (!bassOptions.length) return [null, null, null, null, null, null]

  bassOptions.sort((a, b) => a.fret - b.fret || a.stringIndex - b.stringIndex)
  const bass = bassOptions[0]!

  const result: (number | null)[] = [null, null, null, null, null, null]
  result[bass.stringIndex] = bass.fret

  const maxFret = Math.max(4, bass.fret + 4)
  const covered = new Set<number>([chord.rootPc])
  let reference = bass.fret

  for (let stringIndex = bass.stringIndex + 1; stringIndex < 6; stringIndex++) {
    const options: { fret: number; pc: number; cost: number }[] = []
    for (let fret = 0; fret <= maxFret; fret++) {
      const pc = normalize(tuning[stringIndex]! + fret)
      if (!has(pc)) continue

      const isNew = !covered.has(pc)
      // Меньше лад, ближе к предыдущей ноте, открытые струны и новые звуки — выгоднее.
      const cost = fret + 0.8 * Math.abs(fret - reference) + (fret === 0 ? -2 : 0) + (isNew ? -3 : 0)
      options.push({ fret, pc, cost })
    }
    if (!options.length) continue

    options.sort((a, b) => a.cost - b.cost)
    const chosen = options[0]!
    result[stringIndex] = chosen.fret
    covered.add(chosen.pc)
    reference = chosen.fret
  }

  return result
}

/** Окно ладов, в котором видна аппликатура. */
export function fingeringWindow(frets: (number | null)[]): number {
  const played = frets.filter((fret): fret is number => fret !== null && fret >= 1)
  if (!played.length) return 1
  const min = Math.min(...played)
  const max = Math.max(...played)
  const start = Math.min(min, Math.max(1, max - 4))
  return Math.max(1, start)
}

export function useChordTree() {
  return {
    MOOD_LABELS,
    moodOf,
    TREE_NOTE_NAMES,
    MODE_INTERVALS,
    MODE_LABELS,
    MAJOR_MODES,
    MINOR_MODES,
    STYLES,
    chordColor,
    degreeChord,
    tonicChord,
    buildChordTree,
    chordMidiNotes,
    chordFingering,
    fingeringWindow,
  }
}
