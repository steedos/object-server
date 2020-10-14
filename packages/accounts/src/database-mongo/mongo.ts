// tslint:disable variable-name _id
import {
  ConnectionInformations,
  CreateUser,
  DatabaseInterface,
  Session,
  User,
} from '../types';
import { get, merge, trim, map } from 'lodash';
import { Collection, Db, ObjectID } from 'mongodb';

import { AccountsMongoOptions, MongoUser } from './types';
import { getSessionByUserId, hashStampedToken } from '@steedos/auth';
const moment = require('moment');

const toMongoID = (objectId: string | ObjectID) => {
  if (typeof objectId === 'string') {
    return new ObjectID(objectId);
  }
  return objectId;
};

const defaultOptions = {
  collectionName: 'users',
  sessionCollectionName: 'sessions',
  codeCollectionName: 'users_verify_code',
  inviteCollectionName: 'space_users_invite',
  spaceUserCollectionName: 'space_users',
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  convertUserIdToMongoObjectId: false,
  convertSessionIdToMongoObjectId: false,
  caseSensitiveUserName: true,
  dateProvider: (date?: Date) => (date ? date.getTime() : Date.now()),
};

export class Mongo implements DatabaseInterface {
  // Options of Mongo class
  private options: AccountsMongoOptions & typeof defaultOptions;
  // Db object
  private db: Db;
  // Account collection
  private collection: Collection;
  // Session collection
  private sessionCollection: Collection;
  // Code collection
  private codeCollection: Collection;

  private inviteCollection: Collection;

  private spaceUserCollection: Collection;

  constructor(db: any, options?: AccountsMongoOptions) {
    this.options = merge({ ...defaultOptions }, options);
    if (!db) {
      throw new Error('A database connection is required');
    }
    this.db = db;
    this.collection = this.db.collection(this.options.collectionName);
    this.sessionCollection = this.db.collection(this.options.sessionCollectionName);
    this.codeCollection = this.db.collection(this.options.codeCollectionName);
    this.inviteCollection = this.db.collection(this.options.inviteCollectionName);
    this.spaceUserCollection = this.db.collection(this.options.spaceUserCollectionName);
  }

  public async setupIndexes(): Promise<void> {
    await this.sessionCollection.createIndex('token', {
      unique: true,
      sparse: true,
    });
    await this.collection.createIndex('username', {
      unique: true,
      sparse: true,
    });
    await this.collection.createIndex('emails.address', {
      unique: true,
      sparse: true,
    });
  }

  public async createUser({
    password,
    username,
    email,
    email_verified,
    mobile,
    mobile_verified,
    ...cleanUser
  }: CreateUser): Promise<string> {
    const user: MongoUser = {
      ...cleanUser,
      services: {},
      [this.options.timestamps.createdAt]: this.options.dateProvider(),
      [this.options.timestamps.updatedAt]: this.options.dateProvider(),
    };
    if (password) {
      user.services.password = { bcrypt: password };
    }
    if (username) {
      user.username = username;
    }
    if (email) {
      user.email = email.toLowerCase();
      user.email_verified = email_verified;
      user.emails = [{ address: email.toLowerCase(), verified: email_verified }];
    }

    if(mobile){
      user.mobile = mobile;
      user.mobile_verified = mobile_verified;
    }

    if (this.options.idProvider) {
      user._id = this.options.idProvider();
    }

    user.steedos_id = user._id;
    const ret = await this.collection.insertOne(user);
    return ret.ops[0]._id.toString();
  }

