const { expect } = require('@playwright/test');
const { stabilizePage } = require('./pageStabilize');

async function setLanguageCookie(page, locale) {
    await page.goto('/#/');
    await page.evaluate((language) => {
        document.cookie = `language=${language}; path=/`;
    }, locale);
}

async function waitForRouteReady(page) {
    await page.waitForLoadState('domcontentloaded');
}

async function expectVisualSnapshot(page, snapshotName, options = {}) {
    await stabilizePage(page);
    await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
        fullPage: true,
        ...options,
    });
}

module.exports = {
    expectVisualSnapshot,
    setLanguageCookie,
    waitForRouteReady,
};
