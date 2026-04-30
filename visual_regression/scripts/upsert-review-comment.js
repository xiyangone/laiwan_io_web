const fs = require('fs');
const { COMMENT_MARKER } = require('./review-comment-constants');

function buildPassSummary() {
    return `${COMMENT_MARKER}\n## 视觉回归 Diff\n\n✅ 视觉回归通过，无 diff。`;
}

function buildBaselineInitializedSummary() {
    return [
        COMMENT_MARKER,
        '## 视觉回归 Diff',
        '',
        '已从 base sha 临时生成视觉 baseline，本次使用 base 分支截图作为对比基准。',
        '',
        'CI 不会提交回 PR 分支；后续提交仍会重新从 base sha 生成 baseline 后再对比 PR。',
    ].join('\n');
}

function buildVisualReviewGateSummary({ approved }) {
    if (approved) {
        return [
            '### 合并状态',
            '',
            '检测到 `visual-approved` label，本次视觉 diff 已放行。',
        ].join('\n');
    }

    return [
        '### 合并状态',
        '',
        '检测到视觉 diff，当前 PR 未标记 `visual-approved`，CI 会阻止合并。',
        '',
        '确认这次 UI 变化符合预期后，给 PR 添加 `visual-approved` label 并重新运行视觉 CI。',
    ].join('\n');
}

function decorateVisualReviewSummary(body, { approved }) {
    return `${body.trimEnd()}\n\n---\n\n${buildVisualReviewGateSummary({ approved })}`;
}

function findVisualReviewComment(comments) {
    return comments.find((comment) => comment.body && comment.body.includes(COMMENT_MARKER));
}

async function requestGitHub({
    fetchImpl,
    token,
    url,
    method = 'GET',
    body,
}) {
    const response = await fetchImpl(url, {
        method,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API ${method} ${url} failed: ${response.status} ${errorText}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function upsertReviewComment({
    fetchImpl = global.fetch,
    token,
    repo,
    issueNumber,
    body,
}) {
    if (!fetchImpl) {
        throw new Error('fetch is not available');
    }
    if (!token) {
        throw new Error('GITHUB_TOKEN is required');
    }
    if (!repo) {
        throw new Error('GITHUB_REPOSITORY is required');
    }
    if (!issueNumber) {
        throw new Error('PR_NUMBER is required');
    }
    if (!body || !body.includes(COMMENT_MARKER)) {
        throw new Error('comment body must include the visual review marker');
    }

    const commentsUrl = `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`;
    const comments = await requestGitHub({
        fetchImpl,
        token,
        url: `${commentsUrl}?per_page=100`,
    });
    const existing = findVisualReviewComment(comments);

    if (existing) {
        const comment = await requestGitHub({
            fetchImpl,
            token,
            url: `https://api.github.com/repos/${repo}/issues/comments/${existing.id}`,
            method: 'PATCH',
            body: { body },
        });

        return {
            action: 'updated',
            comment,
        };
    }

    const comment = await requestGitHub({
        fetchImpl,
        token,
        url: commentsUrl,
        method: 'POST',
        body: { body },
    });

    return {
        action: 'created',
        comment,
    };
}

function readCommentBody({ env = process.env, readFile = fs.readFileSync } = {}) {
    if (env.COMMENT_BODY_PATH) {
        const body = readFile(env.COMMENT_BODY_PATH, 'utf8');

        if (Object.prototype.hasOwnProperty.call(env, 'VISUAL_REVIEW_APPROVED')) {
            return decorateVisualReviewSummary(body, {
                approved: env.VISUAL_REVIEW_APPROVED === 'true',
            });
        }

        return body;
    }

    if (env.VISUAL_REVIEW_STATUS === 'pass') {
        return buildPassSummary();
    }

    if (env.VISUAL_REVIEW_STATUS === 'baseline-initialized') {
        return buildBaselineInitializedSummary();
    }

    throw new Error('COMMENT_BODY_PATH or VISUAL_REVIEW_STATUS=pass is required');
}

async function runFromEnv(env = process.env) {
    const result = await upsertReviewComment({
        token: env.GITHUB_TOKEN,
        repo: env.GITHUB_REPOSITORY,
        issueNumber: env.PR_NUMBER,
        body: readCommentBody({ env }),
    });

    console.log(`Visual review comment ${result.action}.`);
}

if (require.main === module) {
    runFromEnv().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    buildBaselineInitializedSummary,
    buildPassSummary,
    buildVisualReviewGateSummary,
    decorateVisualReviewSummary,
    findVisualReviewComment,
    readCommentBody,
    upsertReviewComment,
};
