const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('@playwright/test');
const {
    getCasePrefix,
    getSequenceScreenshotPath,
} = require('./helpers/watchNaming');
const {
    resolveVisualServerCommand,
} = require('./helpers/serverCommand');
const {
    buildDynamicClassHideCss,
    createDiffImageBuffer,
    isVisualDiffEnabled,
    saveTimestampedScreenshotBuffer,
    waitForFontsReady,
} = require('./helpers/screenshot');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const TARGET_URL = process.env.TARGET_URL || process.env.VISUAL_BASE_URL || 'http://127.0.0.1:8080/#/';
const SERVER_URL = 'http://127.0.0.1:8080';
const SERVER_START_TIMEOUT_MS = 120000;

const WATCH_SELECTOR = process.env.WATCH_SELECTOR || 'body *';
const OUTPUT_DIR = process.env.OUTPUT_DIR || process.env.VISUAL_SCREENSHOT_DIR || '../visual_regression/test';
const VISUAL_CASE_FILE = process.env.VISUAL_CASE_FILE || '';
const MIN_DIFF_PIXELS = Number(process.env.VISUAL_MIN_DIFF_PIXELS || 80);
const VIEWPORT_WIDTH = Number(process.env.VIEWPORT_WIDTH || 1440);
const VIEWPORT_HEIGHT = Number(process.env.VIEWPORT_HEIGHT || 900);
const WAIT_AFTER_CHANGE = Number(process.env.WAIT_AFTER_CHANGE || 800);
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL || 500);
const FULL_PAGE = process.env.FULL_PAGE === 'true';
const HEADLESS = process.env.HEADLESS === 'true' || process.env.VISUAL_WATCH_HEADLESS === '1';

const WATCH_TEXT = process.env.WATCH_TEXT !== 'false';
const WATCH_LAYOUT = process.env.WATCH_LAYOUT !== 'false';
const IGNORED_CLASS_NAMES = (process.env.IGNORED_CLASS_NAMES || '_1zAX1KISmCqHJI2_KxdiQu')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const WATCH_STYLE_PROPS = [
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'line-height',
    'letter-spacing',
    'color',
    'background-color',
    'display',
    'visibility',
    'opacity',
    'width',
    'height',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
    'transform',
];

let devServerProcess = null;
let shuttingDown = false;
let lockFilePath = null;

function shouldExitOnFirstCapture(env = process.env) {
    const raw = env.VISUAL_WATCH_EXIT_ON_FIRST_CAPTURE;

    if (raw === undefined) {
        return env.VISUAL_DOCKER === '1';
    }

    const normalized = `${raw}`.trim().toLowerCase();
    return normalized !== '0' && normalized !== 'false';
}

const EXIT_ON_FIRST_CAPTURE = shouldExitOnFirstCapture(process.env);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function isServerReady() {
    return new Promise((resolve) => {
        const request = http.get(SERVER_URL, (response) => {
            response.resume();
            resolve(response.statusCode >= 200 && response.statusCode < 500);
        });

        request.on('error', () => resolve(false));
        request.setTimeout(3000, () => {
            request.destroy();
            resolve(false);
        });
    });
}

function isPidRunning(pid) {
    if (!Number.isInteger(pid) || pid <= 0) {
        return false;
    }

    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return false;
    }
}

