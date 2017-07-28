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
 * 
 * Native `importScripts` is synchronous, however we can't do that, so this polyfill
 * is async and returns a Promise.
 */
global.importScripts =
  global.importScripts ||
  (importPath =>
    new Promise((resolve: Function, reject: Function) => {
      const timeout: number = 10000;
      if (typeof XMLHttpRequest === 'undefined') {
        reject(new Error('No XMLHttpRequest support'));
      }

      const request = new XMLHttpRequest();
      request.timeout = timeout;
      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          resolve();
          return;
        }

        if (request.status === 0) {
          // Timeout
          reject(new Error(`Request for ${importPath} timed out`));
        } else if (request.status === 404) {
          reject(new Error(`Resource ${importPath} was not found on server`));
        } else if (request.status !== 200 && request.status !== 304) {
          // Unknown error
          reject(new Error(`Request for ${importPath} failed`));
        } else {
          // Apply changes from hot update
          // eslint-disable-next-line no-eval
          eval(request.responseText);
          resolve();
        }
      };

      try {
        request.open('GET', importPath);
        request.send(null);
      } catch (e) {
        reject(e);
      }
    }));
