/* @flow */

// eslint-disable-next-line import/no-extraneous-dependencies
import React, { Component } from 'client-react';
import deepForceUpdate from 'react-deep-force-update';

/**
 * Original code was from https://github.com/gaearon/react-hot-loader/ by Dan Abramov
 */

let instance;
export default function AppContainer(rootFactory: Function) {
  return class Wrapper extends Component {
    constructor(props: *) {
      super(props);
      instance = this;
    }

    componentDidMount() {
      // $FlowFixMe
      if (typeof __REACT_HOT_LOADER__ === 'undefined') {
        console.error(
          'React Hot Loader: It appears that "react-hot-loader/patch" ' +
            'did not run immediately before the app started. Make sure that it ' +
            'runs before any other code. For example, if you use Webpack, ' +
            'you can add "react-hot-loader/patch" as the very first item to the ' +
            '"entry" array in its config. Alternatively, you can add ' +
            'require("react-hot-loader/patch") as the very first line ' +
            'in the application code, before any other imports.',
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

AppContainer.redraw = () => {
  instance.forceUpdate();
};
