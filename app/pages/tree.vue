<script setup lang="ts">
import {
  MAJOR_MODES,
  MINOR_MODES,
  MODE_LABELS,
  STYLES,
  TREE_NOTE_NAMES,
  buildChordTree,
  chordMidiNotes,
  tonicChord,
  type StyleId,
  type TreeMode,
  type TreeNode,
} from '~/composables/useChordTree'
import { useAudioEngine } from '~/composables/useAudioEngine'

useHead({ title: 'Дерево аккордов — quinto-circle' })

const tonicPc = ref(0)
const quality = ref<'maj' | 'min'>('maj')
const mode = ref<TreeMode>('major')
const style = ref<StyleId>('functional')
const depth = ref(3)
const selectedId = ref<string | null>(null)

const { playNotes, stop } = useAudioEngine()

const availableModes = computed(() => (quality.value === 'maj' ? MAJOR_MODES : MINOR_MODES))

watch(quality, (value) => {
  const allowed = value === 'maj' ? MAJOR_MODES : MINOR_MODES
  if (!allowed.includes(mode.value)) mode.value = allowed[0]!
})

const tree = computed(() =>
  buildChordTree({ tonicPc: tonicPc.value, mode: mode.value, style: style.value, maxDepth: depth.value }),
)

const center = computed(() => tonicChord(tonicPc.value, mode.value))

const selectedPath = computed(() => {
  const flat: TreeNode[] = []
  const walk = (node: TreeNode) => {
    flat.push(node)
    node.children.forEach(walk)
  }
  walk(tree.value.root)
  return flat.find((node) => node.id === selectedId.value)?.path ?? [center.value]
})

const styleInfo = computed(() => STYLES.find((item) => item.id === style.value))

const select = (node: TreeNode) => {
  selectedId.value = node.id === selectedId.value ? null : node.id
  stop()
  playNotes('piano', chordMidiNotes(node.chord), 1.3)
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
        <span class="field-label">Глубина</span>
        <select v-model.number="depth" class="select select--note">
          <option :value="2">2 аккорда</option>
          <option :value="3">3 аккорда</option>
          <option :value="4">4 аккорда</option>
        </select>
      </label>

      <button type="button" class="button" @click="reset">Сброс</button>
    </section>

    <main class="tree-area">
      <ChordTree :root="tree.root" :selected-id="selectedId" @select="select" />
    </main>

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
  width: 100%;
  min-height: 100vh;
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

.tree-area {
  position: relative;
  flex: 1;
  min-height: 380px;
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
