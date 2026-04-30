const fs = require('fs');
const path = require('path');

const MAX_FILES_PER_CASE = 5;
const MAX_HUNKS_PER_FILE = 3;
const UI_FILE_PATTERNS = [
    'react_laiwan_com/src/',
    '.github/workflows/visual-pr.yaml',
    'visual_regression/',
];

const CASE_FILE_PATTERNS = [
    {
        test: (caseName) => caseName.startsWith('home-'),
        patterns: [
            'react_laiwan_com/src/page/home/',
            'react_laiwan_com/src/common/view/NavBar',
            'react_laiwan_com/src/common/view/LanguageSelect',
            'react_laiwan_com/src/common/style/NavBar',
            'react_laiwan_com/src/localization/locales/',
        ],
    },
    {
        test: (caseName) => caseName.startsWith('glossary-'),
        patterns: [
            'react_laiwan_com/src/page/glossary/',
            'react_laiwan_com/src/localization/locales/',
        ],
    },
    {
        test: (caseName) => caseName.startsWith('tutorial-'),
        patterns: [
            'react_laiwan_com/src/Tutorial.js',
            'react_laiwan_com/src/view/style/tutorial.css',
            'react_laiwan_com/src/localization/locales/',
        ],
    },
    {
        test: (caseName) => caseName.startsWith('h5-tutorial-'),
        patterns: [
            'react_laiwan_com/src/page/h5-tutorial/',
            'react_laiwan_com/src/config.json',
            'react_laiwan_com/src/localization/locales/',
        ],
    },
];

const CASE_PATCH_KEYWORDS = [
    {
        test: (caseName) => caseName.startsWith('home-'),
        keywords: ['home_page_', 'navbar_'],
    },
    {
        test: (caseName) => caseName.startsWith('glossary-'),
        keywords: ['glossary_', 'terminolog'],
    },
    {
        test: (caseName) => caseName.startsWith('tutorial-'),
        keywords: ['apple_tutorial_', 'tutorial'],
    },
    {
        test: (caseName) => caseName.startsWith('h5-tutorial-'),
        keywords: ['h5_'],
    },
];

function isUiFile(file) {
    return UI_FILE_PATTERNS.some((pattern) => file.filename.startsWith(pattern));
}

function getPatternsForCase(caseName) {
    const mapping = CASE_FILE_PATTERNS.find((item) => item.test(caseName));
    return mapping ? mapping.patterns : [];
}

function fileMatchesPatterns(file, patterns) {
    return patterns.some((pattern) => file.filename.startsWith(pattern));
}

function filterChangedFilesForCase(caseName, changedFiles) {
    const patterns = getPatternsForCase(caseName);
    const matchedFiles = changedFiles.filter((file) => fileMatchesPatterns(file, patterns));

    if (matchedFiles.length > 0) {
        return matchedFiles.slice(0, MAX_FILES_PER_CASE);
    }

    return changedFiles.filter(isUiFile).slice(0, MAX_FILES_PER_CASE);
}

function getPatchKeywordsForCase(caseName) {
    const mapping = CASE_PATCH_KEYWORDS.find((item) => item.test(caseName));
    return mapping ? mapping.keywords : [];
}

function isNoopChangedLines(changedLines) {
    if (changedLines.length === 0) {
        return true;
    }

    const removed = changedLines
        .filter((line) => line.startsWith('-') && !line.startsWith('---'))
        .map((line) => line.slice(1).trim());
    const added = changedLines
        .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
        .map((line) => line.slice(1).trim());

    return removed.length === added.length
        && removed.every((line, index) => line === added[index]);
}

function hunkMatchesKeywords(header, changedLines, keywords) {
    if (keywords.length === 0) {
        return true;
    }

    const content = `${header}\n${changedLines.join('\n')}`.toLowerCase();
    return keywords.some((keyword) => content.includes(keyword.toLowerCase()));
}

function shouldFilterPatchByKeywords(file) {
    return file.filename.startsWith('react_laiwan_com/src/localization/locales/');
}

function summarizePatch(patch = '', { keywords = [] } = {}) {
    const lines = patch.split('\n');
    const summaryLines = [];
    const hunks = [];
    let currentHunk = null;

    lines.forEach((line) => {
        if (line.startsWith('@@')) {
            currentHunk = {
                header: line,
                changedLines: [],
            };
            hunks.push(currentHunk);
            return;
        }

        if (
            currentHunk
            && (line.startsWith('+') || line.startsWith('-'))
            && !line.startsWith('+++')
            && !line.startsWith('---')
        ) {
            currentHunk.changedLines.push(line);
        }
    });

    hunks
        .filter((hunk) => !isNoopChangedLines(hunk.changedLines))
        .filter((hunk) => hunkMatchesKeywords(hunk.header, hunk.changedLines, keywords))
        .slice(0, MAX_HUNKS_PER_FILE)
        .forEach((hunk) => {
            summaryLines.push(hunk.header);
            summaryLines.push(...hunk.changedLines);
        });

    return summaryLines.join('\n');
}

