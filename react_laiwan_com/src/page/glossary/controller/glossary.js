import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useLocalization } from '../../../localization/controller/localizationContext';

import FooterBar from '../view/FooterBar';
import GlossarySection from '../view/glossarySection';

import en from '../../../localization/locales/terminologies_en.json';
import zh from '../../../localization/locales/terminologies_zh.json';
import logo from '../image/logo.png';

import search from '../image/search.png';
import top from '../image/icon_to_top.png';

/* eslint-disable-next-line no-unused-vars */
import styles from './style/glossaryStyle.module.css';

const languages = {
    en,
    zh,
};

const Glossary = () => {
    const { formatMessage } = useIntl();
    const { getCurrentLocale } = useLocalization();
    const currentLocale = getCurrentLocale();

    const [mobileNavigationIsOpen, setMobileNavigationIsOpen] = useState(false);

    const [selectedLetter, setSelectedLetter] = useState('');
    const [searchText, setSearchText] = useState('');
    const [terms] = useState(JSON.parse(JSON.stringify(languages[currentLocale])));

    const getChars = (set) => {
        let lastChar = '';
        const charList = [];

        const loopForChars = (value) => {
            if (value.toString()[0].toUpperCase() !== lastChar) {
                lastChar = value.toString()[0].toUpperCase();
                charList.push(value.toString()[0].toUpperCase());
            }
        };

        Object.keys(set).forEach(loopForChars);
        return charList;
    };

    const chars = getChars(terms);

    const scrollDownToLetter = (letter) => {
        if (letter === '') {
            return;
        }
        setSelectedLetter(letter);
        if (document.getElementById(`group-${letter}`) !== null) {
            document.getElementById(`group-${letter}`).scrollIntoView();
        }
    };

    return (
        <div style={{margin: 'revert', padding: 'revert'}}>
            <div className={styles.navigationBar}>
                <div className={styles.logoContainer}>
                    <Link
                        className={styles.logoLink}
                        to="/"
                    >
                        <img src={logo} alt="laiwan" className={styles.logo}/>
                    </Link>
                </div>
                <div>
                    <input
                        className={styles.mobileSearch}
                        placeholder={formatMessage({ id: 'glossary_search' })}
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); }}
                    />
                </div>
                <div className={styles.navigationContainer}>
                    <Link to="/">
                        <div className={styles.navigationButton}>
                            <p>
                                {formatMessage({ id: 'navbar_home_page' })}
                            </p>
                        </div>
                    </Link>
                    <Link to="/glossary">
                        <div className={styles.navigationButton}>
                            <p>
                                {formatMessage({ id: 'navbar_terminology_list' })}
                            </p>
                        </div>
                    </Link>
                </div>
                <button
                    type="button"
                    className={mobileNavigationIsOpen
                        ? styles.navigationExpandButtonIsOpen
                        : styles.navigationExpandButton}
                    onClick={() => setMobileNavigationIsOpen(!mobileNavigationIsOpen)}
                    aria-label="Expand Navigation"
                >
                    <span className={styles.navigationExpandIcon}/>
                    <span className={styles.navigationExpandIcon}/>
                    <span className={styles.navigationExpandIcon}/>
                </button>
                <div
                    className={styles.navigationExpandMenu}
                    style={mobileNavigationIsOpen
                        ? {}
                        : { visibility: 'hidden', height: '0px' }}
                >
                    <Link to="/">
                        <div className={styles.navigationExpandMenuOption}>
                            <p>{formatMessage({ id: 'navbar_home_page' })}</p>
                        </div>
                    </Link>
                    <Link to="/glossary">
                        <div className={styles.navigationExpandMenuOption}>
                            <p>
                                {formatMessage({ id: 'navbar_terminology_list' })}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
            <div className={styles.topSpacing}/>
            <div className={styles.glossaryHeaderContainer}>
                <p className={styles.glossaryHeader}>
                    {formatMessage({ id: 'glossary_header' })}
                </p>
                <p className={styles.glossaryHeaderBody}>
                    {formatMessage({ id: 'glossary_text_1' })}
                </p>
                <p className={styles.glossaryHeaderBody}>
                    {formatMessage({ id: 'glossary_text_2' })}
                </p>
                <p className={styles.glossaryHeaderBody}>
                    {formatMessage({ id: 'glossary_text_3' })}
                </p>
            </div>
            <div className={styles.searchContainer}>
                <div>
                    <span className={styles.searchIconContainer}>
                        <img src={search} alt="search" className={styles.searchIcon}/>
                    </span>
                    <input
                        className={styles.searchBar}
                        placeholder={formatMessage({ id: 'glossary_search' })}
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); }}
                    />
                </div>
                <div className={styles.searchContainer2}>
                    <div className={styles.searchList}>
                        {
                            Object.values(chars).map((character) => (
                                <button
                                    type="button"
                                    key={`searchLetter-${character}`}
                                    className={styles.searchListItem}
                                    onClick={() => scrollDownToLetter(character)}
                                >
                                    {character}
                                </button>
                            ))
                        }
                    </div>
                </div>
            </div>
            <button
                className={styles.toTopButton}
                type="button"
                onClick={() => window.scrollTo(0, 0)}
                aria-label="To Top"
            >
                <img
                    className={styles.toTopIcon}
                    src={top}
                    alt="To Top"
                />
            </button>
            <GlossarySection
                selectedLetter={selectedLetter}
                searchText={searchText}
                getChars={getChars}
                terms={terms}
                locale={currentLocale}
                styles={styles}
            />
            <FooterBar/>
            <div>
                {
                    () => console.log(selectedLetter) // scrollDownToLetter(selectedLetter)
                }
            </div>
        </div>
    );
};

export default Glossary;
