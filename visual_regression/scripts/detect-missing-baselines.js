const fs = require('fs');
const path = require('path');

const MISSING_SNAPSHOT_PATTERN = /A snapshot doesn't exist at (.+?baseline-[^\s,]+\.png)/g;

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

function detectMissingBaselines({ resultsDir }) {
    const missingBaselines = new Set();

    walkFiles(resultsDir)
        .filter((filePath) => path.basename(filePath) === 'error-context.md')
        .forEach((filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            let match = MISSING_SNAPSHOT_PATTERN.exec(content);

            while (match) {
                missingBaselines.add(match[1]);
                match = MISSING_SNAPSHOT_PATTERN.exec(content);
            }
        });

    return [...missingBaselines].sort((a, b) => a.localeCompare(b));
}

function writeGitHubOutput({ missingBaselines, outputPath }) {
    if (!outputPath) {
        return;
    }

    fs.appendFileSync(outputPath, `missing=${missingBaselines.length > 0}\n`);
    fs.appendFileSync(outputPath, `count=${missingBaselines.length}\n`);
}

function runFromEnv(env = process.env) {
    const missingBaselines = detectMissingBaselines({
        resultsDir: env.TEST_RESULTS_DIR || 'test-results',
    });

    writeGitHubOutput({
        missingBaselines,
        outputPath: env.GITHUB_OUTPUT,
    });

    if (missingBaselines.length > 0) {
        console.log(`Detected ${missingBaselines.length} missing visual baseline(s):`);
        missingBaselines.forEach((baselinePath) => console.log(`- ${baselinePath}`));
        return;
    }

    console.log('No missing visual baselines detected.');
}

if (require.main === module) {
    runFromEnv();
}

module.exports = {
    detectMissingBaselines,
    writeGitHubOutput,
};
