/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

/**
 * Original code was written by Dan Abramov - https://github.com/gaearon/react-hot-loader/
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import React, { Component } from 'react';
import deepForceUpdate from 'react-deep-force-update';
import resetRedBox from './utils';

const instances = {};
export function makeHot(initialRootFactory: Function, id?: string = 'default') {
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
        instances[id] = this;
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
        deepForceUpdate(this);
      }

      componentDidMount() {
        if (typeof global.__REACT_HOT_LOADER__ === 'undefined') {
          console.error(
            'Haul HMR: It appears that "haul-hmr/patch" ' +
              'did not run immediately before the app started. Make sure that it ' +
              'runs before any other code.',
          );
        }
      }

      componentWillReceiveProps() {
        this._resetError();
        deepForceUpdate(this);
      }

      componentDidCatch(error: Object) {
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
        return <Root {...this.props} />;
      }
    };
}

export function redraw(
  rootComponentFactory: Function,
  id?: string = 'default',
) {
  instances[id]._redraw(rootComponentFactory);
}

export function tryUpdateSelf() {
  Object.keys(instances).forEach(id => {
    setTimeout(() => {
      instances[id]._redraw();
    }, 0);
  });
}

export function callOnce(callback: Function) {
  if (!global.__HAUL_HMR__.isInitialised) {
    callback();
    global.__HAUL_HMR__.isInitialised = true;
  }
}

export function clearCacheFor(resolvedModuleName: string) {
  delete require.cache[resolvedModuleName];
}
