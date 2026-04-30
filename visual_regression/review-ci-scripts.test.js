const fs = require('fs');
const os = require('os');
const path = require('path');

const {
    buildPassSummary,
    findVisualReviewComment,
    upsertReviewComment,
} = require('./scripts/upsert-review-comment');
const {
    copyReviewArtifacts,
    resolvePublishTargets,
} = require('./scripts/publish-review-artifacts');
const {
    appendCodeContextToSummary,
    buildCodeContextMarkdown,
    filterChangedFilesForCase,
    summarizePatch,
} = require('./scripts/collect-pr-code-context');

describe('upsertReviewComment', () => {
    test('builds the pass summary with the stable marker', () => {
        expect(buildPassSummary()).toBe('<!-- visual-review-comment -->\n## 视觉回归 Diff\n\n✅ 视觉回归通过，无 diff。');
    });

    test('finds an existing visual review comment by marker', () => {
        const comments = [
            { id: 1, body: 'unrelated' },
            { id: 2, body: 'before\n<!-- visual-review-comment -->\nafter' },
        ];

        expect(findVisualReviewComment(comments)).toEqual(comments[1]);
    });

    test('updates existing visual review comment', async () => {
        const calls = [];
        const fetchImpl = jest.fn(async (url, options = {}) => {
            calls.push({ url, options });

            if (options.method === 'PATCH') {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ id: 2, body: 'new body' }),
                };
            }

            return {
                ok: true,
                status: 200,
                json: async () => [
                    { id: 2, body: '<!-- visual-review-comment -->\nold body' },
                ],
            };
        });

        const result = await upsertReviewComment({
            fetchImpl,
            token: 'token',
            repo: 'xiyangone/laiwan_io_web',
            issueNumber: '1',
            body: '<!-- visual-review-comment -->\nnew body',
        });

        expect(result.action).toBe('updated');
        expect(calls[1].url).toBe('https://api.github.com/repos/xiyangone/laiwan_io_web/issues/comments/2');
        expect(calls[1].options.method).toBe('PATCH');
    });

    test('creates a visual review comment when none exists', async () => {
        const calls = [];
        const fetchImpl = jest.fn(async (url, options = {}) => {
            calls.push({ url, options });

            if (options.method === 'POST') {
                return {
                    ok: true,
                    status: 201,
                    json: async () => ({ id: 3, body: 'new body' }),
                };
            }

            return {
                ok: true,
                status: 200,
                json: async () => [],
            };
        });

        const result = await upsertReviewComment({
            fetchImpl,
            token: 'token',
            repo: 'xiyangone/laiwan_io_web',
            issueNumber: '1',
            body: '<!-- visual-review-comment -->\nnew body',
        });

        expect(result.action).toBe('created');
        expect(calls[1].url).toBe('https://api.github.com/repos/xiyangone/laiwan_io_web/issues/1/comments');
        expect(calls[1].options.method).toBe('POST');
    });
});

describe('publishReviewArtifacts helpers', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-publish-'));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('resolves run and latest publish targets', () => {
        expect(resolvePublishTargets({ prNumber: '7', runId: '123' })).toEqual({
            runTarget: 'pr-7/run-123',
            latestTarget: 'pr-7/latest',
        });
    });

    test('copies visual review artifacts to run and latest directories', () => {
        const workspace = path.join(tempDir, 'workspace');
        const publishDir = path.join(tempDir, 'publish');
        const reviewDir = path.join(workspace, 'visual-review', 'home-nav-en');

        fs.mkdirSync(reviewDir, { recursive: true });
        fs.mkdirSync(path.join(publishDir, 'pr-1', 'latest'), { recursive: true });
        fs.writeFileSync(path.join(reviewDir, 'diff.png'), 'diff');
        fs.writeFileSync(path.join(workspace, 'visual-review', 'summary.md'), 'summary');
        fs.writeFileSync(path.join(publishDir, 'pr-1', 'latest', 'stale.png'), 'stale');

        copyReviewArtifacts({
            workspace,
            publishDir,
            prNumber: '1',
            runId: '456',
        });

        expect(fs.readFileSync(path.join(publishDir, 'pr-1', 'run-456', 'home-nav-en', 'diff.png'), 'utf8')).toBe('diff');
        expect(fs.readFileSync(path.join(publishDir, 'pr-1', 'latest', 'home-nav-en', 'diff.png'), 'utf8')).toBe('diff');
        expect(fs.existsSync(path.join(publishDir, 'pr-1', 'latest', 'stale.png'))).toBe(false);
    });
});