function buildCodeContextMarkdownForCase({ caseName, changedFiles }) {
    const patterns = getPatternsForCase(caseName);
    const hasDirectFiles = changedFiles.some((file) => fileMatchesPatterns(file, patterns));
    const relatedFiles = filterChangedFilesForCase(caseName, changedFiles);
    const caseKeywords = hasDirectFiles ? getPatchKeywordsForCase(caseName) : [];
    const relatedSummaries = relatedFiles
        .map((file) => ({
            file,
            patchSummary: summarizePatch(file.patch || '', {
                keywords: shouldFilterPatchByKeywords(file) ? caseKeywords : [],
            }),
        }))
        .filter(({ patchSummary }) => patchSummary);

    if (relatedSummaries.length === 0) {
        return [
            '#### 相关代码改动',
            '',
            '未找到本 PR 中可关联的 UI 文件改动。',
            '',
        ].join('\n');
    }

    const lines = [
        '#### 相关代码改动',
        '',
    ];

    relatedSummaries.forEach(({ file, patchSummary }) => {
        lines.push(`- \`${file.filename}\``);
        lines.push('');
        lines.push('```diff');
        lines.push(patchSummary);
        lines.push('```');
        lines.push('');
    });

    return lines.join('\n');
}

function buildCodeContextMarkdown({ caseNames, changedFiles }) {
    return caseNames
        .map((caseName) => buildCodeContextMarkdownForCase({ caseName, changedFiles }))
        .join('\n');
}

function listCaseNames(outputDir) {
    if (!fs.existsSync(outputDir)) {
        return [];
    }

    return fs.readdirSync(outputDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
}

function appendSectionToSummary(summary, caseName, markdown) {
    const caseHeading = `### ${caseName}`;
    const headingIndex = summary.indexOf(caseHeading);

    if (headingIndex < 0) {
        return summary;
    }

    const nextHeadingIndex = summary.indexOf('\n### ', headingIndex + caseHeading.length);
    const insertIndex = nextHeadingIndex < 0 ? summary.length : nextHeadingIndex;
    const before = summary.slice(0, insertIndex).replace(/\s*$/, '\n\n');
    const after = summary.slice(insertIndex);

    return `${before}${markdown.trim()}\n${after}`;
}

function appendCodeContextToSummary({ outputDir, changedFiles }) {
    const summaryPath = path.join(outputDir, 'summary.md');
    const caseNames = listCaseNames(outputDir);
    let summary = fs.readFileSync(summaryPath, 'utf8');
    caseNames.forEach((caseName) => {
        summary = appendSectionToSummary(
            summary,
            caseName,
            buildCodeContextMarkdownForCase({ caseName, changedFiles })
        );
    });

    fs.writeFileSync(summaryPath, summary);

    return summary;
}

async function requestChangedFiles({
    fetchImpl = global.fetch,
    token,
    repo,
    prNumber,
}) {
    if (!fetchImpl) {
        throw new Error('fetch is not available');
    }
    if (!token) {
        throw new Error('GITHUB_TOKEN is required');
    }

    const changedFiles = [];
    let page = 1;

    while (true) {
        const response = await fetchImpl(
            `https://api.github.com/repos/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`,
            {
                headers: {
                    Accept: 'application/vnd.github+json',
                    Authorization: `Bearer ${token}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API changed files request failed: ${response.status} ${errorText}`);
        }

        const files = await response.json();
        changedFiles.push(...files);

        if (files.length < 100) {
            break;
        }

        page += 1;
    }

    return changedFiles;
}

async function runFromEnv(env = process.env) {
    const changedFiles = await requestChangedFiles({
        token: env.GITHUB_TOKEN,
        repo: env.GITHUB_REPOSITORY,
        prNumber: env.PR_NUMBER,
    });

    appendCodeContextToSummary({
        outputDir: env.VISUAL_REVIEW_DIR || 'visual-review',
        changedFiles,
    });

    console.log(`Appended PR code context for ${changedFiles.length} changed file(s).`);
}

if (require.main === module) {
    runFromEnv().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    appendCodeContextToSummary,
    buildCodeContextMarkdown,
    buildCodeContextMarkdownForCase,
    filterChangedFilesForCase,
    getPatchKeywordsForCase,
    listCaseNames,
    requestChangedFiles,
    summarizePatch,
};
