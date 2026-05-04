import path from 'node:path';
import { defineConfig } from '@playwright/test';

const repoRoot = path.basename(process.cwd()) === 'react_laiwan_com'
    ? path.resolve(process.cwd(), '..')
    : process.cwd();
const snapshotDir = process.env.VISUAL_SCREENSHOT_DIR || './test';

export default defineConfig({
    testDir: './specs',
    testMatch: ['**/*.visual.spec.ts'],
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { outputFolder: '../playwright-report', open: 'never' }],
    ],
    outputDir: '../test-results',
    snapshotPathTemplate: `${snapshotDir}/baseline-{arg}{ext}`,
    use: {
        baseURL: 'http://127.0.0.1:8080',
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
        command: 'NODE_OPTIONS=--openssl-legacy-provider bun run webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 8080',
        url: 'http://127.0.0.1:8080/#/',
        cwd: path.join(repoRoot, 'react_laiwan_com'),
        reuseExistingServer: true,
        timeout: 120000,
    },
});
