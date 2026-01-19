export const timerStatuses = [
  'idle',
  'delay',
  'running',
  'break',
  'finished',
  'paused',
] as const

export type TimerStatus = (typeof timerStatuses)[number]

export type TimerSettings = {
  startDelaySeconds: number
  startDelayEnabled: boolean
  intervalSeconds: number
  breakSeconds: number
  repetitions: number
  includeBreakAtEnd: boolean
}

export const defaultSettings: TimerSettings = {
  startDelaySeconds: 5,
  startDelayEnabled: true,
  intervalSeconds: 120,
  breakSeconds: 30,
  repetitions: 0,
  includeBreakAtEnd: false,
}

export const lastSecondsThreshold = 3
