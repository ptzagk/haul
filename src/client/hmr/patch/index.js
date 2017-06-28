if (module.hot && process.env.NODE_ENV !== 'production') {
  module.exports = require('./patch.dev');
}
