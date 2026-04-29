import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Cookies from 'js-cookie';
import styles from '../style/HomeScreen.module.css';
import phoneScreenshot from '../image/img-phone.png';
import h5Version1 from '../image/btn-h-5-blue-empty.png';
import h5Version2 from '../image/btn-h-5-green-empty.png';
import h5Tutorial1 from '../image/btn-phone-home-blue-empty.png';
import h5Tutorial2 from '../image/btn-phone-home-green-empty.png';
import NavBar from '../../../common/view/NavBar';
import { googleStoreLink } from '../../../constant/Constant';
import {
    h5_version_url_1 as h5VersionUrl1,
    h5_version_url_2 as h5VersionUrl2,
    android_download_url as androidDownloadUrl,
} from '../../../config.json';
import DownloadModalForIOS from '../view/DownloadIOSModal';
import Qrcode from '../../../view/Qrcode';
import getLocalDownloadVersion from '../../../utils/getLocalDownloadVersion';
import { useLocalization } from '../../../localization/controller/localizationContext';
import LanguageSelect from '../../../common/view/LanguageSelect';
import DownloadButtonIcon from '../view/DownloadButtonIcon';
import googleDownload from '../image/logo_google_play.png';
import localDownload from '../image/logo_local_download.png';
import newsIcon from '../image/logo_news.png';

import phoneScreenshotZh from '../image/zh/img-phone.png';
import phoneScreenshotEn from '../image/en/img-phone.png';

