/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

/**
 * When imported, this module will setup almost everything needed for HMR.
 * 
 * In production `withHMR` will do literally nothing.
 */

if (!module.hot || process.env.NODE_ENV === 'production') {
  module.exports = require('./passThrough');
} else {
  global.__HAUL_HMR__ = global.__HAUL_HMR__ || {};
  require('./hotClient.js')({
    path: `${process.env.DEV_SERVER_ORIGIN || ''}/haul-hmr`,
    overlay: false,
  });
  require('./patch');
  module.exports = require('./withHMR');
}
