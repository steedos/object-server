import { hashHistory } from "../utils/hash_history";
import { logout, loadMe } from "./users";
import store from '../stores/redux_store';
import { getCurrentUser } from "../selectors/entities/users";
import { getMySpaces, getCurrentSpaceId, getSpace } from '../selectors/entities/spaces';
import LocalStorageStore from '../stores/local_storage_store';
import { selectSpace } from '../actions/spaces';


const dispatch = store.dispatch;
const getState = store.getState;

export function emitUserLoggedOutEvent(redirectToPath, shouldSignalLogout = true, userAction = true) {
    // If the logout was intentional, discard knowledge about having previously been logged in.
    // This bit is otherwise used to detect session expirations on the login page.
    if (userAction) {
    }

    if (!redirectToPath)
        redirectToPath = '/login'

    dispatch(logout()).then(() => {
        LocalStorageStore.setUserId(null);

        // if (shouldSignalLogout) {
        //     BrowserStore.signalLogout();
        // }

        // BrowserStore.clear();
        // stopPeriodicStatusUpdates();
        // WebsocketActions.close();

        // clearUserCookie();

        redirectTo(redirectToPath);
    }).catch((e) => {
        console.log(e);
        redirectTo(redirectToPath);
    });
}


export async function selectDefaultSpace() {
    let state = getState();

    // Assume we need to load the user if they don't have any team memberships loaded or the user loaded
    let user = getCurrentUser(state);
    
    if (!user) {
        return;
    }
    
    // const locale = getCurrentLocale(state);
    const spaceId = LocalStorageStore.getPreviousSpaceId(user.id);

    const space = getSpace(state, spaceId);
    if (space) {
        dispatch(selectSpace(space._id));
        return space._id;
    } else {
        hashHistory.push('/select-space');
    }
}

export async function redirectUserToDefaultSpace() {

    const spaceId = await selectDefaultSpace();
    
    hashHistory.push(`/home/${spaceId}`);
}

export async function redirectUserToUpdatePassword(){
    console.log('redirectUserToUpdatePassword....');
    hashHistory.push('/update-password');
}

export async function redirectTo(redirectTo) {

    if (!redirectTo) 
        return;

    if (redirectTo && redirectTo.indexOf('no_redirect=1')<0) {
      const userId = LocalStorageStore.getItem('userId');
      const authToken =  LocalStorageStore.getItem('token');
      const spaceId =  LocalStorageStore.getItem('spaceId');
      redirectTo = redirectTo.indexOf("?")>0?redirectTo+'no_redirect=1':redirectTo+'?no_redirect=1'
      if (userId && authToken)
        redirectTo = `${redirectTo}&X-Auth-Token=${authToken}&X-User-Id=${userId}&X-Space-Id=${spaceId}`

      if (redirectTo.match(/^\/([^/]|$)/))
        hashHistory.push(redirectTo);
      else
        document.location.href=redirectTo
    }

}