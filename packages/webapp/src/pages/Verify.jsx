import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { getSettings, getTenant, getSettingsTenantId } from '../selectors';
import * as Utils from '../utils/utils';
import FormError from '../components/FormError';
import Card from '../components/Card';
import Logo from '../components/Logo';
import Background from '../components/Background';
import LocalizedInput from '../components/LocalizedInput';
import { bindActionCreators } from 'redux';
import { verifyEmail, verifyMobile, sendVerificationToken } from '../actions/users';
import { withRouter } from "react-router-dom";
import * as GlobalAction from '../actions/global_actions';
import { getCurrentUserId, getCurrentUser } from '../selectors/entities/users';
import { useCountDown } from "../components/countdown";

const totalSeconds = 60;
const ReApplyCodeBtn = ({ onClick, id, loginId }) => {
    const [restTime, resetCountdown] = useCountDown(loginId || "cnt1", {
        total: totalSeconds,
        lifecycle: "session"
    });
    let textColor = "text-blue-600 hover:text-blue-600"
    if (restTime > 0) {
        textColor = "text-gray-300 hover:text-gray-300"
    }
    return (

        <button className={"justify-center col-span-2 -ml-px relative inline-flex items-center px-3 py-3 border border-gray-300 text-sm leading-5 font-medium rounded-br-md bg-gray-100 hover:bg-white focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:bg-gray-100 transition ease-in-out duration-150 " + textColor}
            id={id}
            disabled={restTime > 0}
            type="button"
            onClick={(e) => {
                resetCountdown();
                if (onClick) {
                    onClick();
                }
            }}>
            <span className="">
                <FormattedMessage
                    id='accounts.sendCode'
                    defaultMessage='Get Verify code'
                />{restTime > 0 ? ` (${restTime})` : null}
            </span>
        </button>

    );
};


class Verify extends React.Component {

    constructor(props, context) {
        super(props, context);

        const verifyBy = this.props.match.params.token;
        this.state = {
            verifyBy,

            email: '',
            mobile: '',
            verifyCode: '',

            serverError: '',
            loading: false
        };
        window.browserHistory = this.props.history;
        document.title = Utils.localizeMessage(`accounts.verify_${verifyBy}`) + ` | ${this.props.tenant.name}`;
    }

    handleEmailChange = (e) => {
        this.setState({
            email: e.target.value,
        });
    }

    handleMobileChange = (e) => {
        this.setState({
            mobile: e.target.value,
        });
    }

    handleCodeChange = (e) => {
        this.setState({
            verifyCode: e.target.value,
        });
    }


    sendVerificationToken = (e) => {
        this.setState({ serverError: null, loading: true });
        if (this.state.loginBy === 'email' && !this.state.email.trim()) {
            this.setState({
                serverError: (
                    <FormattedMessage
                        id='accounts.invalidEmail'
                    />
                ),
            });
            return
        }
        if (this.state.loginBy === 'mobile' && !this.state.mobile.trim()) {
            this.setState({
                serverError: (
                    <FormattedMessage
                        id='accounts.invalidMobile'
                    />
                ),
            });
            return
        }

        const user = {
            email: this.state.email,
            mobile: this.state.mobile
        }
        this.props.actions.sendVerificationToken(user).then(async (userId) => {
            this.state.userId = userId;
            if (!userId)
                this.setState({
                    serverError: (
                        <FormattedMessage
                            id='accounts.userNotFound'
                            defaultMessage='User not found.'
                        />
                    ),
                });
        });
    }

