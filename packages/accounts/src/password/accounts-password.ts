import { trim, isEmpty, pick, isString, isPlainObject, find, includes, defer } from 'lodash';
import {
  User,
  LoginUserIdentity,
  EmailRecord,
  TokenRecord,
  DatabaseInterface,
  AuthenticationService,
  HashAlgorithm,
  ConnectionInformations,
  LoginResult,
} from '../types';
import { TwoFactor, AccountsTwoFactorOptions, getUserTwoFactorService } from '@accounts/two-factor';
import { AccountsServer, ServerHooks, generateRandomToken, generateRandomCode } from '../server';
import {
  getUserResetTokens,
  getUserVerificationTokens,
  hashPassword,
  bcryptPassword,
  verifyPassword,
  isEmail,
} from './utils';
import { PasswordCreateUserType, PasswordLoginType, PasswordType, ErrorMessages } from './types';
import { errors } from './errors';
import { getSteedosConfig } from '@steedos/objectql';
import { verifyCode, getVerifyRecord } from '../rest-express/endpoints/steedos/verify_code';
const EFFECTIVE_TIME = 10; //10分钟
const CODE_LENGTH = 6;
const MAX_FAILURE_COUNT = 10;
export interface AccountsPasswordOptions {
  /**
   * Two factor options passed down to the @accounts/two-factor service.
   */
  twoFactor?: AccountsTwoFactorOptions;
  passwordHashAlgorithm?: HashAlgorithm;
  /**
   * The number of milliseconds from when a link to verify the user email is sent until token expires and user can't verify his email with the link anymore.
   * Defaults to 3 days.
   */
  verifyEmailTokenExpiration?: number;
  /**
   * The number of milliseconds from when a link to reset password is sent until token expires and user can't reset password with the link anymore.
   * Defaults to 3 days.
   */
  passwordResetTokenExpiration?: number;
  /**
   * The number of milliseconds from when a link to set inital password is sent until token expires and user can't set password with the link anymore.
   * Defaults to 30 days.
   */
  passwordEnrollTokenExpiration?: number;
  /**
   * Accounts password module errors
   */
  errors?: ErrorMessages;
  /**
   * Notify a user after his password has been changed.
   * This email is sent when the user reset his password and when he change it.
   * Default to true.
   */
  notifyUserAfterPasswordChanged?: boolean;
  /**
   * Default to false.
   */
  returnTokensAfterResetPassword?: boolean;
  /**
   * Invalidate existing sessions after password has been reset
   * Default to true.
   */
  invalidateAllSessionsAfterPasswordReset?: boolean;
  /**
   * Invalidate existing sessions after password has been changed
   * Default to false.
   */
  invalidateAllSessionsAfterPasswordChanged?: boolean;
  /**
   * Will automatically send a verification email after signup.
   * Default to false.
   */
  sendVerificationEmailAfterSignup?: boolean;
  /**
   * Function that will validate the user object during `createUser`.
   * The user returned from this function will be directly inserted in the database so be careful when you whitelist the fields,
   * By default we only allow `username`, `email` and `password` fields.
   */
  validateNewUser?: (
    user: PasswordCreateUserType
  ) => Promise<PasswordCreateUserType> | PasswordCreateUserType;
  /**
   * Function that check if the email is a valid email.
   * This function will be called when you call `createUser` and `addEmail`.
   */
  validateEmail?(email?: string): boolean;
  /**
   * Function that check if the password is valid.
   * This function will be called when you call `createUser` and `changePassword`.
   */
  validatePassword?(password?: PasswordType): boolean;
  /**
   * Function that check if the username is a valid username.
   * This function will be called when you call `createUser`.
   */
  validateUsername?(username?: string): boolean;
}

