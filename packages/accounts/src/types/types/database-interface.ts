import { User } from './user';
import { Session } from './session';
import { CreateUser } from './create-user';
import { ConnectionInformations } from './connection-informations';

export interface DatabaseInterface extends DatabaseInterfaceSessions {
  // Find user by identity fields
  findUserByEmail(email: string): Promise<User | null>;

  findUserByUsername(username: string): Promise<User | null>;

  findUserById(userId: string): Promise<User | null>;
  
  findUserByMobile(mobile:string): Promise<User | null>;

  // Create and update users
  createUser(user: CreateUser): Promise<string>;

  setUsername(userId: string, newUsername: string): Promise<void>;

  // Auth services related operations
  findUserByServiceId(serviceName: string, serviceId: string): Promise<User | null>;

  setService(userId: string, serviceName: string, data: object): Promise<void>;

  unsetService(userId: string, serviceName: string): Promise<void>;

  // Password related operation
  findPasswordHash(userId: string): Promise<string | null>;

  findUserByResetPasswordToken(token: string): Promise<User | null>;

  setPassword(userId: string, newPassword: string): Promise<void>;

  addResetPasswordToken(
    userId: string,
    email: string,
    token: string,
    reason: string
  ): Promise<void>;

  setResetPassword(
    userId: string,
    email: string,
    newPassword: string,
    token: string
  ): Promise<void>;

  // Email related operations
  findUserByEmailVerificationToken(token: string): Promise<User | null>;

  addEmail(userId: string, newEmail: string, verified: boolean): Promise<void>;

  removeEmail(userId: string, email: string): Promise<void>;

  verifyEmail(userId: string, email: string): Promise<void>;

  verifyMobile(userId: string, email: string): Promise<void>;

  addEmailVerificationToken(userId: string, email: string, token: string, code: string): Promise<void>;

  setUserDeactivated(userId: string, deactivated: boolean): Promise<void>;
  
  addVerificationCode(user: any, code: string, options: any): Promise<void>;

  findUserByVerificationCode(user: any, code: string): Promise<User | null>;
  
  checkVerificationCode(user: any, code: string): Promise<boolean>;

  getMySpaces(userId: string): Promise<any | null>;

  getInviteInfo(id: string): Promise<any | null>;
}

export interface DatabaseInterfaceSessions {
  findSessionById(sessionId: string): Promise<Session | null>;

  findSessionByToken(token: string): Promise<Session | null>;

  createSession(
    userId: string,
    token: string,
    connection: ConnectionInformations,
    extraData?: object
  ): Promise<string>;

  updateSession(sessionId: string, connection: ConnectionInformations): Promise<void>;

  invalidateSession(sessionId: string): Promise<void>;

  invalidateAllSessions(userId: string): Promise<void>;
}
