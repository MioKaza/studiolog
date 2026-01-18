import '@testing-library/jest-dom'

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 16)
global.cancelAnimationFrame = (id) => clearTimeout(id)

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function () { }
