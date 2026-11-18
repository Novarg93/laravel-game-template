import { fileURLToPath, URL } from 'node:url';
import { cpSync, createReadStream, existsSync, realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { defineConfig, type Plugin } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const alias = { '@': resolve(root, 'resources/js'), '@game': resolve(root, 'game') };

// The optional standalone harness serves/copies only approved public game assets.
function standaloneAssets(): Plugin {
    return {
        name: 'standalone-game-assets',
        configureServer(server) {
            server.middlewares.use('/game-assets', (request, response, next) => {
                const assets = resolve(root, 'public/game-assets');
                let file: string;
                try { file = realpathSync(resolve(assets, '.' + decodeURIComponent((request.url ?? '/').split('?')[0]))); }
                catch { next(); return; }
                if (!file.startsWith(assets + sep) || !statSync(file).isFile()) { next(); return; }
                const type = file.endsWith('.json') ? 'application/json' : file.endsWith('.png') ? 'image/png' : file.endsWith('.wav') ? 'audio/wav' : file.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream';
                response.setHeader('Content-Type', type);
                createReadStream(file).pipe(response);
            });
        },
        closeBundle() {
            if (existsSync(resolve(root, 'dist'))) cpSync(resolve(root, 'public/game-assets'), resolve(root, 'dist/game-assets'), { recursive: true });
        },
    };
}

export default defineConfig(({ mode }) => {
    const standalone = mode === 'game';
    return {
        plugins: standalone ? [vue(), standaloneAssets()] : [
            laravel({ input: ['resources/css/app.css', 'resources/js/app.ts', 'resources/js/game.ts'], refresh: true }),
            inertia(), tailwindcss(),
            vue({ template: { transformAssetUrls: { base: null, includeAbsolute: false } } }),
            wayfinder({ formVariants: true }),
        ],
        publicDir: false,
        // Standalone dev has one real HTML entry; archived art viewers are not app dependencies.
        optimizeDeps: standalone ? { entries: ['index.html'] } : undefined,
        resolve: { alias, dedupe: ['vue', 'phaser'] },
        build: standalone ? { outDir: 'dist' } : {},
        server: {
            host: '127.0.0.1', port: standalone ? 5173 : 5174, strictPort: true,
            watch: { ignored: ['**/.tmp/**', '**/test-results/**', '**/playwright-report/**', '**/art/**', '**/screenshots/**', '**/vendor/**', '**/storage/**', '**/.agents/**', '**/.codex/**'] },
        },
    };
});
