import { expect, type Page, type PageAssertionsToHaveScreenshotOptions } from '@playwright/test';

const DYNAMIC_CLASS_NAMES = ['_1zAX1KISmCqHJI2_KxdiQu'];

function escapeClassName(className: string): string {
    return className.replace(/([^A-Za-z0-9_-])/g, '\\$1');
}

function buildDynamicClassHideCss(): string {
    return `${DYNAMIC_CLASS_NAMES.map((className) => `.${escapeClassName(className)}`).join(',\n')} {
        display: none !important;
    }`;
}

export async function 稳定视觉页面(page: Page): Promise<void> {
    // 视觉回归只关心稳定页面状态，动画和光标会制造无意义截图差异。
    await page.addStyleTag({
        content: `
            *, *::before, *::after {
                animation: none !important;
                transition: none !important;
                caret-color: transparent !important;
            }
        `,
    });

    // webpack/css-loader 生成的动态类名会随构建变化，这里隐藏对应元素避免误报。
    await page.addStyleTag({ content: buildDynamicClassHideCss() });

    await page.evaluate(() => document.fonts.ready);
}

export async function 设置页面语言(page: Page, locale: string): Promise<void> {
    await page.goto('/#/');
    await page.evaluate((language: string) => {
        document.cookie = `language=${language}; path=/`;
    }, locale);
}

export async function 等待页面路由稳定(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
}

export async function 匹配视觉截图(
    page: Page,
    snapshotName: string,
    options: PageAssertionsToHaveScreenshotOptions = {}
): Promise<void> {
    await 稳定视觉页面(page);
    await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
        fullPage: true,
        ...options,
    });
}
