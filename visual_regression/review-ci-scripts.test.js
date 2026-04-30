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
