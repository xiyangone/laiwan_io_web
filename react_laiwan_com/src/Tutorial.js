import React, { Component } from 'react';
import { injectIntl, FormattedMessage, IntlProvider } from 'react-intl';
import './view/style/tutorial.css';
import TemporaryDrawer from './TemporaryDrawer';
import logo from './source/logo.png';
import NavigatorJudge from './utils/navigatorJudge';
import createAppleIDImage from './md/source/create_apple_id.png';
import checkAppleIDImage from './md/source/img_web_two.png';
import nextPageImage from './md/source/img_web_three.png';
import editImage from './md/source/img_web_four.png';
import replaceCountryImage from './md/source/img_web_five.png';
import payWayImage from './md/source/img_web_six.png';
import searchLaiWanImage from './md/source/img_web_seven.png';
import h5Version1 from './page/home/image/btn-h-5-blue.png';
import h5Version2 from './page/home/image/btn-h-5-green.png';
import {
    h5_version_url_1 as h5VersionUrl1,
    h5_version_url_2 as h5VersionUrl2,
} from './config.json';
import LanguageSelect from './common/view/LanguageSelect';
import { LocalizationContext } from './localization/controller/localizationContext';

import en from './localization/locales/en.json';
import zh from './localization/locales/zh.json';

const messages = {
    en,
    zh,
};

class Tutorial extends Component {
    constructor(props) {
        super(props);
        this.state = {
            show: false,
        };
    }
    
    componentDidMount() {
        if (document.location.toString().indexOf('tutorial/') === -1) {
            document.location.href += '/';
            document.location.reload();
            return;
        }
        this.setState({ show: true });
    }

    _renderPcNavigator = () => (
        <div className="tutorial_navigation_bar">
            <div className="row_center">
                <a href="/" label="laiwan">
                    <img src={logo} className="tutorial_logo" alt="logo" />
                </a>
                <a href="/" label="laiwan">
                    <p className="tutorial_nav_title">
                        <FormattedMessage
                            id="laiwan"
                            defaultMessage="来玩"
                        />
                    </p>
                </a>
            </div>
            <div className="row_center">
                <a href="/">
                    <p className="tutorial_nav_subtitle">
                        <FormattedMessage
                            id="navbar_home_page"
                            defaultMessage="首页"
                        />
                    </p>
                </a>
                <a href="/glossary">
                    <p className="tutorial_nav_subtitle">
                        <FormattedMessage
                            id="navbar_terminology_list"
                            defaultMessage="德州扑克术语表"
                        />
                    </p>
                </a>
            </div>
        </div>
    );
    
