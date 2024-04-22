import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import FooterBar from '../view/FooterBar';

import en from '../../../localization/locales/terminologies_en.json';
import zh from '../../../localization/locales/terminologies_zh.json';

import logo from '../image/logo.png';

import styles from './style/definitionStyles.module.css';

const languages = {
    en,
    zh,
};

const Definition = () => {
    const { formatMessage } = useIntl();
    const { term, locale } = useParams();

    const list = JSON.parse(JSON.stringify(languages[locale]));

    const [mobileNavigationIsOpen, setMobileNavigationIsOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div>
            <div className={styles.navigationBar}>
                <div className={styles.logoContainer}>
                    <Link
                        className={styles.logoLink}
                        to="/"
                    >
                        <img src={logo} alt="laiwan" className={styles.logo}/>
                    </Link>
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
            <div className={styles.definitionContent}>
                <div className={styles.headerContainer}>
                    <p className={styles.headerStyle}>{list[term].name}</p>
                </div>
                <div className={styles.goBackContainer}>
                    <Link to="/glossary">
                        <p className={styles.goBack}>{formatMessage({ id: 'glossary_go_back' })}</p>
                    </Link>
                </div>
                {list[term].definition !== undefined
                    ? (
                        <div>
                            {Object.entries(list[term].definition).map(([key, value]) => (
                                <div key={key}>
                                    <p
                                        className={styles.headerStyle}
                                        key={`h-${key}`}
                                    >
                                        {value.header}
                                    </p>
                                    <div key={`p-${key}`}>
                                        <div
                                            className={styles.bodyTextContainer}
                                            key={`d-${key}`}
                                        >
                                            {Object.entries(value.body).map(([key2, value2]) => (
                                                <p
                                                    className={styles.bodyTextStyle}
                                                    key={`p-${key2}`}
                                                >
                                                    {value2}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                    : (<div/>) }
            </div>
            <FooterBar/>
        </div>
    );
};

export default Definition;
