<script setup lang="ts">
import { midiToName } from '~/composables/useChordDetector'

const props = defineProps<{
  modelValue: (number | null)[]
  tuning: number[]
  /** Только показ аппликатуры: без кликов, маркеров и подсказки. */
  readonly?: boolean
  /** Стартовый лад видимого окна. */
  initialFret?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: (number | null)[]]
  note: [midi: number, fret: number]
}>()

const TOTAL_FRETS = 15
const VISIBLE_FRETS = 5

const startFret = ref(props.initialFret ?? 1)
const maxStartFret = TOTAL_FRETS - VISIBLE_FRETS + 1

watch(
  () => props.initialFret,
  (value) => {
    if (value && value >= 1) startFret.value = Math.min(maxStartFret, value)
  },
)

const LEFT = 52
const NUT_Y = 78
const MARKER_Y = 38
const FOOT = 44
const MIN_FRET_H = 44

const canvas = ref<HTMLElement | null>(null)
const canvasHeight = ref(0)

let observer: ResizeObserver | null = null

onMounted(() => {
  const measure = () => {
    canvasHeight.value = canvas.value?.clientHeight ?? 0
  }
  if (canvas.value) {
    observer = new ResizeObserver(measure)
    observer.observe(canvas.value)
  }
  measure()
})

onBeforeUnmount(() => observer?.disconnect())

/** The neck fills the available page height, so the four visible frets stretch with it. */
const fretH = computed(() =>
  Math.max(MIN_FRET_H, (canvasHeight.value - NUT_Y - FOOT) / VISIBLE_FRETS),
)
const neckBottom = computed(() => NUT_Y + fretH.value * VISIBLE_FRETS)
const svgHeight = computed(() => neckBottom.value + FOOT)

const INLAYS = [3, 5, 7, 9, 12, 15]

const visibleFrets = computed(() =>
  Array.from({ length: VISIBLE_FRETS }, (_, i) => startFret.value + i),
)

/** Ширина грифа подстраивается под высоту, чтобы лады не выглядели вытянутыми. */
const stringGap = computed(() => Math.min(78, Math.max(36, fretH.value * 0.6)))
const neckRight = computed(() => LEFT + stringGap.value * 5)
const svgWidth = computed(() => neckRight.value + 52)

const stringX = (index: number) => LEFT + index * stringGap.value
const fretY = (fret: number) => NUT_Y + (fret - startFret.value) * fretH.value
const cellCenterY = (fret: number) => fretY(fret) + fretH.value / 2

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
  if (props.readonly) return
  const next = [...props.modelValue]
  next[index] = next[index] === fret ? null : fret
  setStrings(next)
  if (next[index] !== null) emit('note', props.tuning[index] + next[index]!)
}

const muteString = (index: number) => {
  if (props.readonly) return
  const next = [...props.modelValue]
  next[index] = null
  setStrings(next)
}

const toggleOpen = (index: number) => {
  if (props.readonly) return
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
  if (props.readonly) return
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
  <div class="neck" :style="{ width: `${svgWidth}px` }">
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

    <div ref="canvas" class="neck-canvas">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="neck-svg"
        @wheel="onWheel"
      >
      <!-- кликабельные ячейки ладов -->
      <g v-for="fret in visibleFrets" :key="`cells-${fret}`">
        <g v-for="(_, index) in tuning" :key="`cell-${fret}-${index}`">
          <rect
            :x="stringX(index) - stringGap / 2"
            :y="fretY(fret)"
            :width="stringGap"
            :height="fretH"
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
              :cx="(LEFT + neckRight) / 2"
              :cy="cellCenterY(fret)"
              r="5"
            />
            <template v-else>
              <circle
                :cx="(LEFT + neckRight) / 2 - stringGap * 0.9"
                :cy="cellCenterY(fret)"
                r="5"
              />
              <circle
                :cx="(LEFT + neckRight) / 2 + stringGap * 0.9"
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
          :x1="LEFT - stringGap / 2"
          :x2="neckRight + stringGap / 2"
          :y1="fretY(fret)"
          :y2="fretY(fret)"
        />
        <line
          :x1="LEFT - stringGap / 2"
          :x2="neckRight + stringGap / 2"
          :y1="neckBottom"
          :y2="neckBottom"
        />
        <rect
          v-if="startFret === 1"
          :x="LEFT - stringGap / 2"
          :y="NUT_Y - 4"
          :width="neckRight - LEFT + stringGap"
          height="5"
          class="nut"
        />
      </g>

      <!-- номера ладов -->
      <g class="fret-numbers">
        <text
          v-for="fret in visibleFrets"
          :key="`num-${fret}`"
          :x="LEFT - stringGap / 2 - 14"
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
          :y2="neckBottom"
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
          :y="dot.above ? NUT_Y - 16 : neckBottom + 10"
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
          :y="neckBottom + 30"
          text-anchor="middle"
        >
          {{ midiToName(midi) }}
        </text>
      </g>
      </svg>
    </div>

    <p v-if="!readonly" class="neck-hint">
      Клик по ладу — зажать струну, повторный клик — снять. Колесо мыши или ▲▼ — двигать окно по грифу.
      Правый клик — заглушить струну. Верхний ряд: ○ — открытая струна, × — не играет.
    </p>
  </div>
</template>

<style scoped>
.neck {
  /* Абсолютное растягивание: родитель (.neck-area) должен быть position: relative
     с ненулевой высотой — тогда гриф занимает всю доступную высоту страницы. */
  position: absolute;
  inset: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
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

.neck-canvas {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
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
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
  color: var(--muted-foreground);
}
</style>
