import React, {
    createContext,
    useState,
    useContext,
} from 'react';
import { IntlProvider } from 'react-intl';

import en from '../locales/en.json';
import zh from '../locales/zh.json';
import ja from '../locales/ja.json';
import ru from '../locales/ru.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import it from '../locales/it.json';
import ko from '../locales/ko.json';

const messages = {
    en,
    zh,
    ja,
    ru,
    de,
    es,
    fr,
    it,
    ko,
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
