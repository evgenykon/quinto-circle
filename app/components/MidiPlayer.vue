<script setup lang="ts">
import { useCircleOfFifths } from '~/composables/useCircleOfFifths'
import { useAudioEngine } from '~/composables/useAudioEngine'
import type { Instrument, Style } from '~/composables/useAudioEngine'

const { scaleDegrees, mode, selectDegree, selection, progressionRoots, currentStep: sharedCurrentStep, CHROMATIC_NOTES, CIRCLE_ORDER } = useCircleOfFifths()
const { scheduleChord, scheduleMetronome, stop: audioStop, getCtx } = useAudioEngine()

const instrument = ref<Instrument>('piano')
const style = ref<Style>('chord')
const playing = ref(false)
const localCurrentStep = ref(-1)
const selectedPattern = ref(0)
const bpm = ref(100)
const metronomeOn = ref(false)

const instruments: { value: Instrument; label: string }[] = [
  { value: 'piano', label: 'Пианино' },
  { value: 'guitar', label: 'Гитара' },
  { value: 'organ', label: 'Орган' },
]

const styles: { value: Style; label: string }[] = [
  { value: 'chord', label: 'Аккорд' },
  { value: 'arpeggio', label: 'Арпеджио' },
]

const chordTypeLabel: Record<string, string> = {
  maj: '',
  min: 'm',
  dim: '°',
}

