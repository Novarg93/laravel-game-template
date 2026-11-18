import { defineConfig } from '@playwright/test';
import runtime from './playwright.config';

// Original PixelSurvivor review scenarios, selectors and assertions are retained.
export default defineConfig(runtime, {
    testDir: './tests/historical/e2e',
});
