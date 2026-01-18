/**
 * StudioLogger - A high-performance, beautiful logging utility 
 * that works across Browser Consoles and System Terminals.
 */

const IS_BROWSER = typeof window !== 'undefined';

// ANSI Colors for Terminal
const TERM_COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    bgBlue: "\x1b[44m",
    bgYellow: "\x1b[43m",
    bgRed: "\x1b[41m",
    white: "\x1b[37m",
};

// CSS Styles for Browser Console
const BROWSER_STYLES = {
    badge: (color: string) => `background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: sans-serif; font-size: 10px;`,
    timestamp: 'color: #888; font-size: 10px;',
    content: 'color: inherit;',
    error: 'color: #ef4444; font-weight: bold;',
    warn: 'color: #f59e0b; font-weight: bold;',
    info: 'color: #3b82f6; font-weight: bold;',
};

export const StudioLogger = {
    log: (...args: any[]) => {
        const time = new Date().toLocaleTimeString();
        if (IS_BROWSER) {
            console.log(
                `%cStudioLog%c %c${time}%c`,
                BROWSER_STYLES.badge('#3b82f6'),
                '',
                BROWSER_STYLES.timestamp,
                '',
                ...args
            );
        } else {
            console.log(
                `${TERM_COLORS.bgBlue}${TERM_COLORS.white} StudioLog ${TERM_COLORS.reset} ${TERM_COLORS.dim}${time}${TERM_COLORS.reset}`,
                ...args
            );
        }
    },

    warn: (...args: any[]) => {
        const time = new Date().toLocaleTimeString();
        if (IS_BROWSER) {
            console.warn(
                `%cStudioLog%c %c${time}%c %cWARN%c`,
                BROWSER_STYLES.badge('#f59e0b'),
                '',
                BROWSER_STYLES.timestamp,
                '',
                BROWSER_STYLES.warn,
                '',
                ...args
            );
        } else {
            console.warn(
                `${TERM_COLORS.bgYellow}${TERM_COLORS.white} StudioLog ${TERM_COLORS.reset} ${TERM_COLORS.yellow}[WARN]${TERM_COLORS.reset} ${TERM_COLORS.dim}${time}${TERM_COLORS.reset}`,
                ...args
            );
        }
    },

    error: (...args: any[]) => {
        const time = new Date().toLocaleTimeString();
        if (IS_BROWSER) {
            console.error(
                `%cStudioLog%c %c${time}%c %cERROR%c`,
                BROWSER_STYLES.badge('#ef4444'),
                '',
                BROWSER_STYLES.timestamp,
                '',
                BROWSER_STYLES.error,
                '',
                ...args
            );
        } else {
            console.error(
                `${TERM_COLORS.bgRed}${TERM_COLORS.white} StudioLog ${TERM_COLORS.reset} ${TERM_COLORS.red}[ERROR]${TERM_COLORS.reset} ${TERM_COLORS.dim}${time}${TERM_COLORS.reset}`,
                ...args
            );
        }
    },

    info: (...args: any[]) => {
        const time = new Date().toLocaleTimeString();
        if (IS_BROWSER) {
            console.info(
                `%cStudioLog%c %c${time}%c %cINFO%c`,
                BROWSER_STYLES.badge('#8b5cf6'),
                '',
                BROWSER_STYLES.timestamp,
                '',
                BROWSER_STYLES.info,
                '',
                ...args
            );
        } else {
            console.info(
                `${TERM_COLORS.magenta}${TERM_COLORS.bright}StudioLog${TERM_COLORS.reset} ${TERM_COLORS.cyan}[INFO]${TERM_COLORS.reset} ${TERM_COLORS.dim}${time}${TERM_COLORS.reset}`,
                ...args
            );
        }
    }
};