const patterns: { name: string; degrees: number[]; desc: string }[] = [
  { name: 'I–IV–V–I (классический)', degrees: [0, 3, 4, 0], desc: 'Основа классической гармонии. Полный функциональный оборот: тоника → субдоминанта → доминанта → тоника. Создаёт завершённое, устойчивое звучание.' },
  { name: 'I–V–vi–IV (поп)', degrees: [0, 4, 5, 3], desc: 'Стандартная поп-последовательность («золотая»). Используется в тысячах песен. Сочетает мажорную тонику и минорную субмедианту для эмоционального контраста.' },
  { name: 'I–vi–IV–V (50-е)', degrees: [0, 5, 3, 4], desc: 'Легендарная последовательность 1950-х (doo-wop). Использована в «Earth Angel», «Stand by Me» и множестве других хитов тёплое, ностальгическое звучание.' },
  { name: 'ii–V–I (джаз)', degrees: [1, 4, 0], desc: 'Главный джазовый оборот. ii создаёт лёгкое напряжение, V усиливает его, I разрешает. Основа бибопа и свинга. Играется с септимами и альтерациями.' },
  { name: 'I–IV–vi–V', degrees: [0, 3, 5, 4], desc: 'Вариация поп-прогрессии с субдоминантой на первом месте вместо тоники после IV. Создаёт более плавное движение, чем I–V–vi–IV.' },
  { name: 'vi–IV–I–V (поп-рок)', degrees: [5, 3, 0, 4], desc: 'Популярнейшая последовательность 2000-х. Начинается с минора (vi), что создаёт меланхоличный оттенок. Использована в «Someone Like You», «Hello» и др.' },
  { name: 'I–V–IV–I', degrees: [0, 4, 3, 0], desc: 'Простой рок-н-ролльный оборот. Доминанта переходит не в тонику, а в субдоминанту — классический обманный ход в блюз-роке.' },
  { name: 'I–ii–V–I', degrees: [0, 1, 4, 0], desc: 'Полный функциональный оборот с надстройкой: тоника → супертоника → доминанта → тоника. ii смягчает переход, добавляя джазовый оттенок.' },
  { name: 'I–IV–I–V', degrees: [0, 3, 0, 4], desc: 'Плагальное движение с возвратом к тонике. Выход из тоники в субдоминанту и обратно создаёт «церковное», хоральное звучание.' },
  { name: 'I–vi–ii–V (джазовый)', degrees: [0, 5, 1, 4], desc: 'Классический джазовый оборот (I–VI–II–V). Каждый аккорд — доминанта к следующему. Используется в стандартах и джазовых балладах.' },
  { name: 'I–iii–IV–V', degrees: [0, 2, 3, 4], desc: 'Восходящее движение по терциям. Медианта (iii) мягко связывает тонику с субдоминантой. Светлое, мажорное звучание.' },
  { name: 'I–vi–I–vi', degrees: [0, 5, 0, 5], desc: 'Качалка между мажором и минором. Создаёт эффект светотени, мажорная тоника сменяется минорной субмедиантой — и обратно.' },
  { name: 'I–IV–V–vi', degrees: [0, 3, 4, 5], desc: 'Классика с неожиданным финалом. После V слушатель ждёт тонику, но получает vi — прерванный оборот. Эффект неожиданности.' },
  { name: 'I–V–vi–V', degrees: [0, 4, 5, 4], desc: 'Доминанта возвращается дважды, создавая пульсацию. Типично для рока и поп-музыки 80-х (power ballads).' },
  { name: 'I–ii–vi–I', degrees: [0, 1, 5, 0], desc: 'Мягкое нисходящее движение. ii и vi — субдоминантовая и тоническая замены. Создаёт расслабленное, эмбиентное настроение.' },
  { name: 'I–IV–I–IV', degrees: [0, 3, 0, 3], desc: 'Плагальный минимализм. Два аккорда, бесконечное чередование тоники и субдоминанты. Используется в gospel, эмбиенте и минимализме.' },
  { name: 'V–I–IV–V', degrees: [4, 0, 3, 4], desc: 'Начинается с доминанты вместо тоники — «с конца». Создаёт ощущение, что мы входим в уже звучащую музыку.' },
  { name: 'I–IV–vi–IV', degrees: [0, 3, 5, 3], desc: 'Двойная субдоминанта. Возврат к IV после vi усиливает субдоминантовое звучание. Мягкое, обволакивающее движение.' },
  { name: 'I–V–vii°–I', degrees: [0, 4, 6, 0], desc: 'С уменьшённым вводным тоном. vii° создаёт сильное диссонантное тяготение в тонику. Романтическое, напряжённое звучание.' },
  { name: 'vi–IV–V–I', degrees: [5, 3, 4, 0], desc: 'Минорное начало с разрешением в мажорную тонику. vi придаёт оттенок грусти, который рассеивается на I.' },
  { name: 'I–vi–V–vi', degrees: [0, 5, 4, 5], desc: 'Бесконечное возвращение к минору. V постоянно разрешается не в тонику, а в vi — прерванный оборот на каждом шагу.' },
  { name: 'I–V–I–V', degrees: [0, 4, 0, 4], desc: 'Двухаккордная рок-пульсация. Тоника и доминанта чередуются как вдох-выдох. Основа блюза и раннего рок-н-ролла.' },
  { name: 'I–IV–vi–I', degrees: [0, 3, 5, 0], desc: 'Тоника → субдоминанта → минорная замена → тоника. Плавный спуск с возвратом. Кинематографичное звучание.' },
  { name: 'vi–V–IV–I', degrees: [5, 4, 3, 0], desc: 'Нисходящая последовательность от минора до мажора. Каждый шаг — спуск по тональности. Драматическое, эпическое звучание.' },
  { name: 'I–IV–V–vii°', degrees: [0, 3, 4, 6], desc: 'Доминанта переходит в уменьшённый vii° вместо тоники. Создаёт ощущение незавершённости, вопросительную интонацию.' },
  { name: 'ii–V–vi–I', degrees: [1, 4, 5, 0], desc: 'Джазовый оборот с обманом: после V ожидается тоника, но идёт vi (прерванный оборот). Красивый гармонический сюрприз.' },
  { name: 'I–V–ii–V', degrees: [0, 4, 1, 4], desc: 'Доминанта заменяет тонику на ii. Создаёт подвижную, «плывущую» гармонию. Характерно для лаунж и easy listening.' },
  { name: 'I–iii–vi–IV', degrees: [0, 2, 5, 3], desc: 'Восходящая последовательность по терциям. I → iii → vi → IV — плавное движение без резких скачков. Медитативное звучание.' },
  { name: 'IV–V–I–V', degrees: [3, 4, 0, 4], desc: 'Начинается с субдоминанты, что создаёт ощущение «уже начавшейся песни». V в конце зацикливает гармонию.' },
  { name: 'I–V–vi–I', degrees: [0, 4, 5, 0], desc: 'Простая трёхаккордовая последовательность. V → vi → I — неполный оборот с минорной вставкой между доминантой и тоникой.' },
  { name: 'vi–I–IV–vi', degrees: [5, 0, 3, 5], desc: 'Начинается минором, уходит в мажор и возвращается. Создаёт цикличное, кольцевое ощущение. Используется в инди-роке.' },
  { name: 'I–vi–iii–V', degrees: [0, 5, 2, 4], desc: 'Нисхождение по терциям: тоника → vi → iii → V. Плавное скольжение вниз. Тёплое, бархатное звучание.' },
  { name: 'I–ii–IV–V', degrees: [0, 1, 3, 4], desc: 'Субдоминанта берётся дважды — ii и IV. Усиление субдоминантовой функции перед финальной доминантой. Развёрнутый оборот.' },
  { name: 'V–vi–IV–I', degrees: [4, 5, 3, 0], desc: 'Начинается с доминанты, обманывает нас прерванным оборотом (V→vi), затем плавно приходит к тонике.' },
  { name: 'I–iii–vi–V', degrees: [0, 2, 5, 4], desc: 'Восходяще-нисходящее движение. I→iii (вверх), затем vi→V (вниз). Создаёт волнообразную гармоническую линию.' },
  { name: 'I–iii–IV–vi', degrees: [0, 2, 3, 5], desc: 'Медианта связывает тонику с субдоминантой, а финал в vi придаёт минорный оттенок. Неожиданный поворот.' },
  { name: 'I–ii–V–vi', degrees: [0, 1, 4, 5], desc: 'Полный функциональный оборот с финалом в vi вместо I. Прерванный каданс на каждом повторе даёт чувство «бесконечного развития».' },
  { name: 'V–I–vi–I', degrees: [4, 0, 5, 0], desc: 'Доминанта → тоника → минорная замена → тоника. Быстрое разрешение с кратким минорным отклонением.' },
  { name: 'I–vi–V–ii', degrees: [0, 5, 4, 1], desc: 'Движение от тоники через минор и доминанту к ii. Нестандартный путь: вместо возврата в I уходим в ii.' },
  { name: 'vi–IV–V–vi', degrees: [5, 3, 4, 5], desc: 'Минорная петля: vi → IV → V → vi. Типично для британского рока и инди. Меланхоличное, «задумчивое» звучание.' },
  { name: 'I–ii–vi–V', degrees: [0, 1, 5, 4], desc: 'Движение от тоники через ii и vi к доминанте. Оборот разомкнут — звучит как вопрос, требующий разрешения.' },
  { name: 'I–ii–IV–I', degrees: [0, 1, 3, 0], desc: 'Двойная субдоминанта (ii и IV) с возвратом к тонике. Плагальное движение с предыктом. «Церковное» звучание.' },
  { name: 'V–ii–I–V', degrees: [4, 1, 0, 4], desc: 'Доминанта → ii → тоника → доминанта. Оборот с перестановкой: доминанта и ii меняются местами. Зацикленное движение.' },
  { name: 'I–iii–I–V', degrees: [0, 2, 0, 4], desc: 'Медианта как украшение между двумя тониками. Лёгкое, воздушное движение с кратким отклонением.' },
  { name: 'I–IV–vii°–I', degrees: [0, 3, 6, 0], desc: 'Уменьшённый vii° между субдоминантой и тоникой. Сильное хроматическое тяготение. Драматичный, театральный оборот.' },
  { name: 'I–vi–I–IV', degrees: [0, 5, 0, 3], desc: 'Тоника → минорная медианта → возврат → субдоминанта. Игра света и тени перед уходом в IV.' },
  { name: 'ii–V–vi–IV', degrees: [1, 4, 5, 3], desc: 'Джазовый оборот с финалом в субдоминанте. ii–V — стандартная подготовка, но разрешение идёт в vi и IV.' },
  { name: 'I–V–iii–vi', degrees: [0, 4, 2, 5], desc: 'Доминанта → медианта → субмедианта. V разрешается не прямо в тонику, а через iii в vi. Плавное затухание.' },
  { name: 'IV–ii–V–I', degrees: [3, 1, 4, 0], desc: 'Субдоминанта → супертоника → доминанта → тоника. Развёрнутое движение к тонике через две субдоминантовые ступени.' },
  { name: 'I–vi–IV–V–I (5 аккордов)', degrees: [0, 5, 3, 4, 0], desc: 'Расширенная классика: тоника → vi → IV → V → I. Полная гармоническая история: устойчивость, движение, напряжение, разрешение.' },
]

