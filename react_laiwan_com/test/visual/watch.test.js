const fs = require('fs');
const os = require('os');
const path = require('path');
const { PNG } = require('pngjs');

jest.mock('pixelmatch', () => (
    jest.fn((beforeData, afterData, outputData) => {
        let diffPixels = 0;

        for (let index = 0; index < beforeData.length; index += 4) {
            const changed = beforeData[index] !== afterData[index]
                || beforeData[index + 1] !== afterData[index + 1]
                || beforeData[index + 2] !== afterData[index + 2]
                || beforeData[index + 3] !== afterData[index + 3];

            if (changed) {
                outputData[index] = afterData[index];
                outputData[index + 1] = afterData[index + 1];
                outputData[index + 2] = afterData[index + 2];
                outputData[index + 3] = 255;
                diffPixels += 1;
            } else {
                outputData[index] = 0;
                outputData[index + 1] = 0;
                outputData[index + 2] = 0;
                outputData[index + 3] = 0;
            }
        }

        return diffPixels;
    })
));

const {
    getCasePrefix,
    getSequenceScreenshotPath,
} = require('./helpers/watchNaming');
const {
    cleanupCaseDiffArtifacts,
    cleanupLegacyArtifacts,
    shouldExitOnFirstCapture,
} = require('./watch');
const {
    DEFAULT_DOCKER_VISUAL_SERVER_COMMAND,
    resolveVisualServerCommand,
} = require('./helpers/serverCommand');
const {
    buildDynamicClassHideCss,
    createDiffImageBuffer,
    normalizeDynamicClassNames,
    waitForFontsReady,
} = require('./helpers/screenshot');

