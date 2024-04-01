import React from 'react';

const LanguageSelect = ({handleChange, currentLanguage = 'en'}) => (
    <select onChange={(value) => handleChange(value)} defaultValue={currentLanguage}>
        <option value='de'>Deutsch</option>
        <option value='en'>English</option>
        <option value='es'>Española</option>
        <option value='fr'>Français</option>
        <option value='ko'>한국어</option>
        <option value='it'>Italiano</option>
        <option value='ja'>日本語</option>
        <option value='ru'>Русский</option>
        <option value='zh'>中文</option>
    </select>
);

export default LanguageSelect;