    render() {
        const { show } = this.state;
        const { switchLocale, locale, getCurrentLocale } = this.context;

        if (!show) {
            return <div />;
        }

        const handleLanguageChange = (event) => {
            switchLocale(event.target.value);
        };

        return (
            <LocalizationContext.Provider value={{ locale, switchLocale, getCurrentLocale }}>
                <IntlProvider locale={locale} messages={messages[locale]}>
                    <div>
                        {NavigatorJudge.isMobile() ? (
                            <TemporaryDrawer className="temporary_drawer" />
                        ) : (
                            this._renderPcNavigator()
                        )}
                        <div className="tutorial_content">
                            <div>
                                <div>
                                    <LanguageSelect handleChange={handleLanguageChange} />
                                </div>
                            </div>
                            <div className="tutorial_container">
                                <p className="can_not_download_text">
                                    &nbsp;&nbsp;&nbsp;&nbsp;
                                    <FormattedMessage
                                        id="apple_tutorial_china_accounts_unable"
                                        defaultMessage="apple_tutorial_china_accounts_unable"
                                    />
                                    <br />
                                    <br />
                                    <FormattedMessage
                                        id="apple_tutorial_web_address"
                                        defaultMessage="apple_tutorial_web_address"
                                    />
                                </p>
                                <div className="web_version">
                                    <a href={h5VersionUrl1}>
                                        <img
                                            className="web_button"
                                            src={h5Version1}
                                            alt="H5 版本一"
                                        />
                                    </a>
                                    <a href={h5VersionUrl2}>
                                        <img
                                            className="web_button"
                                            src={h5Version2}
                                            alt="H5 版本二"
                                        />
                                    </a>
                                </div>
                                
                                <h2>
                                    <FormattedMessage
                                        id="apple_tutorial_step_one"
                                        defaultMessage="apple_tutorial_step_one"
                                    />
                                </h2>
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_one_sentence_one"
                                        defaultMessage="apple_tutorial_step_one_sentence_one"
                                    />
                                    {' '}
                                    <a href="https://appleid.apple.com/">
                                        https://appleid.apple.com/
                                    </a>
                                    {' '}
                                    <FormattedMessage
                                        id="apple_tutorial_step_one_sentence_two"
                                        defaultMessage="apple_tutorial_step_one_sentence_two"
                                    />
                                </h4>
                                <img src={createAppleIDImage} alt="laiwan" />
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_one_sentence_three"
                                        defaultMessage="apple_tutorial_step_one_sentence_three"
                                    />
                                </h4>
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_one_sentence_four"
                                        defaultMessage="apple_tutorial_step_one_sentence_four"
                                    />
                                </h4>
                                <h2>
                                    <FormattedMessage
                                        id="apple_tutorial_step_two"
                                        defaultMessage="apple_tutorial_step_two"
                                    />
                                </h2>
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_two_sentence_one"
                                        defaultMessage="apple_tutorial_step_two_sentence_one"
                                    />
                                </h4>
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_two_sentence_two"
                                        defaultMessage="apple_tutorial_step_two_sentence_two"
                                    />
                                </h4>
                                <img src={checkAppleIDImage} alt="check_apple_id" />
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_two_sentence_three"
                                        defaultMessage="apple_tutorial_step_two_sentence_three"
                                    />
                                </h4>
                                <img src={nextPageImage} alt="next_page" />
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_two_sentence_four"
                                        defaultMessage="apple_tutorial_step_two_sentence_four"
                                    />
                                </h4>
                                <h2>
                                    <FormattedMessage
                                        id="apple_tutorial_step_three"
                                        defaultMessage="apple_tutorial_step_three"
                                    />
                                </h2>
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_three_sentence_one"
                                        defaultMessage="apple_tutorial_step_three_sentence_one"
                                    />
                                    {' '}
                                    <a href="https://appleid.apple.com/">
                                        https://appleid.apple.com
                                    </a>
                                </h4>
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_three_sentence_two"
                                        defaultMessage="apple_tutorial_step_three_sentence_two"
                                    />
                                </h4>
                                <img src={editImage} alt="edit_page" />
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_three_sentence_three"
                                        defaultMessage="apple_tutorial_step_three_sentence_three"
                                    />
                                    {' '}
                                    <a href="https://shenfendaquan.com/Index/index/meiguo_zhenshi_dizhi">
                                        https://shenfendaquan.com
                                    </a>
                                </h4>
                                <h4>
                                    <p>
                                        <FormattedMessage
                                            id="apple_tutorial_step_three_sentence_four"
                                            defaultMessage="apple_tutorial_step_three_sentence_four"
                                        />
                                    </p>
                                </h4>
                                <h4>
                                    {' '}
                                    <FormattedMessage
                                        id="apple_tutorial_step_three_sentence_five"
                                        defaultMessage="apple_tutorial_step_three_sentence_five"
                                    />
                                </h4>
                                <img src={replaceCountryImage} alt="replace_country" />
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_three_sentence_six"
                                        defaultMessage="apple_tutorial_step_three_sentence_six"
                                    />
                                </h4>
                                <img src={payWayImage} alt="pay_way" />
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_three_sentence_seven"
                                        defaultMessage="apple_tutorial_step_three_sentence_seven"
                                    />
                                </h4>
                                <h2>
                                    <FormattedMessage
                                        id="apple_tutorial_step_four"
                                        defaultMessage="apple_tutorial_step_four"
                                    />
                                </h2>
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_four_sentence_one"
                                        defaultMessage="apple_tutorial_step_four_sentence_one"
                                    />
                                </h4>
                                <h4>
                                    <FormattedMessage
                                        id="apple_tutorial_step_four_sentence_two"
                                        defaultMessage="apple_tutorial_step_four_sentence_two"
                                    />
                                </h4>
                                <h4>
                                    <p>
                                        <FormattedMessage
                                            id="apple_tutorial_step_four_sentence_three"
                                            defaultMessage="apple_tutorial_step_four_sentence_three"
                                        />
                                    </p>
                                </h4>
                                <img src={searchLaiWanImage} alt="search_laiwan" />
                            </div>
                        </div>
                    </div>
                </IntlProvider>
            </LocalizationContext.Provider>
        );
    }
}

Tutorial.contextType = LocalizationContext;

export default injectIntl(Tutorial);
