const fs = require('fs');
const { COMMENT_MARKER } = require('./review-comment-constants');

function buildPassSummary() {
    return `${COMMENT_MARKER}\n## 视觉回归 Diff\n\n✅ 视觉回归通过，无 diff。`;
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
        return readFile(env.COMMENT_BODY_PATH, 'utf8');
    }

    if (env.VISUAL_REVIEW_STATUS === 'pass') {
        return buildPassSummary();
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
    buildPassSummary,
    findVisualReviewComment,
    readCommentBody,
    upsertReviewComment,
};
