import { test, expect } from '@playwright/test';
import {
    expectVisualSnapshot,
    setLanguageCookie,
    waitForRouteReady,
} from '../helpers/visualHelpers';
import config from '../../react_laiwan_com/src/config.json';

const {
    h5_version_url_1: h5VersionUrl1,
    h5_version_url_2: h5VersionUrl2,
} = config;

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
