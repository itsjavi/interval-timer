import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import type { TimerSettings, TimerStatus } from '@/lib/timer-types'
import { defaultSettings } from '@/lib/timer-types'
import { resolveAfterBreak, resolveAfterRunning } from '@/lib/timer-logic'

export const statusAtom = atom<TimerStatus>('idle')
export const pausedFromStatusAtom = atom<TimerStatus | null>(null)
export const remainingTimeAtom = atom<number>(defaultSettings.intervalSeconds)
export const currentRepetitionAtom = atom<number>(0)

export const settingsAtom = atomWithStorage<TimerSettings>(
  'interval-timer-settings',
  defaultSettings,
)

export const startTimerAtom = atom(null, (get, set) => {
  const settings = get(settingsAtom)

  set(currentRepetitionAtom, 0)
  set(pausedFromStatusAtom, null)

  if (settings.startDelayEnabled && settings.startDelaySeconds > 0) {
    set(statusAtom, 'delay')
    set(remainingTimeAtom, settings.startDelaySeconds)
    return
  }

  set(statusAtom, 'running')
  set(remainingTimeAtom, settings.intervalSeconds)
})

export const resetTimerAtom = atom(null, (get, set) => {
  const settings = get(settingsAtom)

  set(statusAtom, 'idle')
  set(currentRepetitionAtom, 0)
  set(pausedFromStatusAtom, null)
  set(remainingTimeAtom, settings.intervalSeconds)
})

export const pauseTimerAtom = atom(null, (get, set) => {
  const status = get(statusAtom)

  if (status === 'delay' || status === 'running' || status === 'break') {
    set(pausedFromStatusAtom, status)
    set(statusAtom, 'paused')
  }
})

export const resumeTimerAtom = atom(null, (get, set) => {
  const status = get(statusAtom)
  const pausedFrom = get(pausedFromStatusAtom)

  if (status === 'paused' && pausedFrom) {
    set(statusAtom, pausedFrom)
  }
})

export const tickTimerAtom = atom(null, (get, set) => {
  const status = get(statusAtom)

  if (status !== 'delay' && status !== 'running' && status !== 'break') {
    return
  }

  const remainingTime = get(remainingTimeAtom)
  const settings = get(settingsAtom)

  if (remainingTime > 1) {
    set(remainingTimeAtom, remainingTime - 1)
    return
  }

  if (status === 'delay') {
    set(statusAtom, 'running')
    set(remainingTimeAtom, settings.intervalSeconds)
    return
  }

  if (status === 'running') {
    const nextRepetition = get(currentRepetitionAtom) + 1
    const nextPhase = resolveAfterRunning(settings, nextRepetition)

    set(currentRepetitionAtom, nextRepetition)
    set(statusAtom, nextPhase.status)
    set(remainingTimeAtom, nextPhase.remainingTime)
    return
  }

  const nextPhase = resolveAfterBreak(settings, get(currentRepetitionAtom))

  set(statusAtom, nextPhase.status)
  set(remainingTimeAtom, nextPhase.remainingTime)
})
