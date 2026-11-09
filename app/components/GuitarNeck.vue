<script setup lang="ts">
import { midiToName } from '~/composables/useChordDetector'

const props = defineProps<{
  modelValue: (number | null)[]
  tuning: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: (number | null)[]]
  note: [midi: number, fret: number]
}>()

const TOTAL_FRETS = 15
const VISIBLE_FRETS = 4

const startFret = ref(1)
const maxStartFret = TOTAL_FRETS - VISIBLE_FRETS + 1

const STRING_GAP = 36
const LEFT = 52
const RIGHT = LEFT + STRING_GAP * 5
const WIDTH = RIGHT + 52
const NUT_Y = 78
const FRET_H = 56
const MARKER_Y = 38
const NECK_BOTTOM = NUT_Y + FRET_H * VISIBLE_FRETS
const HEIGHT = NECK_BOTTOM + 44

const INLAYS = [3, 5, 7, 9, 12, 15]

const visibleFrets = computed(() =>
  Array.from({ length: VISIBLE_FRETS }, (_, i) => startFret.value + i),
)

const stringX = (index: number) => LEFT + index * STRING_GAP
const fretY = (fret: number) => NUT_Y + (fret - startFret.value) * FRET_H
const cellCenterY = (fret: number) => fretY(fret) + FRET_H / 2

const stringWidth = (index: number) => 2.6 - index * 0.26

const fretOf = (index: number) => props.modelValue[index] ?? null

const isVisible = (fret: number) => fret >= startFret.value && fret < startFret.value + VISIBLE_FRETS

const markerLabel = (index: number) => {
  const fret = fretOf(index)
  if (fret === null) return '×'
  if (fret === 0) return '○'
  return String(fret)
}

const setStrings = (next: (number | null)[]) => emit('update:modelValue', next)

const selectFret = (index: number, fret: number) => {
  const next = [...props.modelValue]
  next[index] = next[index] === fret ? null : fret
  setStrings(next)
  if (next[index] !== null) emit('note', props.tuning[index] + next[index]!)
}

const muteString = (index: number) => {
  const next = [...props.modelValue]
  next[index] = null
  setStrings(next)
}

const toggleOpen = (index: number) => {
  const next = [...props.modelValue]
  const isOpen = next[index] === 0
  next[index] = isOpen ? null : 0
  setStrings(next)
  if (!isOpen) emit('note', props.tuning[index]!)
}

const shift = (direction: number) => {
  startFret.value = Math.min(maxStartFret, Math.max(1, startFret.value + direction))
}

const onWheel = (event: WheelEvent) => {
  const delta = event.deltaY || event.deltaX
  if (!delta) return
  event.preventDefault()
  shift(delta > 0 ? 1 : -1)
}

const cellNoteName = (index: number, fret: number) => midiToName(props.tuning[index] + fret)

interface NeckDot {
  index: number
  fret: number
}

const visibleDots = computed<NeckDot[]>(() =>
  props.modelValue.flatMap((fret, index) =>
    fret !== null && fret >= 1 && isVisible(fret) ? [{ index, fret }] : [],
  ),
)

/** Fretted notes scrolled out of the visible window. */
const hiddenDots = computed(() =>
  props.modelValue.flatMap((fret, index) => {
    if (fret === null || fret < 1 || isVisible(fret)) return []
    return [{ index, fret, above: fret < startFret.value }]
  }),
)
</script>

