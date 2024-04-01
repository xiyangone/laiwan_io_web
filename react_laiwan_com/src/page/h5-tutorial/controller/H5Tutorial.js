import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { useIntl } from 'react-intl';

import {
    h5_version_url_1 as H5VersionUrl1,
    h5_version_url_2 as h5VersionUrl2,
} from '../../../config.json';
import NavBar from '../../../common/view/NavBar';
import imgBannerH5 from '../image/img-banner-h5.png';
import imgTutorial1LaiwanLife from '../image/img-tutorials-1-1.png';
import imgTutorial1Laiwanpai from '../image/img-tutorials-1.png';
import imgTutorial2 from '../image/img-tutorials-2.png';
import imgTutorial3LaiwanLife from '../image/img-tutorials-3-1.png';
import imgTutorial3Laiwanpai from '../image/img-tutorials-3.png';
import imgTutorial4LaiwanLife from '../image/img-tutorials-4-1.png';
import imgTutorial4Laiwanpai from '../image/img-tutorials-4.png';
import imgTutorial5 from '../image/img-tutorials-5.png';
import styles from '../style/H5Tutorial.module.css';

const pageResourceMap = {
    // 生产环境下 h5.laiwan.life 的教程图片
    'laiwan-life': {
        H5URL: H5VersionUrl1,
        imgTutorial1: imgTutorial1LaiwanLife,
        imgTutorial3: imgTutorial3LaiwanLife,
        imgTutorial4: imgTutorial4LaiwanLife,
    },
    // 生产环境下 h5.laiwanpai.com 的教程图片
    'laiwanpai-com': {
        H5URL: h5VersionUrl2,
        imgTutorial1: imgTutorial1Laiwanpai,
        imgTutorial3: imgTutorial3Laiwanpai,
        imgTutorial4: imgTutorial4Laiwanpai,
    },
};

const H5Tutorial = () => {
    const { url } = useParams();
    const { formatMessage } = useIntl();

    const PageResource = useMemo(
        () => pageResourceMap[url] || pageResourceMap['laiwan-life'],
        [url]
    );

    return (
        <div className={styles.container}>
            <div className={styles.navbarContainer}>
                <NavBar className={styles.navbar} />
            </div>
            <div className={styles.main}>
                <img className={styles.banner} src={imgBannerH5} alt="横幅" />
                <div className={styles.section}>
                    <h2 className={styles.title}>
                        {formatMessage({ id: 'h5_what_is_h5_header' })}
                    </h2>
                    <p className={styles.content}>
                        {formatMessage({ id: 'h5_what_is_h5_body' })}
                    </p>
                </div>
                <div className={styles.section}>
                    <h2 className={styles.title}>
                        {formatMessage({ id: 'h5_link_header_one' })}
                        <span className={styles.purpleyBlueText}>
                            {formatMessage({ id: 'h5_link_header_two' })}
                        </span>
                        {formatMessage({ id: 'h5_link_header_three' })}
                    </h2>
                    <a
                        className={`${styles.content} ${styles.purpleyBlueText}`}
                        href={PageResource.H5URL}
                    >
                        {PageResource.H5URL}
                    </a>
                    <br />
                </div>
                <div className={styles.section}>
                    <h2 className={styles.title}>
                        {formatMessage({ id: 'h5_add_to_home_screen' })}
                    </h2>
                    <ol className={styles.tutorialList}>
                        <li>
                            <h3 className={styles.title}>
                                {formatMessage({ id: 'h5_step_one' })}
                            </h3>
                            <a
                                href={PageResource.H5URL}
                                className={styles.tutorial1Link}
                            >
                                {PageResource.H5URL}
                            </a>

                            <img
                                src={PageResource.imgTutorial1}
                                alt="教程图片1"
                            />
                        </li>
                        <li>
                            <h3 className={styles.title}>
                                {formatMessage({ id: 'h5_step_two' })}
                            </h3>
                            <img src={imgTutorial2} alt="教程图片2" />
                        </li>
                        <li>
                            <h3 className={styles.title}>
                                {formatMessage({ id: 'h5_step_three' })}
                            </h3>
                            <img
                                src={PageResource.imgTutorial3}
                                alt="教程图片3"
                            />
                        </li>
                        <li>
                            <h3 className={styles.title}>
                                {formatMessage({ id: 'h5_step_four' })}
                            </h3>
                            <img
                                src={PageResource.imgTutorial4}
                                alt="教程图片4"
                            />
                        </li>
                        <li>
                            <h3 className={styles.title}>
                                {formatMessage({ id: 'h5_step_five' })}
                            </h3>
                            <img src={imgTutorial5} alt="教程图片5" />
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default H5Tutorial;
