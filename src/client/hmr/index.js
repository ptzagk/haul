/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

/**
 * When imported, this module will setup almost everything needed for HMR, expect for accepting
 * changed modules since Webpack HMR API doesn't allow to accept from different file other than
 * parent, thus accepting must be done in `index.${platform}.js` file.
 * 
 * In production `withHMR` will do literally nothing and in development it will require updated
 * root component and force deep update of the three when calling `redraw`.
 * 
 * @example
 * import withHMR from 'haul-hmr';
 * import React, { Component } from 'react';
 * import {
 *   AppRegistry,
 * } from 'react-native';
 *
 * AppRegistry.registerComponent(
 *   'appKey',
 *   () => withHMR(() => require('./app.ios.js').default)
 * );
 *
 * if (module.hot) {
 *   module.hot.accept('./app.ios.js', () => {
 *     withHMR.redraw();
 *   });
 * }
 * 
 * To wrap up, here are the steps to get HMR working (for iOS, Android analogously):
 * 1. Create another file, for instance `app.ios.js` and put the root component there,
 *    so that in `index.ios.js` will contain only the code to run the app.
 * 2. Import this file, preferably using alias - `haul-hmr` in `index.ios.js`.
 * 3. Call `withHMR` in `registerComponent` 2nd argument passing a function which will
 *    require the root component.
 * 4. Add `accepting` section at the bottom as in the example.
 */

if (!module.hot || process.env.NODE_ENV === 'production') {
  module.exports = require('./passThrough');
} else {
  require('../hotClient.js')({
    path: `${process.env.DEV_SERVER_ORIGIN || ''}/hot`,
    overlay: false,
  });
  require('./patch');
  module.exports = require('./withHMR');
}
