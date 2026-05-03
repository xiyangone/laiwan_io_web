const fs = require('fs');
const path = require('path');
const { createDiffImageBuffer } = require('./pngDiff');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_SCREENSHOT_DIR = path.join(PROJECT_ROOT, 'visual_regression', 'test');

function formatTimestamp(date = new Date()) {
    const pad = (value, size = 2) => value.toString().padStart(size, '0');

    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
        + `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
        + `-${pad(date.getMilliseconds(), 3)}`;
}

function resolveScreenshotsDir() {
    const configuredDir = process.env.VISUAL_SCREENSHOT_DIR;

    if (!configuredDir) {
        return DEFAULT_SCREENSHOT_DIR;
    }

    return path.isAbsolute(configuredDir)
        ? configuredDir
        : path.resolve(PROJECT_ROOT, configuredDir);
}

function sanitizeScreenshotName(name) {
    return name
        .toString()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        || 'visual-shot';
}

function isVisualDiffEnabled() {
    const raw = `${process.env.VISUAL_SAVE_DIFF || '1'}`.trim().toLowerCase();
    return raw !== '0' && raw !== 'false';
}

function buildDiffImagePath(outputDir, name) {
    fs.mkdirSync(outputDir, { recursive: true });
    return path.join(outputDir, `diff-${sanitizeScreenshotName(name)}.png`);
}

function buildTimestampedScreenshotPath(name, prefix = '', screenshotsDir = resolveScreenshotsDir()) {
    fs.mkdirSync(screenshotsDir, { recursive: true });

    const normalizedPrefix = sanitizeScreenshotName(prefix);
    const normalizedName = sanitizeScreenshotName(name);
    const segments = [];

    if (normalizedPrefix !== 'visual-shot') {
        segments.push(normalizedPrefix);
    }

    segments.push(normalizedName, formatTimestamp());

    return path.join(screenshotsDir, `${segments.join('-')}.png`);
}

function saveTimestampedScreenshotBuffer(buffer, name, prefix = '') {
    const screenshotsDir = resolveScreenshotsDir();
    const filePath = prefix === 'diff'
        ? buildDiffImagePath(screenshotsDir, name)
        : buildTimestampedScreenshotPath(name, prefix, screenshotsDir);

    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function captureTimestampedScreenshotBuffer(page, name) {
    const buffer = await page.screenshot({
        fullPage: true,
    });
    const filePath = saveTimestampedScreenshotBuffer(buffer, name);

    return {
        buffer,
        filePath,
    };
}

async function captureTimestampedScreenshot(page, name) {
    const { filePath } = await captureTimestampedScreenshotBuffer(page, name);

    return filePath;
}

function getBaselineSnapshotPath(snapshotName) {
    return path.join(resolveScreenshotsDir(), `baseline-${snapshotName}`);
}

function saveSnapshotDiffFromBuffer(snapshotName, actualBuffer, artifactName) {
    if (!isVisualDiffEnabled()) {
        return null;
    }

    const baselinePath = getBaselineSnapshotPath(snapshotName);
    if (!fs.existsSync(baselinePath)) {
        return null;
    }

    const baselineBuffer = fs.readFileSync(baselinePath);
    const { diffPixels, diffBuffer } = createDiffImageBuffer(baselineBuffer, actualBuffer);

    if (diffPixels < 1) {
        return {
            baselinePath,
            diffPixels,
            diffPath: null,
        };
    }

    return {
        baselinePath,
        diffPixels,
        diffPath: saveTimestampedScreenshotBuffer(diffBuffer, artifactName, 'diff'),
    };
}

module.exports = {
    buildDiffImagePath,
    buildTimestampedScreenshotPath,
    captureTimestampedScreenshot,
    captureTimestampedScreenshotBuffer,
    getBaselineSnapshotPath,
    isVisualDiffEnabled,
    sanitizeScreenshotName,
    saveSnapshotDiffFromBuffer,
    saveTimestampedScreenshotBuffer,
};
