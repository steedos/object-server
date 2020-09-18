import React from 'react';
import {bindActionCreators} from 'redux';

import { Switch, HashRouter, Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { getTenant } from './selectors';
import { getCurrentUser } from './selectors/entities/users'
import * as GlobalActions from './actions/global_actions';
import {loadMeAndConfig} from './actions/root';

import LoggedIn from './components/LoggedIn';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Home from './pages/Home';
import UpdatePassword from './pages/updatePassword';
import CreateTenant from './pages/CreateTenant';
import SelectSpace from './pages/SelectSpace';
import Preference from './pages/Preference';
import Loading from './components/Loading';
import Verify from './pages/Verify';


const LoggedInRoute = ({component: Component, ...rest}) => {

  if (!Component) return null;
  return (
    <Route
        {...rest}
        render={(props) => (
            <LoggedIn {...props}>
                <Component {...props}/>
            </LoggedIn>
        )}
    />
    )}
;

class Root extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      configLoaded: false,
    };
  }

  onConfigLoaded = () => {
    this.setState({configLoaded: true});
  }

  componentDidMount() {
    this.props.actions.loadMeAndConfig().then((response) => {
      let password_expired = false;
      if(this.props.currentUser && this.props.currentUser.password_expired){
        password_expired = true;
      }
      if(password_expired){
        GlobalActions.redirectUserToUpdatePassword();
      }else{
        GlobalActions.selectDefaultSpace();
        if (document.location.pathname === '/' && document.location.hash === '#/' && response[1] && response[1].data) {
            GlobalActions.redirectUserToDefaultSpace();
        }
      }
      this.onConfigLoaded();
    }).then(() => {
        // if (isCurrentUserSystemAdmin(store.getState())) {
        //     this.props.actions.getWarnMetricsStatus();
        // }
    });
    // trackLoadTime();
  }

  render() {
    if (!this.state.configLoaded) {
      return <div/>;
    }
    
    return (
      <HashRouter basename="">
          <div className="absolute w-full h-full">
            <Loading></Loading>
            {/* <GlobalMessage></GlobalMessage> */}
                  {/* <Route path="/" component={GoBack}/> */}
                  {/* <Route path="/" component={Title}/> */}
                <Switch>                  
                  <LoggedInRoute exact path="/" component={Home}/>

                  <Route path="/signup" component={Signup} />

                  <Route path="/login" component={Login} />
                  <Route path="/logout" component={Logout} />
                  
                  <LoggedInRoute path="/create-space" component={CreateTenant} />
                  <LoggedInRoute path="/select-space" component={SelectSpace} />
                  <LoggedInRoute exact path="/update-password" component={UpdatePassword} />
                  <LoggedInRoute path="/verify/:token" component={Verify} />
                  {/* <Route path="/login-code" component={LoginCode} /> */}
                  <LoggedInRoute path="/preference" component={Preference} />
                  {/* <LoggedInRoute path="/verify-mobile/:token" component={VerifyMobile} /> */}
                  <LoggedInRoute path="/home/:spaceId" component={Home}/>
                  <Redirect
                      to={{
                          ...this.props.location,
                          pathname: '/login',
                      }}
                  />
              </Switch>
            </div>
      </HashRouter>
    );
  };
}

function mapStateToProps(state) {
  return {
    tenant: getTenant(state),
    currentUser: getCurrentUser(state),
  };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
          loadMeAndConfig,
          //getWarnMetricsStatus,
        }, dispatch),
    };
}
export default connect(mapStateToProps, mapDispatchToProps)(Root);