/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */
/* global WebSocket, MessageEvent */

const processUpdate = require('webpack-hot-middleware/process-update');

function normalizeOptions({ path, quiet, overlay, reload, name }) {
  const shouldLog = !quiet;
  const options = {
    path,
    overlay: true,
    reload: false,
    name: '',
    logger: {
      shouldLog,
      log(...args) {
        if (shouldLog) {
          console.log(...args);
        }
      },
      warn(...args) {
        if (shouldLog) {
          console.warn(...args);
        }
      },
      error(...args) {
        if (shouldLog) {
          console.error(...args);
        }
      },
    },
  };

  if (overlay) {
    options.overlay = overlay !== 'false';
  }
  if (reload) {
    options.reload = reload !== 'false';
  }
  if (name) {
    options.name = name;
  }
  return options;
}

function processPayload(payload, { logger, reporter, ...opts }) {
  switch (payload.action) {
    case 'building':
      logger.log(
        `[Haul HMR] Bundle ${payload.name ? `'${payload.name}' ` : ''}rebuilding`,
      );
      break;
    case 'built':
      logger.log(
        `[Haul HMR] Bundle ${payload.name ? `'${payload.name}' ` : ''}rebuilt in ${payload.time}ms`,
      );
    // fall through
    case 'sync':
      if (payload.name && opts.name && payload.name !== opts.name) {
        return;
      }

      if (payload.errors.length > 0 && reporter) {
        reporter.problems('errors', payload);
      } else if (payload.warnings.length > 0 && reporter) {
        reporter.problems('warnings', payload);
      } else if (reporter) {
        reporter.cleanProblemsCache();
        reporter.success();
      }

      processUpdate(payload.hash, payload.modules, {
        ...opts,
        log: logger.shouldLog,
        warn: logger.shouldLog,
        error: logger.shouldLog,
      });
      break;
    default:
      logger.warn(`[HMR] Invalid action ${payload.action}`);
  }
}

/**
 * Custom HMR client with WebSocket support instead of EventSource as `webpack-hot-middleware`
 */
module.exports = function connect(options: Object) {
  const { logger, ...opts } = normalizeOptions(options);
  const ws = new WebSocket(opts.path);

  ws.onopen = () => {
    logger.log(
      '[Haul HMR] Client connected, however until you `Enable Hot Reloading`, ' +
        'you will not get any updates',
    );
  };

  ws.onerror = error => {
    logger.error(
      `[Haul HMR] Client could not connect to the server ${opts.path}`,
      error,
    );
  };

  ws.onmessage = (message: MessageEvent) => {
    if (typeof message.data !== 'string') {
      throw new Error(
        `[Haul HMR] Data from websocker#onmessage must be a string`,
      );
    }
    const payload = JSON.parse(message.data);
    try {
      processPayload(payload, { logger, ...opts });
    } catch (error) {
      logger.warn(`[Haul HMR] Invalid message: ${payload}`, error);
    }
  };
};

// @TODO check if the stuff below is needed
// // the reporter needs to be a singleton on the page
// // in case the client is being used by multiple bundles
// // we only want to report once.
// // all the errors will go to all clients
// /*
// const singletonKey = '__webpack_hot_middleware_reporter__';

// if (typeof window !== 'undefined') {
//   if (!window[singletonKey]) {
//     window[singletonKey] = createReporter();
//   }
//   reporter = window[singletonKey];
// }

// function createReporter() {
//   var strip = require('strip-ansi');

//   var overlay;
//   if (typeof document !== 'undefined' && options.overlay) {
//     overlay = require('./client-overlay');
//   }

//   var styles = {
//     errors: "color: #ff0000;",
//     warnings: "color: #999933;"
//   };
//   var previousProblems = null;
//   function log(type, obj) {
//     var newProblems = obj[type].map(function(msg) { return strip(msg); }).join('\n');
//     if (previousProblems == newProblems) {
//       return;
//     } else {
//       previousProblems = newProblems;
//     }

//     var style = styles[type];
//     var name = obj.name ? "'" + obj.name + "' " : "";
//     var title = "[HMR] bundle " + name + "has " + obj[type].length + " " + type;
//     // NOTE: console.warn or console.error will print the stack trace
//     // which isn't helpful here, so using console.log to escape it.
//     if (console.group && console.groupEnd) {
//       console.group("%c" + title, style);
//       console.log("%c" + newProblems, style);
//       console.groupEnd();
//     } else {
//       console.log(
//         "%c" + title + "\n\t%c" + newProblems.replace(/\n/g, "\n\t"),
//         style + "font-weight: bold;",
//         style + "font-weight: normal;"
//       );
//     }
//   }

//   return {
//     cleanProblemsCache: function () {
//       previousProblems = null;
//     },
//     problems: function(type, obj) {
//       if (options.warn) {
//         log(type, obj);
//       }
//       if (overlay && type !== 'warnings') overlay.showProblems(type, obj[type]);
//     },
//     success: function() {
//       if (overlay) overlay.clear();
//     },
//     useCustomOverlay: function(customOverlay) {
//       overlay = customOverlay;
//     }
//   };
// }*/
