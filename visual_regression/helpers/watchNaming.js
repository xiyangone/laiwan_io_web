const path = require('path');

const TEST_FILE_SUFFIX_PATTERN = /\.(test|spec)\.(js|ts)$/i;
const SCREENSHOT_PHASE_LABELS = {
    before: '修改前',
    after: '修改后',
};

function normalizeWatchName(name) {
    return name
        .toString()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        || 'visual-change';
}

function getCasePrefix(caseFilePath) {
    if (!caseFilePath || !caseFilePath.trim()) {
        throw new Error('VISUAL_CASE_FILE is required.');
    }

    const baseName = path.basename(caseFilePath.trim());
    const prefix = baseName.replace(TEST_FILE_SUFFIX_PATTERN, '');

    if (!prefix || prefix === baseName) {
        throw new Error(`Unsupported VISUAL_CASE_FILE: ${caseFilePath}`);
    }

    return prefix;
}

function getSequenceScreenshotPath(outputRoot, casePrefix, index) {
    if (!Number.isInteger(index) || index < 1) {
        throw new Error(`Invalid screenshot index: ${index}`);
    }

    return path.join(outputRoot, `${casePrefix}.${index}.png`);
}

function getStableScreenshotPath(outputRoot, changeName, phase) {
    const label = SCREENSHOT_PHASE_LABELS[phase];

    if (!label) {
        throw new Error(`Unsupported screenshot phase: ${phase}`);
    }

    return path.join(outputRoot, `${normalizeWatchName(changeName)}-${label}.png`);
}

function getWatchDiffImagePath(outputRoot, changeName) {
    return path.join(outputRoot, `diff-${normalizeWatchName(changeName)}.png`);
}

module.exports = {
    getCasePrefix,
    getSequenceScreenshotPath,
    getStableScreenshotPath,
    getWatchDiffImagePath,
    normalizeWatchName,
};
