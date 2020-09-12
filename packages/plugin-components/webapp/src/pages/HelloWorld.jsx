import React from 'react';
import SteedosTemplate from '../components/SteedosTemplate';

class HelloWorld extends React.Component {
  render() {
    return (
      <div>hello world.
        <SteedosTemplate name="creator_about"/>
      </div>
    )
  }
}

export default HelloWorld