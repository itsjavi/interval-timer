import * as React from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { PauseIcon, PlayIcon, RefreshCcwIcon, TimerIcon, Volume2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { ensureAudioReady, playIntervalStart, playLongBeep, playShortBeep } from '@/lib/timer-audio'
import { formatTimerSeconds, getPhaseLabel, isActiveStatus, isLastSeconds } from '@/lib/timer-logic'
import {
  currentRepetitionAtom,
  pausedFromStatusAtom,
  pauseTimerAtom,
  remainingTimeAtom,
  resetTimerAtom,
  resumeTimerAtom,
  settingsAtom,
  startTimerAtom,
  statusAtom,
  tickTimerAtom,
} from '@/lib/timer-store'
import { ThemeToggle } from './theme-toggle'

export function IntervalTimer({ className, ...props }: React.ComponentProps<'div'>) {
  const status = useAtomValue(statusAtom)
  const pausedFromStatus = useAtomValue(pausedFromStatusAtom)
  const remainingTime = useAtomValue(remainingTimeAtom)
  const currentRepetition = useAtomValue(currentRepetitionAtom)
  const [settings, setSettings] = useAtom(settingsAtom)
  const startTimer = useSetAtom(startTimerAtom)
  const pauseTimer = useSetAtom(pauseTimerAtom)
  const resumeTimer = useSetAtom(resumeTimerAtom)
  const resetTimer = useSetAtom(resetTimerAtom)
  const tickTimer = useSetAtom(tickTimerAtom)
  const setRemainingTime = useSetAtom(remainingTimeAtom)

  const settingsLocked = status !== 'idle' && status !== 'finished'
  const showLastSeconds = isLastSeconds(status, remainingTime)
  const phaseLabel = getPhaseLabel(status)
  const repetitionLabel = settings.repetitions > 0 ? settings.repetitions.toString() : '∞'

  const previousStatusRef = React.useRef(status)

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
    if (status !== 'running') {
      previousStatusRef.current = status
      return
    }

    const wasPaused = previousStatusRef.current === 'paused'

    if (remainingTime === settings.intervalSeconds && !wasPaused) {
      playIntervalStart()
    }

    previousStatusRef.current = status
  }, [remainingTime, settings.intervalSeconds, status])

  React.useEffect(() => {
    if (status !== 'running') {
      return
    }

    if (remainingTime === 3 || remainingTime === 2) {
      playShortBeep()
    }

    if (remainingTime === 1) {
      playLongBeep()
    }
  }, [remainingTime, status])

  async function handleStart() {
    await ensureAudioReady()
    startTimer()
  }

  async function handleResume() {
    await ensureAudioReady()
    resumeTimer()
  }

  function updateSetting<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    const nextSettings = { ...settings, [key]: value }
    setSettings(nextSettings)

    if (key === 'intervalSeconds' && (status === 'idle' || status === 'finished')) {
      setRemainingTime(nextSettings.intervalSeconds)
    }
  }

  function parseNumber(value: string, min: number) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      return min
    }
    return Math.max(min, parsed)
  }

  return (
    <div
      className={cn(
        'bg-background text-foreground flex min-h-screen w-full items-center justify-center px-4 py-10',
        className,
      )}
      {...props}
    >
      <div className={cn('flex w-full max-w-5xl flex-col gap-6')}>
        <Card className={cn('border-border/70')}>
          <CardHeader
            className={cn('flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between')}
          >
            <div className={cn('flex items-center gap-3')}>
              <div
                className={cn(
                  'bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full',
                )}
              >
                <TimerIcon className={cn('h-5 w-5')} />
              </div>
              <div>
                <CardTitle className={cn('text-2xl')}>Interval Timer</CardTitle>
                <CardDescription>Stay on pace with clear phase transitions.</CardDescription>
              </div>
            </div>
            <div className={cn('flex items-center gap-4')}>
              <div className={cn('text-muted-foreground flex items-center gap-2 text-sm')}>
                <Volume2Icon className={cn('h-4 w-4')} />
                Audio cues auto
              </div>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent className={cn('flex flex-col gap-6')}>
            <div className={cn('flex flex-col items-start gap-2')}>
              <span
                className={cn('text-sm font-medium tracking-wide uppercase', {
                  'text-primary': status === 'running',
                  'text-secondary-foreground': status === 'break',
                  'text-muted-foreground': status === 'idle' || status === 'paused',
                  'text-amber-500': showLastSeconds,
                  'text-emerald-600': status === 'finished',
                  'last-seconds-pulse': showLastSeconds,
                })}
              >
                {phaseLabel}
                {status === 'paused' && pausedFromStatus
                  ? ` · ${getPhaseLabel(pausedFromStatus)}`
                  : ''}
              </span>
              <div className={cn('flex items-baseline gap-3')}>
                <span
                  className={cn('text-5xl font-semibold tabular-nums sm:text-6xl', {
                    'text-primary': status === 'running',
                    'text-amber-500': showLastSeconds,
                    'text-secondary-foreground': status === 'break',
                    'last-seconds-pulse': showLastSeconds,
                  })}
                >
                  {formatTimerSeconds(remainingTime)}
                </span>
                <span className={cn('text-muted-foreground text-sm')}>mm:ss</span>
              </div>
              <div className={cn('text-muted-foreground text-sm')}>
                Completed {currentRepetition} / {repetitionLabel} intervals
              </div>
            </div>
            <div className={cn('flex flex-wrap items-center gap-3')}>
              <Button
                onClick={() => void handleStart()}
                disabled={status !== 'idle' && status !== 'finished'}
                className={cn('min-w-[120px]')}
              >
                <PlayIcon className={cn('h-4 w-4')} />
                Start
              </Button>
              {status === 'paused' ? (
                <Button onClick={() => void handleResume()} variant="secondary">
                  <PlayIcon className={cn('h-4 w-4')} />
                  Resume
                </Button>
              ) : (
                <Button onClick={pauseTimer} variant="secondary" disabled={!isActiveStatus(status)}>
                  <PauseIcon className={cn('h-4 w-4')} />
                  Pause
                </Button>
              )}
              <Button onClick={resetTimer} variant="outline">
                <RefreshCcwIcon className={cn('h-4 w-4')} />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={cn('border-border/70')}>
          <CardHeader>
            <CardTitle className={cn('text-xl')}>Settings</CardTitle>
            <CardDescription>Changes apply on reset while the timer is active.</CardDescription>
          </CardHeader>
          <CardContent className={cn('flex flex-col gap-6')}>
            <FieldGroup>
              <Field orientation="responsive" data-disabled={settingsLocked}>
                <FieldLabel>Start delay</FieldLabel>
                <FieldContent className={cn('flex flex-col gap-3')}>
                  <div className={cn('flex items-center gap-3')}>
                    <Switch
                      checked={settings.startDelayEnabled}
                      disabled={settingsLocked}
                      onCheckedChange={(checked) =>
                        updateSetting('startDelayEnabled', checked === true)
                      }
                    />
                    <span className={cn('text-sm')}>
                      {settings.startDelayEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={settings.startDelaySeconds}
                    disabled={settingsLocked || !settings.startDelayEnabled}
                    onChange={(event) =>
                      updateSetting('startDelaySeconds', parseNumber(event.target.value, 0))
                    }
                  />
                </FieldContent>
              </Field>

              <Separator />

              <Field orientation="responsive" data-disabled={settingsLocked}>
                <FieldLabel>Interval</FieldLabel>
                <FieldContent className={cn('flex flex-col gap-3')}>
                  <Input
                    type="number"
                    min={1}
                    value={settings.intervalSeconds}
                    disabled={settingsLocked}
                    onChange={(event) =>
                      updateSetting('intervalSeconds', parseNumber(event.target.value, 1))
                    }
                  />
                  <FieldDescription>Seconds for each work interval.</FieldDescription>
                </FieldContent>
              </Field>

              <Field orientation="responsive" data-disabled={settingsLocked}>
                <FieldLabel>Break</FieldLabel>
                <FieldContent className={cn('flex flex-col gap-3')}>
                  <Input
                    type="number"
                    min={0}
                    value={settings.breakSeconds}
                    disabled={settingsLocked}
                    onChange={(event) =>
                      updateSetting('breakSeconds', parseNumber(event.target.value, 0))
                    }
                  />
                  <FieldDescription>Seconds for each recovery break.</FieldDescription>
                </FieldContent>
              </Field>

              <Field orientation="responsive" data-disabled={settingsLocked}>
                <FieldLabel>Repetitions</FieldLabel>
                <FieldContent className={cn('flex flex-col gap-3')}>
                  <Input
                    type="number"
                    min={0}
                    value={settings.repetitions}
                    disabled={settingsLocked}
                    onChange={(event) =>
                      updateSetting('repetitions', parseNumber(event.target.value, 0))
                    }
                  />
                  <FieldDescription>0 runs indefinitely.</FieldDescription>
                </FieldContent>
              </Field>

              <Separator />

              <Field orientation="responsive" data-disabled={settingsLocked}>
                <FieldLabel>Include break at end</FieldLabel>
                <FieldContent>
                  <Switch
                    checked={settings.includeBreakAtEnd}
                    disabled={settingsLocked}
                    onCheckedChange={(checked) =>
                      updateSetting('includeBreakAtEnd', checked === true)
                    }
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
