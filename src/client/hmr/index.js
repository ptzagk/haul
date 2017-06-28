if (!module.hot || process.env.NODE_ENV === 'production') {
  module.exports = require('./AppContainer/AppContainer.prod');
} else {
  require('../hotClient.js')({
    path: `${process.env.DEV_SERVER_ORIGIN}/hot`,
    overlay: false,
  });
  require('./patch');
  module.exports = require('./AppContainer/AppContainer.dev');
}
