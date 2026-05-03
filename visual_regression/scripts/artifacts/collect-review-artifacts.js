const fs = require('fs');
const path = require('path');
const { createDiffImageBuffer } = require('../../helpers/pngDiff');
const { COMMENT_MARKER } = require('../review-comment/review-comment-constants');

const EXPECTED_SUFFIX = '-expected.png';
const ACTUAL_SUFFIX = '-actual.png';
const DIFF_SUFFIX = '-diff.png';

function walkFiles(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            return walkFiles(entryPath);
        }

        return entry.isFile() ? [entryPath] : [];
    });
}

function copyFile(source, target) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
}

function emptyDir(dir) {
    fs.mkdirSync(dir, { recursive: true });

    fs.readdirSync(dir).forEach((entryName) => {
        fs.rmSync(path.join(dir, entryName), { recursive: true, force: true });
    });
}

function buildReviewImageUrl({ repo, artifactBranch, prNumber, runId, caseName, fileName }) {
    return `https://github.com/${repo}/blob/${artifactBranch}/pr-${prNumber}/run-${runId}/${caseName}/${fileName}?raw=true`;
}

function buildSummary({ cases, repo, prNumber, runId, artifactBranch }) {
    const lines = [
        COMMENT_MARKER,
        '## 视觉回归 Diff',
        '',
    ];

    if (cases.length === 0) {
        lines.push('未找到视觉变更截图产物。');
        return `${lines.join('\n')}\n`;
    }

    lines.push(`本次检测到 ${cases.length} 个视觉变更用例；以下图片均为整张浏览器截图，只展示发生视觉变化的用例。`);
    lines.push('');

    cases.forEach((visualCase) => {
        const beforeUrl = buildReviewImageUrl({
            repo,
            artifactBranch,
            prNumber,
            runId,
            caseName: visualCase.name,
            fileName: 'before.png',
        });
        const afterUrl = buildReviewImageUrl({
            repo,
            artifactBranch,
            prNumber,
            runId,
            caseName: visualCase.name,
            fileName: 'after.png',
        });
        const diffUrl = buildReviewImageUrl({
            repo,
            artifactBranch,
            prNumber,
            runId,
            caseName: visualCase.name,
            fileName: 'diff.png',
        });

        lines.push(`### ${visualCase.name}`);
        lines.push('| 修改前 | 修改后 | 差异 |');
        lines.push('| --- | --- | --- |');
        lines.push(`| ![${visualCase.name} before](${beforeUrl}) | ![${visualCase.name} after](${afterUrl}) | ![${visualCase.name} diff](${diffUrl}) |`);
        lines.push('');
    });

    return `${lines.join('\n')}\n`;
}

function collectReviewArtifacts({
    resultsDir,
    outputDir,
    repo,
    prNumber,
    runId,
    artifactBranch = 'visual-review-artifacts',
    requireCases = false,
}) {
    emptyDir(outputDir);

    const cases = walkFiles(resultsDir)
        .filter((filePath) => path.basename(filePath).endsWith(EXPECTED_SUFFIX))
        .map((expectedPath) => {
            const dir = path.dirname(expectedPath);
            const expectedName = path.basename(expectedPath);
            const caseName = expectedName.slice(0, -EXPECTED_SUFFIX.length);
            const actualPath = path.join(dir, `${caseName}${ACTUAL_SUFFIX}`);

            if (!fs.existsSync(actualPath)) {
                return null;
            }

            const diffPath = path.join(dir, `${caseName}${DIFF_SUFFIX}`);
            const caseOutputDir = path.join(outputDir, caseName);
            const beforeOutputPath = path.join(caseOutputDir, 'before.png');
            const afterOutputPath = path.join(caseOutputDir, 'after.png');
            const diffOutputPath = path.join(caseOutputDir, 'diff.png');

            copyFile(expectedPath, beforeOutputPath);
            copyFile(actualPath, afterOutputPath);

            if (fs.existsSync(diffPath)) {
                copyFile(diffPath, diffOutputPath);
            } else {
                const { diffBuffer } = createDiffImageBuffer(
                    fs.readFileSync(expectedPath),
                    fs.readFileSync(actualPath)
                );
                fs.writeFileSync(diffOutputPath, diffBuffer);
            }

            return {
                name: caseName,
                beforePath: beforeOutputPath,
                afterPath: afterOutputPath,
                diffPath: diffOutputPath,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

    const summary = buildSummary({
        cases,
        repo,
        prNumber,
        runId,
        artifactBranch,
    });
    fs.writeFileSync(path.join(outputDir, 'summary.md'), summary);

    if (requireCases && cases.length === 0) {
        throw new Error('Visual regression failed, but no reviewable screenshot diff artifacts were found.');
    }

    return {
        cases,
        summary,
    };
}

if (require.main === module) {
    const result = collectReviewArtifacts({
        resultsDir: process.env.TEST_RESULTS_DIR || '/workspace/test-results',
        outputDir: process.env.VISUAL_REVIEW_DIR || '/workspace/visual-review',
        repo: process.env.GITHUB_REPOSITORY || 'xiyangone/laiwan_io_web',
        prNumber: process.env.PR_NUMBER || 'local',
        runId: process.env.GITHUB_RUN_ID || 'local',
        artifactBranch: process.env.VISUAL_REVIEW_ARTIFACT_BRANCH || 'visual-review-artifacts',
        requireCases: process.env.VISUAL_REVIEW_REQUIRE_CASES === '1',
    });

    console.log(`Collected ${result.cases.length} visual review case(s).`);
}

module.exports = {
    COMMENT_MARKER,
    collectReviewArtifacts,
};
