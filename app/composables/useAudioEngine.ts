export type Instrument = 'piano' | 'guitar' | 'organ'
export type Style = 'chord' | 'arpeggio'

const NOTE_TO_MIDI: Record<string, number> = {
  C: 60, 'C#': 61, Db: 61, D: 62, 'D#': 63, Eb: 63, E: 64,
  F: 65, 'F#': 66, Gb: 66, G: 67, 'G#': 68, Ab: 68, A: 69,
  'A#': 70, Bb: 70, B: 71, Cb: 71,
}

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

function createInstrument(instrument: Instrument, ctx: AudioContext): {
  noteOn: (freq: number, time: number) => { stop: (t: number) => void }
} {
  switch (instrument) {
    case 'piano': {
      return {
        noteOn(freq: number, time: number) {
          const gain = ctx.createGain()
          gain.connect(ctx.destination)
          gain.gain.setValueAtTime(0, time)
          gain.gain.linearRampToValueAtTime(0.25, time + 0.005)
          gain.gain.exponentialRampToValueAtTime(0.001, time + 2)

          const osc1 = ctx.createOscillator()
          osc1.type = 'triangle'
          osc1.frequency.setValueAtTime(freq, time)
          osc1.connect(gain)
          osc1.start(time)

          const osc2 = ctx.createOscillator()
          osc2.type = 'sine'
          osc2.frequency.setValueAtTime(freq * 2, time)
          const g2 = ctx.createGain()
          g2.gain.setValueAtTime(0.08, time)
          g2.gain.exponentialRampToValueAtTime(0.001, time + 0.5)
          osc2.connect(g2)
          g2.connect(ctx.destination)
          osc2.start(time)

          const osc3 = ctx.createOscillator()
          osc3.type = 'sine'
          osc3.frequency.setValueAtTime(freq * 3, time)
          const g3 = ctx.createGain()
          g3.gain.setValueAtTime(0.04, time)
          g3.gain.exponentialRampToValueAtTime(0.001, time + 0.3)
          osc3.connect(g3)
          g3.connect(ctx.destination)
          osc3.start(time)

          return {
            stop(t: number) {
              gain.gain.cancelScheduledValues(t)
              gain.gain.setValueAtTime(gain.gain.value, t)
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
              osc1.stop(t + 0.05)
              osc2.stop(t + 0.05)
              osc3.stop(t + 0.05)
            },
          }
        },
      }
    }
    case 'guitar': {
      return {
        noteOn(freq: number, time: number) {
          const gain = ctx.createGain()
          gain.connect(ctx.destination)
          gain.gain.setValueAtTime(0, time)
          gain.gain.linearRampToValueAtTime(0.3, time + 0.003)
          gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5)

          const osc = ctx.createOscillator()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, time)
          osc.connect(gain)
          osc.start(time)

          const harm = ctx.createOscillator()
          harm.type = 'sine'
          harm.frequency.setValueAtTime(freq * 2, time)
          const gh = ctx.createGain()
          gh.gain.setValueAtTime(0.12, time)
          gh.gain.exponentialRampToValueAtTime(0.001, time + 0.4)
          harm.connect(gh)
          gh.connect(ctx.destination)
          harm.start(time)

          return {
            stop(t: number) {
              gain.gain.cancelScheduledValues(t)
              gain.gain.setValueAtTime(gain.gain.value, t)
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
              osc.stop(t + 0.03)
              harm.stop(t + 0.03)
            },
          }
        },
      }
    }
    case 'organ': {
      return {
        noteOn(freq: number, time: number) {
          const gain = ctx.createGain()
          gain.connect(ctx.destination)
          gain.gain.setValueAtTime(0.15, time)

          const osc1 = ctx.createOscillator()
          osc1.type = 'sawtooth'
          osc1.frequency.setValueAtTime(freq, time)
          const g1 = ctx.createGain()
          g1.gain.setValueAtTime(0.12, time)
          osc1.connect(g1)
          g1.connect(gain)
          osc1.start(time)

          const osc2 = ctx.createOscillator()
          osc2.type = 'triangle'
          osc2.frequency.setValueAtTime(freq * 2, time)
          const g2 = ctx.createGain()
          g2.gain.setValueAtTime(0.06, time)
          osc2.connect(g2)
          g2.connect(gain)
          osc2.start(time)

          const osc3 = ctx.createOscillator()
          osc3.type = 'sine'
          osc3.frequency.setValueAtTime(freq * 4, time)
          const g3 = ctx.createGain()
          g3.gain.setValueAtTime(0.03, time)
          osc3.connect(g3)
          g3.connect(gain)
          osc3.start(time)

          return {
            stop(t: number) {
              gain.gain.setValueAtTime(gain.gain.value, t)
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
              osc1.stop(t + 0.15)
              osc2.stop(t + 0.15)
              osc3.stop(t + 0.15)
            },
          }
        },
      }
    }
  }
}

