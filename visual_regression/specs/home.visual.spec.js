const { test, expect } = require('@playwright/test');
const { expectVisualSnapshot } = require('../helpers/specHelpers');

test('首页导航语言切换与英文状态视觉回归', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('select');
    await page.locator('select').selectOption('en');
    await expect(page.getByRole('combobox')).toBeVisible();
    await expect(page.getByRole('combobox')).toHaveValue('en');
    await expect(page.getByText('Home page', { exact: true })).toBeVisible();

    await expectVisualSnapshot(page, 'home-nav-en');
});

test('首页导航语言切换与中文状态视觉回归', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('select');
    await page.locator('select').selectOption('zh');
    await expect(page.getByText('德州扑克约局社区')).toBeVisible();

    await expectVisualSnapshot(page, 'home-nav-zh');
});

test('首页导航链接鼠标悬停视觉回归', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('select');
    await page.locator('select').selectOption('zh');
    await expect(page.getByText('德州扑克约局社区')).toBeVisible();

    const glossaryLink = page.getByRole('link', { name: /terminolog|术语/ });
    await expect(glossaryLink).toBeVisible();
    await expectVisualSnapshot(page, 'home-nav-hover', {
        hoverSelector: 'a[href$="glossary"]',
        fullPage: false,
    });
});

test('苹果商店弹窗视觉回归', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.getByAltText('ios_store').click();
    await expect(page.getByText('苹果商店下载')).toBeVisible();

    await expectVisualSnapshot(page, 'home-ios-modal-zh', { fullPage: false });
});
