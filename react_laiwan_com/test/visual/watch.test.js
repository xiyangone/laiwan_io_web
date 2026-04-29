const path = require('path');
const { PNG } = require('pngjs');

jest.mock('pixelmatch', () => (
    jest.fn((beforeData, afterData, outputData) => {
        outputData.set(afterData);
        return beforeData.every((value, index) => value === afterData[index]) ? 0 : 1;
    })
));

const {
    getCasePrefix,
    getSequenceScreenshotPath,
} = require('./helpers/watchNaming');
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
});
