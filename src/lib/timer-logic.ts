import { addSeconds, format } from 'date-fns'

import type { TimerSettings, TimerStatus } from '@/lib/timer-types'
import { lastSecondsThreshold } from '@/lib/timer-types'

type NextPhase = {
  status: TimerStatus
  remainingTime: number
}

export function formatTimerSeconds(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const date = addSeconds(new Date(0), safeSeconds)
  return safeSeconds >= 3600 ? format(date, 'H:mm:ss') : format(date, 'm:ss')
}

export function isActiveStatus(status: TimerStatus) {
  return status === 'delay' || status === 'running' || status === 'break'
}

export function isLastSeconds(status: TimerStatus, remainingTime: number) {
  return status === 'running' && remainingTime <= lastSecondsThreshold && remainingTime > 0
}

export function getPhaseLabel(status: TimerStatus) {
  if (status === 'delay') {
    return 'Get Ready'
  }
  if (status === 'running') {
    return 'Focus'
  }
  if (status === 'break') {
    return 'Break'
  }
  if (status === 'paused') {
    return 'Paused'
  }
  if (status === 'finished') {
    return 'Finished'
  }
  return 'Idle'
}

export function resolveAfterRunning(settings: TimerSettings, nextRepetition: number): NextPhase {
  const reachedLimit = settings.repetitions > 0 && nextRepetition >= settings.repetitions
  const hasBreak = settings.breakSeconds > 0

  if (reachedLimit && (!settings.includeBreakAtEnd || !hasBreak)) {
    return { status: 'finished', remainingTime: 0 }
  }

  if (hasBreak) {
    return { status: 'break', remainingTime: settings.breakSeconds }
  }

  return { status: 'running', remainingTime: settings.intervalSeconds }
}

export function resolveAfterBreak(settings: TimerSettings, currentRepetition: number): NextPhase {
  const reachedLimit = settings.repetitions > 0 && currentRepetition >= settings.repetitions

  if (reachedLimit) {
    return { status: 'finished', remainingTime: 0 }
  }

  return { status: 'running', remainingTime: settings.intervalSeconds }
}

export function calculateTotalTime(settings: TimerSettings): number | null {
  if (settings.repetitions <= 0) {
    return null // Infinite
  }

  const reps = settings.repetitions
  const intervalTotal = reps * settings.intervalSeconds
  const breakCount = settings.includeBreakAtEnd ? reps : reps - 1
  const breakTotal = Math.max(0, breakCount) * settings.breakSeconds
  const delay = settings.startDelayEnabled ? settings.startDelaySeconds : 0

  return delay + intervalTotal + breakTotal
}
