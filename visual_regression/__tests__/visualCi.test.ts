import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test } from 'bun:test';

import {
    detectMissingBaselines,
    writeGitHubOutput,
} from '../scripts/detectMissingBaselines';

let tempDir = '';

beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'visual-ci-'));
});

afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
});

test('finds missing baseline paths in Playwright error contexts', () => {
    const resultsDir = path.join(tempDir, 'test-results');
    const contextPath = path.join(resultsDir, 'home.visual', 'error-context.md');

    mkdirSync(path.dirname(contextPath), { recursive: true });
    writeFileSync(contextPath, [
        'Error: A snapshot doesn\'t exist at /workspace/visual_regression/test/baseline-home-nav-en.png, writing actual.',
        'Error: A snapshot doesn\'t exist at /workspace/visual_regression/test/baseline-home-nav-zh.png, writing actual.',
    ].join('\n'));

    expect(detectMissingBaselines(resultsDir)).toEqual([
        '/workspace/visual_regression/test/baseline-home-nav-en.png',
        '/workspace/visual_regression/test/baseline-home-nav-zh.png',
    ]);
});

test('writes GitHub output flags for missing baseline state', () => {
    const outputPath = path.join(tempDir, 'github-output.txt');

    writeGitHubOutput(['baseline-home-nav-en.png'], outputPath);

    expect(readFileSync(outputPath, 'utf8')).toBe('missing=true\ncount=1\n');
});
