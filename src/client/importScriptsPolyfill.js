/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */
/* global XMLHttpRequest */

/**
 * When setting `target` to `webworker` in webpack config, it will change template for downloading
 * hot update and will use `importScripts` which are available in WebWorkers, so we need to
 * provide implementation for it.
 */
global.importScripts = global.importScripts ||
  (importPath => {
    const timeout = 10000;
    if (typeof XMLHttpRequest === 'undefined') {
      throw new Error('No XMLHttpRequest support');
    }

    const request = new XMLHttpRequest();
    request.timeout = timeout;
    request.onreadystatechange = () => {
      if (request.readyState !== 4) {
        return;
      }

      if (request.status === 0) {
        // Timeout
        throw new Error(`Request for ${importPath} timed out`);
      } else if (request.status === 404) {
        throw new Error(`Resource ${importPath} was not found on server`);
      } else if (request.status !== 200 && request.status !== 304) {
        // Unknown error
        throw new Error(`Request for ${importPath} failed`);
      } else {
        // Apply changes from hot update
        // eslint-disable-next-line no-eval
        eval(request.responseText);
      }
    };

    try {
      request.open('GET', importPath);
    } catch (e) {
      // NOOP
    }
    request.send(null);
  });
