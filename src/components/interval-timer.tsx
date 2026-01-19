import * as React from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { ChevronDownIcon, PauseIcon, PlayIcon, RotateCcwIcon, SettingsIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type NumberInputProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  disabled?: boolean
  className?: string
  variant?: 'default' | 'group'
}

function NumberInput({
  value,
  onChange,
  min = 0,
  disabled,
  className,
  variant = 'default',
}: NumberInputProps) {
  const [draft, setDraft] = React.useState(value.toString())
  const [isFocused, setIsFocused] = React.useState(false)

  // Sync draft with external value when not focused
  React.useEffect(() => {
    if (!isFocused) {
      setDraft(value.toString())
    }
  }, [value, isFocused])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const parsed = Number.parseInt(raw, 10)

    // Trim leading zeros by using the parsed number as string
    if (!Number.isNaN(parsed) && raw !== '') {
      const clamped = Math.max(min, parsed)
      setDraft(clamped.toString())
      onChange(clamped)
    } else {
      setDraft(raw)
      onChange(min)
    }
  }

  function handleBlur() {
    setIsFocused(false)
    // Normalize display on blur
    const parsed = Number.parseInt(draft, 10)
    const finalValue = Number.isNaN(parsed) ? min : Math.max(min, parsed)
    setDraft(finalValue.toString())
  }

  const groupStyles =
    variant === 'group'
      ? 'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent'
      : ''

  return (
    <Input
      type="number"
      min={min}
      value={draft}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onChange={handleChange}
      data-slot={variant === 'group' ? 'input-group-control' : undefined}
      className={cn(groupStyles, className)}
    />
  )
}
import {
  ensureAudioReady,
  playBreakStart,
  playIntervalStart,
  playLongBeep,
  playShortBeep,
} from '@/lib/timer-audio'
import {
  calculateTotalTime,
  formatTimerSeconds,
  getPhaseLabel,
  isActiveStatus,
  isLastSeconds,
} from '@/lib/timer-logic'
import { defaultSettings } from '@/lib/timer-types'
import {
  currentRepetitionAtom,
  pausedFromStatusAtom,
  pauseTimerAtom,
  remainingTimeAtom,
  resetTimerAtom,
  resumeTimerAtom,
  settingsAtom,
  soundEnabledAtom,
  startTimerAtom,
  statusAtom,
  tickTimerAtom,
} from '@/lib/timer-store'
import { GithubIcon } from './icons'
import { SoundToggle } from './sound-toggle'
import { ThemeToggle } from './theme-toggle'

