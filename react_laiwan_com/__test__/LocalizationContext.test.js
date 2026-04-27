import React from 'react';
import { render, screen } from '@testing-library/react';

import { LocalizationProvider, useLocalization, LocalizationContext } from '../src/localization/controller/localizationContext';

// Test component to consume context
const TestComponent = () => {
    const { locale, switchLocale, getCurrentLocale } = useLocalization();
    return (
        <div>
            <div data-testid="locale">{locale}</div>
            <div data-testid="current-locale">{getCurrentLocale()}</div>
            <button onClick={() => switchLocale('en')} data-testid="switch-to-en">Switch to EN</button>
            <button onClick={() => switchLocale('zh')} data-testid="switch-to-zh">Switch to ZH</button>
        </div>
    );
};

describe('LocalizationContext Component', () => {
    test('Provider 正确向下传递 locale 和 switchLocale', () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );
        
        expect(screen.getByTestId('locale')).toBeInTheDocument();
        expect(screen.getByTestId('current-locale')).toBeInTheDocument();
    });

    test('默认语言为中文（zh）', () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );
        
        expect(screen.getByTestId('locale')).toHaveTextContent('zh');
        expect(screen.getByTestId('current-locale')).toHaveTextContent('zh');
    });

    test('测试多语言切换后的状态更新 - 切换到英文', () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );
        
        const switchToEnButton = screen.getByTestId('switch-to-en');
        switchToEnButton.click();
        
        expect(screen.getByTestId('locale')).toHaveTextContent('en');
        expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
    });

    test('测试多语言切换后的状态更新 - 切换到中文', () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );
        
        // First switch to English
        const switchToEnButton = screen.getByTestId('switch-to-en');
        switchToEnButton.click();
        expect(screen.getByTestId('locale')).toHaveTextContent('en');
        
        // Then switch back to Chinese
        const switchToZhButton = screen.getByTestId('switch-to-zh');
        switchToZhButton.click();
        expect(screen.getByTestId('locale')).toHaveTextContent('zh');
        expect(screen.getByTestId('current-locale')).toHaveTextContent('zh');
    });

    test('验证多次切换语言状态正确更新', () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );
        
        const switchToEnButton = screen.getByTestId('switch-to-en');
        const switchToZhButton = screen.getByTestId('switch-to-zh');
        
        // Switch multiple times
        switchToEnButton.click();
        expect(screen.getByTestId('locale')).toHaveTextContent('en');
        
        switchToZhButton.click();
        expect(screen.getByTestId('locale')).toHaveTextContent('zh');
        
        switchToEnButton.click();
        expect(screen.getByTestId('locale')).toHaveTextContent('en');
        
        switchToZhButton.click();
        expect(screen.getByTestId('locale')).toHaveTextContent('zh');
        
        switchToEnButton.click();
        expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });

    test('验证 Context 值包含所有必要的属性和方法', () => {
        const ContextConsumer = () => {
            const context = React.useContext(LocalizationContext);
            return (
                <div>
                    <div data-testid="has-locale">{context.locale !== undefined ? 'yes' : 'no'}</div>
                    <div data-testid="has-switchLocale">{typeof context.switchLocale === 'function' ? 'yes' : 'no'}</div>
                    <div data-testid="has-getCurrentLocale">{typeof context.getCurrentLocale === 'function' ? 'yes' : 'no'}</div>
                </div>
            );
        };
        
        render(
            <LocalizationProvider>
                <ContextConsumer />
            </LocalizationProvider>
        );
        
        expect(screen.getByTestId('has-locale')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-switchLocale')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-getCurrentLocale')).toHaveTextContent('yes');
    });

    test('switchLocale 是函数类型', () => {
        const ContextConsumer = () => {
            const { switchLocale } = useLocalization();
            return <div data-testid="switchLocale-type">{typeof switchLocale}</div>;
        };
        
        render(
            <LocalizationProvider>
                <ContextConsumer />
            </LocalizationProvider>
        );
        
        expect(screen.getByTestId('switchLocale-type')).toHaveTextContent('function');
    });

    test('getCurrentLocale 返回当前语言', () => {
        const ContextConsumer = () => {
            const { getCurrentLocale, switchLocale } = useLocalization();
            return (
                <div>
                    <div data-testid="initial-locale">{getCurrentLocale()}</div>
                    <button 
                        onClick={() => switchLocale('en')} 
                        data-testid="switch-btn"
                    >
                        Switch
                    </button>
                    <div data-testid="current-locale-after-switch">{getCurrentLocale()}</div>
                </div>
            );
        };
        
        render(
            <LocalizationProvider>
                <ContextConsumer />
            </LocalizationProvider>
        );
        
        // Check initial locale
        expect(screen.getByTestId('initial-locale')).toHaveTextContent('zh');
        expect(screen.getByTestId('current-locale-after-switch')).toHaveTextContent('zh');
        
        // Switch to English
        const switchBtn = screen.getByTestId('switch-btn');
        switchBtn.click();
        
        // After switching, both should show 'en'
        expect(screen.getByTestId('initial-locale')).toHaveTextContent('en');
        expect(screen.getByTestId('current-locale-after-switch')).toHaveTextContent('en');
    });

    test('Provider 可以包裹子组件', () => {
        const ChildComponent = () => <div data-testid="child">Child Component</div>;
        
        render(
            <LocalizationProvider>
                <ChildComponent />
            </LocalizationProvider>
        );
        
        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByTestId('child')).toHaveTextContent('Child Component');
    });

    test('IntlProvider 正确配置', () => {
        const ContextConsumer = () => {
            const { locale } = useLocalization();
            return <div data-testid="intl-locale">{locale}</div>;
        };
        
        render(
            <LocalizationProvider>
                <ContextConsumer />
            </LocalizationProvider>
        );
        
        expect(screen.getByTestId('intl-locale')).toBeInTheDocument();
    });
});
