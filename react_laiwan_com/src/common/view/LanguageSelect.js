import React from 'react';

const LanguageSelect = ({handleChange, currentLanguage = 'en'}) => (
    <select onChange={(value) => handleChange(value)} defaultValue={currentLanguage}>
        <option value='en'>English</option>
        <option value='zh'>中文</option>
    </select>
);

export default LanguageSelect;