// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import fetch from './fetch_etag';
import {cleanUrlForLogging} from './utils/sentry';
import { Options, ClientResponse } from './types/client4';
import {buildQueryString} from './utils/helpers';
import { UserProfile } from './types/users';
import { ServerError } from './types/errors';
import { Space } from './types/spaces';
import SObject from './sobject';

const HEADER_AUTH = 'Authorization';
const HEADER_BEARER = 'Bearer';
const HEADER_REQUESTED_WITH = 'X-Requested-With';
const HEADER_USER_AGENT = 'User-Agent';
const HEADER_X_CLUSTER_ID = 'X-Cluster-Id';
const HEADER_X_CSRF_TOKEN = 'X-CSRF-Token';
export const HEADER_X_VERSION_ID = 'X-Version-Id';
const PER_PAGE_DEFAULT = 60;
const LOGS_PER_PAGE_DEFAULT = 10000;
export const DEFAULT_LIMIT_BEFORE = 30;
export const DEFAULT_LIMIT_AFTER = 30;

const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;
const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;

export default class SteedosClient {
    LOGIN_TOKEN_KEY = "Meteor.loginToken";
    LOGIN_TOKEN_EXPIRES_KEY = "Meteor.loginTokenExpires";
    USER_ID_KEY = "Meteor.userId";
    logToConsole = false;
    _lastLoginTokenWhenPolled= null;
    loginExpirationInDays = null;
    serverVersion = '';
    clusterId = '';
    token = '';
    spaceId = '';
    authToken = '';
    csrf = '';
    url = (process.env.NODE_ENV == 'development' && process.env.REACT_APP_API_URL)? process.env.REACT_APP_API_URL as string : '';
    urlVersion = '';
    userAgent: string|null = null;
    enableLogging = false;
    defaultHeaders: {[x: string]: string} = {
        'Content-Type': 'application/json'
    };
    userId = '';
    diagnosticId = '';
    includeCookies = true;
    isRudderKeySet = false;
    translations = {
        connectionError: 'There appears to be a problem with your internet connection.',
        unknownError: 'We received an unexpected status code from the server.',
    };
    userRoles?: string;

    sobjects = {};
    
    getUrl() {
        if(!this.url){
            var href = new URL(window.location.href);
            var foo = href.pathname.split('/accounts');
            var ROOT_URL_PATH_PREFIX = '';
            if(foo.length > 1){
                ROOT_URL_PATH_PREFIX = foo[0];
            }
            return ROOT_URL_PATH_PREFIX;
        }
        return this.url;
    }

    getAbsoluteUrl(baseUrl: string) {
        if (typeof baseUrl !== 'string' || !baseUrl.startsWith('/')) {
            return baseUrl;
        }
        return this.getUrl() + baseUrl;
    }

    setUrl(url: string) {
        this.url = url;
    }

    setUserAgent(userAgent: string) {
        this.userAgent = userAgent;
    }

    getToken() {
        return this.token;
    }

    setToken(token: string) {
        this.token = token;
        this.authToken = this.getSpaceId() + ',' + token;
    }

    getSpaceId(){
        return this.spaceId;
    }

    setSpaceId(spaceId){
        this.spaceId = spaceId;
        this.authToken = spaceId + ',' + this.getToken();
    }

    getAuthToken(){
        // return this.getSpaceId() + ',' + this.getToken();
        return this.authToken;
    }

    setCSRF(csrfToken: string) {
        this.csrf = csrfToken;
    }

    setAcceptLanguage(locale: string) {
        this.defaultHeaders['Accept-Language'] = locale;
    }

    setEnableLogging(enable: boolean) {
        this.enableLogging = enable;
    }

    setIncludeCookies(include: boolean) {
        this.includeCookies = include;
    }

    setUserId(userId: string) {
        this.userId = userId;
    }

    setUserRoles(roles: string) {
        this.userRoles = roles;
    }

    setDiagnosticId(diagnosticId: string) {
        this.diagnosticId = diagnosticId;
    }

    enableRudderEvents() {
        this.isRudderKeySet = true;
    }

    getServerVersion() {
        return this.serverVersion;
    }

    getUrlVersion() {
        return this.urlVersion;
    }

    getBaseRoute() {
        return `${this.getUrl()}${this.urlVersion}`;
    }

    getAccountsRoute() {
        return `${this.getBaseRoute()}/accounts`;
    }

