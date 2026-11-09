<script setup lang="ts">
import {
  TUNINGS,
  STANDARD_TUNING,
  detectChord,
  midiToLabel,
} from '~/composables/useChordDetector'
import { useAudioEngine } from '~/composables/useAudioEngine'

useHead({ title: 'Определить аккорд — quinto-circle' })

const strings = ref<(number | null)[]>([null, null, null, null, null, null])
const tuningId = ref(TUNINGS[0]!.id)
const tuning = ref<number[]>([...STANDARD_TUNING])

const { playNotes, stop } = useAudioEngine()

const result = computed(() => detectChord(strings.value, tuning.value))

const playedMidi = computed(() =>
  strings.value.flatMap((fret, index) => (fret === null ? [] : [tuning.value[index]! + fret])),
)

const applyPreset = (id: string) => {
  tuningId.value = id
  const preset = TUNINGS.find((item) => item.id === id)
  if (preset) tuning.value = [...preset.midi]
}

/** ±5 semitones around the standard tuning of each string. */
const tuningOptions = (index: number) => {
  const base = STANDARD_TUNING[index]!
  return Array.from({ length: 11 }, (_, i) => base - 5 + i)
}

const setStringTuning = (index: number, value: string) => {
  const next = [...tuning.value]
  next[index] = Number(value)
  tuning.value = next
  tuningId.value = 'custom'
}

const reset = () => {
  strings.value = [null, null, null, null, null, null]
  stop()
}

const play = () => {
  if (!playedMidi.value.length) return
  stop()
  playNotes('guitar', playedMidi.value, 1.6)
}

const playSingle = (midi: number) => {
  stop()
  playNotes('guitar', [midi], 1.1)
}
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-titles">
        <h1 class="title">Определить аккорд</h1>
        <p class="subtitle">Зажмите ноты на грифе — название аккорда построится автоматически</p>
      </div>
      <nav class="nav">
        <NuxtLink to="/" class="nav-link">← Квинтовый круг</NuxtLink>
        <NuxtLink to="/tree" class="nav-link">Дерево аккордов</NuxtLink>
      </nav>
    </header>

    <section class="result">
      <div class="result-name" :class="{ 'result-name--unknown': result?.unknown }">
        {{ result ? result.name : '—' }}
      </div>

      <div class="result-body">
        <p v-if="!result" class="result-hint">Выберите хотя бы одну струну</p>
        <template v-else>
          <p class="result-notes">
            <span v-for="note in result.notes" :key="note.name" class="note-chip">
              {{ note.name }}<span v-if="note.degree" class="note-degree">{{ note.degree }}</span>
            </span>
          </p>
          <p class="result-meta">
            Аппликатура: <code>{{ result.fingering }}</code>
            <template v-if="!result.exact && !result.unknown"> · неполный/расширенный состав</template>
          </p>
        </template>
      </div>

      <div class="actions">
        <button type="button" class="button button--primary" :disabled="!playedMidi.length" @click="play">
          Сыграть
        </button>
        <button type="button" class="button" @click="reset">Сброс</button>
      </div>
    </section>

    <main class="neck-area">
      <GuitarNeck v-model="strings" :tuning="tuning" @note="playSingle" />
    </main>

    <footer class="tuning-bar">
      <label class="field field--preset">
        <span class="field-label">Строй</span>
        <select class="select" :value="tuningId" @change="applyPreset(($event.target as HTMLSelectElement).value)">
          <option v-for="preset in TUNINGS" :key="preset.id" :value="preset.id">
            {{ preset.label }}
          </option>
          <option value="custom">Свой строй</option>
        </select>
      </label>

      <div class="tuning-grid">
        <label v-for="(midi, index) in tuning" :key="index" class="tuning-item">
          <span class="tuning-string">{{ 6 - index }} стр.</span>
          <select
            class="select select--small"
            :value="midi"
            @change="setStringTuning(index, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="option in tuningOptions(index)" :key="option" :value="option">
              {{ midiToLabel(option) }}
            </option>
          </select>
        </label>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 24px 18px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
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

.result {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
}

.result-name {
  min-width: 150px;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.result-name--unknown {
  font-size: 19px;
  font-weight: 700;
}

.result-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-hint {
  margin: 0;
  font-size: 13px;
  color: var(--muted-foreground);
}

.result-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
}

.note-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  padding: 3px 9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.note-degree {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.result-meta {
  margin: 0;
  font-size: 12px;
  color: var(--muted-foreground);
}

.result-meta code {
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--muted);
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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

.button--primary:hover:not(:disabled) {
  opacity: 0.85;
  background: var(--accent);
}

.button:disabled {
  opacity: 0.4;
  cursor: default;
}

.neck-area {
  position: relative;
  flex: 1;
  min-height: 400px;
}

.tuning-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--preset {
  flex: 0 0 230px;
}

.field-label {
  font-size: 12px;
  color: var(--muted-foreground);
}

.select {
  width: 100%;
  padding: 7px 9px;
  font-size: 13px;
  color: var(--foreground);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.select--small {
  padding: 5px 6px;
  font-size: 12px;
}

.tuning-grid {
  flex: 1;
  min-width: 260px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
}

.tuning-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tuning-string {
  font-size: 10px;
  text-align: center;
  color: var(--muted-foreground);
}

@media (max-width: 720px) {
  .result {
    flex-wrap: wrap;
    gap: 12px;
  }

  .result-name {
    min-width: 0;
  }

  .actions {
    width: 100%;
  }

  .field--preset {
    flex: 1 1 100%;
  }
}
</style>
