/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

// $FlowFixMe
import Platform from 'Platform'; // eslint-disable-line import/no-extraneous-dependencies

export default function resetRedBox() {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const RCTRedBox = require('NativeModules').RedBox;
    // eslint-disable-next-line no-unused-expressions
    RCTRedBox && RCTRedBox.dismiss && RCTRedBox.dismiss();
  } else {
    // $FlowFixMe
    const RCTExceptionsManager = require('NativeModules').ExceptionsManager; // eslint-disable-line import/no-extraneous-dependencies
    // eslint-disable-next-line no-unused-expressions
    RCTExceptionsManager &&
      RCTExceptionsManager.dismissRedbox &&
      RCTExceptionsManager.dismissRedbox();
  }
}
