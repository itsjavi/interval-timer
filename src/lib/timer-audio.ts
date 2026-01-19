import * as Tone from 'tone'

type SynthPair = {
  shortSynth: Tone.Synth
  longSynth: Tone.Synth
}

let synths: SynthPair | null = null
let audioReady = false

function getSynths(): SynthPair {
  if (synths) {
    return synths
  }

  const shortSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.08 },
    volume: -6,
  }).toDestination()

  const longSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 },
    volume: -4,
  }).toDestination()

  synths = { shortSynth, longSynth }
  return synths
}

export async function ensureAudioReady() {
  if (audioReady) {
    return
  }

  await Tone.start()
  audioReady = true
}

export function playShortBeep() {
  const { shortSynth } = getSynths()
  shortSynth.triggerAttackRelease('C6', '16n')
}

export function playLongBeep() {
  const { longSynth } = getSynths()
  longSynth.triggerAttackRelease('C6', '8n')
}

export function playIntervalStart() {
  const { shortSynth, longSynth } = getSynths()
  const now = Tone.now()

  shortSynth.triggerAttackRelease('G5', '16n', now)
  longSynth.triggerAttackRelease('C6', '8n', now + 0.12)
}
