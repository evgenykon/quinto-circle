<script setup lang="ts">
const props = defineProps<{
  frets: (number | null)[]
  startFret?: number
}>()

const FRETS = 5
const start = computed(() => props.startFret ?? 1)

const markers = computed(() =>
  props.frets.map((fret) => (fret === null ? '×' : fret === 0 ? '○' : '')),
)

interface Dot {
  key: string
  index: number
  left: number
  top: number
  fret: number
}

const dots = computed<Dot[]>(() => {
  const result: Dot[] = []
  props.frets.forEach((fret, index) => {
    if (fret === null || fret < 1) return
    if (fret < start.value || fret > start.value + FRETS - 1) return
    result.push({
      key: `${index}-${fret}`,
      index,
      left: index * 20,
      top: ((fret - start.value + 0.5) / FRETS) * 100,
      fret,
    })
  })
  return result
})

const fretLines = computed(() => Array.from({ length: FRETS }, (_, i) => ((i + 1) / FRETS) * 100))
</script>

<template>
  <div class="diagram">
    <div class="markers">
      <span v-for="(marker, index) in markers" :key="`m-${index}`" class="marker">{{ marker }}</span>
    </div>

    <div class="board">
      <div class="nut" />
      <div
        v-for="(top, index) in fretLines"
        :key="`f-${index}`"
        class="fret"
        :style="{ top: `${top}%` }"
      />
      <div
        v-for="(_, index) in frets"
        :key="`s-${index}`"
        class="string"
        :style="{ left: `${index * 20}%`, width: `${1.8 - index * 0.2}px` }"
      />
      <div
        v-for="dot in dots"
        :key="dot.key"
        class="dot"
        :style="{ left: `${dot.left}%`, top: `${dot.top}%` }"
      >
        {{ dot.fret }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.diagram {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 2px 6px 4px;
  box-sizing: border-box;
}

.markers {
  display: flex;
  justify-content: space-between;
  height: 18%;
  align-items: center;
  padding: 0 2%;
}

.marker {
  width: 16%;
  text-align: center;
  font-size: 0.62em;
  line-height: 1;
  color: var(--muted-foreground);
}

.board {
  position: relative;
  flex: 1;
  margin: 0 2% 0 2%;
  border-bottom: 1px solid var(--muted-foreground);
}

.nut {
  position: absolute;
  left: -2%;
  right: -2%;
  top: 0;
  height: 3px;
  background: var(--foreground);
  border-radius: 1px;
}

.fret {
  position: absolute;
  left: -2%;
  right: -2%;
  height: 1px;
  background: var(--border);
}

.string {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--muted-foreground) 65%, transparent);
}

.dot {
  position: absolute;
  width: 1.5em;
  height: 1.5em;
  margin-left: -0.75em;
  margin-top: -0.75em;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-foreground);
  font-size: 0.62em;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
