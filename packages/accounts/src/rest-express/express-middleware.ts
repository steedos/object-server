import { providerCallback } from './endpoints/oauth/provider-callback';
import { resetPassword, sendResetPasswordEmail } from './endpoints/password/reset';
import { verifyEmail, sendVerificationEmail, sendVerificationCode } from './endpoints/password/verify-email';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
var cookie = require('cookie-parser');
import { AccountsServer } from '../server';
import { refreshAccessToken } from './endpoints/refresh-access-token';
import { getUser } from './endpoints/get-user';
import { impersonate } from './endpoints/impersonate';
import { authorize } from './endpoints/authorize';
import { logout } from './endpoints/logout';
import { serviceAuthenticate } from './endpoints/service-authenticate';
import { updateSession } from './endpoints/update-session';
import { registerPassword } from './endpoints/password/register';
import { twoFactorSecret, twoFactorSet, twoFactorUnset } from './endpoints/password/two-factor';
import { changePassword } from './endpoints/password/change-password';
import { userLoader } from './user-loader';
import { AccountsExpressOptions } from './types';
import { getTenant } from './endpoints/steedos/get-tenant';
import { createTenant } from './endpoints/steedos/create-tenant';
import { getSettings } from './endpoints/steedos/settings';
import { applyCode, getUserIdByToken } from './endpoints/steedos/verify_code';
import { changeUserFullname } from './endpoints/put-user-name';
import { login } from './endpoints/login';
import { getMySpaces } from './endpoints/spaces';


const defaultOptions: AccountsExpressOptions = {
  path: '/accounts',
};

const accountsExpress = (
  accountsServer: AccountsServer,
  options: AccountsExpressOptions = {}
): express.Router => {
  options = { ...defaultOptions, ...options };
  let { path } = options;

  // Stop invalid double slash root path
  if (path === '/') {
    path = '';
  }

  const router = express.Router();
  router.use(cookieParser());
  router.post(`${path}/impersonate`, impersonate(accountsServer));

  router.get(`${path}/authorize`, userLoader(accountsServer), authorize(accountsServer));

  router.get(`${path}/user`, userLoader(accountsServer), getUser(accountsServer));
  router.post(`${path}/user`, userLoader(accountsServer), getUser(accountsServer));
  router.put(`${path}/user`, userLoader(accountsServer), changeUserFullname(accountsServer));
  router.get(`${path}/user/spaces`, userLoader(accountsServer), getMySpaces(accountsServer));
  router.post(`${path}/code/apply`, applyCode(accountsServer));
  router.get(`${path}/code/id`, getUserIdByToken());
  
  router.get(`${path}/settings`, userLoader(accountsServer), getSettings(accountsServer));
  router.get(`${path}/tenant/:id`, userLoader(accountsServer), getTenant(accountsServer));
  // router.post(`${path}/tenant`, userLoader(accountsServer), createTenant(accountsServer));

  router.post(`${path}/refreshTokens`, refreshAccessToken(accountsServer));

  router.post(`${path}/logout`, userLoader(accountsServer), logout(accountsServer));

  router.post(`${path}/:service/authenticate`, serviceAuthenticate(accountsServer));

  router.post(`${path}/:service/session`, userLoader(accountsServer), updateSession(accountsServer));

  const services = accountsServer.getServices();

  // @accounts/password
  if (services.password) {


    router.post(`${path}/password/login`, login(accountsServer));
    router.post(`${path}/password/register`, registerPassword(accountsServer));

    router.post(`${path}/password/verifyEmail`, verifyEmail(accountsServer));

    router.post(`${path}/password/resetPassword`, resetPassword(accountsServer));

    router.post(`${path}/password/sendVerificationEmail`, sendVerificationEmail(accountsServer));

    router.post(`${path}/password/sendVerificationCode`, sendVerificationCode(accountsServer));

    router.post(`${path}/password/sendResetPasswordEmail`, sendResetPasswordEmail(accountsServer));

    // router.post(`${path}/password/verify/email`, todo(accountsServer)); TODO
    // router.post(`${path}/password/verify/mobile`, todo(accountsServer)); TODO
    
    router.post(
      `${path}/password/changePassword`,
      userLoader(accountsServer),
      changePassword(accountsServer)
    );

  }

  // @accounts/oauth
  if (services.oauth) {
    router.get(`${path}/oauth/:provider/callback`, providerCallback(accountsServer, options));
  }

  return router;
};

export default accountsExpress;
