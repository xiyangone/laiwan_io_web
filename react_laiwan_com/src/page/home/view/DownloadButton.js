import React from 'react'
import styles from '../style/HomeScreen.module.css'
import {useLocalization} from '../../../localization/controller/localizationContext';

const DownloadButton = ({ href, title, subtitle, icon }) => {
    const { getCurrentLocale } = useLocalization();
    const currentLocale = getCurrentLocale();
    return (
        <a href={href}>
            <div
                className={styles.downloadButton}
            >{icon &&
            <img src={icon} alt={ title } />}
                <div className={currentLocale === 'jp' ? styles.buttonTextJP : styles.buttonText}>
                    {currentLocale === 'zh' ? (
                        <div>
                            <div style={{color:'white',fontSize:'1.6rem',letterSpacing:'0.5rem'}}>{ title }</div>
                            <div style={{ color: 'white',fontSize:'0.8rem',letterSpacing:'0.3rem' }}>{ subtitle }</div>
                        </div>
                    ) : (
                        <div>
                            <div style={{color:'white',fontSize:'1.2rem'}}>{ title }</div>
                            <div style={{ color: 'white',fontSize:'0.8rem',letterSpacing:'0.05rem' }}>{ subtitle }</div>
                        </div>
                    )}
                </div>
            </div>
        </a>
    );
}
export default DownloadButton