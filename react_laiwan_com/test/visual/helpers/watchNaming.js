const path = require('path');

const TEST_FILE_SUFFIX_PATTERN = /\.(test|spec)\.(js|ts)$/i;

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

module.exports = {
    getCasePrefix,
    getSequenceScreenshotPath,
};
