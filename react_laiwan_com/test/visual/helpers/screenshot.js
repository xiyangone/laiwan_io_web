const fs = require('fs');
const path = require('path');
const pixelmatchModule = require('pixelmatch');
const { PNG } = require('pngjs');

const pixelmatch = pixelmatchModule.default || pixelmatchModule;
const DEFAULT_DYNAMIC_CLASS_NAMES = '_1zAX1KISmCqHJI2_KxdiQu';

function formatTimestamp(date = new Date()) {
    const pad = (value, size = 2) => value.toString().padStart(size, '0');

    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
        + `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
        + `-${pad(date.getMilliseconds(), 3)}`;
}

function resolveScreenshotsDir() {
    const configuredDir = process.env.VISUAL_SCREENSHOT_DIR || 'test/screenshots';

    return path.isAbsolute(configuredDir)
        ? configuredDir
        : path.resolve(__dirname, '..', '..', '..', configuredDir);
}

function normalizeDynamicClassNames(rawValue) {
    const source = rawValue === undefined || rawValue === null
        ? process.env.VISUAL_DYNAMIC_CLASS_NAMES || process.env.IGNORED_CLASS_NAMES || DEFAULT_DYNAMIC_CLASS_NAMES
        : rawValue;

    if (Array.isArray(source)) {
        return [...new Set(source.map((item) => `${item}`.trim()).filter(Boolean))];
    }

    return [...new Set(`${source}`.split(',').map((item) => item.trim()).filter(Boolean))];
}

function escapeClassName(className) {
    return className.replace(/([^A-Za-z0-9_-])/g, '\\$1');
}

function buildDynamicClassHideCss(classNames = normalizeDynamicClassNames()) {
    if (!classNames.length) {
        return '';
    }

    const selector = classNames
        .map((className) => `.${escapeClassName(className)}`)
        .join(',\n');

    return `
        ${selector} {
            display: none !important;
        }
    `;
}

function isVisualDiffEnabled() {
    const raw = `${process.env.VISUAL_SAVE_DIFF || '1'}`.trim().toLowerCase();
    return raw !== '0' && raw !== 'false';
}

async function waitForFontsReady(page) {
    await page.evaluate(() => (
        document.fonts && document.fonts.ready
            ? document.fonts.ready
            : Promise.resolve()
    ));
}

async function stabilizePage(page) {
    await page.addStyleTag({
        content: `
            *, *::before, *::after {
                animation: none !important;
                transition: none !important;
                caret-color: transparent !important;
            }
        `,
    });

    const dynamicClassHideCss = buildDynamicClassHideCss();
    if (dynamicClassHideCss) {
        await page.addStyleTag({
            content: dynamicClassHideCss,
        });
    }

    await waitForFontsReady(page);
}

async function captureTimestampedScreenshot(page, name) {
    const { filePath } = await captureTimestampedScreenshotBuffer(page, name);

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

function sanitizeScreenshotName(name) {
    return name
        .toString()
        .trim()
        .replace(/[^A-Za-z0-9_-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        || 'visual-shot';
}

function buildTimestampedScreenshotPath(name, prefix = '') {
    const screenshotsDir = resolveScreenshotsDir();
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
    const filePath = buildTimestampedScreenshotPath(name, prefix);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

function padPngToSize(source, width, height) {
    const output = new PNG({ width, height });

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const index = (width * y + x) << 2;

            output.data[index] = 255;
            output.data[index + 1] = 255;
            output.data[index + 2] = 255;
            output.data[index + 3] = 255;
        }
    }

    for (let y = 0; y < source.height; y += 1) {
        for (let x = 0; x < source.width; x += 1) {
            const sourceIndex = (source.width * y + x) << 2;
            const targetIndex = (width * y + x) << 2;

            output.data[targetIndex] = source.data[sourceIndex];
            output.data[targetIndex + 1] = source.data[sourceIndex + 1];
            output.data[targetIndex + 2] = source.data[sourceIndex + 2];
            output.data[targetIndex + 3] = source.data[sourceIndex + 3];
        }
    }

    return output;
}

function createDiffImageBuffer(beforeBuffer, afterBuffer) {
    const beforeRaw = PNG.sync.read(beforeBuffer);
    const afterRaw = PNG.sync.read(afterBuffer);

    const width = Math.max(beforeRaw.width, afterRaw.width);
    const height = Math.max(beforeRaw.height, afterRaw.height);

    const before = padPngToSize(beforeRaw, width, height);
    const after = padPngToSize(afterRaw, width, height);
    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(before.data, after.data, diff.data, width, height, {
        threshold: 0.1,
        includeAA: false,
    });

    return {
        diffPixels,
        diffBuffer: PNG.sync.write(diff),
    };
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
    buildTimestampedScreenshotPath,
    buildDynamicClassHideCss,
    captureTimestampedScreenshot,
    captureTimestampedScreenshotBuffer,
    createDiffImageBuffer,
    getBaselineSnapshotPath,
    isVisualDiffEnabled,
    normalizeDynamicClassNames,
    saveTimestampedScreenshotBuffer,
    saveSnapshotDiffFromBuffer,
    sanitizeScreenshotName,
    stabilizePage,
    waitForFontsReady,
};
