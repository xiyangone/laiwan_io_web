/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import { Link } from 'react-router-dom';
import { iosStoreLink } from '../../../constant/Constant';
import close from '../../../view/image/icon_close.png';
import NavigatorJudge from '../../../utils/navigatorJudge';
import BTN_APPLE_DOWNLOAD from '../image/btn-apple-download-empty.png';
import BTN_TUTORIAL from '../image/btn-tutorial-empty.png';
import ICON_PROMPT from '../image/img-prompt.png';
import apple from '../image/logo_apple.png';
import styles from '../style/HomeScreen.module.css';
import { useLocalization } from '../../../localization/controller/localizationContext';

const useStyles = makeStyles((theme) => ({
    paper: {
        width: 750,
        height: 500,
        backgroundColor: 'white',
        border: '2px solid white',
        borderRadius: '30px',
        boxShadow: theme.shadows[5],
        display: 'flex',
        justifyContent: 'space-around',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
    },
    title: {
        fontSize: '20px',
        textAlign: 'center',
        color: '#333333',
        width: '90%',
    },
    titleZh: {
        fontSize: '24px',
        textAlign: 'center',
        letterSpacing: '2.4px',
        color: '#333333',
        width: '90%',
    },
    modal: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: '10px',
        color: 'red',
        letterSpacing: '1.8px',
        textAlign: 'center',
    },
    linkButton: {
        backgroundColor: 'RoyalBlue',
        width: NavigatorJudge.isMobile() ? 90 : 100,
        height: NavigatorJudge.isMobile() ? 30 : 40,
        border: '2px solid RoyalBlue',
        borderRadius: '0.2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadTitle: {
        fontSize: NavigatorJudge.isMobile() ? '7px' : '10px',
        color: 'white',
    },
    logo: {
        width: '71px',
        height: '58px',
    },
    close: {
        position: 'absolute',
        right: '15px',
        top: '15px',
    },
    downloadImage: {
        width: '17.5rem',
        height: ' 4.87rem',
    },
    prompt: {
        marginTop: '30px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    promptText: {
        fontSize: '20px',
        color: '#ff4444',
        marginLeft: '10px',
        textAlign: 'center',
        letterSpacing: -0.7,
        width: '70%',
    },
    promptTextZh: {
        fontSize: '26px',
        color: '#ff4444',
        marginLeft: '10px',
        textAlign: 'center',
        width: '90%',
    },
    downlowdButton: {
        width: '300px',
        height: '100px',
    },
    appleButtonContainer: {
        position: 'relative',
        display: 'inline-block',
    },
    appleButtonTextContainer: {
        position: 'absolute',
        top: '5%',
        left: '20%',
        width: '70%',
        height: '80%',
        display: 'flex',
        alignItems: 'center',
    },
    appleButtonText: {
        display: 'flex',
        position: 'relative',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        margin: 'revert',
        fontSize: '16pt',
        width: '100%',
    },
}));

export default function IOSDownloadModal() {
    const { formatMessage } = useIntl();
    const { getCurrentLocale } = useLocalization();
    const currentLocale = getCurrentLocale();
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const body = (
        <div className={classes.paper}>
            <img src={close} alt="close" className={classes.close} onClick={handleClose} onKeyDown={handleClose} />
            <div className={classes.prompt}>
                <img src={ICON_PROMPT} alt="logo" className={classes.logo} />
                <p
                    className={currentLocale === 'zh'
                        ? classes.promptTextZh
                        : classes.promptText
                    }
                >{formatMessage({ id: 'home_page_apple_china_unavailable' })}</p>
            </div>
            <p 
                className={currentLocale === 'zh'
                    ? classes.titleZh
                    : classes.title
                }
            >
                {formatMessage({ id: 'home_page_apple_id' })}
            </p>
            <a href={iosStoreLink}>
                <div className={classes.appleButtonContainer}>
                    <img className={classes.downlowdButton} src={BTN_APPLE_DOWNLOAD} alt="iosToreLink" />
                    <div className={classes.appleButtonTextContainer}>
                        <p
                            className={classes.appleButtonText}
                        >
                            {formatMessage({ id: 'home_page_apple_button_download'})}
                        </p>
                    </div>
                </div>
            </a>
            <p
                className={currentLocale === 'zh'
                    ? classes.titleZh
                    : classes.title
                }
            >
                {formatMessage({ id: 'home_page_apple_tutorial' })}
            </p>
            <Link to="tutorial">
                <div className={classes.appleButtonContainer}>
                    <img className={classes.downlowdButton} src={BTN_TUTORIAL} alt="tutorial" />
                    <div className={classes.appleButtonTextContainer}>
                        <p
                            className={classes.appleButtonText}
                        >
                            {formatMessage({ id: 'home_page_apple_button_tutorial'})}
                        </p>
                    </div>
                </div>
            </Link>
        </div>
    );

    return (
        <div>
            <div
                className={styles.downloadButton}
            >
                <div
                    className={styles.buttonIconContainer} 
                    style={{textAlign:'center'}}
                    onClick={handleOpen}
                    role="presentation"
                    onKeyDown={handleOpen}
                >
                    <img
                        className={styles.buttonIcon}
                        src={apple}
                        alt="ios_store"
                    />
                    <div className={currentLocale === 'jp' ? styles.buttonIconTextJP : styles.buttonIconText}>
                        {currentLocale === 'zh' ? (
                            <div>
                                <div
                                    style={{color:'white',fontSize:'1.6rem',letterSpacing:'0.5rem'}}
                                >
                                    { formatMessage({ id: 'home_page_apple_link_title' }) }
                                </div>
                                <div style={{ color: 'white',fontSize:'0.8rem',letterSpacing:'0.3rem' }}>
                                    { formatMessage({ id: 'home_page_apple_link_subtitle' }) }
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div
                                    style={{color:'white',fontSize:'1.2rem'}}
                                >
                                    { formatMessage({ id: 'home_page_apple_link_title' }) }
                                </div>
                                <div style={{ color: 'white',fontSize:'0.8rem',letterSpacing:'0.05rem'  }}>
                                    { formatMessage({ id: 'home_page_apple_link_subtitle' }) }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Modal
                open={open}
                onClose={handleClose}
                className={classes.modal}
            >
                {body}
            </Modal>
        </div>
    );
}