    getCSRFFromCookie() {
        if (typeof document !== 'undefined' && typeof document.cookie !== 'undefined') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('MMCSRF=')) {
                    return cookie.replace('MMCSRF=', '');
                }
            }
        }
        return '';
    }

    getOptions(options: Options) {
        const newOptions: Options = {...options};

        const headers: {[x: string]: string} = {
            [HEADER_REQUESTED_WITH]: 'XMLHttpRequest',
            ...this.defaultHeaders,
        };

        if (this.authToken) {
            headers[HEADER_AUTH] = `${HEADER_BEARER} ${this.authToken}`;
        }

        const csrfToken = this.csrf || this.getCSRFFromCookie();
        if (options.method && options.method.toLowerCase() !== 'get' && csrfToken) {
            headers[HEADER_X_CSRF_TOKEN] = csrfToken;
        }

        if (this.includeCookies) {
            newOptions.credentials = 'include';
        }

        if (this.userAgent) {
            headers[HEADER_USER_AGENT] = this.userAgent;
        }

        if (newOptions.headers) {
            Object.assign(headers, newOptions.headers);
        }

        return {
            ...newOptions,
            headers,
        };
    }

    getTranslations = (url: string) => {
        return this.doFetch<Record<string, string>>(
            url,
            {method: 'get'},
        );
    }


    logClientError = (message: string, level = 'ERROR') => {
        // const url = `${this.getBaseRoute()}/logs`;

        // if (!this.enableLogging) {
        //     throw new ClientError(this.getUrl(), {
        //         message: 'Logging disabled.',
        //         url,
        //     });
        // }

        // return this.doFetch<{
        //     message: string;
        // }>(
        //     url,
        //     {method: 'post', body: JSON.stringify({message, level})},
        // );
    };

    login = (user: string | object, password: string, token = '', deviceId = '') => {
        this.trackEvent('api', 'api_users_login');

        const body: any = {
            device_id: deviceId,
            user,
            password,
            token,
            locale: "zh-cn"
        };

        return this.doFetch<UserProfile>(
            `${this.getAccountsRoute()}/password/login`,
            {method: 'POST', body: JSON.stringify(body)},
        );

    };


    createUser = (user: UserProfile, token: string, inviteId: string, redirect: string) => {
        this.trackEvent('api', 'api_users_createUser');

        const queryParams: any = {};

        if (token) {
            queryParams.t = token;
        }

        if (inviteId) {
            queryParams.iid = inviteId;
        }

        if (redirect) {
            queryParams.r = redirect;
        }

        const auth:any = this.doFetch<UserProfile>(
            `${this.getAccountsRoute()}/password/register${buildQueryString(queryParams)}`,
            {method: 'POST', body: JSON.stringify(user)},
        );

        return auth
    };

    createSpace = (name: string) => {
        this.trackEvent('api', 'api_users_createTenant');

        const queryParams: any = {};

        const auth:any = this.doFetch<UserProfile>(
            `${this.getBaseRoute()}/api/v4/spaces/register/tenant${buildQueryString(queryParams)}`,
            {method: 'POST', body: JSON.stringify({name: name})},
        );

        return auth
    };

    sendVerificationToken = (user: string) => {
        this.trackEvent('api', 'api_users_verify');

        const body: any = {
            user: user,
        };

        return this.doFetch<UserProfile>(
            `${this.getAccountsRoute()}/password/sendVerificationCode`,
            {method: 'POST', body: JSON.stringify(body)},
        );
    };

    getSettings = () => {
        return this.doFetch<UserProfile>(
            `${this.getAccountsRoute()}/settings`,
            {method: 'get'},
        );
    };

    getMe = () => {
        return this.doFetch<UserProfile>(
            `${this.getAccountsRoute()}/user`,
            {method: 'get'},
        );
    };

    getMySpaces = () => {
        return this.doFetch<Space[]>(
            `${this.getAccountsRoute()}/user/spaces`,
            {method: 'get'},
        );
    };

    logout = async () => {
        this.trackEvent('api', 'api_users_logout');

        const {response} = await this.doFetchWithResponse(
            `${this.getAccountsRoute()}/logout`,
            {method: 'post'},
        );

        if (response.ok) {
            this.token = '';
        }

        this.serverVersion = '';
        
        return response;
    };

    // Client Helpers

    doFetch = async <T>(url: string, options: Options): Promise<T> => {
        const {data} = await this.doFetchWithResponse<T>(url, options);

        return data;
    };

    doFetchWithResponse = async <T>(url: string, options: Options): Promise<ClientResponse<T>> => {
        const response = await fetch(url, this.getOptions(options));
        const headers = parseAndMergeNestedHeaders(response.headers);

        let data;
        try {
            data = await response.json();
        } catch (err) {
            throw new ClientError(this.getUrl(), {
                message: 'Received invalid response from the server.',
                intl: {
                    id: 'mobile.request.invalid_response',
                    defaultMessage: 'Received invalid response from the server.',
                },
                url,
            });
        }

        if (headers.has(HEADER_X_VERSION_ID) && !headers.get('Cache-Control')) {
            const serverVersion = headers.get(HEADER_X_VERSION_ID);
            if (serverVersion && this.serverVersion !== serverVersion) {
                this.serverVersion = serverVersion as string;
            }
        }

        if (headers.has(HEADER_X_CLUSTER_ID)) {
            const clusterId = headers.get(HEADER_X_CLUSTER_ID);
            if (clusterId && this.clusterId !== clusterId) {
                this.clusterId = clusterId as string;
            }
        }

        if (response.ok) {
            return {
                response,
                headers: headers as Map<string, string>,
                data,
            };
        }

    
        const error = data && data.error ? data.error : data
        const msg = error.message || '';

        if (this.logToConsole) {
            console.error(msg); // eslint-disable-line no-console
        }

        throw new ClientError(this.getUrl(), {
            message: msg,
            server_error_id: data.id,
            status_code: error.code,
            url,
        });
    };

    trackEvent(category: string, event: string, props?: any) {
        if (!this.isRudderKeySet) {
            return;
        }

        const properties = Object.assign({
            category,
            type: event,
            // user_actual_role: this.userRoles && isSystemAdmin(this.userRoles) ? 'system_admin, system_user' : 'system_user',
            user_actual_id: this.userId,
        }, props);
        const options = {
            context: {
                ip: '0.0.0.0',
            },
            page: {
                path: '',
                referrer: '',
                search: '',
                title: '',
                url: '',
            },
            anonymousId: '00000000000000000000000000',
        };

        // rudderAnalytics.track('event', properties, options);
    }

    changePassword = (oldPassword: string, newPassword: string)=>{
        return this.doFetch<UserProfile>(
            `${this.getAccountsRoute()}/password/changePassword`,
            {method: 'POST', body: JSON.stringify({
                oldPassword: oldPassword,
                newPassword: newPassword,
            })},
        );
    }

    verifyEmail = (email: string, code: string)=>{
        return this.doFetch<UserProfile>(
            `${this.getAccountsRoute()}/password/verify/email`,
            {method: 'POST', body: JSON.stringify({
                email: email,
                code: code,
            })},
        );
    }

    verifyMobile = (mobile: string, code: string)=>{
        return this.doFetch<UserProfile>(
            `${this.getAccountsRoute()}/password/verify/mobile`,
            {method: 'POST', body: JSON.stringify({
                mobile: mobile,
                code: code,
            })},
        );
    }

    sobject = function(objectName) {
        this.sobjects = this.sobjects || {};
        var sobject = this.sobjects[objectName] = this.sobjects[objectName] || new SObject(this, objectName);
        return sobject;
    };

    // _initLocalStorage(ROOT_URL_PATH_PREFIX){
    //     if (ROOT_URL_PATH_PREFIX) {
    //         let namespace = `:${ROOT_URL_PATH_PREFIX}`;
    //         this.LOGIN_TOKEN_KEY += namespace;
    //         this.LOGIN_TOKEN_EXPIRES_KEY += namespace;
    //         this.USER_ID_KEY += namespace;
    //       }
    // }

    // _getTokenLifetimeMs() {
    //     const loginExpirationInDays = (this.loginExpirationInDays === null) ? LOGIN_UNEXPIRING_TOKEN_DAYS : this.loginExpirationInDays;
    //     return (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
    // }

    // _tokenExpiration(when) {
    //     return new Date((new Date(when)).getTime() + this._getTokenLifetimeMs());
    // }
    
    // _storeLoginToken(userId, token, tokenExpires) {
    //     localStorage.setItem(this.USER_ID_KEY, userId);
    //     localStorage.setItem(this.LOGIN_TOKEN_KEY, token);
    //     if (! tokenExpires)
    //       tokenExpires = this._tokenExpiration(new Date());
    //       localStorage.setItem(this.LOGIN_TOKEN_EXPIRES_KEY, tokenExpires);
    
    //     this._lastLoginTokenWhenPolled = token;
    //   };
    
    // _unstoreLoginToken() {
    //     localStorage.removeItem(this.USER_ID_KEY);
    //     localStorage.removeItem(this.LOGIN_TOKEN_KEY);
    //     localStorage.removeItem(this.LOGIN_TOKEN_EXPIRES_KEY);

    //     this._lastLoginTokenWhenPolled = null;
    // };
}

