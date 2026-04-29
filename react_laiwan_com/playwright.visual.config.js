const { defineConfig } = require('@playwright/test');
const { resolveVisualServerCommand } = require('./test/visual/helpers/serverCommand');

const snapshotDir = process.env.VISUAL_SCREENSHOT_DIR || 'test/screenshots';

module.exports = defineConfig({
    testDir: './test/visual',
    testIgnore: ['**/watch.test.js'],
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ],
    outputDir: 'test-results',
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
            maxDiffPixels: 50,
        },
    },
    webServer: {
        command: resolveVisualServerCommand(),
        url: 'http://127.0.0.1:8080/#/',
        reuseExistingServer: true,
        timeout: 120000,
    },
});
