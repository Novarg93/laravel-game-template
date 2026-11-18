import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 45000,
    use: { baseURL: `http://127.0.0.1:${process.env.TEMPLATE_BROWSER_PORT ?? '8037'}`, channel: 'chromium', headless: true, viewport: { width: 1280, height: 720 } },
    reporter: [['list']],
});
