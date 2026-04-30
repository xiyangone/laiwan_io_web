const path = require('path');
const { defineConfig } = require('@playwright/test');
const { resolveVisualServerCommand } = require('./helpers/serverCommand');

const snapshotDir = process.env.VISUAL_SCREENSHOT_DIR || './test';
const maxDiffPixels = process.env.CI ? 1200 : 50;

module.exports = defineConfig({
    testDir: './specs',
    testMatch: ['**/*.visual.spec.js'],
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
            maxDiffPixels,
        },
    },
    webServer: {
        command: resolveVisualServerCommand(),
        url: 'http://127.0.0.1:8080/#/',
        cwd: path.resolve(__dirname, '..', 'react_laiwan_com'),
        reuseExistingServer: true,
        timeout: 120000,
    },
});
