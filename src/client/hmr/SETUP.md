```javascript
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import 'haul/src/client/hmr/patch';
import React, { Component } from 'react';
import {
  AppRegistry,
} from 'react-native';
import AppContainer from 'haul/src/client/hmr/AppContainer';

let instance;
class Wrapper extends Component {
  constructor(props) {
    super(props);
    instance = this;
  }

  render() {
    const App = require('./app.ios.js').default;
    return (
      <AppContainer>
        <App />
      </AppContainer>
    );
  }
}

if (module.hot) {
  module.hot.accept('./app.ios.js', () => {
    instance.forceUpdate();
  });
}

AppRegistry.registerComponent(
  'haulHMR',
  () => Wrapper
);



```