const progression = computed(() => {
  const degrees = scaleDegrees.value
  if (!degrees.length) return []

  const pat = patterns[selectedPattern.value]
  return pat.degrees.map((degIdx) => {
    const d = degrees[degIdx]
    return {
      degreeIndex: degIdx,
      roman: d.roman,
      notes: d.chordNotes,
      label: `${d.roman}${chordTypeLabel[d.chordType] ?? ''}`,
    }
  })
})

const chordDuration = computed(() => 60 / bpm.value * 2)

function getCircleIndexFromNote(noteName: string): number {
  const chromatic = CHROMATIC_NOTES.findIndex(
    (n) => n.name === noteName || n.altName === noteName
  )
  const ci = CIRCLE_ORDER.indexOf(chromatic)
  return ci >= 0 ? ci : 0
}

watch(progression, (p) => {
  progressionRoots.value = p.map((s) => getCircleIndexFromNote(s.notes[0]))
  if (!playing.value) sharedCurrentStep.value = -1
}, { immediate: true })

watch(localCurrentStep, (v) => {
  sharedCurrentStep.value = v
})

watch(bpm, () => {
  if (playing.value) {
    stopSequence()
    playing.value = true
    localCurrentStep.value = 0
    scheduleLoop()
  }
})
let loopTimer: number | null = null
let visualTimer: number | null = null
let cycleStartTime = 0