describe('collect PR code context helpers', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-code-context-'));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    const changedFiles = [
        {
            filename: 'react_laiwan_com/src/page/home/style/HomeScreen.module.css',
            patch: '@@ -1,3 +1,3 @@\n-.title { color: white; }\n+.title { color: red; }\n context',
        },
        {
            filename: 'react_laiwan_com/src/page/glossary/controller/style/glossaryStyle.module.css',
            patch: '@@ -10,7 +10,7 @@\n-.glossaryHeader { font-size: 60px; }\n+.glossaryHeader { font-size: 64px; }',
        },
        {
            filename: 'react_laiwan_com/src/page/h5-tutorial/style/H5Tutorial.module.css',
            patch: '@@ -5,7 +5,7 @@\n-.title { margin: 1rem; }\n+.title { margin: 2rem; }',
        },
        {
            filename: 'README.md',
            patch: '@@ -1 +1 @@\n-old\n+new',
        },
    ];

    test('matches changed files to each visual case family', () => {
        expect(filterChangedFilesForCase('home-nav-en', changedFiles).map((file) => file.filename)).toEqual([
            'react_laiwan_com/src/page/home/style/HomeScreen.module.css',
        ]);
        expect(filterChangedFilesForCase('glossary-page-zh', changedFiles).map((file) => file.filename)).toEqual([
            'react_laiwan_com/src/page/glossary/controller/style/glossaryStyle.module.css',
        ]);
        expect(filterChangedFilesForCase('h5-tutorial-laiwan-life', changedFiles).map((file) => file.filename)).toEqual([
            'react_laiwan_com/src/page/h5-tutorial/style/H5Tutorial.module.css',
        ]);
    });

    test('summarizes patch hunks without unchanged context noise', () => {
        expect(summarizePatch('@@ -1,3 +1,3 @@\n unchanged\n-old\n+new\n unchanged 2')).toBe('@@ -1,3 +1,3 @@\n-old\n+new');
    });

    test('summarizes only case-related locale hunks and removes no-op EOF hunks', () => {
        const localePatch = [
            '@@ -29,7 +29,7 @@',
            '-    "glossary_text_1": "old glossary",',
            '+    "glossary_text_1": "new glossary",',
            '@@ -63,7 +63,7 @@',
            '-    "h5_what_is_h5_body": "old h5",',
            '+    "h5_what_is_h5_body": "new h5",',
            '@@ -74,4 +74,4 @@',
            '-}',
            '+}',
        ].join('\n');

        const glossarySummary = summarizePatch(localePatch, { keywords: ['glossary_'] });
        const h5Summary = summarizePatch(localePatch, { keywords: ['h5_'] });

        expect(glossarySummary).toContain('glossary_text_1');
        expect(glossarySummary).not.toContain('h5_what_is_h5_body');
        expect(glossarySummary).not.toContain('-}\n+}');
        expect(h5Summary).toContain('h5_what_is_h5_body');
        expect(h5Summary).not.toContain('glossary_text_1');
    });

    test('builds markdown with fallback UI files when a case has no direct match', () => {
        const markdown = buildCodeContextMarkdown({
            caseNames: ['tutorial-page'],
            changedFiles,
        });

        expect(markdown).toContain('#### 相关代码改动');
        expect(markdown).toContain('react_laiwan_com/src/page/home/style/HomeScreen.module.css');
        expect(markdown).toContain('react_laiwan_com/src/page/glossary/controller/style/glossaryStyle.module.css');
        expect(markdown).not.toContain('README.md');
    });

    test('appends code context after matching case section in summary', () => {
        const outputDir = path.join(tempDir, 'visual-review');
        const summaryPath = path.join(outputDir, 'summary.md');

        fs.mkdirSync(path.join(outputDir, 'glossary-page-zh'), { recursive: true });
        fs.writeFileSync(summaryPath, [
            '<!-- visual-review-comment -->',
            '## 视觉回归 Diff',
            '',
            '### glossary-page-zh',
            '| 修改前 | 修改后 | 差异 |',
            '| --- | --- | --- |',
            '| before | after | diff |',
            '',
        ].join('\n'));

        appendCodeContextToSummary({
            outputDir,
            changedFiles,
        });

        const summary = fs.readFileSync(summaryPath, 'utf8');
        expect(summary).toContain('### glossary-page-zh');
        expect(summary).toContain('#### 相关代码改动');
        expect(summary).toContain('glossaryStyle.module.css');
        expect(summary).toContain('-.glossaryHeader { font-size: 60px; }');
        expect(summary).toContain('+.glossaryHeader { font-size: 64px; }');
    });
});