<template>
  <div class="neck">
    <div class="neck-toolbar">
      <span class="neck-range">Лады {{ startFret }}–{{ startFret + VISIBLE_FRETS - 1 }}</span>
      <div class="neck-arrows">
        <button type="button" class="neck-arrow" :disabled="startFret <= 1" @click="shift(-1)">▲</button>
        <button
          type="button"
          class="neck-arrow"
          :disabled="startFret >= maxStartFret"
          @click="shift(1)"
        >▼</button>
      </div>
    </div>

    <svg
      :width="WIDTH"
      :height="HEIGHT"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="neck-svg"
      @wheel="onWheel"
    >
      <!-- кликабельные ячейки ладов -->
      <g v-for="fret in visibleFrets" :key="`cells-${fret}`">
        <g v-for="(_, index) in tuning" :key="`cell-${fret}-${index}`">
          <rect
            :x="stringX(index) - STRING_GAP / 2"
            :y="fretY(fret)"
            :width="STRING_GAP"
            :height="FRET_H"
            class="cell"
            @click="selectFret(index, fret)"
            @contextmenu.prevent="muteString(index)"
          />
          <text
            v-if="fretOf(index) !== fret"
            :x="stringX(index)"
            :y="cellCenterY(fret)"
            class="cell-note"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {{ cellNoteName(index, fret) }}
          </text>
        </g>
      </g>

      <!-- ориентиры на грифе -->
      <g class="inlays">
        <template v-for="fret in INLAYS" :key="`inlay-${fret}`">
          <template v-if="isVisible(fret)">
            <circle
              v-if="fret !== 12"
              :cx="(LEFT + RIGHT) / 2"
              :cy="cellCenterY(fret)"
              r="5"
            />
            <template v-else>
              <circle
                :cx="(LEFT + RIGHT) / 2 - STRING_GAP * 0.9"
                :cy="cellCenterY(fret)"
                r="5"
              />
              <circle
                :cx="(LEFT + RIGHT) / 2 + STRING_GAP * 0.9"
                :cy="cellCenterY(fret)"
                r="5"
              />
            </template>
          </template>
        </template>
      </g>

      <!-- порожки -->
      <g class="frets">
        <line
          v-for="fret in visibleFrets"
          :key="`fret-${fret}`"
          :x1="LEFT - STRING_GAP / 2"
          :x2="RIGHT + STRING_GAP / 2"
          :y1="fretY(fret)"
          :y2="fretY(fret)"
        />
        <line
          :x1="LEFT - STRING_GAP / 2"
          :x2="RIGHT + STRING_GAP / 2"
          :y1="NECK_BOTTOM"
          :y2="NECK_BOTTOM"
        />
        <rect
          v-if="startFret === 1"
          :x="LEFT - STRING_GAP / 2"
          :y="NUT_Y - 4"
          :width="RIGHT - LEFT + STRING_GAP"
          height="5"
          class="nut"
        />
      </g>

      <!-- номера ладов -->
      <g class="fret-numbers">
        <text
          v-for="fret in visibleFrets"
          :key="`num-${fret}`"
          :x="LEFT - STRING_GAP / 2 - 14"
          :y="cellCenterY(fret)"
          text-anchor="middle"
          dominant-baseline="central"
        >
          {{ fret }}
        </text>
      </g>

      <!-- струны -->
      <g class="strings">
        <line
          v-for="(_, index) in tuning"
          :key="`string-${index}`"
          :x1="stringX(index)"
          :y1="NUT_Y"
          :x2="stringX(index)"
          :y2="NECK_BOTTOM"
          :stroke-width="stringWidth(index)"
        />
      </g>

      <!-- выбранные ноты -->
      <g class="dots">
        <template v-for="dot in visibleDots" :key="`dot-${dot.index}`">
          <circle
            :cx="stringX(dot.index)"
            :cy="cellCenterY(dot.fret)"
            r="14"
            class="dot"
            @click="selectFret(dot.index, dot.fret)"
            @contextmenu.prevent="muteString(dot.index)"
          />
          <text
            :x="stringX(dot.index)"
            :y="cellCenterY(dot.fret)"
            class="dot-label"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {{ dot.fret }}
          </text>
        </template>
      </g>

      <!-- подсказка: зажатая нота вне видимого окна -->
      <g class="hidden-dots">
        <text
          v-for="dot in hiddenDots"
          :key="`hidden-${dot.index}`"
          :x="stringX(dot.index)"
          :y="dot.above ? NUT_Y - 16 : NECK_BOTTOM + 10"
          text-anchor="middle"
          dominant-baseline="central"
        >
          {{ dot.above ? '↑' : '↓' }}{{ dot.fret }}
        </text>
      </g>

      <!-- открытые / заглушённые / вынесенные за окно струны -->
      <g class="markers">
        <g
          v-for="(fret, index) in modelValue"
          :key="`marker-${index}`"
          class="marker"
          @click="toggleOpen(index)"
          @contextmenu.prevent="muteString(index)"
        >
          <circle
            :cx="stringX(index)"
            :cy="MARKER_Y"
            r="12"
            :class="['marker-bg', { 'marker-bg--on': fret !== null }]"
          />
          <text
            :x="stringX(index)"
            :y="MARKER_Y"
            class="marker-label"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {{ markerLabel(index) }}
          </text>
        </g>
      </g>

      <!-- названия струн -->
      <g class="string-names">
        <text
          v-for="(midi, index) in tuning"
          :key="`name-${index}`"
          :x="stringX(index)"
          :y="NECK_BOTTOM + 30"
          text-anchor="middle"
        >
          {{ midiToName(midi) }}
        </text>
      </g>
    </svg>

    <p class="neck-hint">
      Клик по ладу — зажать струну, повторный клик — снять. Колесо мыши или ▲▼ — двигать окно по грифу.
      Правый клик — заглушить струну. Верхний ряд: ○ — открытая струна, × — не играет.
    </p>
  </div>