function findOtherWatcherPids() {
    if (process.platform !== 'win32') {
        return [];
    }

    try {
        const command = [
            "$ErrorActionPreference = 'Stop'",
            "Get-CimInstance Win32_Process",
            "| Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'test\\\\\\\\visual\\\\\\\\watch\\\\.js' }",
            '| Select-Object -ExpandProperty ProcessId',
            '| ConvertTo-Json -Compress',
        ].join(' ');

        const raw = execFileSync('powershell', ['-NoProfile', '-Command', command], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();

        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        const pidList = Array.isArray(parsed) ? parsed : [parsed];

        return pidList
            .map((value) => Number(value))
            .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
    } catch (error) {
        return [];
    }
}

function acquireSingleInstanceLock(targetPath) {
    lockFilePath = targetPath;
    ensureDir(path.dirname(targetPath));

    if (fs.existsSync(targetPath)) {
        try {
            const existing = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
            if (existing && isPidRunning(Number(existing.pid))) {
                throw new Error(`已有 visual watcher 正在运行，PID=${existing.pid}`);
            }
        } catch (error) {
            if (error.message.includes('已有 visual watcher')) {
                throw error;
            }
        }

        fs.rmSync(targetPath, { force: true });
    }

    const otherWatcherPids = findOtherWatcherPids();
    if (otherWatcherPids.length > 0) {
        throw new Error(`已有 visual watcher 正在运行，PID=${otherWatcherPids.join(', ')}`);
    }

    fs.writeFileSync(targetPath, JSON.stringify({ pid: process.pid }), 'utf8');
}

function releaseSingleInstanceLock() {
    if (!lockFilePath || !fs.existsSync(lockFilePath)) {
        return;
    }

    try {
        const existing = JSON.parse(fs.readFileSync(lockFilePath, 'utf8'));
        if (existing && Number(existing.pid) === process.pid) {
            fs.rmSync(lockFilePath, { force: true });
        }
    } catch (error) {
        fs.rmSync(lockFilePath, { force: true });
    }
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanupLegacyArtifacts(outputRoot) {
    const legacyPattern = /(^baseline[-_]|^before[-_]|^after[-_]|^diff_.*\.png$|\.json$)/i;

    for (const entry of fs.readdirSync(outputRoot, { withFileTypes: true })) {
        if (!entry.isFile()) {
            continue;
        }

        if (legacyPattern.test(entry.name)) {
            fs.rmSync(path.join(outputRoot, entry.name), { force: true });
        }
    }
}

function cleanupCaseDiffArtifacts(outputRoot, casePrefix) {
    const diffPattern = new RegExp(`^diff-${escapeRegex(casePrefix)}-\\d+-.*\\.png$`, 'i');

    for (const entry of fs.readdirSync(outputRoot, { withFileTypes: true })) {
        if (!entry.isFile()) {
            continue;
        }

        if (diffPattern.test(entry.name)) {
            fs.rmSync(path.join(outputRoot, entry.name), { force: true });
        }
    }
}

function cleanupCaseSequenceArtifacts(outputRoot, casePrefix) {
    const sequencePattern = new RegExp(`^${escapeRegex(casePrefix)}\\.\\d+\\.png$`);

    for (const entry of fs.readdirSync(outputRoot, { withFileTypes: true })) {
        if (!entry.isFile()) {
            continue;
        }

        if (sequencePattern.test(entry.name)) {
            fs.rmSync(path.join(outputRoot, entry.name), { force: true });
        }
    }
}

async function ensureDevServer() {
    if (await isServerReady()) {
        console.log(`🌐 复用已有页面服务: ${SERVER_URL}`);
        return;
    }

    console.log('🚀 启动本地 webpack dev server...');
    devServerProcess = spawn(resolveVisualServerCommand(), {
        cwd: PROJECT_ROOT,
        shell: true,
        stdio: 'inherit',
    });

    const startTime = Date.now();
    while (Date.now() - startTime < SERVER_START_TIMEOUT_MS) {
        if (await isServerReady()) {
            console.log(`✅ 页面服务已就绪: ${SERVER_URL}`);
            return;
        }
        await sleep(1000);
    }

    throw new Error(`Dev server did not become ready within ${SERVER_START_TIMEOUT_MS}ms`);
}

async function disableAnimations(page) {
    const dynamicClassHideCss = buildDynamicClassHideCss(IGNORED_CLASS_NAMES);

    await page.addStyleTag({
        content: `
      *,
      *::before,
      *::after {
        animation-duration: 0.001s !important;
        animation-delay: 0s !important;
        transition-duration: 0.001s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      ${dynamicClassHideCss}
    `,
    });

    await waitForFontsReady(page);
}

async function getDomVisualSnapshot(page) {
    return page.evaluate(
        ({ selector, props, watchText, watchLayout, ignoredClassNames }) => {
            function getCssPath(el) {
                const parts = [];
                let current = el;

                while (current && current.nodeType === Node.ELEMENT_NODE) {
                    const tag = current.tagName.toLowerCase();

                    if (current.id) {
                        parts.unshift(`${tag}#${current.id}`);
                        break;
                    }

                    const parent = current.parentElement;
                    if (!parent) {
                        parts.unshift(tag);
                        break;
                    }

                    const siblings = Array.from(parent.children).filter(
                        (child) => child.tagName === current.tagName
                    );
                    const index = siblings.indexOf(current) + 1;
                    parts.unshift(`${tag}:nth-of-type(${index})`);
                    current = parent;
                }

                return parts.join(' > ');
            }

            function normalizeText(text) {
                return text.replace(/\s+/g, ' ').trim().slice(0, 300);
            }

            const ignoredSelector = ignoredClassNames.length > 0
                ? ignoredClassNames.map((className) => `.${className}`).join(', ')
                : '';
            const elements = Array.from(document.querySelectorAll(selector));

            return elements
                .filter((el) => !(ignoredSelector && el.closest(ignoredSelector)))
                .map((el) => {
                    const computedStyle = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    const styles = {};

                    for (const prop of props) {
                        styles[prop] = computedStyle.getPropertyValue(prop);
                    }

                    const item = {
                        path: getCssPath(el),
                        tag: el.tagName.toLowerCase(),
                        styles,
                    };

                    if (watchText) {
                        item.text = normalizeText(el.textContent || '');
                    }

                    if (watchLayout) {
                        item.rect = {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                        };
                    }

                    return item;
                })
                .filter((item) => {
                    const display = item.styles.display;
                    const visibility = item.styles.visibility;

                    return display !== 'none' && visibility !== 'hidden';
                });
        },
        {
            selector: WATCH_SELECTOR,
            props: WATCH_STYLE_PROPS,
            watchText: WATCH_TEXT,
            watchLayout: WATCH_LAYOUT,
            ignoredClassNames: IGNORED_CLASS_NAMES,
        }
    );
}

async function waitForStableSnapshot(page) {
    let previous = '';
    let stableCount = 0;

    for (let i = 0; i < 20; i += 1) {
        await sleep(250);
        const current = JSON.stringify(await getDomVisualSnapshot(page));

        if (current === previous) {
            stableCount += 1;
            if (stableCount >= 2) {
                return current;
            }
        } else {
            previous = current;
            stableCount = 0;
        }
    }

    return previous;
}

async function cleanup(browser) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;

    if (browser) {
        await browser.close().catch(() => {});
    }

    if (devServerProcess && !devServerProcess.killed) {
        devServerProcess.kill();
    }

    releaseSingleInstanceLock();
}

async function main() {
    const casePrefix = getCasePrefix(VISUAL_CASE_FILE);
    await ensureDevServer();

    const outputRoot = path.isAbsolute(OUTPUT_DIR)
        ? OUTPUT_DIR
        : path.resolve(PROJECT_ROOT, OUTPUT_DIR);
    ensureDir(outputRoot);
    cleanupLegacyArtifacts(outputRoot);
    cleanupCaseSequenceArtifacts(outputRoot, casePrefix);
    cleanupCaseDiffArtifacts(outputRoot, casePrefix);
    acquireSingleInstanceLock(path.join(outputRoot, '.visual-watch.lock'));

    console.log(`🌐 打开页面: ${TARGET_URL}`);
    console.log(`📝 截图前缀: ${casePrefix}`);

    const browser = await chromium.launch({
        headless: HEADLESS,
    });

    const context = await browser.newContext({
        viewport: {
            width: VIEWPORT_WIDTH,
            height: VIEWPORT_HEIGHT,
        },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
    });

    const page = await context.newPage();

    process.on('SIGINT', async () => {
        await cleanup(browser);
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await cleanup(browser);
        process.exit(0);
    });

    try {
        await page.goto(TARGET_URL, {
            waitUntil: 'networkidle',
            timeout: 30000,
        });
    } catch (error) {
        console.error('❌ 页面打开失败。请确认 React 项目已经启动。');
        console.error(error);
        await cleanup(browser);
        process.exit(1);
    }

    await disableAnimations(page);
    await sleep(1000);

    let baselineComparable = await waitForStableSnapshot(page);
    let baselineBuffer = await page.screenshot({
        fullPage: FULL_PAGE,
    });
    let screenshotIndex = 1;

    const initialPath = getSequenceScreenshotPath(outputRoot, casePrefix, screenshotIndex);
    fs.writeFileSync(initialPath, baselineBuffer);

    console.log(`📸 已保存稳定帧: ${initialPath}`);
    console.log('⏳ 正在监听页面变化...');
    console.log('   你现在可以修改 React 代码、CSS、字体、文字内容，或者直接在 DevTools 里改样式。');
    if (IGNORED_CLASS_NAMES.length > 0) {
        console.log(`   已忽略动态类: ${IGNORED_CLASS_NAMES.join(', ')}`);
    }
    console.log('');

    while (true) {
        await sleep(POLL_INTERVAL);

        let currentComparable = '';
        try {
            currentComparable = JSON.stringify(await getDomVisualSnapshot(page));
        } catch (error) {
            await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
            continue;
        }

        if (currentComparable === baselineComparable) {
            continue;
        }

        console.log('🎯 检测到页面文字、布局或样式变化。');

        await sleep(WAIT_AFTER_CHANGE);
        await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
        await disableAnimations(page);

        const stableComparable = await waitForStableSnapshot(page);
        if (!stableComparable || stableComparable === baselineComparable) {
            console.log('ℹ️ 变化已回落到上一稳定帧，继续监听。');
            continue;
        }

        const candidateBuffer = await page.screenshot({
            fullPage: FULL_PAGE,
        });
        const {
            diffPixels,
            diffBuffer,
        } = createDiffImageBuffer(baselineBuffer, candidateBuffer);

        if (diffPixels < MIN_DIFF_PIXELS) {
            console.log(`ℹ️ 忽略微小变化，diffPixels=${diffPixels}`);
            baselineComparable = stableComparable;
            baselineBuffer = candidateBuffer;
            continue;
        }

        screenshotIndex += 1;
        const targetPath = getSequenceScreenshotPath(outputRoot, casePrefix, screenshotIndex);
        fs.writeFileSync(targetPath, candidateBuffer);

        console.log(`📸 已保存稳定帧: ${targetPath}`);
        console.log(`📊 差异像素: ${diffPixels}`);
        if (isVisualDiffEnabled()) {
            const diffPath = saveTimestampedScreenshotBuffer(
                diffBuffer,
                `${casePrefix}-${screenshotIndex}`,
                'diff'
            );
            console.log(`🖼️ 已保存差异图: ${diffPath}`);
        }
        if (EXIT_ON_FIRST_CAPTURE) {
            console.log('🛑 单次捕获模式已完成，准备退出 watcher。');
        } else {
            console.log('✅ 已更新稳定帧基线，继续监听。');
        }
        console.log('');

        baselineComparable = stableComparable;
        baselineBuffer = candidateBuffer;

        if (EXIT_ON_FIRST_CAPTURE) {
            break;
        }
    }

    await cleanup(browser);
}

if (require.main === module) {
    main().catch(async (error) => {
        console.error('❌ 脚本执行失败:');
        console.error(error);
        await cleanup();
        process.exit(1);
    });
}

module.exports = {
    cleanupCaseDiffArtifacts,
    cleanupCaseSequenceArtifacts,
    cleanupLegacyArtifacts,
    main,
    shouldExitOnFirstCapture,
};
