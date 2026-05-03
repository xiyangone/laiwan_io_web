const fs = require('fs');
const os = require('os');
const path = require('path');
const { PNG } = require('pngjs');

jest.mock(
    'pixelmatch',
    () => (
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
    ),
    { virtual: true }
);

const { collectReviewArtifacts } = require('../scripts/artifacts/collect-review-artifacts');

function writePng(filePath, pixels, width = 4, height = 4) {
    const png = new PNG({ width, height });

    for (let index = 0; index < png.data.length; index += 4) {
        png.data[index] = 255;
        png.data[index + 1] = 255;
        png.data[index + 2] = 255;
        png.data[index + 3] = 255;
    }

    pixels.forEach(([x, y, rgba]) => {
        const index = (width * y + x) << 2;
        png.data[index] = rgba[0];
        png.data[index + 1] = rgba[1];
        png.data[index + 2] = rgba[2];
        png.data[index + 3] = rgba[3];
    });

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, PNG.sync.write(png));
}

describe('collectReviewArtifacts', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-review-'));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('writes full-page before after diff images only for failed visual cases', () => {
        const resultsDir = path.join(tempDir, 'test-results');
        const outputDir = path.join(tempDir, 'visual-review');
        const failedCaseDir = path.join(resultsDir, 'home.visual-title-change');
        const passingCaseDir = path.join(resultsDir, 'glossary.visual-no-diff');

        writePng(path.join(failedCaseDir, 'home-nav-en-expected.png'), [], 8, 6);
        writePng(path.join(failedCaseDir, 'home-nav-en-actual.png'), [[2, 2, [0, 0, 0, 255]]], 8, 6);
        writePng(path.join(failedCaseDir, 'home-nav-en-diff.png'), [[2, 2, [255, 0, 0, 255]]], 8, 6);
        writePng(path.join(passingCaseDir, 'glossary-page-zh-expected.png'), []);

        const result = collectReviewArtifacts({
            resultsDir,
            outputDir,
            repo: 'xiyangone/laiwan_io_web',
            prNumber: '1',
            runId: '123',
            artifactBranch: 'visual-review-artifacts',
        });

        expect(result.cases).toHaveLength(1);
        expect(result.cases[0].name).toBe('home-nav-en');
        expect(fs.existsSync(path.join(outputDir, 'home-nav-en', 'before.png'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'home-nav-en', 'after.png'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'home-nav-en', 'diff.png'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'glossary-page-zh', 'diff.png'))).toBe(false);

        const before = PNG.sync.read(fs.readFileSync(path.join(outputDir, 'home-nav-en', 'before.png')));
        const after = PNG.sync.read(fs.readFileSync(path.join(outputDir, 'home-nav-en', 'after.png')));
        const diff = PNG.sync.read(fs.readFileSync(path.join(outputDir, 'home-nav-en', 'diff.png')));
        expect(before.width).toBe(8);
        expect(before.height).toBe(6);
        expect(after.width).toBe(8);
        expect(after.height).toBe(6);
        expect(diff.width).toBe(8);
        expect(diff.height).toBe(6);

        const summary = fs.readFileSync(path.join(outputDir, 'summary.md'), 'utf8');
        expect(summary).toContain('<!-- visual-review-comment -->');
        expect(summary).toContain('home-nav-en');
        expect(summary).toContain('修改前');
        expect(summary).toContain('修改后');
        expect(summary).toContain('差异');
        expect(summary).toContain('https://github.com/xiyangone/laiwan_io_web/blob/visual-review-artifacts/pr-1/run-123/home-nav-en/before.png?raw=true');
        expect(summary).toContain('https://github.com/xiyangone/laiwan_io_web/blob/visual-review-artifacts/pr-1/run-123/home-nav-en/after.png?raw=true');
        expect(summary).toContain('https://github.com/xiyangone/laiwan_io_web/blob/visual-review-artifacts/pr-1/run-123/home-nav-en/diff.png?raw=true');
    });

    test('clears output directory contents without removing the mounted root', () => {
        const resultsDir = path.join(tempDir, 'test-results');
        const outputDir = path.join(tempDir, 'visual-review');
        const failedCaseDir = path.join(resultsDir, 'home.visual-title-change');
        const staleFilePath = path.join(outputDir, 'stale.txt');
        const originalRmSync = fs.rmSync;

        writePng(path.join(failedCaseDir, 'home-nav-en-expected.png'), [], 8, 6);
        writePng(path.join(failedCaseDir, 'home-nav-en-actual.png'), [[2, 2, [0, 0, 0, 255]]], 8, 6);
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(staleFilePath, 'stale');

        const rmSyncSpy = jest.spyOn(fs, 'rmSync').mockImplementation((targetPath, options) => {
            if (targetPath === outputDir) {
                const error = new Error('resource busy or locked');
                error.code = 'EBUSY';
                throw error;
            }

            return originalRmSync.call(fs, targetPath, options);
        });

        try {
            const result = collectReviewArtifacts({
                resultsDir,
                outputDir,
                repo: 'xiyangone/laiwan_io_web',
                prNumber: '1',
                runId: '123',
                artifactBranch: 'visual-review-artifacts',
            });

            expect(result.cases).toHaveLength(1);
            expect(fs.existsSync(staleFilePath)).toBe(false);
            expect(fs.existsSync(path.join(outputDir, 'home-nav-en', 'before.png'))).toBe(true);
        } finally {
            rmSyncSpy.mockRestore();
        }
    });

    test('throws when reviewable artifacts are required but no failed visual cases exist', () => {
        const resultsDir = path.join(tempDir, 'test-results');
        const outputDir = path.join(tempDir, 'visual-review');

        fs.mkdirSync(resultsDir, { recursive: true });

        expect(() => collectReviewArtifacts({
            resultsDir,
            outputDir,
            repo: 'xiyangone/laiwan_io_web',
            prNumber: '1',
            runId: '123',
            artifactBranch: 'visual-review-artifacts',
            requireCases: true,
        })).toThrow('Visual regression failed, but no reviewable screenshot diff artifacts were found.');

        expect(fs.readFileSync(path.join(outputDir, 'summary.md'), 'utf8')).toContain('未找到视觉变更截图产物。');
    });
});
