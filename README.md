# StudioLog

**The essential in-app terminal for Tauri and Desktop React applications.**

StudioLog is a professional, resident debug console designed for modern desktop apps. It solves the "Black Box" problem in Tauri release builds by providing a beautiful, terminal-style interface for logs, system health, and command execution directly inside your window.

![StudioLog](./demo.png)

## Why StudioLog?

Tauri and Electron applications often disable browser DevTools in final production builds. StudioLog bridge this gap, giving you a powerful developer environment that your testers and users can access even when standard inspection tools are locked.

## Features

- **Tauri Native Feel** - Deep terminal aesthetic matching system tool designs
- **Resident Debugging** - Always available, especially in full-screen or kiosk modes
- **Production-Ready** - Debug release builds without enabling unsecure DevTools
- **Terminal Commands** - Run `filter`, `grep`, `status`, `memory`, and `fps` on the fly
- **Multi-Theme Engine** - Dracula, Nord, Matrix, and Synthwave presets
- **Zero-Network Policy** - No telemetry. No external calls. 100% privacy-focused.
- **Universal compatibility** - While optimized for Tauri, it works flawlessly in any React browser app.

## Installation

```bash
npm install studiolog
```

## Usage

```tsx
import { Peek } from 'studiolog'
import 'studiolog/styles.css'

export default function App({ children }) {
  return (
    <>
      {children}
      {/* 
          Pro-tip: Only enable in dev or via a secret 
          keyboard shortcut for production support 
      */}
      <Peek enabled={process.env.NODE_ENV === 'development'} />
    </>
  )
}
```

## Commands

| Command | Description |
|---------|-------------|
| `help` | Show all available commands |
| `clear` | Wipe the terminal buffer |
| `filter <level>` | Log level isolation (error, warn, info, etc) |
| `grep <term>` | Full-text search across all logs |
| `theme <name>` | dracula, nord, matrix, synthwave |
| `dock` | Cycle position: bottom, right, or floating |
| `status` | System health and session metrics |
| `memory` | Real-time JS heap tracking |
| `fps` | Frame rate monitoring for UI performance |

## Themes

- **Dracula** (default) - High-contrast purple
- **Nord** - Clean, arctic professional
- **Matrix** - Classic hacker aesthetic
- **Synthwave** - Neon 80s debugging

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Show or hide the console trigger |

## Development

```bash
npm install
npm run build
npm run dev
```

## License

MIT © Mio Kaza Labs
