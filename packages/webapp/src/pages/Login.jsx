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
import { bindActionCreators, Dispatch, AnyAction } from 'redux';
import { login, sendVerificationToken } from '../actions/users';
import { withRouter } from "react-router-dom";
import * as GlobalAction from '../actions/global_actions';
import { getCurrentUserId, getCurrentUser } from '../selectors/entities/users';
import { useCountDown } from "../components/countdown";
import LocalStorageStore from '../stores/local_storage_store';

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
        if(onClick){
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


class Login extends React.Component {

  constructor(props, context) {
    super(props, context);

    let email = '';
    if ((new URLSearchParams(this.props.location.search)).get('email')) {
      email = (new URLSearchParams(this.props.location.search)).get('email');
    }
    let spaceId = '';
    if ((new URLSearchParams(this.props.location.search)).get('X-Space-Id')) {
      spaceId = (new URLSearchParams(this.props.location.search)).get('email');
    } else if (this.props.settingsTenantId) {
      spaceId = this.props.settingsTenantId
    }

    this.state = {
        // ldapEnabled: this.props.isLicensed && this.props.enableLdap,
        // samlEnabled: this.props.isLicensed && this.props.enableSaml,
        spaceId,
        email,
        mobile: '',
        loginId: '',
        userId: '',
        password: '',
        verifyCode: '',
        sessionExpired: false,
        loginSuccess: false,

        loginByEmail: true,
        loginByMobile: true,
        loginBy: "mobile",
        
        loginWith: this.props.tenant.enable_password_login? 'password':'code',
        loginWithCode: this.props.tenant.enable_mobile_code_login || this.props.tenant.enable_email_code_login,
        loginWithPassword: this.props.tenant.enable_password_login,

        serverError: '',
        loading: false

        // brandImageError: false,
    };

    
    
    // if (this.props.tenant.enable_mobile_code_login || this.props.tenant.enable_email_code_login) {
    //   this.state.loginWithCode = true;
    //   this.state.loginByEmail = true;
    //   this.state.loginByMobile = true;
    //   this.state.loginBy = "mobile"
    // } else if (this.props.tenant.enable_mobile_code_login) {
    //   this.state.loginWithCode = true
    //   this.state.loginByMobile = true;
    //   this.state.loginByEmail = false;
    //   this.state.loginBy = "mobile"
    // } else if (this.props.tenant.enable_email_code_login) {
    //   this.state.loginWithCode = true
    //   this.state.loginByMobile = false;
    //   this.state.loginByEmail = true;
    //   this.state.loginBy = "email"
    // } else if (this.props.tenant.enable_password_login) {
    //   this.state.loginWithPassword = true
    //   this.state.loginByEmail = true;
    //   this.state.loginByMobile = true;
    //   this.state.loginBy = "email"
    // } 

    // this.state.loginWithCode = false
    // this.state.loginWithPassword = true
    // this.state.loginByMobile = true;
    // this.state.loginByEmail = true;
    // this.state.loginBy = "email"

    this.emailInput = React.createRef();
    this.mobileInput = React.createRef();
    this.passwordInput = React.createRef();

    window.browserHistory = this.props.history;
    document.title = Utils.localizeMessage('accounts.signin') + ` | ${this.props.tenant.name}`;


  }

  createLoginPlaceholder = () => {

    let inputLabel = '';
    if (this.state.loginBy == "mobile")
      inputLabel = 'accounts.mobile';
    else if (this.state.loginBy == "email") 
      inputLabel = 'accounts.email';
    
    return Utils.localizeMessage(inputLabel)
  }

  handleLoginIdChange = (e) => {
    const loginId = e.target.value;
    if (loginId.indexOf('@') > 0) {
      this.setState({
        loginId,
        email: e.target.value,
        loginBy: 'email'
      });
    } else {
      this.setState({
        loginId,
        mobile: e.target.value,
        loginBy: 'mobile'
      });
    }
  }

  handlePasswordChange = (e) => {
    this.setState({
      password: e.target.value,
    });
  }

  handleCodeChange = (e) => {
    this.setState({
      verifyCode: e.target.value,
    });
  }

  switchLoginWithCode = (e) => {
    this.setState({
        loginWith: 'code',
    });
  }

  switchLoginWithPassword = (e) => {
    this.setState({
        loginWith: 'password',
    });
  }

  sendVerificationToken = (e) => {

    this.setState({serverError: null, loading: true});
    if(this.state.loginBy === 'email' && !this.state.email.trim()){
      this.setState({
          serverError: (
              <FormattedMessage
                  id='accounts.invalidEmail'
              />
          ),
      });
      return
    }
    if(this.state.loginBy === 'mobile' && !this.state.mobile.trim()){
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
    this.setState({serverError: null, loading: true});
    e.preventDefault();
    this.setState({error: null});

    if(this.state.loginBy === 'email' && !this.state.email.trim()){
      this.setState({
          serverError: (
              <FormattedMessage
                  id='accounts.invalidEmail'
              />
          ),
      });
      return
    }
    if(this.state.loginBy === 'mobile' && !this.state.mobile.trim()){
      this.setState({
          serverError: (
              <FormattedMessage
                  id='accounts.invalidMobile'
              />
          ),
      });
      return
    }

    // if(!this.state.password.trim()){
    //   throw new Error('accounts.passwordRequired');
    // }

    const user = {
      email: this.state.loginBy === 'email'?this.state.email:'',
      mobile: this.state.loginBy === 'mobile'?this.state.mobile:'',
      spaceId: this.state.spaceId,
    }
    this.props.actions.login(user, this.state.password, this.state.verifyCode).then(async ({error}) => {
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
      this.finishSignin();
      
    });
  };


  finishSignin = (team) => {
    let password_expired = this.props.currentUser.password_expired;
    if(password_expired){
      GlobalAction.redirectUserToUpdatePassword();
      return;
    }

    let redirect_uri = new URLSearchParams(this.props.location.search).get('redirect_uri')
    if (!redirect_uri)
      redirect_uri = '/'
    GlobalAction.redirectTo(redirect_uri);
    // const query = new URLSearchParams(this.props.location.search);
    // let redirectTo = query.get('redirect_uri');

    // // Utils.setCSRFFromCookie();

    // // Record a successful login to local storage. If an unintentional logout occurs, e.g.
    // // via session expiration, this bit won't get reset and we can notify the user as such.

    // if (redirectTo && redirectTo.indexOf('no_redirect=1')<0) {
    //   const userId = LocalStorageStore.getItem('userId');
    //   const authToken =  LocalStorageStore.getItem('token');
    //   const spaceId =  LocalStorageStore.getItem('spaceId');
    //   redirectTo = redirectTo.indexOf("?")>0?redirectTo+'no_redirect=1':redirectTo+'?no_redirect=1'
    //   redirectTo = `${redirectTo}&X-Auth-Token=${authToken}&X-User-Id=${userId}&X-Space-Id=${spaceId}`

    //   if (redirectTo.match(/^\/([^/]|$)/))
    //     this.props.history.push(redirectTo);
    //   else
    //     document.location.href=redirectTo
    // // } else if (team) {
    // //     browserHistory.push(`/${team.name}`);
    // } else {
    //   this.state.loginSuccess = true;
    //   GlobalAction.redirectUserToDefaultSpace();
    // }
  }

  goSignup = ()=>{
    let state = {};
    if(this.state.email.trim().length > 0){
      state =  { email: this.state.email.trim() }
    }
    this.props.history.push({
      pathname: `/signup`,
      search: this.props.location.search,
      state: state
    })
  }

  render() {

    return (
    <>
    <Background/>
    <Card>
        <Logo/>
        <h2 className="mt-2 text-left text-2xl leading-9 font-extrabold text-gray-900">
          <FormattedMessage
              id='accounts.signin'
              defaultMessage='Login'
            />
        </h2>

        <form onSubmit={this.onSubmit} className="mt-4" autoCapitalize="none">
          <div className="rounded-md shadow-sm my-2">
            <div>
              <LocalizedInput 
                id="loginId"
                name="loginId" 
                ref={this.loginIdInput}
                value={this.state.loginId}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5" 
                placeholder={{id: 'accounts.email_mobile', defaultMessage: 'Email or mobile'}}
                onChange={this.handleLoginIdChange}
              />
            </div>

            {this.state.loginWith == 'password' && (
              <div className="-mt-px">
                <LocalizedInput 
                  type="password"
                  id="password"
                  name="password" 
                  value={this.state.password}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5" 
                  placeholder={{id: 'accounts.password_placeholder', defaultMessage: 'Password'}}
                  onChange={this.handlePasswordChange}
                />
              </div>
            )}

            {this.state.loginWith == 'code' && (
                <div className="-mt-px grid grid-cols-5">
                  <LocalizedInput 
                    id="verifyCode"
                    name="verifyCode" 
                    value={this.state.verifyCode}
                    className="col-span-3 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-bl-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5" 
                    placeholder={{id: 'accounts.verifyCode', defaultMessage: 'Verify Code'}}
                    onChange={this.handleCodeChange}
                  />
                  <ReApplyCodeBtn onClick={this.sendVerificationToken} id="reApplyCodeBtn" loginId={this.state.email + this.state.mobile}/>

                </div>
            )}
          </div>
          
          {this.state.serverError && <FormError error={this.state.serverError} />}


          {this.state.loginWithPassword && this.state.loginWith === 'code' && (
            <div className="text-sm leading-5 my-4">
              <button type="button" onClick={this.switchLoginWithPassword}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none hover:underline transition ease-in-out duration-150">
                <FormattedMessage
                    id='accounts.switch_password'
                    defaultMessage='Login with password'
                />
              </button>
            </div>
          )}

          {this.state.loginWithCode && this.state.loginWith === 'password' && (
            <div className="text-sm leading-5 my-4">
              <button type="button" onClick={this.switchLoginWithCode}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none hover:underline transition ease-in-out duration-150">
                <FormattedMessage
                    id='accounts.switch_code'
                    defaultMessage='Login with verfiy code'
                />
              </button>
            </div>
          )}

          {this.props.tenant.enable_register &&
          <div className="text-sm leading-5 my-4">
            <FormattedMessage
                  id='accounts.no_account'
                  defaultMessage='No Account?'
              />
            <button type="button" onClick={this.goSignup}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none hover:underline transition ease-in-out duration-150">
              <FormattedMessage
                  id='accounts.signup'
                  defaultMessage='Sign Up'
              />
            </button>
          </div>}

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
          login,
          sendVerificationToken,
      }, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Login));
