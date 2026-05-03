const { test, expect } = require('@playwright/test');
const {
    expectVisualSnapshot,
    setLanguageCookie,
    waitForRouteReady,
} = require('../helpers/specHelpers');

test('术语表页面视觉回归且不显示语言下拉', async ({ page }) => {
    await page.goto('/#/glossary');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('select')).toHaveCount(0);
    await expect(page.getByText('德州扑克术语', { exact: true })).toBeVisible();

    await expectVisualSnapshot(page, 'glossary-page-zh');
});

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
