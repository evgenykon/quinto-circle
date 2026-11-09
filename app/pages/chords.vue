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
      <div>
        <h1 class="title">Определить аккорд</h1>
        <p class="subtitle">Зажмите ноты на грифе — название аккорда построится автоматически</p>
      </div>
      <NuxtLink to="/" class="nav-link">← Квинтовый круг</NuxtLink>
    </header>

    <div class="layout">
      <section class="panel panel--neck">
        <GuitarNeck v-model="strings" :tuning="tuning" @note="playSingle" />
      </section>

      <section class="panel panel--result">
        <div class="result">
          <p class="result-label">Аккорд</p>
          <p class="result-chord" :class="{ 'result-chord--unknown': result?.unknown }">
            {{ result ? result.name : '—' }}
          </p>
          <p v-if="!result" class="result-hint">Выберите хотя бы одну струну</p>
          <template v-else>
            <p class="result-notes">
              <span
                v-for="note in result.notes"
                :key="note.name"
                class="note-chip"
              >
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

        <div class="tuning">
          <label class="field">
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
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  padding: 32px 24px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--muted-foreground);
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

.layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.panel {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
}

.panel--neck {
  flex: 0 0 auto;
}

.panel--result {
  flex: 1 1 320px;
  min-width: 300px;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-label {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted-foreground);
}

.result-chord {
  margin: 6px 0 0;
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.result-chord--unknown {
  font-size: 22px;
  font-weight: 700;
}

.result-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--muted-foreground);
}

.result-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 0;
}

.note-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  padding: 4px 9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.note-degree {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.result-meta {
  margin: 12px 0 0;
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
}

.button {
  padding: 9px 16px;
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

.tuning {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
</style>
