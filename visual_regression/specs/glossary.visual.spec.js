const { test, expect } = require('@playwright/test');
const {
    captureTimestampedScreenshotBuffer,
    saveSnapshotDiffFromBuffer,
    stabilizePage,
} = require('../helpers/screenshot');

test('术语表页面视觉回归且不显示语言下拉', async ({ page }) => {
    await page.goto('/#/glossary');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('select')).toHaveCount(0);
    await expect(page.getByText('德州扑克术语', { exact: true })).toBeVisible();

    await stabilizePage(page);
    const { buffer } = await captureTimestampedScreenshotBuffer(page, 'glossary-page-zh');
    saveSnapshotDiffFromBuffer('glossary-page-zh.png', buffer, 'glossary-page-zh');
    await expect(page).toHaveScreenshot('glossary-page-zh.png', {
        fullPage: true,
    });
});
