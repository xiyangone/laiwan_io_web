const DEFAULT_DYNAMIC_CLASS_NAMES = '_1zAX1KISmCqHJI2_KxdiQu';

function normalizeDynamicClassNames(rawValue) {
    const source = rawValue === undefined || rawValue === null
        ? process.env.VISUAL_DYNAMIC_CLASS_NAMES || process.env.IGNORED_CLASS_NAMES || DEFAULT_DYNAMIC_CLASS_NAMES
        : rawValue;

    if (Array.isArray(source)) {
        return [...new Set(source.map((item) => `${item}`.trim()).filter(Boolean))];
    }

    return [...new Set(`${source}`.split(',').map((item) => item.trim()).filter(Boolean))];
}

function escapeClassName(className) {
    return className.replace(/([^A-Za-z0-9_-])/g, '\\$1');
}

function buildDynamicClassHideCss(classNames = normalizeDynamicClassNames()) {
    if (!classNames.length) {
        return '';
    }

    const selector = classNames
        .map((className) => `.${escapeClassName(className)}`)
        .join(',\n');

    return `
        ${selector} {
            display: none !important;
        }
    `;
}

async function waitForFontsReady(page) {
    await page.evaluate(() => (
        document.fonts && document.fonts.ready
            ? document.fonts.ready
            : Promise.resolve()
    ));
}

async function stabilizePage(page) {
    await page.addStyleTag({
        content: `
            *, *::before, *::after {
                animation: none !important;
                transition: none !important;
                caret-color: transparent !important;
            }
        `,
    });

    const dynamicClassHideCss = buildDynamicClassHideCss();
    if (dynamicClassHideCss) {
        await page.addStyleTag({
            content: dynamicClassHideCss,
        });
    }

    await waitForFontsReady(page);
}

module.exports = {
    buildDynamicClassHideCss,
    normalizeDynamicClassNames,
    stabilizePage,
    waitForFontsReady,
};
