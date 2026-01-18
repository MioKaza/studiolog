'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import './studiolog.css'
import { LogEntry, SearchState, TailState } from './types'
import { LogList } from './components/LogList'
import { CommandBar } from './components/CommandBar'
import { consoleProxy } from './utils/consoleProxy'
import { motion, AnimatePresence } from 'framer-motion'

type DockPosition = 'bottom' | 'right' | 'float'

export function LogViewerShell({ enabled = true }: { enabled?: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [tail, setTail] = useState<TailState>({ isEnabled: true, isPaused: false })
    const [search] = useState<SearchState>({ query: '', matches: [], currentIndex: 0, isActive: false })

    // Positioning state
    const [dockPosition, setDockPosition] = useState<DockPosition>('bottom')
    const [panelSize, setPanelSize] = useState({ height: 400, width: 500 })
    const [floatPosition, setFloatPosition] = useState({ x: 100, y: 100 })
    const [isResizing, setIsResizing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

    // Session info
    const [sessionId] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase())
    const [sessionStart] = useState(() => Date.now())

    // Filter/grep state
    const [filterLevel, setFilterLevel] = useState<string | null>(null)
    const [grepQuery, setGrepQuery] = useState<string | null>(null)

    // Theme state with actual color palettes
    type ThemeName = 'dracula' | 'nord' | 'matrix' | 'synthwave'
    const [currentTheme, setCurrentTheme] = useState<ThemeName>('dracula')

    const themeColors: Record<ThemeName, { bg: string; bgDarker: string; bgLighter: string; fg: string; fgDim: string; cyan: string; pink: string; purple: string; orange: string; yellow: string; red: string }> = {
        dracula: { bg: '#282a36', bgDarker: '#21222c', bgLighter: '#44475a', fg: '#f8f8f2', fgDim: '#6272a4', cyan: '#8be9fd', pink: '#ff79c6', purple: '#bd93f9', orange: '#ffb86c', yellow: '#f1fa8c', red: '#ff5555' },
        nord: { bg: '#2e3440', bgDarker: '#242933', bgLighter: '#3b4252', fg: '#eceff4', fgDim: '#4c566a', cyan: '#88c0d0', pink: '#b48ead', purple: '#5e81ac', orange: '#d08770', yellow: '#ebcb8b', red: '#bf616a' },
        matrix: { bg: '#0d0d0d', bgDarker: '#000000', bgLighter: '#1a1a1a', fg: '#00ff00', fgDim: '#005500', cyan: '#00ff00', pink: '#00cc00', purple: '#00aa00', orange: '#33ff33', yellow: '#66ff66', red: '#ff0000' },
        synthwave: { bg: '#1a1a2e', bgDarker: '#0f0f1a', bgLighter: '#2d2d44', fg: '#eee', fgDim: '#666', cyan: '#00fff5', pink: '#ff2975', purple: '#7b2cbf', orange: '#ff6b35', yellow: '#fcbf49', red: '#e63946' }
    }

    // Command history
    const [commandHistory, setCommandHistory] = useState<string[]>([])

    // Aliases
    const [aliases, setAliases] = useState<Record<string, string>>({})

    // Watch levels (play sound on these log levels)
    const [watchLevels, setWatchLevels] = useState<string[]>([])

    // Pinned logs
    const [pinnedLogs, setPinnedLogs] = useState<string[]>([])

    // Performance timers (from console.time)
    const [perfTimers, setPerfTimers] = useState<Record<string, number>>({})

    // Network requests
    const [networkRequests, setNetworkRequests] = useState<{ url: string; status: number; time: number }[]>([])

    // FPS tracking
    const [fps, setFps] = useState(0)
    const frameCountRef = useRef(0)
    const lastFpsTimeRef = useRef(Date.now())

    const hasBooted = useRef(false)

    // AGGRESSIVE font override - inject style with max specificity
    useEffect(() => {
        const styleId = 'studiolog-font-override'
        if (document.getElementById(styleId)) return

        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
            [data-studiolog-terminal],
            [data-studiolog-terminal] * {
                font-family: var(--font-jetbrains), 'JetBrains Mono', Menlo, Monaco, 'Courier New', Consolas, monospace !important;
            }
            [data-studiolog-terminal] .sl-bold {
                font-weight: 800 !important;
            }
        `
        document.head.appendChild(style)

        return () => {
            const el = document.getElementById(styleId)
            if (el) el.remove()
        }
    }, [])

    // Apply theme colors dynamically
    useEffect(() => {
        const colors = themeColors[currentTheme]
        const shell = document.querySelector('[data-studiolog-terminal]') as HTMLElement
        if (shell) {
            shell.style.setProperty('--sl-bg', colors.bg)
            shell.style.setProperty('--sl-bg-darker', colors.bgDarker)
            shell.style.setProperty('--sl-bg-lighter', colors.bgLighter)
            shell.style.setProperty('--sl-fg', colors.fg)
            shell.style.setProperty('--sl-fg-dim', colors.fgDim)
            shell.style.setProperty('--sl-cyan', colors.cyan)
            shell.style.setProperty('--sl-pink', colors.pink)
            shell.style.setProperty('--sl-purple', colors.purple)
            shell.style.setProperty('--sl-orange', colors.orange)
            shell.style.setProperty('--sl-yellow', colors.yellow)
            shell.style.setProperty('--sl-red', colors.red)
            shell.style.backgroundColor = colors.bg
            shell.style.color = colors.fg
        }
    }, [currentTheme, themeColors])

    // FPS tracking
    useEffect(() => {
        let animationId: number
        const countFrame = () => {
            frameCountRef.current++
            const now = Date.now()
            if (now - lastFpsTimeRef.current >= 1000) {
                setFps(frameCountRef.current)
                frameCountRef.current = 0
                lastFpsTimeRef.current = now
            }
            animationId = requestAnimationFrame(countFrame)
        }
        animationId = requestAnimationFrame(countFrame)
        return () => cancelAnimationFrame(animationId)
    }, [])

    // Boot sequence
    const boot = useCallback(() => {
        if (hasBooted.current) return
        hasBooted.current = true

        const banner = `
╔══════════════════════════════════════════════════╗
║                                                  ║
║   S T U D I O   ░▒▓█  L O G  █▓▒░   v2.1        ║
║                                                  ║
╚══════════════════════════════════════════════════╝`

        setLogs([{ id: 'banner', timestamp: new Date(), level: 'info', message: banner, args: [] }])

        // Single animated progress bar
        const progressId = 'boot-progress'
        const steps = [
            { percent: 15, msg: 'Initializing kernel...', d: 150 },
            { percent: 42, msg: 'Loading drivers...', d: 350 },
            { percent: 71, msg: 'Mounting filesystem...', d: 550 },
            { percent: 89, msg: 'Starting services...', d: 750 },
            { percent: 100, msg: '', d: 950 }
        ]

        // Add initial progress bar
        setLogs(prev => [...prev, {
            id: progressId,
            timestamp: new Date(),
            level: 'info',
            message: '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%   Initializing...',
            args: []
        }])

        steps.forEach(step => {
            setTimeout(() => {
                setLogs(prev => {
                    const newLogs = [...prev]
                    const progressIndex = newLogs.findIndex(l => l.id === progressId)
                    if (progressIndex >= 0) {
                        const barLength = 30
                        const filled = Math.floor((step.percent / 100) * barLength)
                        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)
                        newLogs[progressIndex] = {
                            ...newLogs[progressIndex],
                            message: `${bar} ${step.percent}%  ${step.msg}`
                        }
                    }
                    return newLogs
                })
            }, step.d)
        })
    }, [])

    useEffect(() => {
        if (isOpen) boot()
    }, [isOpen, boot])

    // Console Proxy
    useEffect(() => {
        if (!enabled) return
        return consoleProxy.init((entry) => {
            setLogs(prev => [...prev, {
                id: entry.id,
                timestamp: entry.timestamp,
                level: entry.level,
                message: entry.args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '),
                args: entry.args,
                stack: entry.stack
            }])
        })
    }, [enabled])

    // Keyboard shortcut
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault()
                setIsOpen(v => !v)
            }
        }
        window.addEventListener('keydown', handle)
        return () => window.removeEventListener('keydown', handle)
    }, [])

    // Resize handler
    useEffect(() => {
        if (!isResizing) return
        const handleMouseMove = (e: MouseEvent) => {
            if (dockPosition === 'bottom') {
                const newHeight = window.innerHeight - e.clientY
                setPanelSize(s => ({ ...s, height: Math.max(200, Math.min(newHeight, window.innerHeight - 100)) }))
            } else if (dockPosition === 'right') {
                const newWidth = window.innerWidth - e.clientX
                setPanelSize(s => ({ ...s, width: Math.max(300, Math.min(newWidth, window.innerWidth - 100)) }))
            }
        }
        const handleMouseUp = () => {
            setIsResizing(false)
            document.body.style.cursor = ''
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = dockPosition === 'bottom' ? 'ns-resize' : 'ew-resize'
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, dockPosition])

    // Drag handler for float mode
    useEffect(() => {
        if (!isDragging) return
        const handleMouseMove = (e: MouseEvent) => {
            setFloatPosition({
                x: e.clientX - dragStartRef.current.x + dragStartRef.current.posX,
                y: e.clientY - dragStartRef.current.y + dragStartRef.current.posY
            })
        }
        const handleMouseUp = () => setIsDragging(false)
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    const startDrag = (e: React.MouseEvent) => {
        if (dockPosition !== 'float') return
        dragStartRef.current = { x: e.clientX, y: e.clientY, posX: floatPosition.x, posY: floatPosition.y }
        setIsDragging(true)
    }

    const handleCommand = useCallback((cmd: string) => {
        // Resolve alias if exists
        let resolvedCmd = cmd.trim()
        const aliasName = resolvedCmd.split(' ')[0].toLowerCase()
        if (aliases[aliasName]) {
            resolvedCmd = aliases[aliasName] + resolvedCmd.slice(aliasName.length)
        }

        const c = resolvedCmd.toLowerCase()

        // Track command history
        setCommandHistory(prev => [...prev.slice(-50), cmd.trim()])

        setLogs(prev => [...prev, { id: `cmd-${Date.now()}`, timestamp: new Date(), level: 'log', message: `$ ${cmd}`, args: [] }])

        let output = ''
        if (c === 'help') {
            output = `
╔══════════════════════════════════════════════════════════════════════╗
║  STUDIOLOG v2.1.0 • COMMAND REFERENCE                                ║
╠══════════════════════════════════════════════════════════════════════╣
║  UTILITIES                                                           ║
║    help              Display this menu                               ║
║    clear             Flush terminal buffer                           ║
║    dock              Cycle dock position (bottom/right/float)        ║
║    tail              Toggle auto-scroll on/off                       ║
║    export            Copy logs to clipboard as markdown              ║
║    mark              Add a visual separator/marker                   ║
║    history           Show command history                            ║
║    alias <n> <cmd>   Create command shortcut                         ║
║    watch <level>     Play beep on log level (off to disable)         ║
║    pin <id>          Pin a log entry (shows at top)                  ║
╠══════════════════════════════════════════════════════════════════════╣
║  FILTERING                                                           ║
║    filter <level>    Show only: error, warn, info, log, debug        ║
║    filter off        Remove level filter                             ║
║    grep <term>       Filter logs containing <term>                   ║
║    grep off          Remove grep filter                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  MONITORING                                                          ║
║    status            Show session health                             ║
║    count             Log frequency statistics                        ║
║    top               Show most active log sources                    ║
║    uptime            Show session uptime                             ║
║    env               Show environment info                           ║
║    info              Show system/project info (ASCII art)            ║
║    analyze           Scan logs and summarize                         ║
║    perf              Show performance timings                        ║
║    net               Show recent network requests                    ║
║    memory            Show JS heap usage                              ║
║    fps               Show current frame rate                         ║
╠══════════════════════════════════════════════════════════════════════╣
║  THEMES                                                              ║
║    theme <name>      Switch theme: dracula, nord, matrix, synthwave  ║
╚══════════════════════════════════════════════════════════════════════╝`
        } else if (c === 'clear') {
            setLogs([])
            return
        } else if (c === 'font') {
            // Debug: Check what font is actually being used
            const shell = document.querySelector('.studiolog-shell')
            if (shell) {
                const computedStyle = window.getComputedStyle(shell)
                const fontFamily = computedStyle.fontFamily
                output = `Current font-family: ${fontFamily}`
            } else {
                output = 'Could not detect shell element'
            }
        } else if (c === 'dock') {
            const positions: DockPosition[] = ['bottom', 'right', 'float']
            const currentIndex = positions.indexOf(dockPosition)
            const nextPosition = positions[(currentIndex + 1) % positions.length]
            setDockPosition(nextPosition)
            output = `Dock position changed to: ${nextPosition.toUpperCase()}`
        } else if (c === 'status') {
            output = `[ONLINE] Session: ${sessionId} | Logs: ${logs.length} | Mode: ${dockPosition.toUpperCase()}`
        } else if (c === 'count') {
            const counts = logs.reduce((acc, log) => {
                acc[log.level] = (acc[log.level] || 0) + 1
                return acc
            }, {} as Record<string, number>)
            output = `Total: ${logs.length} | LOG: ${counts.log || 0} | INFO: ${counts.info || 0} | WARN: ${counts.warn || 0} | ERROR: ${counts.error || 0}`
        }
        // ═══════════════════════════════════════════════════════════════
        //  FILTER
        // ═══════════════════════════════════════════════════════════════
        else if (c.startsWith('filter')) {
            const arg = c.replace('filter', '').trim()
            if (arg === 'off' || !arg) {
                setFilterLevel(null)
                output = 'Filter cleared. Showing all log levels.'
            } else if (['error', 'warn', 'info', 'log', 'debug'].includes(arg)) {
                setFilterLevel(arg)
                output = `Filter active: showing only ${arg.toUpperCase()} logs.`
            } else {
                output = `Unknown level '${arg}'. Use: error, warn, info, log, debug, or off.`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  GREP
        // ═══════════════════════════════════════════════════════════════
        else if (c.startsWith('grep')) {
            const arg = c.replace('grep', '').trim()
            if (arg === 'off' || !arg) {
                setGrepQuery(null)
                output = 'Grep filter cleared.'
            } else {
                setGrepQuery(arg)
                output = `Grep active: showing logs containing '${arg}'.`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  TAIL
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'tail') {
            setTail(prev => ({ ...prev, isEnabled: !prev.isEnabled }))
            output = `Auto-scroll ${!tail.isEnabled ? 'ENABLED' : 'DISABLED'}.`
        }
        // ═══════════════════════════════════════════════════════════════
        //  EXPORT
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'export') {
            const markdown = logs.map(l => `[${l.level.toUpperCase()}] ${l.message}`).join('\n')
            navigator.clipboard.writeText(markdown).then(() => {
                setLogs(prev => [...prev, { id: `out-${Date.now()}`, timestamp: new Date(), level: 'info', message: `Copied ${logs.length} log entries to clipboard.`, args: [] }])
            })
            return
        }
        // ═══════════════════════════════════════════════════════════════
        //  MARK
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'mark') {
            const now = new Date().toLocaleTimeString()
            output = `\n════════════════════════════════════════════════════════════════\n   ▌▌ MARKER @ ${now} ▌▌\n════════════════════════════════════════════════════════════════`
        }
        // ═══════════════════════════════════════════════════════════════
        //  THEME
        // ═══════════════════════════════════════════════════════════════
        else if (c.startsWith('theme')) {
            const arg = c.replace('theme', '').trim()
            const themes = ['dracula', 'nord', 'matrix', 'synthwave']
            if (themes.includes(arg)) {
                setCurrentTheme(arg as typeof currentTheme)
                output = `Theme switched to ${arg.toUpperCase()}.`
            } else {
                output = `Unknown theme '${arg}'. Available: ${themes.join(', ')}`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  TOP
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'top') {
            const sources: Record<string, number> = {}
            logs.forEach(l => {
                const src = l.message.split(' ')[0]?.replace(/[^a-zA-Z]/g, '') || 'unknown'
                sources[src] = (sources[src] || 0) + 1
            })
            const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 5)
            output = `\n╔══════════════════════════════════════╗\n║  TOP LOG SOURCES                     ║\n╠══════════════════════════════════════╣\n${sorted.map(([src, cnt]) => `║  ${src.padEnd(20)} ${String(cnt).padStart(5)} logs  ║`).join('\n')}\n╚══════════════════════════════════════╝`
        }
        // ═══════════════════════════════════════════════════════════════
        //  UPTIME
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'uptime') {
            const elapsed = Date.now() - sessionStart
            const mins = Math.floor(elapsed / 60000)
            const secs = Math.floor((elapsed % 60000) / 1000)
            output = `Session uptime: ${mins}m ${secs}s`
        }
        // ═══════════════════════════════════════════════════════════════
        //  ENV
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'env') {
            output = `\n╔══════════════════════════════════════╗\n║  ENVIRONMENT                         ║\n╠══════════════════════════════════════╣\n║  NODE_ENV:      ${((globalThis as any).process?.env?.NODE_ENV || 'development').padEnd(18)}  ║\n║  Platform:      ${(typeof navigator !== 'undefined' ? navigator.platform : 'unknown').padEnd(18)}  ║\n║  Session:       ${sessionId.padEnd(18)}  ║\n╚══════════════════════════════════════╝`
        }
        // ═══════════════════════════════════════════════════════════════
        //  ANALYZE
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'analyze') {
            const errors = logs.filter(l => l.level === 'error').length
            const warns = logs.filter(l => l.level === 'warn').length
            const fiveMin = Date.now() - 300000
            const recentErrors = logs.filter(l => l.level === 'error' && l.timestamp.getTime() > fiveMin).length
            output = `\n╔══════════════════════════════════════╗\n║  ANALYSIS REPORT                     ║\n╠══════════════════════════════════════╣\n║  Total Logs:         ${String(logs.length).padStart(10)}     ║\n║  Errors (all time):  ${String(errors).padStart(10)}     ║\n║  Warnings (all time):${String(warns).padStart(10)}     ║\n║  Errors (last 5min): ${String(recentErrors).padStart(10)}     ║\n╚══════════════════════════════════════╝`
        }
        // ═══════════════════════════════════════════════════════════════
        //  INFO (formerly neofetch)
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'info') {
            const uptimeMs = Date.now() - sessionStart
            output = `
        ██████╗ ████████╗██╗   ██╗██████╗ ██╗ ██████╗
       ██╔════╝ ╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
       ╚█████╗     ██║   ██║   ██║██║  ██║██║██║   ██║
        ╚═══██╗    ██║   ██║   ██║██║  ██║██║██║   ██║
       ██████╔╝    ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
       ╚═════╝     ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝ LOG
       ───────────────────────────────────────────────
       Session:    ${sessionId}
       Uptime:     ${Math.floor(uptimeMs / 60000)}m ${Math.floor((uptimeMs % 60000) / 1000)}s
       Logs:       ${logs.length}
       Theme:      ${currentTheme}
       Platform:   ${typeof navigator !== 'undefined' ? navigator.platform : 'unknown'}
       Framework:  Next.js + React
       ───────────────────────────────────────────────`
        }
        // ═══════════════════════════════════════════════════════════════
        //  HISTORY
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'history') {
            if (commandHistory.length === 0) {
                output = 'No commands in history yet.'
            } else {
                output = `\n╔══════════════════════════════════════╗\n║  COMMAND HISTORY                     ║\n╠══════════════════════════════════════╣\n${commandHistory.slice(-10).map((cmd, i) => `║  ${String(i + 1).padStart(2)}. ${cmd.padEnd(30)}  ║`).join('\n')}\n╚══════════════════════════════════════╝`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  ALIAS
        // ═══════════════════════════════════════════════════════════════
        else if (c.startsWith('alias')) {
            const parts = c.replace('alias', '').trim().split(' ')
            const name = parts[0]
            const command = parts.slice(1).join(' ')
            if (!name) {
                // List aliases
                if (Object.keys(aliases).length === 0) {
                    output = 'No aliases defined. Use: alias <name> <command>'
                } else {
                    output = `\n╔══════════════════════════════════════╗\n║  ALIASES                             ║\n╠══════════════════════════════════════╣\n${Object.entries(aliases).map(([n, cmd]) => `║  ${n.padEnd(10)} → ${cmd.padEnd(22)}  ║`).join('\n')}\n╚══════════════════════════════════════╝`
                }
            } else if (!command) {
                output = `Usage: alias <name> <command>`
            } else {
                setAliases(prev => ({ ...prev, [name]: command }))
                output = `Alias created: '${name}' → '${command}'`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  WATCH
        // ═══════════════════════════════════════════════════════════════
        else if (c.startsWith('watch')) {
            const level = c.replace('watch', '').trim()
            if (level === 'off') {
                setWatchLevels([])
                output = 'Watch disabled. No sound alerts.'
            } else if (['error', 'warn', 'info', 'log', 'debug'].includes(level)) {
                setWatchLevels(prev => prev.includes(level) ? prev : [...prev, level])
                output = `Now watching for ${level.toUpperCase()} logs. You'll hear a beep.`
            } else {
                output = `Watching: ${watchLevels.length > 0 ? watchLevels.join(', ') : 'none'}\nUse: watch <level> or watch off`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  PIN
        // ═══════════════════════════════════════════════════════════════
        else if (c.startsWith('pin')) {
            const id = c.replace('pin', '').trim()
            if (!id) {
                if (pinnedLogs.length === 0) {
                    output = 'No pinned logs. Use: pin <log-id> (hint: log IDs are visible in export)'
                } else {
                    output = `Pinned logs: ${pinnedLogs.length}`
                }
            } else if (id === 'clear') {
                setPinnedLogs([])
                output = 'All pins cleared.'
            } else {
                setPinnedLogs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
                output = `Log ${id} ${pinnedLogs.includes(id) ? 'unpinned' : 'pinned'}.`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  PERF
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'perf') {
            const entries = Object.entries(perfTimers)
            if (entries.length === 0) {
                output = 'No performance timers recorded. Use console.time() in your code.'
            } else {
                output = `\n╔══════════════════════════════════════╗\n║  PERFORMANCE TIMERS                  ║\n╠══════════════════════════════════════╣\n${entries.slice(-10).map(([name, ms]) => `║  ${name.padEnd(22)} ${String(ms).padStart(8)}ms  ║`).join('\n')}\n╚══════════════════════════════════════╝`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  NET
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'net') {
            if (networkRequests.length === 0) {
                output = 'No network requests recorded yet.'
            } else {
                output = `\n╔══════════════════════════════════════════════════════════════╗\n║  NETWORK REQUESTS                                            ║\n╠══════════════════════════════════════════════════════════════╣\n${networkRequests.slice(-10).map(r => `║  ${r.status === 200 ? '✓' : '✗'} ${String(r.status).padEnd(4)} ${r.url.slice(0, 45).padEnd(45)} ${String(r.time).padStart(4)}ms  ║`).join('\n')}\n╚══════════════════════════════════════════════════════════════╝`
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  MEMORY
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'memory') {
            // @ts-expect-error - performance.memory is non-standard
            const mem = performance.memory
            if (mem) {
                const used = (mem.usedJSHeapSize / 1024 / 1024).toFixed(2)
                const total = (mem.totalJSHeapSize / 1024 / 1024).toFixed(2)
                const limit = (mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
                output = `\n╔══════════════════════════════════════╗\n║  MEMORY USAGE                        ║\n╠══════════════════════════════════════╣\n║  Used:     ${used.padStart(10)} MB           ║\n║  Total:    ${total.padStart(10)} MB           ║\n║  Limit:    ${limit.padStart(10)} MB           ║\n╚══════════════════════════════════════╝`
            } else {
                output = 'Memory API not available in this browser.'
            }
        }
        // ═══════════════════════════════════════════════════════════════
        //  FPS
        // ═══════════════════════════════════════════════════════════════
        else if (c === 'fps') {
            output = `Current FPS: ${fps}`
        }
        // ═══════════════════════════════════════════════════════════════
        //  UNKNOWN
        // ═══════════════════════════════════════════════════════════════
        else {
            output = `Command '${c}' not recognized. Type 'help'.`
        }

        if (output) {
            setTimeout(() => {
                setLogs(prev => [...prev, { id: `out-${Date.now()}`, timestamp: new Date(), level: 'info', message: output, args: [] }])
            }, 50)
        }
    }, [dockPosition, logs, sessionId, sessionStart, tail.isEnabled, currentTheme, aliases, commandHistory, watchLevels, pinnedLogs, perfTimers, networkRequests, fps])

    // Get panel styles based on dock position
    const getPanelStyles = (): React.CSSProperties => {
        switch (dockPosition) {
            case 'bottom':
                return { position: 'fixed', bottom: 0, left: 0, right: 0, height: panelSize.height }
            case 'right':
                return { position: 'fixed', top: 0, right: 0, bottom: 0, width: panelSize.width }
            case 'float':
                return {
                    position: 'fixed',
                    left: floatPosition.x,
                    top: floatPosition.y,
                    width: 600,
                    height: 400,
                    borderRadius: 8,
                    border: '1px solid var(--sl-bg-lighter)'
                }
        }
    }

    if (!enabled) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[999999]">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        data-studiolog-terminal
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="studiolog-shell pointer-events-auto flex flex-col overflow-hidden shadow-2xl"
                        style={getPanelStyles()}
                    >
                        {/* Resize Handle */}
                        {dockPosition === 'bottom' && (
                            <div onMouseDown={() => setIsResizing(true)} className="h-1 cursor-ns-resize hover:bg-[var(--sl-purple)] transition-colors" />
                        )}
                        {dockPosition === 'right' && (
                            <div onMouseDown={() => setIsResizing(true)} className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[var(--sl-purple)] transition-colors" />
                        )}

                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-4 py-2 select-none shrink-0"
                            style={{ backgroundColor: 'var(--sl-bg-darker)', borderBottom: '1px solid var(--sl-bg-lighter)' }}
                            onMouseDown={startDrag}
                        >
                            <div className="flex items-center gap-3">
                                <span className="sl-bold text-xs tracking-wider flex items-center gap-2" style={{ color: 'var(--sl-cyan)' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8" /></svg>
                                    STUDIOLOG
                                </span>
                                <div className="h-3 w-[1px]" style={{ backgroundColor: 'var(--sl-bg-lighter)' }} />
                                <span className="text-[10px] opacity-60 font-mono tracking-tight" style={{ color: 'var(--sl-fg-dim)' }}>
                                    ● connected
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Dock Toggle Buttons */}
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--sl-bg)' }}>
                                    <button
                                        onClick={() => setDockPosition('bottom')}
                                        className={`p-1 rounded transition-colors ${dockPosition === 'bottom' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                                        title="Dock Bottom"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-cyan)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
                                    </button>
                                    <button
                                        onClick={() => setDockPosition('right')}
                                        className={`p-1 rounded transition-colors ${dockPosition === 'right' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                                        title="Dock Right"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-cyan)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
                                    </button>
                                    <button
                                        onClick={() => setDockPosition('float')}
                                        className={`p-1 rounded transition-colors ${dockPosition === 'float' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                                        title="Float (Drag to move)"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-cyan)" strokeWidth="2"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
                                    </button>
                                </div>

                                <span className="text-[10px] sl-bold" style={{ color: 'var(--sl-fg-dim)' }}>{logs.length} LINES</span>

                                <button onClick={() => setIsOpen(false)} className="transition-all hover:rotate-90" style={{ color: 'var(--sl-red)' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Log Stream */}
                        <LogList logs={logs} search={search} tail={tail} onToggleExpand={() => { }} onTogglePin={() => { }} />

                        {/* Command Input */}
                        <CommandBar onCommand={handleCommand} />

                        {/* Bottom Status Bar */}
                        <div
                            className="flex items-center justify-between px-4 py-1.5 text-[10px] select-none shrink-0"
                            style={{ backgroundColor: 'var(--sl-bg-darker)', borderTop: '1px solid var(--sl-bg-lighter)' }}
                        >
                            <div className="flex items-center gap-4">
                                <span><span className="sl-bold" style={{ color: 'var(--sl-purple)' }}>SESSION:</span> <span style={{ color: 'var(--sl-fg)' }}>{sessionId}</span></span>
                                <span><span className="sl-bold" style={{ color: 'var(--sl-purple)' }}>NETWORK:</span> <span style={{ color: '#50fa7b' }}>ONLINE</span></span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span><span className="sl-bold" style={{ color: 'var(--sl-purple)' }}>ENV:</span> <span style={{ color: 'var(--sl-orange)' }}>DEV</span></span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="pointer-events-auto fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all group"
                        style={{ backgroundColor: 'var(--sl-bg)', border: '1px solid var(--sl-bg-lighter)' }}
                    >
                        <svg className="group-hover:scale-110 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sl-cyan)" strokeWidth="2">
                            <path d="M4 17l6-6-6-6M12 19h8" />
                        </svg>
                        {logs.length > 0 && (
                            <div className="absolute -top-1 -right-1 text-[10px] sl-bold rounded-full px-1.5 min-w-[18px]" style={{ backgroundColor: 'var(--sl-pink)', color: 'var(--sl-bg)' }}>
                                {logs.length}
                            </div>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    )
}