watch([() => scaleDegrees.value, selectedPattern], () => {
  stopSequence()
})

function stopSequence() {
  playing.value = false
  if (loopTimer !== null) {
    cancelAnimationFrame(loopTimer)
    loopTimer = null
  }
  if (visualTimer !== null) {
    clearInterval(visualTimer)
    visualTimer = null
  }
  audioStop()
  localCurrentStep.value = -1
}

function scheduleLoop() {
  const audioCtx = getCtx()
  const steps = progression.value
  if (!steps.length) return

  const step = chordDuration.value
  cycleStartTime = audioCtx.currentTime
  let nextStart = cycleStartTime

  function scheduleCycle() {
    const now = audioCtx.currentTime
    if (nextStart < now) nextStart = now

    for (let i = 0; i < steps.length; i++) {
      const stepData = steps[i]
      const noteNames = stepData.notes.map((name) => name.replace(/[♯♭]/g, ''))
      scheduleChord(
        instrument.value,
        style.value,
        noteNames,
        4,
        bpm.value,
        nextStart + i * step,
        step,
      )
    }

    if (metronomeOn.value) {
      scheduleMetronome(nextStart, step / 2, steps.length * 2)
    }

    nextStart += steps.length * step
    scheduleNext()
  }

  function scheduleNext() {
    if (!playing.value) return
    const ahead = nextStart - audioCtx.currentTime
    if (ahead < 2) {
      scheduleCycle()
    } else {
      loopTimer = requestAnimationFrame(scheduleNext)
    }
  }

  scheduleCycle()

  visualTimer = window.setInterval(() => {
    if (!playing.value) return
    const elapsed = audioCtx.currentTime - cycleStartTime
    const cycleLen = steps.length * step
    const pos = elapsed % cycleLen
    const idx = Math.floor(pos / step) % steps.length
    if (idx !== localCurrentStep.value) {
      localCurrentStep.value = idx
    }
  }, 100)
}

function togglePlay() {
  if (playing.value) {
    stopSequence()
    return
  }

  if (!progression.value.length) return

  playing.value = true
  localCurrentStep.value = 0
  scheduleLoop()
}
</script>

