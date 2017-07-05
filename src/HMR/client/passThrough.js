/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

export default function passThrough(rootFactory: Function) {
  return () => rootFactory();
}

passThrough.redraw = () => {};
