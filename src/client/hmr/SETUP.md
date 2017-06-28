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

AppRegistry.registerComponent(
  'haulHMR',
  () => AppContainer(() => require('./app.ios.js').default)
);

if (module.hot) {
  module.hot.accept('./app.ios.js', () => {
    AppContainer.redraw();
  });
}

```