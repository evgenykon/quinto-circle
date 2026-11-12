<script setup lang="ts">
import { STANDARD_TUNING } from '~/composables/useChordDetector'
import { detectChord } from '~/composables/useChordDetector'
import type { ChordDiagramData } from '~/composables/useNotebook'

const props = defineProps<{ diagram: ChordDiagramData | null }>()
const emit = defineEmits<{
  apply: [diagram: ChordDiagramData]
  cancel: []
}>()

const strings = ref<(number | null)[]>(
  props.diagram ? [...props.diagram.frets] : [null, null, null, null, null, null],
)
const name = ref(props.diagram?.name ?? '')
const touched = ref(false)

const detected = computed(() => detectChord(strings.value, STANDARD_TUNING)?.name ?? '')

watch(detected, (value) => {
  if (!touched.value) name.value = value
})

const played = computed(() => strings.value.some((fret) => fret !== null))

const apply = () => {
  const frets = [...strings.value]
  const playedFrets = frets.filter((fret): fret is number => fret !== null && fret >= 1)
  const startFret = playedFrets.length ? Math.max(1, Math.min(...playedFrets)) : 1
  emit('apply', { frets, name: name.value || detected.value, startFret: Math.min(startFret, 8) })
}

const clear = () => {
  strings.value = [null, null, null, null, null, null]
  name.value = ''
  touched.value = false
}
</script>

<template>
  <div class="picker">
    <div class="neck-wrap">
      <GuitarNeck v-model="strings" :tuning="STANDARD_TUNING" />
    </div>

    <div class="side">
      <label class="field">
        <span class="field-label">Название</span>
        <input
          v-model="name"
          class="input"
          type="text"
          placeholder="определится автоматически"
          @input="touched = true"
        >
      </label>

      <p class="detected">
        Определено: <strong>{{ detected || '—' }}</strong>
      </p>

      <div class="actions">
        <button type="button" class="button" @click="clear">Очистить</button>
        <button type="button" class="button" @click="emit('cancel')">Отмена</button>
        <button type="button" class="button button--primary" :disabled="!played" @click="apply">
          Применить
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  gap: 18px;
  align-items: stretch;
  flex-wrap: wrap;
}

.neck-wrap {
  position: relative;
  width: 340px;
  height: 430px;
  flex: 0 0 auto;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 220px;
  flex: 1;
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

.input {
  padding: 8px 10px;
  font-size: 14px;
  color: var(--foreground);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.detected {
  margin: 0;
  font-size: 12px;
  color: var(--muted-foreground);
}

.detected strong {
  color: var(--foreground);
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

.button {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
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
</style>
