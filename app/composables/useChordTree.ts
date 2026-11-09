export const TREE_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export type ChordQuality = 'maj' | 'min' | 'dim' | 'aug'
export type TreeMode = 'major' | 'mixolydian' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor' | 'dorian'

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
    description: 'ii–V–I и отклонения через III, VI и пониженные ступени.',
    rules: [
      [5, 1, 3, 2], // I  → VI, II, IV, III
      [4], //          II → V
      [5, 1], //       III → VI, II
      [4, 0, 1], //    IV → V, I, II
      [0, 5, 2], //    V  → I, VI, III
      [1, 4], //       VI → II, V
      [2, 0], //       VII → III, I
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
export function chordColor(rootPc: number, quality: ChordQuality): string {
  const pc = normalize(rootPc)
  if (quality === 'maj') {
    const hue = (330 + pc * 10) % 360
    return `hsl(${hue} 85% ${pc % 2 === 0 ? 58 : 66}%)`
  }
  if (quality === 'aug') {
    const hue = (330 + pc * 10) % 360
    return `hsl(${hue} 55% 74%)`
  }
  if (quality === 'min') {
    return `hsl(${170 + pc * 10} ${pc % 2 === 0 ? 42 : 52}% ${pc % 2 === 0 ? 46 : 56}%)`
  }
  return 'hsl(265 20% 44%)'
}

function qualityFromIntervals(third: number, fifth: number): ChordQuality {
  if (third === 4 && fifth === 7) return 'maj'
  if (third === 3 && fifth === 7) return 'min'
  if (third === 3 && fifth === 6) return 'dim'
  if (third === 4 && fifth === 8) return 'aug'
  return 'maj'
}

const QUALITY_SUFFIX: Record<ChordQuality, string> = { maj: '', min: 'm', dim: 'dim', aug: 'aug' }

export function degreeChord(tonicPc: number, mode: TreeMode, degree: number): TreeChord {
  const intervals = MODE_INTERVALS[mode]
  const at = (step: number) => tonicPc + intervals[((step % 7) + 7) % 7]! + 12 * Math.floor(step / 7)

  const root = at(degree)
  const third = at(degree + 2)
  const fifth = at(degree + 4)

  const quality = qualityFromIntervals(normalize(third - root), normalize(fifth - root))
  const rootPc = normalize(root)
  const romanBase = ROMAN_UPPER[degree]!
  const roman = quality === 'min' || quality === 'dim' ? romanBase.toLowerCase() : romanBase

  return {
    key: `${rootPc}-${quality}`,
    rootPc,
    quality,
    degree,
    roman: quality === 'dim' ? `${roman}°` : quality === 'aug' ? `${roman}+` : roman,
    name: `${TREE_NOTE_NAMES[rootPc]}${QUALITY_SUFFIX[quality]}`,
    color: chordColor(rootPc, quality),
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
  }
}

export function buildChordTree(options: BuildOptions): ChordTreeResult {
  const { tonicPc, mode, style, maxDepth } = options
  const maxNodes = options.maxNodes ?? 320
  const styleRules = STYLES.find((item) => item.id === style) ?? STYLES[0]!
  const rules = styleRules.rules

  // Палитра стиля: 7 диатонических ступеней + заимствованные аккорды (bVII, bIII, …).
  const palette: TreeChord[] = Array.from({ length: 7 }, (_, degree) => degreeChord(tonicPc, mode, degree))
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
    const nextIndexes = allowed.filter(
      (index) => index !== 0 && palette[index] && !usedKeys.has(palette[index]!.key),
    )

    for (const index of nextIndexes) {
      const child = expand(index, level + 1, [...path, chord])
      if (child) node.children.push(child)
    }

    if (!node.children.length && !node.canReturn) return null
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
export function chordMidiNotes(chord: TreeChord, octave = 4): number[] {
  const intervals = chord.quality === 'min'
    ? [0, 3, 7]
    : chord.quality === 'dim'
      ? [0, 3, 6]
      : chord.quality === 'aug'
        ? [0, 4, 8]
        : [0, 4, 7]
  const root = 12 * (octave + 1) + chord.rootPc
  return intervals.map((interval) => root + interval)
}

export function useChordTree() {
  return {
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
  }
}
