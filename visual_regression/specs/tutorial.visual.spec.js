const { test, expect } = require('@playwright/test');
const {
    expectVisualSnapshot,
    setLanguageCookie,
    waitForRouteReady,
} = require('../helpers/specHelpers');

test('苹果下载教程页视觉回归', async ({ page }) => {
    await setLanguageCookie(page, 'zh');
    await page.goto('/#/tutorial/');
    await waitForRouteReady(page);
    await expect(page.getByText('一、注册一个新的AppleID并下载来玩:', { exact: true })).toBeVisible();

    await expectVisualSnapshot(page, 'tutorial-page');
});
