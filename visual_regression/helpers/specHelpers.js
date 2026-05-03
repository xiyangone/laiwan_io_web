const { expect } = require('@playwright/test');
const { stabilizePage } = require('./pageStabilize');
const {
    captureTimestampedScreenshotBuffer,
    saveSnapshotDiffFromBuffer,
} = require('./screenshotIO');

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

module.exports = {
    expectVisualSnapshot,
    setLanguageCookie,
    waitForRouteReady,
};