    onSubmit = async (e) => {
        this.setState({ serverError: null, loading: true });
        e.preventDefault();
        this.setState({ error: null });

        if (this.state.verifyBy === 'email' && !this.state.email.trim()) {
            this.setState({
                serverError: (
                    <FormattedMessage
                        id='accounts.invalidEmail'
                    />
                ),
            });
            return
        }
        
        if (this.state.verifyBy === 'mobile' && !this.state.mobile.trim()) {
            this.setState({
                serverError: (
                    <FormattedMessage
                        id='accounts.invalidMobile'
                    />
                ),
            });
            return
        }

        if(this.state.verifyBy === 'email'){
            this.props.actions.verifyEmail(this.state.email.trim(), this.state.code).then(async ({ error }) => {
                if (error) {
                    this.setState({
                        serverError: (
                            <FormattedMessage
                                id={error.message}
                            />
                        ),
                    });
                    return;
                }
                this.finish();
            });
        }

        if(this.state.verifyBy === 'mobile'){
            this.props.actions.verifyMobile(this.state.mobile.trim(), this.state.code).then(async ({ error }) => {
                if (error) {
                    this.setState({
                        serverError: (
                            <FormattedMessage
                                id={error.message}
                            />
                        ),
                    });
                    return;
                }
                this.finish();
            });
        }
    };


    finish = (team) => {
        let password_expired = this.props.currentUser.password_expired;
        if (password_expired) {
            GlobalAction.redirectUserToUpdatePassword();
            return;
        }

        let redirect_uri = new URLSearchParams(this.props.location.search).get('redirect_uri')
        if (!redirect_uri)
            redirect_uri = '/'
        GlobalAction.redirectTo(redirect_uri);
    }

    render() {

        return (
            <>
                <Background />
                <Card>
                    <Logo />
                    <h2 className="mt-2 text-left text-2xl leading-9 font-extrabold text-gray-900">
                        <FormattedMessage
                            id={`accounts.verify_${this.state.verifyBy}`}
                            defaultMessage={`verify ${this.state.verifyBy}`}
                        />
                    </h2>

                    <form onSubmit={this.onSubmit} className="mt-4" autoCapitalize="none">
                        <div className="rounded-md shadow-sm my-2">


                            {this.state.verifyBy == 'email' && (
                                <div className="-mt-px">
                                    <LocalizedInput
                                        id="email"
                                        name="email"
                                        value={this.state.email}
                                        className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5"
                                        placeholder={{ id: 'accounts.email_placeholder', defaultMessage: 'Email' }}
                                        onChange={this.handleEmailChange}
                                    />
                                </div>
                            )}

                            {this.state.verifyBy == 'mobile' && (
                                <div className="-mt-px">
                                    <LocalizedInput
                                        id="mobile"
                                        name="mobile"
                                        value={this.state.mobile}
                                        className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5"
                                        placeholder={{ id: 'accounts.mobile_placeholder', defaultMessage: 'Mobile' }}
                                        onChange={this.handleMobileChange}
                                    />
                                </div>
                            )}

                            <div className="-mt-px grid grid-cols-5">
                                <LocalizedInput
                                    id="verifyCode"
                                    name="verifyCode"
                                    value={this.state.verifyCode}
                                    className="col-span-3 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-bl-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5"
                                    placeholder={{ id: 'accounts.verifyCode', defaultMessage: 'Verify Code' }}
                                    onChange={this.handleCodeChange}
                                />
                                <ReApplyCodeBtn onClick={this.sendVerificationToken} id="reApplyCodeBtn" loginId={this.state.email + this.state.mobile} />

                            </div>
                        </div>

                        {this.state.serverError && <FormError error={this.state.serverError} />}

                        <div className="mt-6 flex justify-end">
                            <button type="submit" className="rounded group relative w-32 justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-none text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out">
                                <FormattedMessage
                                    id='accounts.submit'
                                    defaultMessage='Submit'
                                />
                            </button>
                        </div>
                    </form>
                </Card>
            </>
        );
    };

}

function mapStateToProps(state) {
    return {
        getCurrentUserId: getCurrentUserId(state),
        currentUser: getCurrentUser(state),
        settings: getSettings(state),
        tenant: getTenant(state),
        settingsTenantId: getSettingsTenantId(state)
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            verifyEmail,
            verifyMobile,
            sendVerificationToken,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Verify));
