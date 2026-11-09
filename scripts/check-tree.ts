import {
  buildChordTree,
  chordColor,
  countLeaves,
  degreeChord,
  flattenTree,
  STYLES,
  TREE_NOTE_NAMES,
} from '../app/composables/useChordTree.ts'

let failed = 0
const check = (name: string, ok: boolean, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)
}

// центральный аккорд C-мажор
for (const style of STYLES) {
  const { root, totalNodes, maxLevel } = buildChordTree({ tonicPc: 0, mode: 'major', style: style.id, maxDepth: 3 })
  const nodes = flattenTree(root)
  check(`${style.id}: центр = C`, root.chord.name === 'C', root.chord.name)
  check(`${style.id}: есть ветвление`, totalNodes > 3, `${totalNodes} узлов`)
  check(`${style.id}: глубина ≤ 2 шага`, maxLevel <= 2, `maxLevel=${maxLevel}`)
  check(`${style.id}: без повторов аккорда в пути`,
    nodes.every((n) => new Set(n.path.map((c) => c.key)).size === n.path.length))
  check(`${style.id}: каждый лист умеет вернуться на центр`,
    nodes.filter((n) => n.children.length === 0).every((n) => n.canReturn))
  check(`${style.id}: длина ветки не больше глубины`,
    nodes.every((n) => n.path.length <= 3))
  check(`${style.id}: id уникальны`, new Set(nodes.map((n) => n.id)).size === nodes.length)
}

// диапазоны размеров по глубине (для читаемости схемы)
for (const depth of [2, 3, 4]) {
  const { totalNodes, root } = buildChordTree({ tonicPc: 0, mode: 'major', style: 'functional', maxDepth: depth })
  console.log(`   depth=${depth}: узлов ${totalNodes}, листьев ${countLeaves(root)}`)
  check(`functional depth=${depth}: ≤ 90 узлов`, totalNodes <= 90, `${totalNodes}`)
}

// диатоника: в C-мажоре по правилам функциональной гармонии только белые клавиши
const { root: cRoot } = buildChordTree({ tonicPc: 0, mode: 'major', style: 'functional', maxDepth: 4 })
const diatonic = new Set([0, 2, 4, 5, 7, 9, 11])
check('C-мажор: все аккорды диатоничны', flattenTree(cRoot).every((n) => diatonic.has(n.chord.rootPc)))

// a-moll: центральный аккорд Am
const am = buildChordTree({ tonicPc: 9, mode: 'natural_minor', style: 'pop', maxDepth: 3 })
check('a-moll: центр = Am', am.root.chord.name === 'Am', am.root.chord.name)
check('a-moll: у Am минорный цвет', am.root.chord.quality === 'min')

// заимствованные ступени: рок должен давать bVII и bIII в C-мажоре
const rock = buildChordTree({ tonicPc: 0, mode: 'major', style: 'rock', maxDepth: 4 })
const rockNames = new Set(flattenTree(rock.root).map((n) => n.chord.name))
check('рок: есть bVII (Bb)', rockNames.has('Bb'), [...rockNames].join(','))
check('рок: есть bIII (Eb)', rockNames.has('Eb'))
check('рок: заимствованные помечены ступенью bVII',
  flattenTree(rock.root).some((n) => n.chord.roman === 'bVII'))
check('блюз: есть bVII (Bb)', flattenTree(buildChordTree({ tonicPc: 0, mode: 'major', style: 'blues', maxDepth: 4 }).root)
  .some((n) => n.chord.roman === 'bVII'))

// расширение рока и блюза: ветвей заметно больше, чем в исходной версии
const bluesD4 = buildChordTree({ tonicPc: 0, mode: 'major', style: 'blues', maxDepth: 4 })
check('блюз: глубина 4 даёт ≥ 15 узлов', bluesD4.totalNodes >= 15, `${bluesD4.totalNodes}`)
check('рок: глубина 4 даёт ≥ 25 узлов', rock.totalNodes >= 25, `${rock.totalNodes}`)
check('блюз: последовательности до 4 аккордов', bluesD4.maxLevel + 1 >= 3, `уровней ${bluesD4.maxLevel + 1}`)

// цвета
const cMaj = chordColor(0, 'maj')
const cMin = chordColor(0, 'min')
const dMaj = chordColor(2, 'maj')
check('C и Cm — разные цвета (тёплый/холодный)', cMaj !== cMin, `${cMaj} / ${cMin}`)
check('C и D — разные цвета', cMaj !== dMaj, `${cMaj} / ${dMaj}`)
const hue = (c: string) => Number(c.match(/hsl\((\d+)/)![1])
const isWarm = (h: number) => h >= 315 || h <= 90
const isCool = (h: number) => h >= 160 && h <= 290
check('мажор — тёплые оттенки', isWarm(hue(cMaj)), `${hue(cMaj)}°`)
check('минор — холодные оттенки', isCool(hue(cMin)), `${hue(cMin)}°`)
check('все 12 мажоров тёплые, все 12 миноров холодные',
  Array.from({ length: 12 }, (_, pc) => isWarm(hue(chordColor(pc, 'maj')))).every(Boolean)
  && Array.from({ length: 12 }, (_, pc) => isCool(hue(chordColor(pc, 'min')))).every(Boolean))
check('цвет зависит только от аккорда (стабилен)',
  chordColor(0, 'maj') === chordColor(0, 'maj') && chordColor(0, 'maj') === chordColor(12, 'maj'))

// трезвучия ступеней C-мажора
const chords = Array.from({ length: 7 }, (_, d) => degreeChord(0, 'major', d))
check('C-мажор: I, IV, V мажорные', [0, 3, 4].every((d) => chords[d]!.quality === 'maj'))
check('C-мажор: ii, iii, vi минорные', [1, 2, 5].every((d) => chords[d]!.quality === 'min'))
check('C-мажор: vii° уменьшённый', chords[6]!.quality === 'dim')
check('C-мажор: названия I–VII корректны',
  chords.map((c) => c.name).join(',') === 'C,Dm,Em,F,G,Am,Bdim', chords.map((c) => c.name).join(','))

// гармонический минор даёт мажорную доминанту
const hm = Array.from({ length: 7 }, (_, d) => degreeChord(9, 'harmonic_minor', d))
check('a гарм. минор: V = E (мажор)', hm[4]!.name === 'E', hm[4]!.name)
check('ноты не выходят за 12 названий', TREE_NOTE_NAMES.length === 12)

console.log(failed ? `\n${failed} failing` : '\nall passed')
if (failed) (globalThis as unknown as { process: { exit(code: number): void } }).process.exit(1)
