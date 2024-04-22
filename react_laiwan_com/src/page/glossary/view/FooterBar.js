import React from 'react';
import { useIntl } from 'react-intl';
import logo from '../image/logo.png';
import styles from './style/FooterBarStyle.module.css';

const FooterBar = () => {
    const { formatMessage } = useIntl();

    return (
        <footer>
            <div className={styles.footerBar}>
                <div className={styles.footerLogoContainer}>
                    <img src={logo} alt="laiwan" className={styles.footerLogo}/>
                    <p className={styles.footerCopyright}>{ formatMessage({ id: 'copyright' }) }</p>
                </div>
            </div>
        </footer>
    );
};

export default FooterBar;