describe('visual watch naming helpers', () => {
    test('derives case prefix from a .test.ts file path', () => {
        expect(getCasePrefix('visual_regression/test/aa/bb/点击用户头像.test.ts')).toBe('点击用户头像');
    });

    test('derives case prefix from a .spec.js file path', () => {
        expect(getCasePrefix('visual_regression/test/aa/bb/点击回退按钮.spec.js')).toBe('点击回退按钮');
    });

    test('builds screenshot names with a 1-based sequence', () => {
        const filePath = getSequenceScreenshotPath('screenshots', '点击用户头像', 3);
        expect(filePath).toBe(path.join('screenshots', '点击用户头像.3.png'));
    });

    test('rejects unsupported file names', () => {
        expect(() => getCasePrefix('visual_regression/test/aa/bb/点击用户头像.ts')).toThrow(
            'Unsupported VISUAL_CASE_FILE'
        );
    });

    test('normalizes dynamic class names from a comma-separated string', () => {
        expect(normalizeDynamicClassNames(' foo,bar , foo ,, baz ')).toEqual(['foo', 'bar', 'baz']);
    });

    test('builds display-none css for dynamic classes', () => {
        const css = buildDynamicClassHideCss(['ticker', 'animated']);

        expect(css).toContain('.ticker');
        expect(css).toContain('.animated');
        expect(css).toContain('display: none !important;');
    });

    test('creates a diff image buffer when pixels differ', () => {
        const before = new PNG({ width: 1, height: 1 });
        const after = new PNG({ width: 1, height: 1 });

        before.data.set([0, 0, 0, 255]);
        after.data.set([255, 255, 255, 255]);

        const result = createDiffImageBuffer(PNG.sync.write(before), PNG.sync.write(after));

        expect(result.diffPixels).toBe(1);
        expect(Buffer.isBuffer(result.diffBuffer)).toBe(true);
    });

    test('crops diff image buffer to the changed region when requested', () => {
        const before = new PNG({ width: 5, height: 5 });
        const after = new PNG({ width: 5, height: 5 });

        before.data.fill(255);
        after.data.fill(255);

        const changedPixelIndex = ((5 * 2) + 3) << 2;
        after.data[changedPixelIndex] = 0;
        after.data[changedPixelIndex + 1] = 0;
        after.data[changedPixelIndex + 2] = 0;
        after.data[changedPixelIndex + 3] = 255;

        const result = createDiffImageBuffer(PNG.sync.write(before), PNG.sync.write(after), {
            cropToDiff: true,
            diffPadding: 0,
        });
        const croppedDiff = PNG.sync.read(result.diffBuffer);

        expect(result.diffPixels).toBe(1);
        expect(result.bounds).toEqual({
            left: 3,
            top: 2,
            right: 3,
            bottom: 2,
            width: 1,
            height: 1,
        });
        expect(croppedDiff.width).toBe(1);
        expect(croppedDiff.height).toBe(1);
    });

    test('waits for document fonts readiness when available', async () => {
        const evaluate = jest.fn().mockResolvedValue(undefined);

        await waitForFontsReady({ evaluate });

        expect(evaluate).toHaveBeenCalledTimes(1);
        expect(evaluate.mock.calls[0][0].toString()).toContain('document.fonts.ready');
    });

    test('uses docker visual server command when VISUAL_DOCKER is enabled', () => {
        expect(resolveVisualServerCommand({ VISUAL_DOCKER: '1' }, 'linux')).toBe(
            DEFAULT_DOCKER_VISUAL_SERVER_COMMAND
        );
    });

    test('prefers explicit visual server command override', () => {
        expect(resolveVisualServerCommand({ VISUAL_SERVER_COMMAND: 'custom start' }, 'win32')).toBe(
            'custom start'
        );
    });

    test('cleans up current-case diff artifacts without touching other files', () => {
        const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-watch-'));
        const currentDiff = path.join(outputRoot, 'diff-docker-watch-2-20260429-062710-267.png');
        const otherDiff = path.join(outputRoot, 'diff-other-case-2-20260429-062710-267.png');
        const stableFrame = path.join(outputRoot, 'docker-watch.2.png');

        fs.writeFileSync(currentDiff, 'current');
        fs.writeFileSync(otherDiff, 'other');
        fs.writeFileSync(stableFrame, 'stable');

        cleanupCaseDiffArtifacts(outputRoot, 'docker-watch');

        expect(fs.existsSync(currentDiff)).toBe(false);
        expect(fs.existsSync(otherDiff)).toBe(true);
        expect(fs.existsSync(stableFrame)).toBe(true);

        fs.rmSync(outputRoot, { recursive: true, force: true });
    });

    test('legacy cleanup removes old baseline-style artifacts', () => {
        const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-watch-'));
        const legacyDiff = path.join(outputRoot, 'diff_old.png');
        const baseline = path.join(outputRoot, 'baseline-home-nav-zh.png');
        const keepFile = path.join(outputRoot, 'docker-watch.1.png');

        fs.writeFileSync(legacyDiff, 'legacy');
        fs.writeFileSync(baseline, 'baseline');
        fs.writeFileSync(keepFile, 'keep');

        cleanupLegacyArtifacts(outputRoot);

        expect(fs.existsSync(legacyDiff)).toBe(false);
        expect(fs.existsSync(baseline)).toBe(false);
        expect(fs.existsSync(keepFile)).toBe(true);

        fs.rmSync(outputRoot, { recursive: true, force: true });
    });

    test('enables single-capture exit mode only when requested', () => {
        expect(shouldExitOnFirstCapture({ VISUAL_WATCH_EXIT_ON_FIRST_CAPTURE: '1' })).toBe(true);
        expect(shouldExitOnFirstCapture({ VISUAL_WATCH_EXIT_ON_FIRST_CAPTURE: 'true' })).toBe(true);
        expect(shouldExitOnFirstCapture({ VISUAL_DOCKER: '1' })).toBe(true);
        expect(shouldExitOnFirstCapture({ VISUAL_WATCH_EXIT_ON_FIRST_CAPTURE: '0' })).toBe(false);
        expect(shouldExitOnFirstCapture({})).toBe(false);
    });
});
