const { test, expect } = require('@playwright/test');
const {
    captureTimestampedScreenshotBuffer,
    saveSnapshotDiffFromBuffer,
    stabilizePage,
} = require('../helpers/screenshot');
const {
    h5_version_url_1: h5VersionUrl1,
    h5_version_url_2: h5VersionUrl2,
} = require('../../react_laiwan_com/src/config.json');

async function setLanguageCookie(page, locale) {
    await page.goto('/#/');
    await page.evaluate((language) => {
        document.cookie = `language=${language}; path=/`;
    }, locale);
}

async function waitForRouteReady(page) {
    await page.waitForLoadState('domcontentloaded');
}

async function expectVisualSnapshot(page, snapshotName) {
    await stabilizePage(page);
    const { buffer } = await captureTimestampedScreenshotBuffer(page, snapshotName);
    saveSnapshotDiffFromBuffer(`${snapshotName}.png`, buffer, snapshotName);
    await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
        fullPage: true,
    });
}

test('术语表英文列表页视觉回归', async ({ page }) => {
    await setLanguageCookie(page, 'en');
    await page.goto('/#/glossary');
    await waitForRouteReady(page);
    await expect(page.locator('select')).toHaveCount(0);
    await expect(page.getByText("Texas Hold'em Glossary", { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search glossary' })).toBeVisible();

    await expectVisualSnapshot(page, 'glossary-list-en');
});

test('术语表中文定义页视觉回归', async ({ page }) => {
    await setLanguageCookie(page, 'zh');
    await page.goto('/#/glossary/zh/agaodepaixingzuhe');
    await waitForRouteReady(page);
    await expect(page.getByText('A高的牌型组合', { exact: true })).toBeVisible();
    await expect(page.getByText('返回列表', { exact: true })).toBeVisible();

    await expectVisualSnapshot(page, 'glossary-definition-zh');
});

test('术语表英文定义页视觉回归', async ({ page }) => {
    await setLanguageCookie(page, 'en');
    await page.goto('/#/glossary');
    await waitForRouteReady(page);
    await expect(page.getByText("Texas Hold'em Glossary", { exact: true })).toBeVisible();
    await page.goto('/#/glossary/en/agame');
    await waitForRouteReady(page);
    await expect(page.getByText('A-Game', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Return to list', { exact: true })).toBeVisible();

    await expectVisualSnapshot(page, 'glossary-definition-en');
});

test('苹果下载教程页视觉回归', async ({ page }) => {
    await setLanguageCookie(page, 'zh');
    await page.goto('/#/tutorial/');
    await waitForRouteReady(page);
    await expect(page.getByText('一、注册一个新的AppleID并下载来玩:', { exact: true })).toBeVisible();

    await expectVisualSnapshot(page, 'tutorial-page');
});

test('H5 来玩 life 教程页视觉回归', async ({ page }) => {
    await setLanguageCookie(page, 'zh');
    await page.goto('/#/h5-tutorial/laiwan-life');
    await waitForRouteReady(page);
    await expect(page.getByText('什么是H5？', { exact: true })).toBeVisible();
    await expect(page.locator(`a[href="${h5VersionUrl1}"]`).first()).toBeVisible();

    await expectVisualSnapshot(page, 'h5-tutorial-laiwan-life');
});

test('H5 来玩派教程页视觉回归', async ({ page }) => {
    await setLanguageCookie(page, 'zh');
    await page.goto('/#/h5-tutorial/laiwanpai-com');
    await waitForRouteReady(page);
    await expect(page.getByText('什么是H5？', { exact: true })).toBeVisible();
    await expect(page.locator(`a[href="${h5VersionUrl2}"]`).first()).toBeVisible();

    await expectVisualSnapshot(page, 'h5-tutorial-laiwanpai-com');
});
