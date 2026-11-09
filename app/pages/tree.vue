<script setup lang="ts">
import {
  chordFingering,
  fingeringWindow,
  MAJOR_MODES,
  MINOR_MODES,
  MODE_LABELS,
  MOOD_LABELS,
  STYLES,
  TREE_NOTE_NAMES,
  buildChordTree,
  chordMidiNotes,
  tonicChord,
  type ChordMood,
  type StyleId,
  type TreeMode,
  type TreeNode,
} from '~/composables/useChordTree'
import { STANDARD_TUNING } from '~/composables/useChordDetector'
import { useAudioEngine } from '~/composables/useAudioEngine'

useHead({ title: 'Дерево аккордов — quinto-circle' })

const tonicPc = ref(0)
const quality = ref<'maj' | 'min'>('maj')
const mode = ref<TreeMode>('major')
const style = ref<StyleId>('functional')
const depth = ref(3)
const sevenths = ref(false)
const mood = ref<ChordMood | 'any'>('any')
const selectedId = ref<string | null>(null)

const { playNotes, stop } = useAudioEngine()

const availableModes = computed(() => (quality.value === 'maj' ? MAJOR_MODES : MINOR_MODES))

watch(quality, (value) => {
  const allowed = value === 'maj' ? MAJOR_MODES : MINOR_MODES
  if (!allowed.includes(mode.value)) mode.value = allowed[0]!
})

const styleInfo = computed(() => STYLES.find((item) => item.id === style.value))

const allNodes = computed(() => {
  const flat: TreeNode[] = []
  const walk = (node: TreeNode) => {
    flat.push(node)
    node.children.forEach(walk)
  }
  walk(tree.value.root)
  return flat
})

const selectedNode = computed(() => allNodes.value.find((node) => node.id === selectedId.value) ?? null)

const fingering = computed(() =>
  selectedNode.value ? chordFingering(selectedNode.value.chord, STANDARD_TUNING) : null,
)

const fingeringStart = computed(() => (fingering.value ? fingeringWindow(fingering.value) : 1))

watch(style, () => {
  sevenths.value = styleInfo.value?.chords === 'sevenths'
})

const tree = computed(() =>
  buildChordTree({
    tonicPc: tonicPc.value,
    mode: mode.value,
    style: style.value,
    maxDepth: depth.value,
    sevenths: sevenths.value,
    mood: mood.value,
  }),
)

const isEmpty = computed(() => tree.value.root.children.length === 0)

const center = computed(() => tonicChord(tonicPc.value, mode.value))

const selectedPath = computed(() => selectedNode.value?.path ?? [center.value])

const chordWord = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'аккорд'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'аккорда'
  return 'аккордов'
}

const select = (node: TreeNode) => {
  selectedId.value = node.id === selectedId.value ? null : node.id
  // Клик только показывает аккорд на грифе; звук — по кнопке «Сыграть».
  stop()
}

let timers: number[] = []

const playPath = () => {
  stop()
  timers.forEach((id) => clearTimeout(id))
  timers = []
  selectedPath.value.forEach((chord, index) => {
    timers.push(window.setTimeout(() => {
      playNotes('piano', chordMidiNotes(chord), 0.6)
    }, index * 550))
  })
}

const reset = () => {
  selectedId.value = null
  stop()
}

