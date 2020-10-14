import * as React from 'react';
import { connect } from 'react-redux';
import { getSettings, getTenant } from '../selectors';
import Logo from './Logo';

class Card extends React.Component {
  render() {
    return (
<div className="flex sm:items-center justify-center mx-auto overflow-auto p-10 h-full">
  <div className="relative rounded p-11 sm:shadow-md bg-white w-screen max-w-md">
    {this.props.children}
  </div>
</div>
    )
  }
}

function mapStateToProps(state: any) {
  return {
      tenant: getTenant(state),
  };
}

export default connect(mapStateToProps)(Card);