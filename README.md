# Kotoba Studio

Kotoba Studio is a focused Japanese vocabulary trainer for studying lesson-based word lists. It combines Japanese writing, romaji pronunciation, localized meanings, progress tracking, and a built-in content editor in one calm, offline-friendly application.

The interface is available in Russian, English, and Japanese. Kotoba Studio is packaged as a native macOS desktop application.

## Features

- 25 structured lessons with 413 vocabulary entries
- Japanese, romaji, and localized Russian or English study directions
- Mixed and focused practice sessions
- Per-word mastery, accuracy, streaks, and session history
- Russian, English, and Japanese interface languages for lessons, vocabulary, and practice
- Light and dark themes with persistent preferences
- Local-first storage with no account required
- JSON backup, import, and content export
- Visual lesson and vocabulary editor
- Offline-friendly desktop interface
- Native macOS packaging with Tauri

## Technology

- React and TypeScript
- Vite
- Zustand
- IndexedDB
- Zod
- Vitest and Testing Library
- Playwright
- Tauri 2 and Rust

## Installation

Download `Kotoba-Studio-macOS-Apple-Silicon.dmg` from the latest GitHub Release, open the disk image, and drag Kotoba Studio to Applications.

## Run in development

Requirements: macOS, Node.js 24 or newer, pnpm, Rust, and Xcode Command Line Tools.

```bash
pnpm install
pnpm desktop dev
```

## Build the macOS application

The desktop build requires macOS, Rust, and Xcode Command Line Tools.

```bash
pnpm install
pnpm desktop:build
```

Tauri creates the `.app` bundle and Apple Silicon `.dmg` installer under `src-tauri/target/release/bundle/`.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

End-to-end tests can be run with:

```bash
pnpm test:e2e
```

## Project structure

```text
src/
  data/             lesson content and migrations
  domain/           learning rules, types, and validation
  infrastructure/   IndexedDB persistence and speech
  presentation/     screens, components, localization, and themes
  store/            application state
src-tauri/           native macOS application shell
e2e/                 browser-level tests
```

## Local data

Learning progress, settings, custom lessons, and session history stay on the user's device. The application includes full JSON backup and restore tools so the data can be moved without an online account.

## License

Kotoba Studio is available under the [MIT License](LICENSE).
