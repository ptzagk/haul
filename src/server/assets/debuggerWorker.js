/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* global __fbBatchedBridge, self, importScripts, postMessage, onmessage: true */ // eslint-disable-line

/* eslint-disable */

'use strict';

onmessage = (() => {
  let visibilityState;
  const showVisibilityWarning = (() => {
    let hasWarned = false;
    return () => {
      // Wait until `YellowBox` gets initialized before displaying the warning.
      if (hasWarned || console.warn.toString().includes('[native code]')) {
        return;
      }
      hasWarned = true;
      const warning = 'Remote debugger is in a background tab which may cause apps to ' +
        'perform slowly. Fix this by foregrounding the tab (or opening it in ' +
        'a separate window).';
      console.warn(warning);
    };
  })();

  let shouldQueueIncomingMessages = false;
  const messageQueue = [];

  // Flush enqueued message handlers and execute them
  function flushMessageQueue() {
    while (messageQueue.length) {
      const processMessage = messageQueue.shift();
      processMessage();
    }

    if (messageQueue.length) {
      flushMessageQueue();
    } else {
      shouldQueueIncomingMessages = false;
    }
  }

  const messageHandlers = {
    executeApplicationScript(message, sendReply) {
      // Enqueue next messages, since they need to be process after `executeApplicationScript`
      // sends a response
      shouldQueueIncomingMessages = true;

      for (const key in message.inject) {
        self[key] = JSON.parse(message.inject[key]);
      }

      fetch(message.url).then(resp => resp.text()).then(js => {
        let errorMessage;
        try {
          (new Function(js))();
        } catch (error) {
          errorMessage = error.message;
          if (self.ErrorUtils) {
            self.ErrorUtils.reportFatalError(error);
          } else {
            console.error(error);
          }
        } finally {
          sendReply(null, errorMessage);
          // Flush the queue
          flushMessageQueue();
        }
      });
    },
    setDebuggerVisibility(message, sendReply) {
      visibilityState = message.visibilityState;
    },
  };

  return function(message) {
    // Create message prcoessing function
    const processMessage = () => {
      if (visibilityState === 'hidden') {
        showVisibilityWarning();
      }

      const obj = message.data;

      const sendReply = function(result, error) {
        postMessage({ replyID: obj.id, result, error });
      };

      const handler = messageHandlers[obj.method];

      // Special cased handlers
      if (handler) {
        handler(obj, sendReply);
      } else {
        let returnValue = [[], [], [], 0];
        let error;
        try {
          if (typeof __fbBatchedBridge === 'object' && __fbBatchedBridge[obj.method]) {
            returnValue = __fbBatchedBridge[obj.method].apply(null, obj.arguments);
          } else {
            error = 'Failed to call function, __fbBatchedBridge is undefined';
          }
        } catch (err) {
          error = err.message;
        } finally {
          sendReply(JSON.stringify(returnValue), error);
        }
      }
    };

    if (shouldQueueIncomingMessages) {
      messageQueue.push(processMessage);
    } else {
      processMessage();
    }
  };
})();
