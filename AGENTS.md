# INTERVAL TIMER SPA - LLM GUIDE

This project uses Vite, TypeScript, React, shadcn/ui and Tailwind CSS.

- Use jotai for global state management.
- Use lucide-react for icons.
- Use tone for audio samples and synthesis.
- Use date-fns for date or time manipulation.
- Reuse shadcn/ui components whenever possible instead of writing new similar components.
- Keep UI modern, responsive and consistent across the app.

The project is a SPA that is deployed as GitHub Pages. It follows a simple and well-known src
directory structure: components, lib, utils, hooks, etc.

## BUSINESS LOGIC

### GOAL

A simple, beautiful interval timer SPA for workouts or focus sessions. The app orchestrates
time-based phases (delay → work → break) with sound cues, clear visual feedback, and predictable
repetition behavior.

The goal is also to have a repeatable and predictable interval timer that can be used for workouts
or focus sessions without much manual intervention.

### CORE CONCEPTS

- Time is discrete and counted in seconds.
- The timer is a finite state machine.
- One “cycle” = one interval (work) + optional break.
- The app runs until repetitions are exhausted or manually stopped.

### GLOBAL STATE (JOTAI-LEVEL, CONCEPTUAL)

- status: idle | delay | running | break | finished | paused
- remainingTime: number (seconds left in current phase)
- currentRepetition: number (0-based)
- settings:
  - startDelaySeconds (default 5)
  - startDelayEnabled (default true)
  - intervalSeconds (default 120)
  - breakSeconds (default 30)
  - repetitions (default 0 = infinite)
  - includeBreakAtEnd (default false)

### Persistent storage

The app uses local storage to load/save all configuration settings.

### TIMER FLOW (HIGH LEVEL)

1. IDLE
   - User edits settings.
   - Start button initializes run.

2. START
   - Reset repetition counter.
   - If startDelayEnabled → enter DELAY
   - Else → enter RUNNING immediately.

3. DELAY
   - Countdown startDelaySeconds.
   - On zero → enter RUNNING.

4. RUNNING (INTERVAL)
   - Countdown intervalSeconds.
   - During last seconds (e.g. last 3s):
     - Play audio cues: beep, beep, beeeep.
   - On zero:
     - Increment currentRepetition.
     - Decide next state:
       - If repetitions > 0 AND currentRepetition >= repetitions: → FINISHED (unless
         includeBreakAtEnd is true)
       - Else if breakSeconds > 0: → BREAK
       - Else: → RUNNING again

5. BREAK
   - Countdown breakSeconds.
   - On zero:
     - If repetitions limit reached: → FINISHED
     - Else: → RUNNING

6. FINISHED
   - Timer stops.
   - Clear “active” visuals.
   - Offer restart or reset.

### PAUSE / RESUME

- Pause freezes remainingTime and status.
- Resume continues the same phase without recalculation.

### AUDIO LOGIC

- Audio is purely event-based (no external files).
- Audio is generated using Tone.js.
- Audio is triggered:
  - 3 seconds before a delay/break/workout ends (one beep each second)
  - on workout/break starts (a combination of notes)

### UI FEEDBACK RULES

- Always show:
  - Current phase (Delay / Interval / Break / Finished)
  - Large countdown number (seconds)
- Visual emphasis:
  - RUNNING: strong primary color
  - BREAK: softer / secondary color
  - LAST SECONDS: warning color + subtle pulse
- Controls:
  - Start disabled while running
  - Pause / Resume toggle while active
  - Reset always available
- Responsive:
  - Mobile-first
  - Large tap targets
  - Big typography

### EDGE CASES

- repetitions = 0 → infinite loop
- breakSeconds = 0 → skip break phase
- includeBreakAtEnd = false → final interval ends immediately
- Changing settings while running is ignored until reset

### DEPLOYMENT INTENT (NON-TECHNICAL)

- App is static.
- Build outputs a single distributable bundle.
- Automated workflow builds and publishes to GitHub Pages.
- No backend, no persistence required.

### LLM EXPECTATION

- Respect this state machine strictly.
- Do not invent extra phases.
- Prioritize clarity, predictability, and visual feedback over features.
