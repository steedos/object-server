// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// This is a temporary store while we are transitioning from Flux to Redux. This file exports
// the configured Redux store for use by actions and selectors.

import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import rootReducer from '../reducers'
import initialState from './initial_state';

const store = createStore(
    rootReducer, 
    initialState, 
    applyMiddleware(
      thunkMiddleware,
    )
);

export function bindActionToRedux(action, ...args) {
    return async () => {
        await action(...args)(store.dispatch, store.getState);
    };
}

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') { //eslint-disable-line no-process-env
    window.storeWebapp = store;
}

export default store;
