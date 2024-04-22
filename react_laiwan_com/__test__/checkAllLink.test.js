import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import 'cross-fetch/polyfill';

import { LocalizationProvider } from '../src/localization/controller/localizationContext';
import HomeScreen from '../src/page/home/controller/HomeScreen';
import H5Tutorial from '../src/page/h5-tutorial/controller/H5Tutorial';
import Glossary from '../src/page/glossary/controller/glossary';
import Tutorial from '../src/Tutorial';

const STAGING_DOMAIN = 'shafayouxi.org';

const mockResponse = {
    ok: true,
    result: {
        cdn_download_url:
            'https://app.production.laiwan.shafayouxi.com/android/\u6765\u73a9-2207221841.apk',
        config: {},
        download_url:
            'https://app-qrcode-production.oss-accelerate.aliyuncs.com/android/\u6765\u73a9-2207221841.apk',
        id: 'com.ac.laiwan/2207221841/android',
        is_publish: true,
        md5: 'd67f127b1707e9c06e22abb87a9737a7',
        must_update: false,
        package_id: 'com.ac.laiwan',
        platform: 'android',
        version: '2207221841',
        version_description: '\u6700\u65b0\u7248\u672c',
    },
};

const componentWithRouter = (Component) => (
    <BrowserRouter>{Component}</BrowserRouter>
);

describe('链接测试', () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
    });

    window.history.pushState({}, '', `http://localhost/tutorial/`);

    afterAll(() => {
        cleanup();
        jest.restoreAllMocks();
    });

    test('所有可点击链接，不包含staging服务器', async () => {
        const { container } = render(
            componentWithRouter(
                <LocalizationProvider>
                    <HomeScreen />
                    <H5Tutorial />
                    <Tutorial />
                    <Glossary />
                </LocalizationProvider>
            )
        );
        const allATagElements = await waitFor(() =>
            Array.from(container.querySelectorAll('a'))
        );
        const allClickAbleLink = allATagElements.map((_) => _.href);

        expect(allClickAbleLink.find((_) => _.includes(STAGING_DOMAIN))).toBe(
            undefined
        );
    });
});
