import path from 'node:path';
import { defineConfig } from '@playwright/test';

const repoRoot = path.resolve(process.cwd(), '..');

export default defineConfig({
    testDir: './specs',
    testMatch: ['**/*.visual.spec.ts'],
    fullyParallel: false,
    forbidOnly: true,
    retries: 0,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { outputFolder: '../playwright-report', open: 'never' }],
    ],
    outputDir: '../test-results',
    snapshotPathTemplate: './test/baseline-{arg}{ext}',
    use: {
        baseURL: 'http://127.0.0.1:18080',
        viewport: { width: 1440, height: 900 },
        headless: true,
        colorScheme: 'light',
        locale: 'en-US',
        timezoneId: 'Asia/Shanghai',
    },
    expect: {
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            scale: 'css',
            maxDiffPixels: 0,
            threshold: 0,
        },
    },
    webServer: {
        command: 'NODE_OPTIONS=--openssl-legacy-provider bun run webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 18080',
        url: 'http://127.0.0.1:18080/#/',
        cwd: path.join(repoRoot, 'react_laiwan_com'),
        reuseExistingServer: false,
        timeout: 120000,
    },
});
