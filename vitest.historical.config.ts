import { defineConfig } from 'vitest/config';
import runtime from './vitest.config';

// Missing historical inputs must fail this opt-in suite; there are no fake proofs.
export default defineConfig({
    ...runtime,
    test: { ...runtime.test, include: ['tests/historical/unit/**/*.test.ts'] },
});
