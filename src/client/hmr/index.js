if (!module.hot || process.env.NODE_ENV === 'production') {
  module.exports = require('./AppContainer/AppContainer.prod');
} else {
  require('./patch');
  module.exports = require('./AppContainer/AppContainer.dev');
}
