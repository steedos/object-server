import React, { useState, useEffect } from 'react';
import {bindActionCreators} from 'redux';
import { RouteComponentProps, Link } from 'react-router-dom';
import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import {FormattedMessage} from 'react-intl';
import { connect } from 'react-redux';
import { getTenant, getSettings } from '../selectors';
import { getCurrentUser } from "../selectors/entities/users";
import { getCurrentSpace, getCurrentSpaceId } from "../selectors/entities/spaces";
import Navbar from '../components/Navbar';
import { selectSpace, goSpaceHome } from '../actions/spaces';
import { hashHistory } from "../utils/hash_history";
import LocalStorageStore from '../stores/local_storage_store';
import * as GlobalAction from '../actions/global_actions';

class Home extends React.PureComponent {


  constructor(props, context) {
    super(props, context);
  }

  componentDidMount() {
    const previousSpaceId = LocalStorageStore.getPreviousSpaceId();
    const paramSpaceId = (this.props.match && this.props.match.params)?this.props.match.params.spaceId:null;
    const {currentSpaceId} = this.props;

    const spaceId = paramSpaceId?paramSpaceId:currentSpaceId?currentSpaceId:previousSpaceId
    let password_expired = this.props.currentUser.password_expired;
    if(password_expired){
      GlobalAction.redirectUserToUpdatePassword();
      return;
    }
    if (spaceId) {
      this.props.actions.selectSpace(spaceId).then(async (result) => {
        if (result && result.data == false) {
          hashHistory.push('/select-space');
          return
        }
      });
    } else {
      hashHistory.push('/select-space');
    }

    if (process.env.NODE_ENV == 'production')
      if (this.props.currentUser && this.props.currentSpace) 
        this.goHome();
  }

  goHome = async () => {
    this.props.actions.goSpaceHome();
  };

  render() {

    if (process.env.NODE_ENV == 'production')
      return null;

    const {currentUser, currentSpace} = this.props;

    if (!currentUser || !currentSpace) {
      return null;
    }

    return (
      <div>
        <Navbar user={currentUser}/>
<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200 md:flex md:items-center md:justify-between">
  <div className="flex-1 min-w-0">
    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9 sm:truncate">
      {this.props.currentSpace && this.props.currentSpace.name}
    </h2>
  </div>
  <div className="mt-4 flex md:mt-0 md:ml-4">
    {/* <span className="shadow-sm rounded-md">
      <button type="button" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:text-gray-800 active:bg-gray-50 transition duration-150 ease-in-out">
        切换企业
      </button>
    </span> */}
    <span className="shadow-sm rounded-md">
      <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-700 active:bg-blue-700 transition duration-150 ease-in-out"
        onClick={this.goHome}>
          进入首页
      </button>
    </span>
  </div>
</div>
        
{/* 
        <div className="bg-white overflow-hidden sm:shadow sm:rounded-lg sm:px-6 sm:mx-8 sm:my-8 md:max-w-5xl md:mx-auto">
          <div className="px-4 py-5 sm:p-6">
            <div className="py-6 md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="inline-block h-15 w-15 rounded-full overflow-hidden bg-gray-100 text-gray-500">
                    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </span>
                  <div>
                    <div className="flex items-center">
                      <h1 className="ml-3 text-2xl font-bold leading-7 text-cool-gray-900 sm:leading-9 sm:truncate">
                        {this.props.currentSpace && this.props.currentSpace.name}
                      </h1>
                    </div>
                    <dl className="mt-6 flex flex-col sm:ml-3 sm:mt-1 sm:flex-row sm:flex-wrap">
                      <dt className="sr-only">Company</dt>
                      <dd className="flex items-center text-sm leading-5 text-cool-gray-500 font-medium capitalize sm:mr-6">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-cool-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                        华炎软件
                      </dd>
                      <dt className="sr-only">Account status</dt>
                      <dd className="mt-3 flex items-center text-sm leading-5 text-cool-gray-500 font-medium sm:mr-6 sm:mt-0 capitalize">
                        {emailVerified()}
                        {mobileVerified()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <span className="shadow-sm rounded-md">
                  <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:shadow-outline-teal focus:border-teal-700 active:bg-teal-700 transition duration-150 ease-in-out" 
                    onClick={this.onHome}>
                    进入首页
                  </button>
                </span>
                <span className="shadow-sm rounded-md">
                  <a href="#/preference" className="inline-flex items-center px-4 py-2 border border-cool-gray-300 text-sm leading-5 font-medium rounded-md text-cool-gray-700 bg-white hover:text-cool-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:text-cool-gray-800 active:bg-cool-gray-50 transition duration-150 ease-in-out">
                    账户设置
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    );
  }
};

function mapStateToProps(state) {
  return {
    currentUser: getCurrentUser(state),
    currentSpace: getCurrentSpace(state),
    currentSpaceId: getCurrentSpaceId(state),
    tenant: getTenant(state),
    settings: getSettings(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
      actions: bindActionCreators({
          selectSpace,
          goSpaceHome,
      }, dispatch),
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(Home);