const defaultOptions = {
  // 3 days - 3 * 24 * 60 * 60 * 1000
  verifyEmailTokenExpiration: 259200000,
  // 3 days - 3 * 24 * 60 * 60 * 1000
  passwordResetTokenExpiration: 259200000,
  // 30 days - 30 * 24 * 60 * 60 * 1000
  passwordEnrollTokenExpiration: 2592000000,
  notifyUserAfterPasswordChanged: true,
  returnTokensAfterResetPassword: false,
  invalidateAllSessionsAfterPasswordReset: true,
  invalidateAllSessionsAfterPasswordChanged: false,
  validateEmail(email?: string): boolean {
    return !isEmpty(trim(email)) && isEmail(email);
  },
  validatePassword(password?: PasswordType): boolean {
    return !isEmpty(password);
  },
  validateUsername(username?: string): boolean {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
    const isValid = username && !isEmpty(trim(username)) && usernameRegex.test(username);
    return Boolean(isValid);
  },
  errors,
  sendVerificationEmailAfterSignup: false,
};

const getPathFragmentPrefix = function(){
  const config = getSteedosConfig().email;
  const defaultPathPrefix = 'accounts/a/#';
  let pathFragmentPrefix = config && config.pathFragmentPrefix ? config.pathFragmentPrefix : defaultPathPrefix;
  if(pathFragmentPrefix && !/\/$/.test(pathFragmentPrefix)){
    pathFragmentPrefix += "/";
  }
  return pathFragmentPrefix;
}

export default class AccountsPassword implements AuthenticationService {
  public serviceName = 'password';
  public server!: AccountsServer;
  public twoFactor: TwoFactor;
  private options: AccountsPasswordOptions & typeof defaultOptions;
  private db!: DatabaseInterface;

  constructor(options: AccountsPasswordOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.twoFactor = new TwoFactor(options.twoFactor);
  }

  public setStore(store: DatabaseInterface) {
    this.db = store;
    // this.twoFactor.setStore(store);
  }

  public async authenticate(params: any): Promise<User> {
    const { user, password, token, locale } = params;

    if(user && token){
      return await this.codeAuthenticator(user, token, locale);
    }

    if (!user || !password) {
      throw new Error(this.options.errors.unrecognizedOptionsForLogin);
    }

    if ((!isString(user) && !isPlainObject(user)) || !isString(password)) {
      throw new Error(this.options.errors.matchFailed);
    }

    const foundUser = await this.passwordAuthenticator(user, password);

    // // If user activated two factor authentication try with the code
    // if (getUserTwoFactorService(foundUser)) {
    //   await this.twoFactor.authenticate(foundUser, code!);
    // }

    return foundUser;
  }

  /**
   * @description Find a user by one of his emails.
   * @param {string} email - User email.
   * @returns {Promise<Object>} - Return a user or null if not found.
   */
  public findUserByEmail(email: string): Promise<User | null> {
    return this.db.findUserByEmail(email);
  }

  /**
   * @description Find a user by his username.
   * @param {string} username - User username.
   * @returns {Promise<Object>} - Return a user or null if not found.
   */
  public findUserById(id: string): Promise<User | null> {
    return this.db.findUserById(id);
  }

  /**
   * @description Find a user by his username.
   * @param {string} username - User username.
   * @returns {Promise<Object>} - Return a user or null if not found.
   */
  public findUserByUsername(username: string): Promise<User | null> {
    return this.db.findUserByUsername(username);
  }

  public async getInviteInfo(id: string): Promise<any> {
    return await this.db.getInviteInfo(id);
  }

  /**
   * @description Add an email address for a user.
   * It will trigger the `validateEmail` option and throw if email is invalid.
   * Use this instead of directly updating the database.
   * @param {string} userId - User id.
   * @param {string} newEmail - A new email address for the user.
   * @param {boolean} [verified] - Whether the new email address should be marked as verified.
   * Defaults to false.
   * @returns {Promise<void>} - Return a Promise.
   */
  public addEmail(userId: string, newEmail: string, verified: boolean): Promise<void> {
    if (!this.options.validateEmail(newEmail)) {
      throw new Error(this.options.errors.invalidEmail);
    }
    return this.db.addEmail(userId, newEmail, verified);
  }

