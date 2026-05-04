const fs = require('fs');
const os = require('os');
const path = require('path');

const { resolveVisualServerCommand } = require('../helpers/serverCommand');
const {
    detectMissingBaselines,
    writeGitHubOutput,
} = require('../scripts/baselines/detect-missing-baselines');

describe('resolveVisualServerCommand', () => {
    test('returns custom server command before defaults', () => {
        expect(resolveVisualServerCommand({
            VISUAL_SERVER_COMMAND: 'custom visual server',
            VISUAL_DOCKER: '1',
        }, 'linux')).toBe('custom visual server');
    });

    test('uses Windows command on win32', () => {
        expect(resolveVisualServerCommand({}, 'win32')).toBe(
            'set NODE_OPTIONS=--openssl-legacy-provider&& npx webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 8080'
        );
    });

    test('uses Unix command outside Windows', () => {
        expect(resolveVisualServerCommand({}, 'linux')).toBe(
            'NODE_OPTIONS=--openssl-legacy-provider npx webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 8080'
        );
    });

    test('ignores removed VISUAL_DOCKER compatibility flag', () => {
        expect(resolveVisualServerCommand({ VISUAL_DOCKER: '1' }, 'linux')).toBe(
            'NODE_OPTIONS=--openssl-legacy-provider npx webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 8080'
        );
    });
});

describe('detect missing visual baselines', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-missing-baseline-'));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('finds missing baseline paths in Playwright error contexts', () => {
        const resultsDir = path.join(tempDir, 'test-results');
        const contextPath = path.join(resultsDir, 'home.visual', 'error-context.md');

        fs.mkdirSync(path.dirname(contextPath), { recursive: true });
        fs.writeFileSync(contextPath, [
            'Error: A snapshot doesn\'t exist at /workspace/visual_regression/test/baseline-home-nav-en.png, writing actual.',
            'Error: A snapshot doesn\'t exist at /workspace/visual_regression/test/baseline-home-nav-zh.png, writing actual.',
        ].join('\n'));

        expect(detectMissingBaselines({ resultsDir })).toEqual([
            '/workspace/visual_regression/test/baseline-home-nav-en.png',
            '/workspace/visual_regression/test/baseline-home-nav-zh.png',
        ]);
    });

    test('writes GitHub output flags for missing baseline state', () => {
        const outputPath = path.join(tempDir, 'github-output.txt');

        writeGitHubOutput({
            missingBaselines: ['baseline-home-nav-en.png'],
            outputPath,
        });

        expect(fs.readFileSync(outputPath, 'utf8')).toBe('missing=true\ncount=1\n');
    });
});
