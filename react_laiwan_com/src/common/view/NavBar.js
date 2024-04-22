import React from 'react';
import { useIntl } from 'react-intl';
import styles from '../style/NavBar.module.css';
import logo from '../../source/logo.png';

const NavBar = ({ className = '' }) => {
    const { formatMessage } = useIntl();
    return (
        <div className={`${styles.container} ${className}`}>
            <div className={styles.logoContainer}>
                <img className={styles.logoImage} src={logo} alt="logo" />
                <h2 className={styles.logoText}>{formatMessage({ id: 'navbar_come_play' })}</h2>
            </div>
            <div className={styles.navList}>
                <a className={styles.navItem} href="/">{formatMessage({ id: 'navbar_home_page' })}</a>
                <a className={styles.navItem} href="/#/glossary">{formatMessage({ id: 'navbar_terminology_list' })}</a>
            </div>
        </div>
    );
}

export default NavBar;