</template>

<style scoped>
.neck {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.neck-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.neck-range {
  font-size: 13px;
  color: var(--muted-foreground);
}

.neck-arrows {
  display: flex;
  gap: 6px;
}

.neck-arrow {
  width: 28px;
  height: 24px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--foreground);
  font-size: 11px;
  cursor: pointer;
}

.neck-arrow:hover:not(:disabled) {
  background: var(--muted);
}

.neck-arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

.neck-svg {
  display: block;
  user-select: none;
  touch-action: none;
}

.cell {
  fill: transparent;
  cursor: pointer;
  transition: fill 0.12s;
}

.cell:hover {
  fill: var(--muted);
}

.cell-note {
  font-size: 10px;
  fill: var(--muted-foreground);
  pointer-events: none;
  user-select: none;
}

.inlays circle {
  fill: var(--border);
}

.frets line {
  stroke: var(--border);
  stroke-width: 1.5;
  pointer-events: none;
}

.nut {
  fill: var(--foreground);
  pointer-events: none;
}

.fret-numbers text {
  font-size: 10px;
  fill: var(--muted-foreground);
  pointer-events: none;
}

.strings line {
  stroke: var(--foreground);
  stroke-opacity: 0.55;
  pointer-events: none;
}

.dot {
  fill: var(--accent);
  cursor: pointer;
}

.dot-label {
  font-size: 12px;
  font-weight: 700;
  fill: var(--accent-foreground);
  pointer-events: none;
  user-select: none;
}

.hidden-dots text {
  font-size: 9px;
  font-weight: 700;
  fill: var(--accent);
  pointer-events: none;
  user-select: none;
}

.marker {
  cursor: pointer;
}

.marker-bg {
  fill: var(--background);
  stroke: var(--border);
  stroke-width: 1.5;
  transition: all 0.15s;
}

.marker:hover .marker-bg {
  stroke: var(--foreground);
}

.marker-bg--on {
  fill: var(--muted);
  stroke: var(--foreground);
}

.marker-label {
  font-size: 11px;
  font-weight: 700;
  fill: var(--foreground);
  pointer-events: none;
  user-select: none;
}

.string-names text {
  font-size: 11px;
  font-weight: 600;
  fill: var(--muted-foreground);
  pointer-events: none;
}

.neck-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted-foreground);
  max-width: 320px;
}
</style>
