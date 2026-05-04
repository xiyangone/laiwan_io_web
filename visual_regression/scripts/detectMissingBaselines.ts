import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MISSING_SNAPSHOT_PATTERN = /A snapshot doesn't exist at (.+?baseline-[^\s,]+\.png)/g;

function walkFiles(dir: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }

    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            return walkFiles(entryPath);
        }

        return entry.isFile() ? [entryPath] : [];
    });
}

export function detectMissingBaselines(resultsDir: string): string[] {
    const missingBaselines = new Set<string>();

    for (const filePath of walkFiles(resultsDir).filter((item) => path.basename(item) === 'error-context.md')) {
        const content = readFileSync(filePath, 'utf8');

        for (const match of content.matchAll(MISSING_SNAPSHOT_PATTERN)) {
            missingBaselines.add(match[1]);
        }
    }

    return [...missingBaselines].sort((a, b) => a.localeCompare(b));
}

export function writeGitHubOutput(missingBaselines: string[], outputPath?: string): void {
    if (!outputPath) {
        return;
    }

    appendFileSync(outputPath, `missing=${missingBaselines.length > 0}\n`);
    appendFileSync(outputPath, `count=${missingBaselines.length}\n`);
}

export function runFromEnv(env = process.env): void {
    const missingBaselines = detectMissingBaselines(env.TEST_RESULTS_DIR || 'test-results');

    writeGitHubOutput(missingBaselines, env.GITHUB_OUTPUT);

    if (missingBaselines.length > 0) {
        console.log(`Detected ${missingBaselines.length} missing visual baseline(s):`);
        missingBaselines.forEach((baselinePath) => console.log(`- ${baselinePath}`));
        return;
    }

    console.log('No missing visual baselines detected.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    runFromEnv();
}
