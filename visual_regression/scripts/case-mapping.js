// Single source of truth for case → source files / patch keywords mapping.
// Used by review-comment/collect-pr-code-context.js (and future automations) so
// adding a new visual page only requires touching this file.

const cases = [
    {
        prefix: 'home-',
        sources: [
            'react_laiwan_com/src/page/home/',
            'react_laiwan_com/src/common/view/NavBar',
            'react_laiwan_com/src/common/view/LanguageSelect',
            'react_laiwan_com/src/common/style/NavBar',
            'react_laiwan_com/src/localization/locales/',
        ],
        keywords: ['home_page_', 'navbar_'],
    },
    {
        prefix: 'glossary-',
        sources: [
            'react_laiwan_com/src/page/glossary/',
            'react_laiwan_com/src/localization/locales/',
        ],
        keywords: ['glossary_', 'terminolog'],
    },
    {
        prefix: 'tutorial-',
        sources: [
            'react_laiwan_com/src/Tutorial.js',
            'react_laiwan_com/src/view/style/tutorial.css',
            'react_laiwan_com/src/localization/locales/',
        ],
        keywords: ['apple_tutorial_', 'tutorial'],
    },
    {
        prefix: 'h5-tutorial-',
        sources: [
            'react_laiwan_com/src/page/h5-tutorial/',
            'react_laiwan_com/src/config.json',
            'react_laiwan_com/src/localization/locales/',
        ],
        keywords: ['h5_'],
    },
];

const fallbackUiFiles = [
    'react_laiwan_com/src/',
    '.github/workflows/visual-pr.yaml',
    'visual_regression/',
];

function findCaseByName(caseName) {
    return cases.find((entry) => caseName.startsWith(entry.prefix)) || null;
}

function getSourcesForCase(caseName) {
    const entry = findCaseByName(caseName);
    return entry ? entry.sources : [];
}

function getKeywordsForCase(caseName) {
    const entry = findCaseByName(caseName);
    return entry ? entry.keywords : [];
}

module.exports = {
    cases,
    fallbackUiFiles,
    findCaseByName,
    getKeywordsForCase,
    getSourcesForCase,
};
