import { expect, type Page, type PageAssertionsToHaveScreenshotOptions } from '@playwright/test';

const DEFAULT_DYNAMIC_CLASS_NAMES = '_1zAX1KISmCqHJI2_KxdiQu';

export function normalizeDynamicClassNames(rawValue?: string | string[] | null): string[] {
    const source: string | string[] = rawValue
        ?? process.env.VISUAL_DYNAMIC_CLASS_NAMES
        ?? process.env.IGNORED_CLASS_NAMES
        ?? DEFAULT_DYNAMIC_CLASS_NAMES;
    const values: string[] = Array.isArray(source) ? source : source.split(',');

    return [...new Set(values.map((item: string) => item.trim()).filter(Boolean))];
}

function escapeClassName(className: string): string {
    return className.replace(/([^A-Za-z0-9_-])/g, '\\$1');
}

export function buildDynamicClassHideCss(classNames = normalizeDynamicClassNames()): string {
    if (!classNames.length) {
        return '';
    }

    return `${classNames.map((className) => `.${escapeClassName(className)}`).join(',\n')} {
        display: none !important;
    }`;
}

export async function stabilizePage(page: Page): Promise<void> {
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
        await page.addStyleTag({ content: dynamicClassHideCss });
    }

    await page.evaluate(() => (document.fonts?.ready ?? Promise.resolve()));
}

export async function setLanguageCookie(page: Page, locale: string): Promise<void> {
    await page.goto('/#/');
    await page.evaluate((language: string) => {
        document.cookie = `language=${language}; path=/`;
    }, locale);
}

export async function waitForRouteReady(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
}

export async function expectVisualSnapshot(
    page: Page,
    snapshotName: string,
    options: PageAssertionsToHaveScreenshotOptions = {}
): Promise<void> {
    await stabilizePage(page);
    await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
        fullPage: true,
        ...options,
    });
}