  /**
   * @description Remove an email address for a user.
   * Use this instead of directly updating the database.
   * @param {string} userId - User id.
   * @param {string} email - The email address to remove.
   * @returns {Promise<void>} - Return a Promise.
   */
  public removeEmail(userId: string, email: string): Promise<void> {
    return this.db.removeEmail(userId, email);
  }

  /**
   * @description Marks the user's email address as verified.
   * @param {string} token - The token retrieved from the verification URL.
   * @returns {Promise<void>} - Return a Promise.
   */
  public async verifyEmail(token: string): Promise<void> {
    if (!token || !isString(token)) {
      throw new Error(this.options.errors.invalidToken);
    }

    const user = await this.db.findUserByEmailVerificationToken(token);
    if (!user) {
      throw new Error(this.options.errors.verifyEmailLinkExpired);
    }

    const verificationTokens = getUserVerificationTokens(user);
    const tokenRecord = find(verificationTokens, (t: TokenRecord) => t.token === token);
    if (!tokenRecord || this.isTokenExpired(tokenRecord, this.options.verifyEmailTokenExpiration)) {
      throw new Error(this.options.errors.verifyEmailLinkExpired);
    }

    const emailRecord = find(user.emails, (e: EmailRecord) => e.address === tokenRecord.address);
    if (!emailRecord) {
      throw new Error(this.options.errors.verifyEmailLinkUnknownAddress);
    }
    await this.db.verifyEmail(user.id, emailRecord.address);
  }

  /**
   * @description Reset the password for a user using a token received in email.
   * @param {string} token - The token retrieved from the reset password URL.
   * @param {string} newPassword - A new password for the user.
   * @returns {Promise<LoginResult | null>} - If `returnTokensAfterResetPassword` option is true return the session tokens and user object, otherwise return null.
   */
  public async resetPassword(
    token: string,
    newPassword: PasswordType,
    infos: ConnectionInformations
  ): Promise<LoginResult | null> {
    if (!token || !isString(token)) {
      throw new Error(this.options.errors.invalidToken);
    }
    if (!newPassword || !isString(newPassword)) {
      throw new Error(this.options.errors.invalidNewPassword);
    }

    const user = await this.db.findUserByResetPasswordToken(token);
    if (!user) {
      throw new Error(this.options.errors.resetPasswordLinkExpired);
    }

    const resetTokens = getUserResetTokens(user);
    const resetTokenRecord = find(resetTokens, t => t.token === token);

    if (
      !resetTokenRecord ||
      this.isTokenExpired(
        resetTokenRecord,
        resetTokenRecord.reason === 'enroll'
          ? this.options.passwordEnrollTokenExpiration
          : this.options.passwordResetTokenExpiration
      )
    ) {
      throw new Error(this.options.errors.resetPasswordLinkExpired);
    }

    const emails = user.emails || [];
    if (
      !includes(
        emails.map((email: EmailRecord) => email.address),
        resetTokenRecord.address
      )
    ) {
      throw new Error(this.options.errors.resetPasswordLinkUnknownAddress);
    }

    const password = await this.hashAndBcryptPassword(newPassword);
    // Change the user password and remove the old token
    await this.db.setResetPassword(user.id, resetTokenRecord.address, password, token);

    this.server.getHooks().emit(ServerHooks.ResetPasswordSuccess, user);

    // If user clicked on an enrollment link we can verify his email
    if (resetTokenRecord.reason === 'enroll') {
      await this.db.verifyEmail(user.id, resetTokenRecord.address);
    }

    // Changing the password should invalidate existing sessions
    if (this.options.invalidateAllSessionsAfterPasswordReset) {
      await this.db.invalidateAllSessions(user.id);
    }

    if (this.options.notifyUserAfterPasswordChanged) {
      const address = user.emails && user.emails[0].address;
      if (address) {
        const passwordChangedMail = this.server.prepareMail(
          address,
          '',
          this.server.sanitizeUser(user),
          '',
          this.server.options.emailTemplates.passwordChanged,
          this.server.options.emailTemplates.from
        );
        await this.server.options.sendMail(passwordChangedMail);
      }
    }

    if (this.options.returnTokensAfterResetPassword) {
      return this.server.loginWithUser(user, infos);
    }
    return null;
  }

