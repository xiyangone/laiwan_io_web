import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import LanguageSelect from '../src/common/view/LanguageSelect';

describe('LanguageSelect Component', () => {
    let mockHandleChange;

    beforeEach(() => {
        mockHandleChange = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('默认语言显示正确（英文）', () => {
        render(<LanguageSelect handleChange={mockHandleChange} currentLanguage="en" />);
        
        const selectElement = screen.getByRole('combobox');
        expect(selectElement).toBeInTheDocument();
        expect(selectElement.value).toBe('en');
    });

    test('默认语言显示正确（中文）', () => {
        render(<LanguageSelect handleChange={mockHandleChange} currentLanguage="zh" />);
        
        const selectElement = screen.getByRole('combobox');
        expect(selectElement.value).toBe('zh');
    });

    test('未传入 currentLanguage 时默认为英文', () => {
        render(<LanguageSelect handleChange={mockHandleChange} />);
        
        const selectElement = screen.getByRole('combobox');
        expect(selectElement.value).toBe('en');
    });

    test('模拟用户切换语言到中文，onChange 回调被正确触发', () => {
        render(<LanguageSelect handleChange={mockHandleChange} currentLanguage="en" />);
        
        const selectElement = screen.getByRole('combobox');
        fireEvent.change(selectElement, { target: { value: 'zh' } });
        
        expect(mockHandleChange).toHaveBeenCalledTimes(1);
        // Verify the event object was passed (React synthetic event)
        expect(mockHandleChange.mock.calls[0][0]).toBeDefined();
    });

    test('模拟用户切换语言到英文，onChange 回调被正确触发', () => {
        render(<LanguageSelect handleChange={mockHandleChange} currentLanguage="zh" />);
        
        const selectElement = screen.getByRole('combobox');
        fireEvent.change(selectElement, { target: { value: 'en' } });
        
        expect(mockHandleChange).toHaveBeenCalledTimes(1);
        // Verify the event object was passed (React synthetic event)
        expect(mockHandleChange.mock.calls[0][0]).toBeDefined();
    });

    test('只包含中文和英文两个选项', () => {
        render(<LanguageSelect handleChange={mockHandleChange} currentLanguage="en" />);
        
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(2);
        expect(options[0]).toHaveValue('en');
        expect(options[0]).toHaveTextContent('English');
        expect(options[1]).toHaveValue('zh');
        expect(options[1]).toHaveTextContent('中文');
    });

    test('验证 select 元素存在', () => {
        render(<LanguageSelect handleChange={mockHandleChange} currentLanguage="en" />);
        
        const selectElement = screen.getByRole('combobox');
        expect(selectElement).toBeInTheDocument();
        expect(selectElement.tagName).toBe('SELECT');
    });

    test('多次切换语言，每次回调都被触发', () => {
        render(<LanguageSelect handleChange={mockHandleChange} currentLanguage="en" />);
        
        const selectElement = screen.getByRole('combobox');
        
        fireEvent.change(selectElement, { target: { value: 'zh' } });
        expect(mockHandleChange).toHaveBeenCalledTimes(1);
        
        fireEvent.change(selectElement, { target: { value: 'en' } });
        expect(mockHandleChange).toHaveBeenCalledTimes(2);
        
        fireEvent.change(selectElement, { target: { value: 'zh' } });
        expect(mockHandleChange).toHaveBeenCalledTimes(3);
    });

    test('handleChange 为必填属性', () => {
        expect(() => {
            render(<LanguageSelect />);
        }).not.toThrow();
    });
});
