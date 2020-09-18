import {Action, ActionFunc, ActionResult, batchActions, DispatchFunc, GetStateFunc} from '../types/actions';

import { UserTypes } from '../action_types';
import { UserProfile } from '../types/users';
import { Client4 } from '../client/';
import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary, debounce} from './helpers';
import { getMySpaces, selectSpace } from './spaces';
import LocalStorageStore from '../stores/local_storage_store';

export function createUser(user: UserProfile, token: string, inviteId: string, redirect: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let created;

        try {
            created = await Client4.createUser(user, token, inviteId, redirect);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({type: UserTypes.RECEIVED_ME, data: created.user});
        return completeLogin(created)(dispatch, getState);
    };
}

export function login(loginId: string, password: string, mfaToken = ''): ActionFunc {
  return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
      dispatch({type: UserTypes.LOGIN_REQUEST, data: null});

      const deviceId = getState().entities.general.deviceToken;
      let data;

      try {
          data = await Client4.login(loginId, password, mfaToken, deviceId);
      } catch (error) {
          dispatch(batchActions([
              {
                  type: UserTypes.LOGIN_FAILURE,
                  error,
              },
              logError(error),
          ]));
          return {error};
      }

      return completeLogin(data)(dispatch, getState);
  };
}


function completeLogin(data: any): ActionFunc {
  return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
    dispatch({
      type: UserTypes.RECEIVED_ME,
      data: data.user,
    });
    Client4.setToken(data.token);
    Client4.setUserId(data.user._id);

    if (data.user && data.user._id) {
      LocalStorageStore.setUserId(data.user._id, data.token);    
    }
    
    const promises = [
        dispatch(getMySpaces()),
        dispatch(selectSpace()),
      //   dispatch(getClientConfig()),
    ];

    try {
        await Promise.all(promises);
    } catch (error) {
        dispatch(batchActions([
            {type: UserTypes.LOGIN_FAILURE, error},
            logError(error),
        ]));
        return {error};
    }

    dispatch(batchActions([
      {
          type: UserTypes.LOGIN_SUCCESS,
      },
    ]));


    if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        "X-Auth-Token": data.token,
        "X-User-Id": data.user._id,
        "X-Access-Token": data.tokens.accessToken
      }))
    }

    return {data: true};
  };
}

export function loadMe(): ActionFunc {
  return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
      const state = getState();

      // const deviceId = state.entities.general.deviceToken;
      // if (deviceId) {
      //     Client4.attachDevice(deviceId);
      // }

      const promises = [
          dispatch(getMe()),
          dispatch(getMySpaces()),
          dispatch(selectSpace()),
      ];

      await Promise.all(promises);

      const {currentUserId} = getState().entities.users;
      const user = getState().entities.users.users[currentUserId];
      if (currentUserId) {
          Client4.setUserId(currentUserId);
      }

      return {data: true};
  };
}

export function logout(): ActionFunc {
  return async (dispatch: DispatchFunc) => {
      dispatch({type: UserTypes.LOGOUT_REQUEST, data: null});

      try {
          await Client4.logout();
      } catch (error) {
          // nothing to do here
      }

      LocalStorageStore.setUserId(null);
      dispatch({type: UserTypes.LOGOUT_SUCCESS, data: null});

      return {data: true};
  };
}


export function getMe(): ActionFunc {
  return async (dispatch: DispatchFunc, getState: GetStateFunc) => {

      if (!LocalStorageStore.getItem('userId'))
        return {error: 'user not found.'} 

      const getMeFunc = bindClientFunc({
          clientFunc: Client4.getMe,
          onSuccess: UserTypes.RECEIVED_ME,
      });
      const me = await getMeFunc(dispatch, getState);

      if ('error' in me) {
        LocalStorageStore.removeItem('userId');
        return me;
      }
      // if ('data' in me) {
      //     dispatch(loadRolesIfNeeded(me.data.roles.split(' ')));
      // }
      return me;
  };
}

export function sendVerificationToken(loginId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const deviceId = getState().entities.general.deviceToken;
        let data;
  
        try {
            data = await Client4.sendVerificationToken(loginId);
        } catch (error) {
            dispatch(batchActions([
                {
                    type: UserTypes.VERIFICATION_TOKEN_RECIEVED,
                    error,
                },
                //logError(error),
            ]));
            return {error};
        }
  
        return data;
    };
  }
  
export function changePassword(oldPassword: string, newPassword: string){
  return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
    dispatch({type: UserTypes.CHANGEPASSWORD_REQUEST, data: null});
    let data;
    try {
        data = await Client4.changePassword(oldPassword, newPassword);
    } catch (error) {
        dispatch(batchActions([
            {
                type: UserTypes.CHANGEPASSWORD_FAILURE,
                error,
            },
            logError(error),
        ]));
        return {error};
    }

    return data;
  };
}

export function verifyEmail(email: string, code: string){
  return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
    dispatch({type: UserTypes.VERIFYEMAIL_REQUEST, data: null});
    let data;
    try {
        data = await Client4.verifyEmail(email, code);
    } catch (error) {
        dispatch(batchActions([
            {
                type: UserTypes.VERIFYEMAIL_FAILURE,
                error,
            },
            logError(error),
        ]));
        return {error};
    }

    return data;
  };
}

export function verifyMobile(mobile: string, code: string){
  return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
    dispatch({type: UserTypes.VERIFYMOBILE_REQUEST, data: null});
    let data;
    try {
        data = await Client4.verifyMobile(mobile, code);
    } catch (error) {
        dispatch(batchActions([
            {
                type: UserTypes.VERIFYMOBILE_FAILURE,
                error,
            },
            logError(error),
        ]));
        return {error};
    }

    return data;
  };
}