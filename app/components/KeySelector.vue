<script setup lang="ts">
import { useCircleOfFifths } from '~/composables/useCircleOfFifths'
import type { Mode } from '~/composables/useCircleOfFifths'

const { circleNotes, tonic, setTonic, mode, setMode, selectKey, selectMode } = useCircleOfFifths()

const modes: { value: Mode; label: string }[] = [
  { value: 'major', label: 'Мажор' },
  { value: 'natural_minor', label: 'Натур. минор' },
  { value: 'harmonic_minor', label: 'Гарм. минор' },
  { value: 'melodic_minor', label: 'Мел. минор' },
]
</script>

<template>
  <div class="key-selector">
    <label class="selector-label">Тоника</label>
    <div class="tonic-grid">
      <button
        v-for="n in circleNotes" :key="n.index"
        :class="['tonic-btn', { 'tonic-btn--active': tonic === n.index }]"
        @click="setTonic(n.index); selectKey()"
      >
        {{ n.note.name }}
      </button>
    </div>

    <label class="selector-label">Лад</label>
    <div class="mode-grid">
      <button
        v-for="m in modes" :key="m.value"
        :class="['mode-btn', { 'mode-btn--active': mode === m.value }]"
        @click="setMode(m.value); selectMode()"
      >
        {{ m.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.key-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selector-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tonic-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tonic-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background);
  color: var(--foreground);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.tonic-btn:hover {
  background: var(--muted);
}

.tonic-btn--active {
  background: var(--accent);
  color: var(--accent-foreground);
  border-color: var(--accent);
}

.mode-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mode-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background);
  color: var(--foreground);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-btn:hover {
  background: var(--muted);
}

.mode-btn--active {
  background: var(--accent);
  color: var(--accent-foreground);
  border-color: var(--accent);
}
</style>