onBeforeUnmount(() => {
  timers.forEach((id) => clearTimeout(id))
  stop()
})
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-titles">
        <h1 class="title">Дерево аккордов</h1>
        <p class="subtitle">
          От центрального аккорда расходятся допустимые последовательности; ветка заканчивается аккордом,
          из которого можно вернуться на центральный (пунктир).
        </p>
      </div>
      <nav class="nav">
        <NuxtLink to="/" class="nav-link">← Квинтовый круг</NuxtLink>
        <NuxtLink to="/chords" class="nav-link">Определить аккорд</NuxtLink>
      </nav>
    </header>

    <section class="controls">
      <label class="field">
        <span class="field-label">Центральный аккорд</span>
        <span class="field-row">
          <select v-model.number="tonicPc" class="select select--note">
            <option v-for="(name, index) in TREE_NOTE_NAMES" :key="name" :value="index">{{ name }}</option>
          </select>
          <select v-model="quality" class="select">
            <option value="maj">мажор</option>
            <option value="min">минор</option>
          </select>
        </span>
      </label>

      <label class="field">
        <span class="field-label">Лад</span>
        <select v-model="mode" class="select">
          <option v-for="item in availableModes" :key="item" :value="item">{{ MODE_LABELS[item] }}</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Стиль</span>
        <select v-model="style" class="select">
          <option v-for="item in STYLES" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Аккорды</span>
        <select v-model="sevenths" class="select">
          <option :value="false">Трезвучия</option>
          <option :value="true">Септаккорды</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Настроение</span>
        <select v-model="mood" class="select">
          <option v-for="(label, value) in MOOD_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Глубина</span>
        <select v-model.number="depth" class="select select--note">
          <option v-for="value in 7" :key="value" :value="value + 1">
            {{ value + 1 }} {{ chordWord(value + 1) }}
          </option>
        </select>
      </label>

      <button type="button" class="button" @click="reset">Сброс</button>
    </section>

    <div class="workspace">
      <ChordTree class="tree-area" :root="tree.root" :selected-id="selectedId" @select="select" />

      <aside class="chord-card">
        <template v-if="selectedNode && fingering">
          <div class="chord-head">
            <span class="chord-name" :style="{ color: selectedNode.chord.color }">
              {{ selectedNode.chord.name }}
            </span>
            <span class="chord-roman">{{ selectedNode.chord.roman }}</span>
          </div>
          <div class="chord-neck">
            <GuitarNeck
              :model-value="fingering"
              :tuning="STANDARD_TUNING"
              readonly
              :initial-fret="fingeringStart"
            />
          </div>
        </template>
        <p v-else class="chord-empty">Кликни по аккорду — покажу его на грифе</p>
      </aside>
    </div>

    <p v-if="isEmpty" class="empty">
      Для этого настроения в выбранном стиле нет последовательностей — ослабь фильтр или смени стиль.
    </p>

    <footer class="footer">
      <div class="path">
        <span class="path-label">Последовательность</span>
        <div class="path-chords">
          <template v-for="(chord, index) in selectedPath" :key="`${chord.key}-${index}`">
            <span v-if="index > 0" class="path-arrow">→</span>
            <span class="chip" :style="{ borderColor: chord.color }">
              <span class="chip-dot" :style="{ background: chord.color }" />
              {{ chord.name }}
              <span class="chip-roman">{{ chord.roman }}</span>
            </span>
          </template>
          <span v-if="selectedPath.length > 1" class="path-arrow path-arrow--return">↩</span>
          <span v-if="selectedPath.length > 1" class="chip chip--muted">{{ selectedPath[0]?.name }}</span>
        </div>
      </div>

      <div class="footer-right">
        <span class="legend">
          <span class="legend-item"><span class="legend-dot legend-dot--major" /> мажор</span>
          <span class="legend-item"><span class="legend-dot legend-dot--minor" /> минор</span>
        </span>
        <button type="button" class="button button--primary" :disabled="selectedPath.length < 2" @click="playPath">
          Сыграть
        </button>
      </div>

      <p class="hint">{{ styleInfo?.description }} Узлов: {{ tree.totalNodes }}.</p>
    </footer>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 620px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px 16px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.header-titles {
  max-width: 720px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--muted-foreground);
}

.nav {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.nav-link {
  font-size: 13px;
  color: var(--muted-foreground);
  text-decoration: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 12px;
  white-space: nowrap;
  transition: all 0.15s;
}

.nav-link:hover {
  color: var(--foreground);
  background: var(--muted);
}

.controls {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-row {
  display: flex;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  color: var(--muted-foreground);
}

.select {
  padding: 7px 9px;
  font-size: 13px;
  color: var(--foreground);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.select--note {
  min-width: 76px;
}

.workspace {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
}

.tree-area {
  flex: 1;
  min-height: 0;
}

.chord-card {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  min-height: 0;
}

.chord-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.chord-name {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.chord-roman {
  font-size: 12px;
  color: var(--muted-foreground);
}

.chord-empty {
  margin: auto;
  font-size: 12px;
  text-align: center;
  color: var(--muted-foreground);
}

.chord-neck {
  position: relative;
  height: 440px;
  margin: auto 0;
}

.empty {
  position: absolute;
  left: 50%;
  top: 46%;
  transform: translate(-50%, -50%);
  margin: 0;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--background);
  font-size: 13px;
  color: var(--muted-foreground);
  text-align: center;
  max-width: 420px;
}

.footer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.path {
  flex: 1;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.path-label {
  font-size: 11px;
  color: var(--muted-foreground);
}

.path-chords {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.path-arrow {
  color: var(--muted-foreground);
  font-size: 12px;
}

.path-arrow--return {
  margin-left: 4px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.chip--muted {
  opacity: 0.6;
  border-style: dashed;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chip-roman {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.legend {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--muted-foreground);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot--major {
  background: hsl(28 82% 58%);
}

.legend-dot--minor {
  background: hsl(204 45% 50%);
}

.button {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.15s;
}

.button:hover:not(:disabled) {
  background: var(--muted);
}

.button--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-foreground);
}

.button:disabled {
  opacity: 0.4;
  cursor: default;
}

.hint {
  flex: 1 1 100%;
  margin: 0;
  font-size: 11px;
  color: var(--muted-foreground);
}
</style>
