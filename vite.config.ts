import { fileURLToPath, URL } from 'node:url';
import { cpSync, createReadStream, existsSync, mkdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { defineConfig, type Plugin } from 'vite';
import presentation from './game/presentation.generated.json' with { type: 'json' };
import type { GamePresentation } from './game/presentation.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const alias = { '@': resolve(root, 'resources/js'), '@game': resolve(root, 'game') };

// Standalone serves the game pack and the exact configured branding files.
function standaloneAssets({ logo, favicon, title, description }: GamePresentation): Plugin {
    const branding = new Map<string, string>();
    const imageTypes: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif' };
    const publicRoot = realpathSync(resolve(root, 'public'));
    for (const path of [logo, favicon]) {
        if (!path) continue;
        if (!/^\/(?:(?:branding|images)\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:svg|png|ico|webp|jpe?g|avif)|favicon\.(?:svg|ico)|apple-touch-icon\.png)$/i.test(path)) {
            throw new Error('Regenerate standalone branding with php artisan project:sync.');
        }
        const file = realpathSync(resolve(publicRoot, '.' + path));
        const directory = path.includes('/', 1) ? path.split('/')[1] : '';
        if (!file.startsWith(resolve(publicRoot, directory) + sep) || !statSync(file).isFile()) {
            throw new Error('Invalid standalone branding asset: ' + path);
        }
        branding.set(path, file);
    }
    return {
        name: 'standalone-game-assets',
        transformIndexHtml(html) {
            const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
            const withIcon = favicon ? html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${favicon}">`) : html;
            return withIcon.replace('</head>', `<title>${escape(title)}</title><meta name="description" content="${escape(description)}"></head>`);
        },
        configureServer(server) {
            server.middlewares.use((request, response, next) => {
                const file = branding.get(request.url?.split('?')[0] ?? '');
                if (!file) { next(); return; }
                const ext = file.split('.').at(-1)?.toLowerCase();
                response.setHeader('Content-Type', imageTypes[ext ?? ''] ?? 'application/octet-stream');
                createReadStream(file).pipe(response);
            });
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
            if (!existsSync(resolve(root, 'dist'))) return;
            cpSync(resolve(root, 'public/game-assets'), resolve(root, 'dist/game-assets'), { recursive: true });
            for (const [path, file] of branding) {
                const target = resolve(root, 'dist', '.' + path);
                mkdirSync(dirname(target), { recursive: true });
                cpSync(file, target);
            }
        },
    };
}

export default defineConfig(({ mode }) => {
    const standalone = mode === 'game';
    return {
        plugins: standalone ? [vue(), standaloneAssets(presentation)] : [
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