function parseAndMergeNestedHeaders(originalHeaders: any) {
    const headers = new Map();
    let nestedHeaders = new Map();
    originalHeaders.forEach((val: string, key: string) => {
        const capitalizedKey = key.replace(/\b[a-z]/g, (l) => l.toUpperCase());
        let realVal = val;
        if (val && val.match(/\n\S+:\s\S+/)) {
            const nestedHeaderStrings = val.split('\n');
            realVal = nestedHeaderStrings.shift() as string;
            const moreNestedHeaders = new Map(
                nestedHeaderStrings.map((h: any) => h.split(/:\s/)),
            );
            nestedHeaders = new Map([...nestedHeaders, ...moreNestedHeaders]);
        }
        headers.set(capitalizedKey, realVal);
    });
    return new Map([...headers, ...nestedHeaders]);
}

export class ClientError extends Error implements ServerError {
    url?: string;
    intl?: {
        id: string;
        defaultMessage: string;
        values?: any;
    };
    server_error_id?: string;
    status_code?: number;

    constructor(baseUrl: string, data: ServerError) {
        super(data.message + ': ' + cleanUrlForLogging(baseUrl, data.url || ''));

        this.message = data.message;
        this.url = data.url;
        this.intl = data.intl;
        this.server_error_id = data.server_error_id;
        this.status_code = data.status_code;

        // Ensure message is treated as a property of this class when object spreading. Without this,
        // copying the object by using `{...error}` would not include the message.
        Object.defineProperty(this, 'message', {enumerable: true});
    }
}
