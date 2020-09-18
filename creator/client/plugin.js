import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';
import * as ReactSteedos from '@steedos/react';
import * as ReactDesignSystem from '@salesforce/design-system-react';
// import styled from 'styled-components';
import * as ReduxThunk from 'redux-thunk';
import * as Immer from 'immer';
import * as TSODataClient from 'ts-odata-client';
import * as NodeFetch from 'node-fetch';
import * as SteedosFilters from '@steedos/filters';
import { registerPlugin } from '@steedos/react';


export const registerWindowLibraries = () => {
  window["React"] = React;
  window["PropTypes"] = PropTypes;
  window["ReactDom"] = ReactDom;
  window["Redux"] = Redux;
  window["ReactRedux"] = ReactRedux;
  window["ReactDesignSystem"] = ReactDesignSystem;
  window["ReactSteedos"] = ReactSteedos;
  // window["StyledComponents"] = styled;
  // window["ReduxThunk"] = ReduxThunk;
  // window["Immer"] = Immer;
  // window["TSODataClient"] = TSODataClient;
  // window["NodeFetch"] = NodeFetch;
  // window["SteedosFilters"] = SteedosFilters;
  
  window["registerPlugin"] = registerPlugin;
}
