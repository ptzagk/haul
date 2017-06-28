/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

export default function AppContainer(rootFactory: Function) {
  return rootFactory();
}

AppContainer.redraw = () => {};
