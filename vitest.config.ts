import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./resources/js', import.meta.url)), '@game': fileURLToPath(new URL('./game', import.meta.url)) }, dedupe: ['vue'] },
    test: { include: ['tests/unit/**/*.test.ts'], maxWorkers: 2 },
});
