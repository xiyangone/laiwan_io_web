import React, {
    createContext,
    useState,
    useContext,
} from 'react';
import { IntlProvider } from 'react-intl';

import en from '../locales/en.json';
import zh from '../locales/zh.json';

const messages = {
    en,
    zh,
};

export const LocalizationContext = createContext();

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider = ({ children }) => {
    const [locale, setLocale] = useState('en');

    const switchLocale = (newLocale) => setLocale(newLocale);

    const getCurrentLocale = () => locale;

    return (
        <LocalizationContext.Provider value={{ locale, switchLocale, getCurrentLocale }}>
            <IntlProvider locale={locale} messages={messages[locale]}>
                {children}
            </IntlProvider>
        </LocalizationContext.Provider>
    );
};