export function IntervalTimer({ className, ...props }: React.ComponentProps<'div'>) {
  const status = useAtomValue(statusAtom)
  const pausedFromStatus = useAtomValue(pausedFromStatusAtom)
  const remainingTime = useAtomValue(remainingTimeAtom)
  const currentRepetition = useAtomValue(currentRepetitionAtom)
  const [settings, setSettings] = useAtom(settingsAtom)
  const soundEnabled = useAtomValue(soundEnabledAtom)
  const startTimer = useSetAtom(startTimerAtom)
  const pauseTimer = useSetAtom(pauseTimerAtom)
  const resumeTimer = useSetAtom(resumeTimerAtom)
  const resetTimer = useSetAtom(resetTimerAtom)
  const tickTimer = useSetAtom(tickTimerAtom)
  const setRemainingTime = useSetAtom(remainingTimeAtom)

  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [showSecondsFormat, setShowSecondsFormat] = React.useState(false)

  const settingsLocked = status !== 'idle' && status !== 'finished'
  const showLastSeconds = isLastSeconds(status, remainingTime)
  const canShowSeconds = remainingTime < 9999
  const phaseLabel = getPhaseLabel(status)
  const repetitionLabel = settings.repetitions > 0 ? settings.repetitions.toString() : '∞'
  const isRunning = isActiveStatus(status)
  const canStart = status === 'idle' || status === 'finished'
  const isPaused = status === 'paused'

  // Calculate progress for the ring
  const totalTime =
    status === 'running'
      ? settings.intervalSeconds
      : status === 'break'
        ? settings.breakSeconds
        : status === 'delay'
          ? settings.startDelaySeconds
          : settings.intervalSeconds
  const progress = totalTime > 0 ? ((totalTime - remainingTime) / totalTime) * 100 : 0

  const previousStatusRef = React.useRef(status)
  const previousIntervalRef = React.useRef(settings.intervalSeconds)

  // Sync remaining time with settings when idle/finished (skip if value hasn't changed)
  React.useEffect(() => {
    if (previousIntervalRef.current === settings.intervalSeconds) {
      return
    }
    previousIntervalRef.current = settings.intervalSeconds

    if (status === 'idle' || status === 'finished') {
      setRemainingTime(settings.intervalSeconds)
    }
  }, [settings.intervalSeconds, setRemainingTime, status])

  React.useEffect(() => {
    if (!isActiveStatus(status)) {
      return
    }

    const intervalId = window.setInterval(() => {
      tickTimer()
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [status, tickTimer])

  React.useEffect(() => {
    const wasPaused = previousStatusRef.current === 'paused'

    if (soundEnabled && status === 'running') {
      if (remainingTime === settings.intervalSeconds && !wasPaused) {
        playIntervalStart()
      }
    }

    if (soundEnabled && status === 'break') {
      if (remainingTime === settings.breakSeconds && !wasPaused) {
        playBreakStart()
      }
    }

    previousStatusRef.current = status
  }, [remainingTime, settings.intervalSeconds, settings.breakSeconds, status, soundEnabled])

  React.useEffect(() => {
    if (!soundEnabled) {
      return
    }

    if (status !== 'running' && status !== 'delay' && status !== 'break') {
      return
    }

    if (remainingTime === 3 || remainingTime === 2) {
      playShortBeep()
    }

    if (remainingTime === 1) {
      playLongBeep()
    }
  }, [remainingTime, status, soundEnabled])

  // Warn user before closing window if timer is active
  React.useEffect(() => {
    if (!isRunning && !isPaused) {
      return
    }

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isRunning, isPaused])

  async function handleStart() {
    await ensureAudioReady()
    startTimer()
  }

  async function handleResume() {
    await ensureAudioReady()
    resumeTimer()
  }

  function handlePlayPause() {
    if (canStart) {
      void handleStart()
    } else if (isPaused) {
      void handleResume()
    } else if (isRunning) {
      pauseTimer()
    }
  }

  function updateSetting<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    const nextSettings = { ...settings, [key]: value }
    setSettings(nextSettings)

    if (key === 'intervalSeconds' && (status === 'idle' || status === 'finished')) {
      setRemainingTime(nextSettings.intervalSeconds)
    }
  }

  function resetToDefaults() {
    localStorage.removeItem('interval-timer-settings')
    setSettings(defaultSettings)
    if (status === 'idle' || status === 'finished') {
      setRemainingTime(defaultSettings.intervalSeconds)
    }
  }

  // Ring colors based on phase
  const ringColor = showLastSeconds
    ? 'stroke-amber-500'
    : status === 'running'
      ? 'stroke-primary'
      : status === 'break'
        ? 'stroke-sky-500'
        : status === 'delay'
          ? 'stroke-violet-500'
          : 'stroke-muted-foreground/30'

  const ringBgColor =
    status === 'idle' || status === 'finished' ? 'stroke-muted/50' : 'stroke-muted-foreground/10'

  return (
    <div
      className={cn('bg-background text-foreground flex min-h-dvh w-full flex-col', className)}
      {...props}
    >
      {/* Header */}
      <header className={cn('flex items-center justify-between px-6 py-4')}>
        <h1
          className={cn(
            'flex items-center gap-2 text-xl font-extrabold tracking-tight font-stretch-150%',
          )}
        >
          <img
            src="/interval-timer/logo-sm.png"
            alt="Interval Timer"
            className={cn('pointer-events-none size-8 select-none')}
          />
          Interval Timer
        </h1>
        <div className={cn('flex items-center gap-6')}>
          <a
            href="https://github.com/itsjavi/interval-timer"
            target="_blank"
            rel="noopener noreferrer"
            className={cn('hover:opacity-80')}
            aria-label="View source on GitHub"
          >
            <GithubIcon className={cn('size-6')} />
          </a>
          <SoundToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main timer area - takes remaining space */}
      <main className={cn('flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-6')}>
        {/* Phase label */}
        <div
          className={cn(
            'text-center text-sm font-semibold tracking-widest uppercase transition-colors',
            {
              'text-primary': status === 'running' && !showLastSeconds,
              'text-sky-500': status === 'break',
              'text-violet-500': status === 'delay',
              'text-muted-foreground': status === 'idle',
              'text-amber-500': showLastSeconds,
              'text-emerald-500': status === 'finished',
              'text-orange-400': status === 'paused',
            },
          )}
        >
          {phaseLabel}
          {status === 'paused' && pausedFromStatus ? ` · ${getPhaseLabel(pausedFromStatus)}` : ''}
        </div>

        {/* Timer ring */}
        <div className={cn('relative')}>
          <svg
            className={cn('timer-ring -rotate-90')}
            width="280"
            height="280"
            viewBox="0 0 280 280"
          >
            {/* Background ring */}
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              strokeWidth="8"
              className={cn(ringBgColor, 'transition-colors')}
            />
            {/* Progress ring */}
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn(ringColor, 'transition-all duration-300')}
              strokeDasharray={2 * Math.PI * 130}
              strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
            />
          </svg>

          {/* Timer text in center */}
          <div className={cn('absolute inset-0 flex flex-col items-center justify-center')}>
            <button
              type="button"
              onClick={() => canShowSeconds && setShowSecondsFormat((v) => !v)}
              className={cn(
                'text-7xl font-bold tracking-tight tabular-nums transition-colors sm:text-8xl',
                'cursor-pointer bg-transparent select-none',
                {
                  'text-foreground': status === 'idle' || status === 'finished',
                  'text-primary': status === 'running' && !showLastSeconds,
                  'text-sky-500': status === 'break',
                  'text-violet-500': status === 'delay',
                  'text-amber-500': showLastSeconds,
                  'text-orange-400': status === 'paused',
                  'last-seconds-pulse': showLastSeconds,
                },
              )}
            >
              {showSecondsFormat && canShowSeconds ? (
                <>
                  {remainingTime}
                  <span className={cn('text-4xl')}>s</span>
                </>
              ) : (
                formatTimerSeconds(remainingTime)
              )}
            </button>
            <span className={cn('text-muted-foreground mt-1 text-sm')}>
              {currentRepetition} / {repetitionLabel}
            </span>
          </div>
        </div>

        {/* Total time (only for finite reps) */}
        {settings.repetitions > 0 && (
          <div className={cn('text-muted-foreground text-center text-sm')}>
            Total: {formatTimerSeconds(calculateTotalTime(settings) ?? 0)}
          </div>
        )}

        {/* Controls */}
        <div className={cn('flex items-center gap-6')}>
          {/* Reset button */}
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={resetTimer}
            className={cn('h-14 w-14 rounded-full')}
          >
            <RotateCcwIcon className={cn('h-6 w-6')} />
            <span className="sr-only">Reset</span>
          </Button>

          {/* Play/Pause button - the hero */}
          <Button
            onClick={handlePlayPause}
            className={cn('h-20 w-20 rounded-full shadow-lg transition-transform active:scale-95', {
              'bg-primary hover:bg-primary/90': canStart || isPaused,
              'bg-orange-400 hover:bg-orange-500': isRunning && !isPaused,
            })}
          >
            {isRunning && !isPaused ? (
              <PauseIcon className={cn('size-8')} />
            ) : (
              <PlayIcon className={cn('size-7')} />
            )}
            <span className="sr-only">{isRunning && !isPaused ? 'Pause' : 'Start'}</span>
          </Button>

          {/* Settings toggle */}
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={cn('h-14 w-14 rounded-full', {
              'bg-muted': settingsOpen,
            })}
          >
            <SettingsIcon className={cn('h-6 w-6')} />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </main>

      {/* Settings panel */}
      <div
        className={cn(
          'bg-card border-border/50 overflow-hidden border-t transition-all duration-300',
          {
            'max-h-0 border-t-0': !settingsOpen,
            'max-h-[50vh]': settingsOpen,
          },
        )}
      >
        <div className={cn('px-6 pt-7 pb-10')}>
          <div className={cn('mb-3 flex items-center justify-between')}>
            <h2 className={cn('text-sm font-semibold')}>Settings</h2>
            <div className={cn('flex items-center gap-1')}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      onClick={resetToDefaults}
                      disabled={settingsLocked}
                      className={cn(
                        'text-muted-foreground hover:text-foreground cursor-pointer rounded p-1 transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                      )}
                    >
                      <RotateCcwIcon className={cn('h-4 w-4')} />
                    </button>
                  }
                />
                <TooltipContent>Reset to default settings</TooltipContent>
              </Tooltip>
              <button
                onClick={() => setSettingsOpen(false)}
                className={cn('text-muted-foreground hover:text-foreground cursor-pointer p-1')}
              >
                <ChevronDownIcon className={cn('h-4 w-4')} />
              </button>
            </div>
          </div>

          {settingsLocked && (
            <p className={cn('text-muted-foreground mb-3 text-xs')}>
              Settings locked while active. Reset to edit.
            </p>
          )}

          <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4')}>
            <Field data-disabled={settingsLocked}>
              <FieldLabel className={cn('text-xs')}>Interval duration (s)</FieldLabel>
              <FieldContent>
                <NumberInput
                  min={1}
                  value={settings.intervalSeconds}
                  disabled={settingsLocked}
                  onChange={(v) => updateSetting('intervalSeconds', v)}
                  className={cn('h-9')}
                />
              </FieldContent>
            </Field>

            <Field data-disabled={settingsLocked}>
              <FieldLabel className={cn('text-xs')}>
                Break duration (s)
                {settings.includeBreakAtEnd ? ' + final break' : ''}
              </FieldLabel>
              <FieldContent>
                <InputGroup data-disabled={settingsLocked}>
                  <NumberInput
                    min={0}
                    value={settings.breakSeconds}
                    disabled={settingsLocked}
                    onChange={(v) => updateSetting('breakSeconds', v)}
                    variant="group"
                  />
                  <InputGroupAddon align="inline-end">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Checkbox
                            checked={settings.includeBreakAtEnd}
                            disabled={settingsLocked}
                            onCheckedChange={(checked) =>
                              updateSetting('includeBreakAtEnd', checked === true)
                            }
                            aria-label="Include break after final interval"
                            className={cn('cursor-pointer')}
                          />
                        }
                      />
                      <TooltipContent>Include break after final interval</TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
            </Field>

            <Field data-disabled={settingsLocked}>
              <FieldLabel className={cn('text-xs')}>Reps (0 = ∞)</FieldLabel>
              <FieldContent>
                <NumberInput
                  min={0}
                  value={settings.repetitions}
                  disabled={settingsLocked}
                  onChange={(v) => updateSetting('repetitions', v)}
                  className={cn('h-9')}
                />
              </FieldContent>
            </Field>

            <Field data-disabled={settingsLocked}>
              <FieldLabel className={cn('text-xs')}>Initial delay (s)</FieldLabel>
              <FieldContent>
                <InputGroup data-disabled={settingsLocked}>
                  <NumberInput
                    min={0}
                    value={settings.startDelaySeconds}
                    disabled={settingsLocked || !settings.startDelayEnabled}
                    onChange={(v) => updateSetting('startDelaySeconds', v)}
                    variant="group"
                  />
                  <InputGroupAddon align="inline-end">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Checkbox
                            checked={settings.startDelayEnabled}
                            disabled={settingsLocked}
                            onCheckedChange={(checked) =>
                              updateSetting('startDelayEnabled', checked === true)
                            }
                            aria-label="Enable countdown before first interval"
                            className={cn('cursor-pointer')}
                          />
                        }
                      />
                      <TooltipContent>Enable countdown before first interval</TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
            </Field>
          </div>
        </div>
      </div>
    </div>
  )
}
