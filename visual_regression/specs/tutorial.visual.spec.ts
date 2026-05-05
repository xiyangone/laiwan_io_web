import { test, expect } from '@playwright/test';
import {
    匹配视觉截图,
    设置页面语言,
    等待页面路由稳定,
} from '../helpers/visualHelpers';

test('苹果下载教程页视觉回归', async ({ page }) => {
    await 设置页面语言(page, 'zh');
    await page.goto('/#/tutorial/');
    await 等待页面路由稳定(page);
    await expect(page.getByText('一、注册一个新的AppleID并下载来玩:', { exact: true })).toBeVisible();

    await 匹配视觉截图(page, 'tutorial-page');
});
