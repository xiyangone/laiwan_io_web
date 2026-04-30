const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function resolvePublishTargets({ prNumber, runId }) {
    return {
        runTarget: `pr-${prNumber}/run-${runId}`,
        latestTarget: `pr-${prNumber}/latest`,
    };
}

function copyDir(source, target) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true });
}

function copyReviewArtifacts({
    workspace,
    publishDir,
    prNumber,
    runId,
}) {
    const sourceDir = path.join(workspace, 'visual-review');
    const { runTarget, latestTarget } = resolvePublishTargets({ prNumber, runId });
    const runTargetPath = path.join(publishDir, runTarget);
    const latestTargetPath = path.join(publishDir, latestTarget);

    if (!fs.existsSync(sourceDir)) {
        throw new Error(`visual review directory does not exist: ${sourceDir}`);
    }

    fs.rmSync(runTargetPath, { recursive: true, force: true });
    fs.rmSync(latestTargetPath, { recursive: true, force: true });
    copyDir(sourceDir, runTargetPath);
    copyDir(sourceDir, latestTargetPath);

    return {
        runTargetPath,
        latestTargetPath,
    };
}

function runGit(args, options = {}) {
    execFileSync('git', args, {
        stdio: 'inherit',
        ...options,
    });
}

function resolveConfig(env = process.env) {
    const config = {
        token: env.GITHUB_TOKEN,
        repository: env.GITHUB_REPOSITORY,
        workspace: env.GITHUB_WORKSPACE,
        prNumber: env.PR_NUMBER,
        runId: env.GITHUB_RUN_ID,
        artifactBranch: env.VISUAL_REVIEW_ARTIFACT_BRANCH || 'visual-review-artifacts',
    };

    Object.entries(config).forEach(([key, value]) => {
        if (!value) {
            throw new Error(`${key} is required`);
        }
    });

    return config;
}

function publishReviewArtifacts({
    env = process.env,
    runner = runGit,
} = {}) {
    const config = resolveConfig(env);
    const publishDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-review-publish-'));
    const repoUrl = `https://x-access-token:${config.token}@github.com/${config.repository}.git`;

    try {
        runner(['clone', '--depth', '1', '--branch', config.artifactBranch, repoUrl, publishDir]);
        console.log(`Using existing ${config.artifactBranch} branch.`);
    } catch (error) {
        runner(['init', publishDir]);
        runner(['checkout', '--orphan', config.artifactBranch], { cwd: publishDir });
        runner(['remote', 'add', 'origin', repoUrl], { cwd: publishDir });
    }

    runner(['config', 'user.name', 'github-actions[bot]'], { cwd: publishDir });
    runner(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], { cwd: publishDir });

    copyReviewArtifacts({
        workspace: config.workspace,
        publishDir,
        prNumber: config.prNumber,
        runId: config.runId,
    });

    runner(['add', '.'], { cwd: publishDir });

    try {
        runner(['diff', '--cached', '--quiet'], { cwd: publishDir });
        console.log('No visual review image changes to publish.');
    } catch (error) {
        runner(['commit', '-m', `chore: update visual review artifacts for PR #${config.prNumber}`], { cwd: publishDir });
        runner(['push', 'origin', `HEAD:${config.artifactBranch}`], { cwd: publishDir });
    }

    return {
        publishDir,
    };
}

if (require.main === module) {
    try {
        publishReviewArtifacts();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

module.exports = {
    copyReviewArtifacts,
    publishReviewArtifacts,
    resolveConfig,
    resolvePublishTargets,
};
