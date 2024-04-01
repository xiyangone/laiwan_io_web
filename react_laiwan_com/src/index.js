import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { LocalizationProvider } from './localization/controller/localizationContext';

ReactDOM.render(
    <LocalizationProvider >
        <App />
    </LocalizationProvider >
    , document.getElementById('laiwan'));
