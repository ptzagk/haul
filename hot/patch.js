if (module.hot && process.env.NODE_ENV !== 'production') {
  require('../src/HMR/client/hotPatch');
}
