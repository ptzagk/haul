/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

// eslint-disable-next-line import/no-extraneous-dependencies
import React, { Component } from 'react';
import deepForceUpdate from 'react-deep-force-update';
// $FlowFixMe
import Platform from 'Platform'; // eslint-disable-line import/no-extraneous-dependencies

function resetRedBox() {
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

/**
 * Original code was taken from https://github.com/gaearon/react-hot-loader/ by Dan Abramov
 */

let instance;
export default function withHMR(initialRootFactory: Function) {
  return () =>
    class Wrapper extends Component {
      state: {
        error: ?Object,
      };

      rootComponentFactory: ?Function;

      constructor(props: *) {
        super(props);
        this.state = {
          error: null,
        };
        instance = this;
        this.rootComponentFactory = null;
      }

      _resetError() {
        this.setState({ error: null });
        resetRedBox();
      }

      _redraw(rootComponentFactory?: Function) {
        if (rootComponentFactory) {
          this.rootComponentFactory = rootComponentFactory;
        }

        this._resetError();
        this.forceUpdate();
      }

      componentDidMount() {
        // $FlowFixMe
        if (typeof __REACT_HOT_LOADER__ === 'undefined') {
          console.error(
            'Haul HMR: It appears that "haul-hmr/patch" ' +
              'did not run immediately before the app started. Make sure that it ' +
              'runs before any other code.',
          );
        }
      }

      componentWillReceiveProps() {
        // Hot reload is happening.
        // Retry rendering!
        this._resetError();
        // Force-update the whole tree, including
        // components that refuse to update.
        deepForceUpdate(this);
      }

      // This hook is going to become official in React 15.x.
      // In 15.0, it only catches errors on initial mount.
      // Later it will work for updates as well:
      // https://github.com/facebook/react/pull/6020
      // eslint-disable-next-line camelcase
      unstable_handleError(error: Object) {
        this.setState({
          error,
        });
      }

      render() {
        if (this.state.error) {
          console.error(this.state.error);
          return null;
        }

        const Root = this.rootComponentFactory
          ? this.rootComponentFactory()
          : initialRootFactory();
        return React.createElement(Root);
      }
    };
}

withHMR.redraw = rootComponentFactory => {
  instance._redraw(rootComponentFactory);
};

withHMR.tryUpdateSelf = () => {
  if (instance) {
    setTimeout(
      () => {
        instance._redraw();
      },
      0,
    );
  }
};