  /**
   * @description Change the password for a user.
   * @param {string} userId - User id.
   * @param {string} newPassword - A new password for the user.
   * @returns {Promise<void>} - Return a Promise.
   */
  public async setPassword(userId: string, newPassword: string): Promise<void> {
    const password = await bcryptPassword(newPassword);
    return this.db.setPassword(userId, password);
  }

  /**
   * @description Change the current user's password.
   * It will trigger the `validatePassword` option and throw if password is invalid.
   * @param {string} userId - User id.
   * @param {string} oldPassword - The user's current password.
   * @param {string} newPassword - A new password for the user.
   * @returns {Promise<void>} - Return a Promise.
   */
  public async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!this.options.validatePassword(newPassword)) {
      throw new Error(this.options.errors.invalidPassword);
    }

    const user = await this.passwordAuthenticator({ id: userId }, oldPassword);

    const password = await bcryptPassword(newPassword);
    await this.db.setPassword(userId, password);

    this.server.getHooks().emit(ServerHooks.ChangePasswordSuccess, user);

    if (this.options.invalidateAllSessionsAfterPasswordChanged) {
      await this.db.invalidateAllSessions(user.id);
    }

    if (this.options.notifyUserAfterPasswordChanged) {
      const address = user.emails && user.emails[0].address;
      if (address) {
        const passwordChangedMail = this.server.prepareMail(
          address,
          '',
          this.server.sanitizeUser(user),
          '',
          this.server.options.emailTemplates.passwordChanged,
          this.server.options.emailTemplates.from
        );
        await this.server.options.sendMail(passwordChangedMail);
      }
    }
  }

  /**
   * @description Send an email with a link the user can use verify their email address.
   * @param {string} [address] - Which address of the user's to send the email to.
   * This address must be in the user's emails list.
   * Defaults to the first unverified email in the list.
   * If the address is already verified we do not send any email.
   * @returns {Promise<void>} - Return a Promise.
   */
  public async sendVerificationEmail(address: string): Promise<void> {
    if (!address || !isString(address)) {
      throw new Error(this.options.errors.invalidEmail);
    }

    const user = await this.db.findUserByEmail(address);
    if (!user) {
      // To prevent user enumeration we fail silently
      if (this.server.options.ambiguousErrorMessages) {
        return;
      }
      throw new Error(this.options.errors.userNotFound);
    }

    //Do not send an email if the address is already verified
    if (user.email_verified)
      return

    const code = generateRandomCode();
    const token = generateRandomToken();
    await this.db.addEmailVerificationToken(user.id, address, token, code);

    const resetPasswordMail = this.server.prepareMail(
      address,
      code,
      this.server.sanitizeUser(user),
      getPathFragmentPrefix() + 'verify-email',
      this.server.options.emailTemplates.verifyEmail,
      this.server.options.emailTemplates.from
    );

    await this.server.options.sendMail(resetPasswordMail);
  }

  /**
   * @description Send an email with a link the user can use to reset their password.
   * @param {string} [address] - Which address of the user's to send the email to.
   * This address must be in the user's emails list.
   * Defaults to the first email in the list.
   * @returns {Promise<void>} - Return a Promise.
   */
  public async sendResetPasswordEmail(address: string): Promise<void> {
    if (!address || !isString(address)) {
      throw new Error(this.options.errors.invalidEmail);
    }

    const user = await this.db.findUserByEmail(address);
    if (!user) {
      // To prevent user enumeration we fail silently
      if (this.server.options.ambiguousErrorMessages) {
        return;
      }
      throw new Error(this.options.errors.userNotFound);
    }
    const token = generateRandomToken();
    await this.db.addResetPasswordToken(user.id, address, token, 'reset');

    const resetPasswordMail = this.server.prepareMail(
      address,
      token,
      this.server.sanitizeUser(user),
      getPathFragmentPrefix() + 'reset-password',
      this.server.options.emailTemplates.resetPassword,
      this.server.options.emailTemplates.from
    );

    await this.server.options.sendMail(resetPasswordMail);
  }

  /**
   * @description Send an email with a link the user can use to set their initial password.
   * The user's email will be verified after clicking on the link.
   * @param {string} [address] - Which address of the user's to send the email to.
   * This address must be in the user's emails list.
   * Defaults to the first email in the list.
   * @returns {Promise<void>} - Return a Promise.
   */
  public async sendEnrollmentEmail(address: string): Promise<void> {
    if (!address || !isString(address)) {
      throw new Error(this.options.errors.invalidEmail);
    }

    const user = await this.db.findUserByEmail(address);
    if (!user) {
      throw new Error(this.options.errors.userNotFound);
    }
    const token = generateRandomToken();
    await this.db.addResetPasswordToken(user.id, address, token, 'enroll');

    const enrollmentMail = this.server.prepareMail(
      address,
      token,
      this.server.sanitizeUser(user),
      getPathFragmentPrefix() + 'enroll-account',
      this.server.options.emailTemplates.enrollAccount,
      this.server.options.emailTemplates.from
    );

    await this.server.options.sendMail(enrollmentMail);
  }

  /**
   * @description Create a new user.
   * @param user - The user object.
   * @returns Return the id of user created.
   */
  public async createUser(user: PasswordCreateUserType): Promise<string> {
    if (!user.email && !user.mobile) {
      throw new Error(this.options.errors.emailOrMobileRequired);
    }

    if (user.username && !this.options.validateUsername(user.username)) {
      throw new Error(this.options.errors.invalidUsername);
    }

    if (user.email && !this.options.validateEmail(user.email)) {
      throw new Error(this.options.errors.invalidEmail);
    }

    if (user.mobile && (await this.db.findUserByMobile(user.mobile))) {
      throw new Error(this.options.errors.mobileAlreadyExists);
    }

    if (user.username && (await this.db.findUserByUsername(user.username))) {
      throw new Error(this.options.errors.usernameAlreadyExists);
    }

    if (user.email && (await this.db.findUserByEmail(user.email))) {
      throw new Error(this.options.errors.emailAlreadyExists);
    }

    if (user.password) {
      if (!this.options.validatePassword(user.password)) {
        throw new Error(this.options.errors.invalidPassword);
      }
      user.password = await this.hashAndBcryptPassword(user.password);
    }

    if (user.verifyCode) {
      const r = await this.db.checkVerificationCode(user, user.verifyCode);
      if (!r) {
        throw new Error(this.options.errors.invalidVerifyCode);
      }
      delete user.verifyCode;
      if (user.email)
        user.email_verified = true
      if (user.mobile)
        user.mobile_verified = true
    }

    // // If user does not provide the validate function only allow some fields
    // user = this.options.validateNewUser
    //   ? await this.options.validateNewUser(user)
    //   : pick<PasswordCreateUserType, 'username' | 'email' | 'password' | 'mobile' | 'locale'>(user, [
    //       'username',
    //       'email',
    //       'password',
    //       'mobile',
    //       'locale'
    //     ]);

    try {
      const userId = await this.db.createUser(user);
      defer(async () => {
        if (this.options.sendVerificationEmailAfterSignup && user.email && !user.email_verified)
          this.sendVerificationEmail(user.email);

        const userRecord = (await this.db.findUserById(userId)) as User;
        this.server.getHooks().emit(ServerHooks.CreateUserSuccess, userRecord);
      });

      return userId;
    } catch (e) {
      await this.server.getHooks().emit(ServerHooks.CreateUserError, user);
      throw e;
    }
  }

  public isTokenExpired(tokenRecord: TokenRecord, expiryDate: number): boolean {
    return Number(tokenRecord.when) + expiryDate < Date.now();
  }

  public async verifyUserPasswordByEmail(email, password){
    return await this.passwordAuthenticator({email: email}, password);
  }

  public async passwordAuthenticator(
    user: string | LoginUserIdentity,
    password: PasswordType
  ): Promise<User> {
    const { username, email, id, mobile } = isString(user)
      ? this.toMobileAndEmail({ user })
      : this.toMobileAndEmail({ ...user });

    let foundUser: User | null = null;

    if (id) {
      // this._validateLoginWithField('id', user);
      foundUser = await this.db.findUserById(id);
    } else if (username) {
      // this._validateLoginWithField('username', user);
      foundUser = await this.db.findUserByUsername(username);
    } else if (mobile) {
      // this._validateLoginWithField('username', user);
      foundUser = await this.db.findUserByMobile(mobile);
    } else if (email) {
      // this._validateLoginWithField('email', user);
      foundUser = await this.db.findUserByEmail(email);
    }

    if (!foundUser) {
      throw new Error(
        this.server.options.ambiguousErrorMessages
          ? this.options.errors.invalidCredentials
          : this.options.errors.userNotFound
      );
    }

    const hash = await this.db.findPasswordHash(foundUser.id);
    if (!hash) {
      throw new Error(this.options.errors.noPasswordSet);
    }

    const hashAlgorithm = this.options.passwordHashAlgorithm;
    const pass: any = hashAlgorithm ? hashPassword(password, hashAlgorithm) : password;
    const isPasswordValid = await verifyPassword(pass, hash);

    if (!isPasswordValid) {
      throw new Error(
        this.server.options.ambiguousErrorMessages
          ? this.options.errors.invalidCredentials
          : this.options.errors.incorrectPassword
      );
    }

    return foundUser;
  }

  private async codeAuthenticator(
    user, token, locale
  ): Promise<User> {
    const { username, email, mobile, id } = isString(user)
      ? this.toMobileAndEmail({ user })
      : this.toMobileAndEmail({ ...user });
    
    let foundUser = await this.db.findUserByVerificationCode({email: email, mobile: mobile}, token);
    if (!foundUser) {
      throw new Error(
        this.server.options.ambiguousErrorMessages
          ? this.options.errors.invalidCode
          : this.options.errors.userNotFound
      );
    }
    return foundUser;
  }

  private async hashAndBcryptPassword(password: PasswordType): Promise<string> {
    const hashAlgorithm = this.options.passwordHashAlgorithm;
    const hashedPassword: any = hashAlgorithm ? hashPassword(password, hashAlgorithm) : password;
    return bcryptPassword(hashedPassword);
  }

  /**
   * Given a username, user and/or email figure out the username and/or email.
   *
   * @param user An object containing at least `username`, `user` and/or `email`.
   * @returns An object containing `id`, `username` and `email`.
   */
  private toMobileAndEmail({ user, username, email, mobile, id }: any): any {
    if (user && !username && !email && !mobile) {
      if (isEmail(user)) {
        email = user;
      } else {
        mobile = user;
      }
    }
    return { username, email, mobile, id };
  }


  /**
   * @description Send an email with a link the user can use verify their email address.
   * @param {string} [address] - Which address of the user's to send the email to.
   * This address must be in the user's emails list.
   * Defaults to the first unverified email in the list.
   * If the address is already verified we do not send any email.
   * @returns {Promise<void>} - Return a Promise.
   */
  public async sendVerificationCode(user: any): Promise<void> {


    const code = generateRandomCode();

    if (user.email) {
      const result: any = await this.db.addVerificationCode(user, code, {MAX_FAILURE_COUNT, EFFECTIVE_TIME});
      const verificationCodeMail = this.server.prepareMail(
        user.email,
        result.code,
        null,
        getPathFragmentPrefix() + 'verify-email',
        this.server.options.emailTemplates.verificationCode,
        this.server.options.emailTemplates.from
      );
      await this.server.options.sendMail(verificationCodeMail);
      return result.owner
    } else if (user.mobile) {
      const result: any = await this.db.addVerificationCode(user, code, {MAX_FAILURE_COUNT, EFFECTIVE_TIME});
      const sms = {
        mobile: user.mobile,
        message: `验证码：${result.code}，${EFFECTIVE_TIME}分钟内有效，请勿泄漏给他人！`
      }
      await this.server.options.sendSMS(sms);
      return result.owner
    }

  }
}
