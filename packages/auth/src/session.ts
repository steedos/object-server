import crypto = require('crypto');
import { getSteedosSchema, SteedosUserSession, SteedosIDType } from '@steedos/objectql';

const sessions = {};
const size = 35000;
const tokens = [];
const spaceSessions = {};
const spacetokens = [];
const sessionCacheInMinutes = 10;

interface Session {
  name: string;
  userId: SteedosIDType;
  steedos_id?: string;
  email?: string;
  expiredAt: number;
}

interface ResultSession {
  name: string;
  userId: SteedosIDType;
  steedos_id?: string;
  email?: string;
}

interface SpaceSession {
  roles: string[];
  expiredAt: number;
}

function _hashLoginToken(token: string) {
  const hash = crypto.createHash('sha256');
  hash.update(token);
  return hash.digest('base64');
}

function isExpried(expiredAt: number) {
  return expiredAt <= new Date().getTime();
}

function reovkeSessionFromCache(token: string) {
  return delete sessions[token];
}

export function addSessionToCache(token: string, session: Session) {
  sessions[token] = session;
  tokens.push(token);
  if (tokens.length > size) {
    reovkeSessionFromCache(tokens.shift());
  }
}

export function getSessionFromCache(token: string) {
  let session = sessions[token];
  if (!session) {
    return null;
  }
  if (isExpried(session.expiredAt)) {
    reovkeSessionFromCache(token);
    return null;
  }
  return session;
}

async function getUser(token: string) {
  let hashedToken = _hashLoginToken(token).replace(/\//g, '%2F');
  let filters = `(services/resume/loginTokens/hashedToken eq '${hashedToken}')`;
  let users = await getSteedosSchema().getObject('users').find({ filters: filters, fields: ['name', 'steedos_id', 'email'] });
  return users[0];
}

async function getUserRoles(userId: string, spaceId: string) {
  let roles = ['user'];
  let space = await getSteedosSchema().getObject('spaces').findOne(spaceId, { fields: ['admins'] });
  if (space && space.admins.includes(userId)) {
    roles = ['admin'];
  }

  let filters = `(space eq '${spaceId}') and (users eq '${userId}')`;
  let permission_sets = await getSteedosSchema().getObject('permission_set').find({ filters: filters, fields: ['name'] });
  permission_sets.forEach(p => {
    roles.push(p.name);
  });

  console.log('roles：', roles)

  return roles;
}

function assignSession(spaceId, userSession, spaceSession) {
  let result = Object.assign({ spaceId: spaceId }, userSession, spaceSession);
  return reviseSession(result);
}

function reviseSession(session) {
  if (session) {
    delete session.expiredAt;
  }
  return session
}

function reovkeSpaceSessionFromCache(key: string) {
  return delete spaceSessions[key];
}

export function addSpaceSessionToCache(token: string, spaceId: string, spaceSession: SpaceSession) {
  let key = `${token}-${spaceId}`;
  spaceSessions[key] = spaceSession;
  spacetokens.push(key);
  if (spacetokens.length > size) {
    reovkeSpaceSessionFromCache(spacetokens.shift());
  }
}

export function getSpaceSessionFromCache(token: string, spaceId: string) {
  let key = `${token}-${spaceId}`;
  let spaceSession = spaceSessions[key];
  if (!spaceSession) {
    return null;
  }
  if (isExpried(spaceSession.expiredAt)) {
    reovkeSpaceSessionFromCache(key);
    return null;
  }
  return spaceSession;
}

export async function getSession(token: string, spaceId: string): Promise<SteedosUserSession>;
export async function getSession(token: string): Promise<ResultSession>;
export async function getSession(token: string, spaceId?: string): Promise<any> {
  let expiredAt = new Date().getTime() + sessionCacheInMinutes * 60 * 1000;
  let session = getSessionFromCache(token);
  if (!session) {
    let user = await getUser(token);
    if (user) {
      session = { name: user.name, userId: user._id, steedos_id: user.steedos_id, email: user.email, expiredAt: expiredAt };
      addSessionToCache(token, session);
    }
  }
  if (spaceId) {
    let spaceSession = getSpaceSessionFromCache(token, spaceId);
    if (!spaceSession) {
      let user = await getUser(token);
      if (user) {
        let roles = await getUserRoles(user._id, spaceId);
        spaceSession = { roles: roles, expiredAt: expiredAt };
        addSpaceSessionToCache(token, spaceId, spaceSession);
      }
    }
    return assignSession(spaceId, session, spaceSession);
  } else {
    return reviseSession(session)
  }

}