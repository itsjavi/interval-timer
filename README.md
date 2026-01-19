# Interval Timer

A simple, beautiful interval timer SPA for workouts or focus sessions. The app orchestrates time-based phases (delay → work → break) with sound cues, clear visual feedback, and predictable repetition behavior.

## Features

- Configurable work intervals and break periods
- Optional start delay countdown
- Infinite or fixed repetition modes
- Audio cues during countdown (synthesized, no external files)
- Mobile-first responsive design with large tap targets
- Settings persistence via local storage
- Dark/light theme support

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build | [Vite](https://vite.dev) with React Compiler |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) |
| State | [Jotai](https://jotai.org) |
| Audio | [Tone.js](https://tonejs.github.io) |
| Icons | [Lucide React](https://lucide.dev) |
| Deployment | GitHub Pages (static SPA) |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/      # React components
│   └── ui/          # shadcn/ui primitives
├── lib/             # Timer logic, state, and utilities
├── main.tsx         # App entry point
└── styles.css       # Global styles (Tailwind)
```

## Documentation

For detailed business logic, state machine behavior, audio rules, and UI feedback guidelines, see **[AGENTS.md](./AGENTS.md)**.

## Deployment

The app automatically builds and deploys to GitHub Pages via the workflow in `.github/workflows/gh-pages.yaml`. Every push to `main` triggers a new deployment.

## License

MIT