const HomeScreen = () => {
    const { formatMessage } = useIntl();
    const { switchLocale } = useLocalization();
    const [localDownloadUrl, setLocalDownloadUrl] = useState('');
    const [qrcodeDownloadUrl, setQrcodeDownloadUrl] = useState('')
    const { getCurrentLocale } = useLocalization();
    const currentLocale = getCurrentLocale();

    let phoneImage = null;

    const changeScreenshotLocale = () => {
        switch (currentLocale) {
            case 'zh':
                phoneImage = phoneScreenshotZh;
                break;
            case 'en':
                phoneImage = phoneScreenshotEn;
                break;
            default:
                phoneImage = phoneScreenshot;
                break;
        }
    }

    changeScreenshotLocale();

    const setLocale = (locale) => {
        Cookies.set('language', locale, { expires: 365, SameSite: 'strict' });
        switchLocale(locale);
    }

    const handleLanguageChange = (event) => {
        setLocale(event.target.value);
    };

    const getLocaleCookie = () => {
        const savedLanguage = Cookies.get('language');
        if (savedLanguage) {
            return savedLanguage;
        }
        return 'zh';
    }

    useEffect(() => {
        fetch(androidDownloadUrl, { cache: 'no-cache' })
            .then((response) => response.json())
            .then(({ apk_files: apkFiles }) => {
                const url = `https://${window.location.hostname}/apk/${apkFiles[0]}`;
                setLocalDownloadUrl(url);
                setQrcodeDownloadUrl(url);
                // TODO: 缺少错误反馈，之后加
            })
            .catch((error) => {
                console.log(`error .meesage :: ${error.message}`);
            });

        const savedLanguage = Cookies.get('language');
        if (savedLanguage) {
            setLocale(savedLanguage);
        }
        else {
            setLocale('zh');
        }

        document.title = formatMessage({ id: 'laiwan' });
    }, []);

    useEffect(() => {
        document.title = formatMessage({ id: 'laiwan' });
        changeScreenshotLocale();
    }, [currentLocale]);

    return (
        <div className={styles.background}>
            <div className={styles.container}>
                <NavBar />
                <div className={styles.navList}>
                    <div className={styles.language} >
                        <LanguageSelect handleChange={handleLanguageChange} currentLanguage={getLocaleCookie()}/>
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.screenshotContainer}>
                        <div className={styles.circle} />
                        <div className={`${styles.circle} ${styles.second}`} />
                        <div className={`${styles.circle} ${styles.third}`} />
                        <img
                            className={styles.screenshot}
                            src={phoneImage}
                            alt="应用截图"
                        />
                    </div>
                    <div className={styles.infoContent}>
                        <div className={styles.NewsContainer}>
                            <img
                                className={styles.NewsIcon}
                                src={newsIcon}
                                alt="H5 版上线"
                            />
                            <div className={styles.NewsBoxTrailTitle}>
                                <div className={styles.NewsBoxTitle}>
                                    <div className={styles.NewsTextContainerTitle}>
                                        <p className={styles.NewsText}>
                                            {formatMessage({ id: 'home_page_news_title' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.NewsBoxTrail} style={{zIndex: 0, marginTop: '-1px'}}>
                                <div className={styles.NewsBox}>
                                    <div className={styles.NewsTextContainer}>
                                        <p className={styles.NewsText}>
                                            {formatMessage({ id: 'home_page_news_subtitle' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.title}>
                            <span className={styles.titleBadge}>
                                {formatMessage({ id: 'home_page_game_community' })}
                            </span>
                        </div>
                        <div className={styles.subtitle}>{formatMessage({ id: 'home_page_lets_play' })}</div>
                        <div className={styles.downloadMethod}>
                            <div className={styles.tutorialContainer}>
                                <a href={h5VersionUrl1}>
                                    <div className={styles.buttonContainer}>
                                        <img
                                            className={styles.h5Button}
                                            src={h5Version1}
                                            alt="H5 版本一"
                                        />
                                        <div className={styles.buttonTextContainer}>
                                            {currentLocale === 'zh' ? (
                                                <p
                                                    className={styles.buttonTitleText}
                                                    style={{letterSpacing:'0.5rem', fontSize: '1.7rem'}}
                                                >
                                                    {formatMessage({ id: 'home_page_web_link_title' })}
                                                </p>
                                            ) : (
                                                <p
                                                    className={styles.buttonTitleText}
                                                    style={{lineHeight: '1.2rem'}}
                                                >
                                                    {formatMessage({ id: 'home_page_web_link_title' })}
                                                </p>
                                            )}
                                            <p className={styles.buttonSubtitleText}>
                                                {formatMessage({ id: 'home_page_web_link_subtitle' })}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                                <Link
                                    className={styles.h5Tutorual}
                                    to="/h5-tutorial/laiwan-life"
                                >
                                    <div className={styles.buttonContainer}>
                                        <img
                                            className={styles.h5TutorualImage}
                                            src={h5Tutorial1}
                                            alt="如何添加到桌面"
                                        />
                                        <div className={styles.buttonTutorialTextContainer}>
                                            {currentLocale === 'zh' ? (
                                                <p
                                                    className={styles.buttonTutorialText_blue}
                                                    style={{letterSpacing:'0.2rem', fontSize: '1rem'}}
                                                >
                                                    {formatMessage({ id: 'home_page_web_to_mobile' })}
                                                </p>
                                            ) : (
                                                <p
                                                    className={styles.buttonTutorialText_blue}
                                                    style={{letterSpacing:'-0.06rem', lineHeight: '1.2rem'}}
                                                >
                                                    {formatMessage({ id: 'home_page_web_to_mobile' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            <div className={styles.tutorialContainer}>
                                <a href={h5VersionUrl2}>
                                    <div className={styles.buttonContainer}>
                                        <img
                                            className={styles.h5Button}
                                            src={h5Version2}
                                            alt="H5 版本一"
                                        />
                                        <div className={styles.buttonTextContainer}>
                                            {currentLocale === 'zh' ? (
                                                <p
                                                    className={styles.buttonTitleText}
                                                    style={{letterSpacing:'0.4rem', fontSize: '1.7rem'}}
                                                >
                                                    {formatMessage({ id: 'home_page_web_link_title' })}
                                                </p>
                                            ) : (
                                                <p
                                                    className={styles.buttonTitleText} 
                                                    style={{lineHeight: '1.2rem'}}
                                                >
                                                    {formatMessage({ id: 'home_page_web_link_title' })}
                                                </p>
                                            )}
                                            <p className={styles.buttonSubtitleText}>
                                                {formatMessage({ id: 'home_page_web_link_subtitle' })}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                                <Link
                                    className={styles.h5Tutorual}
                                    to="/h5-tutorial/laiwanpai-com"
                                >
                                    <div className={styles.buttonContainer}>
                                        <img
                                            className={styles.h5TutorualImage}
                                            src={h5Tutorial2}
                                            alt="如何添加到桌面"
                                        />
                                        <div className={styles.buttonTutorialTextContainer}>
                                            {currentLocale === 'zh' ? (
                                                <p
                                                    className={styles.buttonTutorialText_green}
                                                    style={{letterSpacing:'0.2rem', fontSize: '1rem'}}
                                                >
                                                    {formatMessage({ id: 'home_page_web_to_mobile' })}
                                                </p>
                                            ) : (
                                                <p
                                                    className={styles.buttonTutorialText_green}
                                                    style={{letterSpacing:'-0.06rem', lineHeight: '1.2rem'}}
                                                >
                                                    {formatMessage({ id: 'home_page_web_to_mobile' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                        <div className={styles.downloadMethod}>
                            <DownloadModalForIOS />
                            <div>
                                <DownloadButtonIcon
                                    href={googleStoreLink}
                                    title={formatMessage({ id: 'home_page_google_link_title'})}
                                    subtitle={formatMessage({ id: 'home_page_google_link_subtitle'})}
                                    icon={googleDownload}
                                    iconAlt="谷歌下载"
                                />
                            </div>
                            <div className={styles.localContainer}>
                                <div>
                                    <DownloadButtonIcon
                                        href={localDownloadUrl}
                                        title={formatMessage({ id: 'home_page_local_download_link_title'})}
                                        subtitle={formatMessage({ id: 'home_page_local_download_link_subtitle'})}
                                        icon={localDownload}
                                        iconAlt="本地下载"
                                    />
                                </div>
                            </div>
                        </div>
                        <span>
                            {`${formatMessage({ id: 'home_page_version' })}` +
                            `: ${getLocalDownloadVersion(localDownloadUrl)}`}
                        </span>
                    </div>
                    <div className={styles.qrcodeContainer}>
                        <Qrcode downloadUrl={qrcodeDownloadUrl} />
                        <div className={styles.qrcodeText}>{formatMessage({ id: 'home_page_qr_scan' })}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
