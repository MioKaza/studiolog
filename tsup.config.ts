import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
    treeshake: true,
    minify: false,
    // Copy CSS and fonts to dist
    esbuildOptions(options) {
        options.loader = {
            ...options.loader,
            '.woff2': 'file',
            '.css': 'css',
        }
    },
})
