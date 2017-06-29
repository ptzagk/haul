/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

// eslint-disable-next-line import/no-extraneous-dependencies
import React, { Component } from 'react';
import deepForceUpdate from 'react-deep-force-update';

/**
 * Original code was taken from https://github.com/gaearon/react-hot-loader/ by Dan Abramov
 */

let instance;
export default function withHMR(rootFactory: Function) {
  return () =>
    class Wrapper extends Component {
      state: {
        error: ?Object,
      };

      constructor(props: *) {
        super(props);
        this.state = {
          error: null,
        };
        instance = this;
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
        this.setState({
          error: null,
        });
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
        // eslint-disable-line camelcase
        this.setState({
          error,
        });
      }

      render() {
        const Root = rootFactory();
        return React.createElement(Root);
      }
    };
}

withHMR.redraw = () => {
  instance.forceUpdate();
};