export function useAudioEngine() {
  let ctx: AudioContext | null = null
  let scheduledNodes: { stop: (t: number) => void }[] = []
  let timeoutIds: number[] = []

  const getCtx = () => {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  const stop = () => {
    if (!ctx) return
    const now = ctx.currentTime
    scheduledNodes.forEach((n) => n.stop(now))
    scheduledNodes = []
    timeoutIds.forEach(clearTimeout)
    timeoutIds = []
  }

  const scheduleChord = (
    instrument: Instrument,
    style: Style,
    noteNames: string[],
    octave: number,
    bpm: number,
    startTime: number,
    duration: number,
  ) => {
    const audioCtx = getCtx()
    const inst = createInstrument(instrument, audioCtx)
    const rootMidi = (NOTE_TO_MIDI[noteNames[0]] ?? 60) + (octave - 4) * 12
    const notes = noteNames.map((name, i) => {
      let m = (NOTE_TO_MIDI[name] ?? 60) + (octave - 4) * 12
      if (i > 0 && m < rootMidi) m += 12
      return midiToFreq(m)
    })

    if (style === 'chord') {
      notes.forEach((freq) => {
        const n = inst.noteOn(freq, startTime)
        scheduledNodes.push(n)
        const id = window.setTimeout(() => {
          if (audioCtx) {
            n.stop(startTime + duration)
          }
        }, (startTime - audioCtx.currentTime + duration) * 1000 + 50)
        timeoutIds.push(id)
      })
    } else {
      const noteDuration = duration / notes.length
      const arpNotes = notes

      arpNotes.forEach((freq, i) => {
        const time = startTime + i * noteDuration
        const n = inst.noteOn(freq, time)
        scheduledNodes.push(n)
        const id = window.setTimeout(() => {
          if (audioCtx) {
            n.stop(time + noteDuration * 0.8)
          }
        }, (time - audioCtx.currentTime + noteDuration * 0.8) * 1000 + 50)
        timeoutIds.push(id)
      })
    }
  }

  const scheduleMetronome = (
    startTime: number,
    beatInterval: number,
    count: number,
  ) => {
    const audioCtx = getCtx()

    for (let i = 0; i < count; i++) {
      const time = startTime + i * beatInterval
      const isDownbeat = i % 4 === 0

      const gain = audioCtx.createGain()
      gain.connect(audioCtx.destination)
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(isDownbeat ? 0.15 : 0.08, time + 0.001)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)

      const osc = audioCtx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(isDownbeat ? 1200 : 900, time)
      osc.connect(gain)
      osc.start(time)
      osc.stop(time + 0.1)

      scheduledNodes.push({
        stop(t: number) {
          try { osc.stop(t) } catch {}
          try { gain.disconnect() } catch {}
        },
      })
    }
  }

  return { scheduleChord, scheduleMetronome, stop, getCtx }
}
