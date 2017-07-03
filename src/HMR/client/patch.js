/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/**
 * Original code taken from https://github.com/gaearon/react-hot-loader/ by Dan Abramov
 */

/* @flow */

// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import createProxy from 'react-proxy';

type ComponentType = Function | Object | string;

class ComponentMap {
  wm: WeakMap<ComponentType, *>;
  slots: { [key: ?ComponentType]: * };

  constructor(useWeakMap: boolean) {
    if (useWeakMap) {
      this.wm = new WeakMap();
    } else {
      this.slots = {};
    }
  }

  getSlot(type: ComponentType) {
    // $FlowFixMe
    const key: string = type.displayName || type.name || 'Unknown';
    if (!this.slots[key]) {
      this.slots[key] = [];
    }
    return this.slots[key];
  }

  get(type: ComponentType) {
    if (this.wm) {
      return this.wm.get(type);
    }

    const slot = this.getSlot(type);
    const { value } = slot.find(({ key }) => key === type) || {};
    return value;
  }

  set(type: ComponentType, value: *) {
    if (this.wm) {
      this.wm.set(type, value);
    } else {
      const slot = this.getSlot(type);
      const index = slot.findIndex(({ key }) => key === type);
      if (index >= 0) {
        slot[index].value = value;
      } else {
        slot.push({ key: type, value });
      }
    }
  }

  has(type: ComponentType): boolean {
    if (this.wm) {
      return this.wm.has(type);
    }

    const slot = this.getSlot(type);
    return !!slot.find(({ key }) => key === type);
  }
}

let proxiesByID: Object;
let didWarnAboutID: Object;
let hasCreatedElementsByType: ComponentMap;
let idsByType: ComponentMap;

const hooks = {
  register(type: ComponentType, uniqueLocalName: string, fileName: string) {
    if (typeof type !== 'function') {
      return;
    }

    if (!uniqueLocalName || !fileName) {
      return;
    }

    if (typeof uniqueLocalName !== 'string' || typeof fileName !== 'string') {
      return;
    }

    const id: string = fileName + '#' + uniqueLocalName; // eslint-disable-line prefer-template
    if (!idsByType.has(type) && hasCreatedElementsByType.has(type)) {
      if (!didWarnAboutID[id]) {
        didWarnAboutID[id] = true;
        // eslint-disable-next-line
        const baseName = fileName.replace(/^.*[\\\/]/, '');
        console.error(
          `React Hot Loader: ${uniqueLocalName} in ${fileName} will not hot reload ` +
            `correctly because ${baseName} uses <${uniqueLocalName} /> during ` +
            `module definition. For hot reloading to work, move ${uniqueLocalName} ` +
            `into a separate file and import it from ${baseName}.`,
        );
      }
      return;
    }

    // Remember the ID.
    idsByType.set(type, id);

    // We use React Proxy to generate classes that behave almost
    // the same way as the original classes but are updatable with
    // new versions without destroying original instances.
    if (!proxiesByID[id]) {
      proxiesByID[id] = createProxy(type);
    } else {
      proxiesByID[id].update(type);
    }
  },

  reset(useWeakMap: boolean) {
    proxiesByID = {};
    didWarnAboutID = {};
    hasCreatedElementsByType = new ComponentMap(useWeakMap);
    idsByType = new ComponentMap(useWeakMap);
  },
};

hooks.reset(typeof WeakMap === 'function');

function resolveType(type: ComponentType) {
  // We only care about composite components
  if (typeof type !== 'function') {
    return type;
  }

  hasCreatedElementsByType.set(type, true);

  // When available, give proxy class to React instead of the real class.
  const id: any = idsByType.get(type);
  // Ignore components from react-native
  if (!id || (typeof id === 'string' && /react-native/.test(id))) {
    return type;
  }

  const proxy = proxiesByID[id];
  if (!proxy) {
    return type;
  }

  return proxy.get();
}

const createElement = React.createElement;
function patchedCreateElement(type: ComponentType, ...args: mixed[]) {
  // Trick React into rendering a proxy so that
  // its state is preserved when the class changes.
  // This will update the proxy if it's for a known type.
  const resolvedType = resolveType(type);
  // $FlowFixMe
  return createElement(resolvedType, ...args);
}
patchedCreateElement.isPatchedByReactHotLoader = true;

function patchedCreateFactory(type: ComponentType) {
  // Patch React.createFactory to use patched createElement
  // because the original implementation uses the internal,
  // unpatched ReactElement.createElement
  const factory = patchedCreateElement.bind(null, type);
  factory.type = type;
  return factory;
}
patchedCreateFactory.isPatchedByReactHotLoader = true;

if (typeof global.__REACT_HOT_LOADER__ === 'undefined') {
  // $FlowFixMe createElement is assigned patched function
  React.createElement = patchedCreateElement;
  React.createFactory = patchedCreateFactory;
  global.__REACT_HOT_LOADER__ = hooks;
}