  public async findUserById(userId: string): Promise<User | null> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    const user = await this.collection.findOne({ _id: id });
    if (user) {
      user.id = user._id.toString();
    }
    return user;
  }

  public async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.collection.findOne({
      'email': email.toLowerCase(),
    });
    if (user) {
      user.id = user._id.toString();
    }
    return user;
  }

  public async findUserByMobile(mobile: string): Promise<User | null> {
    const user = await this.collection.findOne({
      'mobile': mobile,
    });
    if (user) {
      user.id = user._id.toString();
    }
    return user;
  }

  public async findUserByUsername(username: string): Promise<User | null> {
    const filter = this.options.caseSensitiveUserName
      ? { username }
      : {
          $where: `obj.username && (obj.username.toLowerCase() === "${username.toLowerCase()}")`,
        };
    const user = await this.collection.findOne(filter);
    if (user) {
      user.id = user._id.toString();
    }
    return user;
  }

  public async findPasswordHash(userId: string): Promise<string | null> {
    const user = await this.findUserById(userId);
    if (user) {
      return get(user, 'services.password.bcrypt');
    }
    return null;
  }

  public async findUserByEmailVerificationToken(token: string): Promise<User | null> {
    const user = await this.collection.findOne({
      'services.email.verificationTokens.token': token,
    });
    if (user) {
      user.id = user._id.toString();
    }
    return user;
  }

  public async findUserByResetPasswordToken(token: string): Promise<User | null> {
    const user = await this.collection.findOne({
      'services.password.reset.token': token,
    });
    if (user) {
      user.id = user._id.toString();
    }
    return user;
  }

  public async findUserByServiceId(serviceName: string, serviceId: string): Promise<User | null> {
    const user = await this.collection.findOne({
      [`services.${serviceName}.id`]: serviceId,
    });
    if (user) {
      user.id = user._id.toString();
    }
    return user;
  }

  // public async findUserByMobile(mobile: string): Promise<User | null>{

  //   if(!/^\+\d+/g.test(mobile)){
  //     mobile = "+86" + mobile;
  //   }

  //   const user = await this.collection.findOne({
  //     'phone.number': mobile,
  //   });
  //   if (user) {
  //     user.id = user._id.toString();
  //   }
  //   return user;
  // }

  public async addEmail(userId: string, newEmail: string, verified: boolean): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    const ret = await this.collection.updateOne(
      { _id: id },
      {
        $addToSet: {
          emails: {
            address: newEmail.toLowerCase(),
            verified,
          },
        },
        $set: {
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
      }
    );
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  public async removeEmail(userId: string, email: string): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    const ret = await this.collection.updateOne(
      { _id: id },
      {
        $pull: { emails: { address: email.toLowerCase() } },
        $set: {
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
      }
    );
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  public async verifyEmail(userId: string, email: string): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    const ret = await this.collection.updateOne(
      { _id: id, 'email': email },
      {
        $set: {
          'email_verified': true,
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
        $pull: { 'services.email.verificationTokens': { address: email } },
      }
    );
    await this.spaceUserCollection.updateMany({user: id}, {$set: {email_verified: true, modified: this.options.dateProvider(), modified_by: id}})
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  public async verifyMobile(userId: string, mobile: string): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    const ret = await this.collection.updateOne(
      { _id: id, 'mobile': mobile },
      {
        $set: {
          'mobile_verified': true,
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
        $pull: { 'services.mobile.verificationTokens': { mobile: mobile } },
      }
    );
    await this.spaceUserCollection.updateMany({user: id}, {$set: {mobile_verified: true, modified: this.options.dateProvider(), modified_by: id}})
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  public async setMobile(userId: string, newMobile: string): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    let existed = await this.collection.find({_id: {$ne: id}, mobile: newMobile}).count();
    if(existed > 0){
      throw new Error("该手机号已被其他用户注册");
    }
    let user = await this.collection.findOne({_id: id}, {fields: {mobile: 1}});
    if(user && user.mobile != newMobile){
      const ret = await this.collection.updateOne(
        { _id: id},
        {
          $set: {
            'mobile': newMobile,
            [this.options.timestamps.updatedAt]: this.options.dateProvider(),
          },
          $pull: { 'services.mobile.verificationTokens': { mobile: newMobile } },
        }
      );
      await this.spaceUserCollection.updateMany({user: id}, {$set: {mobile: newMobile, modified: this.options.dateProvider(), modified_by: id}})
      
    }
    if(!user){
      throw new Error('User not found');
    }
  }

  public async setEmail(userId: string, newEmail: string): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    let existed = await this.collection.find({_id: {$ne: id}, email: newEmail}).count();
    if(existed > 0){
      throw new Error("该邮箱已被其他用户注册");
    }
    let user = await this.collection.findOne({_id: id}, {fields: {email: 1}});
    if(user && user.email != newEmail){
      const ret = await this.collection.updateOne(
        { _id: id},
        {
          $set: {
            'email': newEmail,
            [this.options.timestamps.updatedAt]: this.options.dateProvider(),
          },
          $pull: { 'services.email.verificationTokens': { address: newEmail } },
        }
      );
      await this.spaceUserCollection.updateMany({user: id}, {$set: {email: newEmail, modified: this.options.dateProvider(), modified_by: id}})
      
    }
    if(!user){
      throw new Error('User not found');
    }
  }


  public async setUsername(userId: string, newUsername: string): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    const ret = await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          username: newUsername,
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
      }
    );
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  public async setPassword(userId: string, newPassword: string): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    const ret = await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          'services.password.bcrypt': newPassword,
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
        $unset: {
          'services.password.reset': '',
        },
      }
    );
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  public async setService(userId: string, serviceName: string, service: object): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          [`services.${serviceName}`]: service,
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
      }
    );
  }

  public async unsetService(userId: string, serviceName: string): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
        $unset: {
          [`services.${serviceName}`]: '',
        },
      }
    );
  }

  public async setUserDeactivated(userId: string, deactivated: boolean): Promise<void> {
    const id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          deactivated,
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
      }
    );
  }

  private resolveInfo(connection: ConnectionInformations= {}){
    let ip = connection.ip;
    let userAgent = connection.userAgent;
    let space = '';
    if(userAgent){
      const foo = userAgent.split(' Space/');
      if(foo.length > 1){
        userAgent = foo[0];
        space =  foo[1];
      }
    }

    if(space){
      return { ip, userAgent, space }
    }

    return { ip, userAgent }
  }

  public async createSession(
    userId: string,
    token: string,
    connection: ConnectionInformations = {},
    extraData?: object
  ): Promise<string> {
    const infos = this.resolveInfo(connection);
    const session: any = {
      userId,
      token,
      ...infos,
      extraData,
      valid: true,
      [this.options.timestamps.createdAt]: this.options.dateProvider(),
      [this.options.timestamps.updatedAt]: this.options.dateProvider(),
    };

    if (this.options.idProvider) {
      session._id = this.options.idProvider();
    }

    const ret = await this.sessionCollection.insertOne(session);
    await this.updateMeteorSession(userId, token)
    return ret.ops[0]._id.toString();
  }

  public async updateSession(sessionId: string, connection: ConnectionInformations): Promise<void> {
    const _id = this.options.convertSessionIdToMongoObjectId ? toMongoID(sessionId) : sessionId;
    const infos = this.resolveInfo(connection);
    let _set = {
      userAgent: infos.userAgent,
      ip: infos.ip,
      [this.options.timestamps.updatedAt]: this.options.dateProvider(),
    }
    if(infos.space){
      _set.space = infos.space
    }

    await this.sessionCollection.updateOne(
      { _id },
      {
        $set: _set,
      }
    );
  }

  public async invalidateSession(sessionId: string): Promise<void> {
    const _id = this.options.convertSessionIdToMongoObjectId ? toMongoID(sessionId) : sessionId;
    await this.sessionCollection.updateOne(
      { _id },
      {
        $set: {
          valid: false,
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
      }
    );
    const session: any = await this.sessionCollection.findOne({_id: _id});
    await this.destroyMeteorToken(session.userId, session.token);
  }

  public async invalidateAllSessions(userId: string): Promise<void> {
    await this.sessionCollection.updateMany(
      { userId },
      {
        $set: {
          valid: false,
          [this.options.timestamps.updatedAt]: this.options.dateProvider(),
        },
      }
    );
  }

  public async findSessionByToken(token: string): Promise<Session | null> {
    const session = await this.sessionCollection.findOne({ token });
    if (session) {
      session.id = session._id.toString();
    }
    return session;
  }

  public async findSessionById(sessionId: string): Promise<Session | null> {
    const _id = this.options.convertSessionIdToMongoObjectId ? toMongoID(sessionId) : sessionId;
    const session = await this.sessionCollection.findOne({ _id });
    if (session) {
      session.id = session._id.toString();
    }
    return session;
  }

  public async addEmailVerificationToken(
    userId: string,
    email: string,
    token: string,
  ): Promise<void> {
    const _id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    await this.collection.updateOne(
      { _id },
      {
        $push: {
          'services.email.verificationTokens': {
            token,
            address: email.toLowerCase(),
            when: this.options.dateProvider(),
          },
        },
      }
    );
  }
  

  public async addResetPasswordToken(
    userId: string,
    email: string,
    token: string,
    reason: string
  ): Promise<void> {
    const _id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
    await this.collection.updateOne(
      { _id },
      {
        $push: {
          'services.password.reset': {
            token,
            address: email.toLowerCase(),
            when: this.options.dateProvider(),
            reason,
          },
        },
      }
    );
  }

  public async setResetPassword(userId: string, email: string, newPassword: string): Promise<void> {
    await this.setPassword(userId, newPassword);
  }

  private async applyCode(name, owner, nextCode, MAX_FAILURE_COUNT, EFFECTIVE_TIME){
    const now: any = new Date();
    const query: any = {
      name: name,
      verifiedAt: null,
      expiredAt: {$gt: now}
    };
    if(owner){
      query.owner = owner
    }
    let record = await this.codeCollection.findOne(query);
    if(record){
      // if(record.failureCount >= MAX_FAILURE_COUNT){
      //   throw new Error('accounts.tooManyFailures');
      // }
      // await this.codeCollection.updateOne({_id: record._id}, {$set: {expiredAt: new Date(moment().add(EFFECTIVE_TIME, 'm'))}});
    }else{
      let doc: any = {
          name, owner, code: nextCode, expiredAt: new Date(moment().add(EFFECTIVE_TIME, 'm')), [this.options.timestamps.createdAt]: this.options.dateProvider()
      }
      if (this.options.idProvider) {
        doc._id = this.options.idProvider();
      }
  
      let result = await this.codeCollection.insertOne(doc);
      record = result.ops[0];
    }
    return record;
  }

  public async addVerificationCode(user: any, code: string, options: any): Promise<void> {

    let foundedUser = null
    if (user.email)
      foundedUser = await this.findUserByEmail(user.email)
    else if (user.mobile)
      foundedUser = await this.findUserByMobile(user.mobile)

    const owner = foundedUser? foundedUser.id: null;
    const ret = await this.applyCode(user.email?user.email:user.mobile, owner, code, options.MAX_FAILURE_COUNT, options.EFFECTIVE_TIME);
    return ret;
  }


  private async verifyCodeByName(name, code){
    const now: any = new Date();
    let query = {
      name: name,
      code: code,
      verifiedAt: null,
      expiredAt: {$gt: now}
    }
    let result = await this.codeCollection.findOne(query);
    if(result){
      await this.codeCollection.updateOne({_id: result._id}, {$set: {verifiedAt: now}})
      return result;
    }else{
      throw new Error("accounts.invalidCode");
    }
  }

  private async verifyCodeByOwner(owner, code){
    const now: any = new Date();
    let query = {
      owner: owner,
      code: code,
      verifiedAt: null,
      expiredAt: {$gt: now}
    }

    let result = await this.codeCollection.findOne(query);
    if(result){
      await this.codeCollection.updateOne({_id: result._id}, {$set: {verifiedAt: now}})
      return result;
    }else{
      console.log("verifyCodeByOwner throw new Error accounts.invalidCode");
      throw new Error("accounts.invalidCode");
    }
  }

  public async checkVerificationCode(user: any, code: string): Promise<boolean> {
    
    let name = null
    if (user.email)
      name = user.email
    else if (user.mobile)
      name = user.mobile

    if (!name) 
      return false;

    const record = await this.verifyCodeByName(name, code);
    if (!record) 
      return false;
    
    return true;
  }

  public async findUserByVerificationCode(user: any, code: string): Promise<User | null> {
    
    let foundedUser = null
    if (user.email)
      foundedUser = await this.findUserByEmail(user.email)
    else if (user.mobile)
      foundedUser = await this.findUserByMobile(user.mobile)

    if (!foundedUser) 
      return null;

    const owner = foundedUser.id;
    const record = await this.verifyCodeByOwner(owner, code);
    if (!record) 
      return null;
    
    if (user.email && (foundedUser.email_verified != true)){
      await this.verifyEmail(owner, user.email)
      foundedUser = await this.findUserById(owner);
    }else if (user.mobile && foundedUser.mobile_verified != true){
      await this.verifyMobile(owner, user.mobile)
      foundedUser = await this.findUserById(owner);
    }
    
    return foundedUser;
  }

  public async getMySpaces(userId:string): Promise<any | null> {
    const userSpaces:any = await this.db.collection('space_users').find({ user: userId }).project({space:1}).toArray();
    const spaceIds = map(userSpaces, 'space')
    const spaces = await this.db.collection('spaces').find({ _id: { $in: spaceIds } }).project({name:1}).toArray();

    return spaces;
  }

  public async updateMeteorSession(userId:string, token:string): Promise<boolean | null> {

    //创建Meteor token
    let stampedAuthToken = {
      token: token,
      when: new Date
    };
    let hashedToken = hashStampedToken(stampedAuthToken);
    let _user = await this.collection.findOne({_id: userId})
    if(!_user['services']){
      _user['services'] = {}
    }
    if (!_user['services']['resume']) {
      _user['services']['resume'] = {loginTokens: []}
    }
    if (!_user['services']['resume']['loginTokens']) {
      _user['services']['resume']['loginTokens'] = [];
    }
    _user['services']['resume']['loginTokens'].push(hashedToken)
    let data = { services: _user['services'] }
    await this.collection.updateOne({_id: userId}, {$set: data});

    return true
  }

  public async destroyMeteorToken(userId:string, token:string): Promise<boolean | null>{
    let stampedAuthToken = {
      token: token,
      when: new Date
    };
    let hashedTokenDoc = hashStampedToken(stampedAuthToken);
    let loginToken = hashedTokenDoc.hashedToken;
    await this.collection.updateOne({_id: userId}, {
      $pull: {
        "services.resume.loginTokens": {
          $or: [
            { hashedToken: loginToken},
            { token: loginToken}
          ]
        }
      }
    });
    return true;
  }

  public async getInviteInfo(id: string): Promise<any> {
    return await this.inviteCollection.findOne({_id: id});
  }
}