<template>
  <div class="midi-player">
    <div class="mp-pattern">
      <label class="mp-label">Паттерн</label>
      <select v-model="selectedPattern" class="mp-select">
        <option
          v-for="(pat, i) in patterns"
          :key="i"
          :value="i"
        >
          {{ pat.name }}
        </option>
      </select>
      <p class="mp-pattern-desc">{{ patterns[selectedPattern]?.desc }}</p>
    </div>

    <div class="mp-progression">
      <div
        v-for="(step, i) in progression"
        :key="i"
        :class="['mp-step', {
          'mp-step--active': playing && localCurrentStep === i,
          'mp-step--selected': !playing && selection.type === 'degree' && selection.index === step.degreeIndex,
        }]"
        @click="selectDegree(step.degreeIndex)"
      >
        <span class="mp-step-roman">{{ step.roman }}</span>
        <span class="mp-step-notes">{{ step.notes.join(' ') }}</span>
      </div>
    </div>

    <div class="mp-controls">
      <div class="mp-group">
        <label class="mp-label">Инструмент</label>
        <div class="mp-btns">
          <button
            v-for="inst in instruments" :key="inst.value"
            :class="['mp-btn', { 'mp-btn--active': instrument === inst.value }]"
            @click="instrument = inst.value"
          >
            {{ inst.label }}
          </button>
        </div>
      </div>

      <div class="mp-group">
        <label class="mp-label">Стиль</label>
        <div class="mp-btns">
          <button
            v-for="s in styles" :key="s.value"
            :class="['mp-btn', { 'mp-btn--active': style === s.value }]"
            @click="style = s.value"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <div class="mp-group">
        <label class="mp-label">Темп (BPM)</label>
        <input
          v-model.number="bpm"
          type="number"
          min="30"
          max="240"
          class="mp-bpm-input"
        />
      </div>

      <div class="mp-group">
        <label class="mp-checkbox-label">
          <input v-model="metronomeOn" type="checkbox" class="mp-checkbox" />
          Метроном
        </label>
      </div>

      <div class="mp-group mp-group--play">
        <button
          :class="['mp-play', { 'mp-play--active': playing }]"
          @click="togglePlay"
        >
          {{ playing ? 'STOP' : 'PLAY' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.midi-player {
  width: 340px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  background: var(--card);
}

.mp-pattern {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.mp-select {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background);
  color: var(--foreground);
  font-size: 12px;
  cursor: pointer;
  width: 100%;
}

.mp-pattern-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted-foreground);
  opacity: 0.75;
}

.mp-progression {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.mp-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
  padding: 8px 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--background);
  transition: all 0.2s;
  min-width: 48px;
  cursor: pointer;
}

.mp-step:hover {
  background: var(--muted);
}

.mp-step--selected {
  border-color: var(--accent);
  background: var(--muted);
}

.mp-step--active {
  border-color: var(--accent);
  background: var(--accent);
}

.mp-step--active .mp-step-roman,
.mp-step--active .mp-step-notes {
  color: var(--accent-foreground);
}

.mp-step-roman {
  font-size: 14px;
  font-weight: 700;
  color: var(--foreground);
}

.mp-step-notes {
  font-size: 10px;
  font-family: monospace;
  color: var(--muted-foreground);
  white-space: nowrap;
}

.mp-controls {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.mp-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mp-group--play {
  margin-left: auto;
}

.mp-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  opacity: 0.7;
}

.mp-btns {
  display: flex;
  gap: 4px;
}

.mp-btn {
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

.mp-btn:hover {
  background: var(--muted);
}

.mp-btn--active {
  background: var(--accent);
  color: var(--accent-foreground);
  border-color: var(--accent);
}

.mp-play {
  padding: 8px 20px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--accent);
  color: var(--accent-foreground);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.15s;
}

.mp-play:hover {
  opacity: 0.85;
}

.mp-play--active {
  background: var(--destructive);
  border-color: var(--destructive);
}

.mp-bpm-input {
  width: 72px;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background);
  color: var(--foreground);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.mp-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--foreground);
  cursor: pointer;
}

.mp-checkbox {
  width: 14px;
  height: 14px;
  accent-color: var(--accent);
}
</style>
