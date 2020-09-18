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
import { changePassword } from '../actions/users';
import { withRouter } from "react-router-dom";
import { getCurrentUserId } from '../selectors/entities/users';
import * as GlobalAction from '../actions/global_actions';

class UpdatePassword extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      serverError: '',
      loading: false
    };

    window.browserHistory = this.props.history;
    document.title = Utils.localizeMessage('accounts.title.updatePassword') + ` | ${this.props.tenant.name}`;
  }


  handleOldPasswordChange = (e) => {
    this.setState({
      oldPassword: e.target.value,
    });
  }

  handleNewPasswordChange = (e) => {
    this.setState({
      newPassword: e.target.value,
    });
  }

  handleConfirmPasswordChange = (e) => {
    this.setState({
      confirmPassword: e.target.value,
    });
  }

  onSubmit = async (e) => {
    this.setState({serverError: null, loading: true});
    e.preventDefault();
    this.setState({error: null});

    if(this.state.oldPassword === this.state.newPassword){
      this.setState({
        serverError: (
            <FormattedMessage
                id='accounts.oldAndNewPasswordNotEQ'
            />
        ),
      });
      return
    }

    if(this.state.newPassword != this.state.confirmPassword){
        this.setState({
          serverError: (
              <FormattedMessage
                  id='accounts.passwordNotEQ'
              />
          ),
        });
        return
    }

    this.props.actions.changePassword(this.state.oldPassword, this.state.newPassword).then(async (result) => {
      let error = null;
      if(result){
        error = result.error
      }
      if (error) {
        if(error.message === 'accounts.invalid_credentials'){
          error.message = 'accounts.updatePassword_invalid_credentials'
        }
        this.setState({
          serverError: (
              <FormattedMessage
                  id={error.message}
              />
          ),
        });
        return;
      }else{
        GlobalAction.emitUserLoggedOutEvent('/login');
      }
    });
  };

  render() {

    return (
      <>
        <Background />
        <Card>
          <Logo />
          <h2 className="mt-2 text-left text-2xl leading-9 font-extrabold text-gray-900">
            <FormattedMessage
              id='accounts.update_password'
              defaultMessage='Change Password'
            />
          </h2>

          <form onSubmit={this.onSubmit} className="mt-4" autoCapitalize="none">
            <div className="rounded-md shadow-sm my-2">

              <div className="-mt-px">
                <LocalizedInput
                  type="password"
                  id="oldPassword"
                  name="oldPassword"
                  autocomplete="old-password"
                  value={this.state.password}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5"
                  placeholder={{ id: 'accounts.oldPassword', defaultMessage: 'Set oldPassword' }}
                  onChange={this.handleOldPasswordChange}
                />
              </div>
              <div className="-mt-px">
                <LocalizedInput
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  autocomplete="new-password"
                  value={this.state.password}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5"
                  placeholder={{ id: 'accounts.newPassword', defaultMessage: 'Set newPassword' }}
                  onChange={this.handleNewPasswordChange}
                />
              </div>
              <div className="-mt-px">
                <LocalizedInput
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  autocomplete="confirm-password"
                  value={this.state.password}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-md sm:leading-5"
                  placeholder={{ id: 'accounts.confirmPassword', defaultMessage: 'Set confirmPassword' }}
                  onChange={this.handleConfirmPasswordChange}
                />
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
    settings: getSettings(state),
    tenant: getTenant(state),
    settingsTenantId: getSettingsTenantId(state)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      changePassword
    }, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(UpdatePassword));
