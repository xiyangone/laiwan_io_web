const { test, expect } = require('@playwright/test');
const {
    captureTimestampedScreenshotBuffer,
    saveSnapshotDiffFromBuffer,
    stabilizePage,
} = require('../helpers/screenshot');

test('首页导航语言切换与英文状态视觉回归', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('select');
    await expect(page.getByRole('combobox')).toBeVisible();

    await stabilizePage(page);
    const { buffer } = await captureTimestampedScreenshotBuffer(page, 'home-nav-en');
    saveSnapshotDiffFromBuffer('home-nav-en.png', buffer, 'home-nav-en');
    await expect(page).toHaveScreenshot('home-nav-en.png', {
        fullPage: true,
    });
});

test('首页导航语言切换与中文状态视觉回归', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('select');
    await page.locator('select').selectOption('zh');
    await expect(page.getByText('德州扑克约局社区')).toBeVisible();

    await stabilizePage(page);
    const { buffer } = await captureTimestampedScreenshotBuffer(page, 'home-nav-zh');
    saveSnapshotDiffFromBuffer('home-nav-zh.png', buffer, 'home-nav-zh');
    await expect(page).toHaveScreenshot('home-nav-zh.png', {
        fullPage: true,
    });
});

test('苹果商店弹窗视觉回归', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.getByAltText('ios_store').click();
    await expect(page.getByText('苹果商店下载')).toBeVisible();

    await stabilizePage(page);
    const { buffer } = await captureTimestampedScreenshotBuffer(page, 'home-ios-modal-zh');
    saveSnapshotDiffFromBuffer('home-ios-modal-zh.png', buffer, 'home-ios-modal-zh');
    await expect(page).toHaveScreenshot('home-ios-modal-zh.png', {
        fullPage: true,
    });
});
