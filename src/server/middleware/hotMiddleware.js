/* @flow */
/* global WebSocket */

type Compiler = {
  plugin: (name: string, fn: Function) => void,
};

type WebSocketProxy = {
  onConnection: (hanlder: Function) => void,
};

type WebSocket = {
  on: (event: string, Function) => void,
  send: (data: string) => void,
};

type Connection = {
  socket: ?WebSocket,
  isOpen: boolean,
};

type ClientConnection = {
  publish: (pyaload: any) => void,
  publishNativeEvent: (action: string) => void,
};

type Logger = {
  log: (...args: Array<mixed>) => void,
};

/**
 * Send updates on bundle rebuilds, so that HMR client can donwload update and process it.
 * In order to support `Enable Hot Reloading` button, we need to 2 connections:
 * - Native Hot Client (on path `/hot`) - if connected, we know that user enabled hot reloading,
 *   it's also used to send `update-start` and `update-done` messages, so it shows notification
 *   on client
 * - Haul HMR Client (on path `/haul-hmr`) - used to send stats to client, so it can download
 *   and process actuall update
 */
function hotMiddleware(
  compiler: Compiler,
  { native, haul }: { native: WebSocketProxy, haul: WebSocketProxy },
  opts: { debug: boolean } = { debug: false },
) {
  const logger: Logger = {
    log(...args) {
      if (opts.debug) {
        console.log('[Hot middleware]', ...args);
      }
    },
  };

  const connection: ClientConnection = createConnection(native, haul, logger);

  compiler.plugin('compile', () => {
    logger.log('webpack building...');
    connection.publishNativeEvent('update-start');
    connection.publish({ action: 'building' });
  });

  compiler.plugin('done', (stats: Object) => {
    connection.publishNativeEvent('update-done');
    publishStats('built', stats, connection, logger);
    // @TODO: check if needed
    // publishStats("sync", stats, eventStream);
  });
}

function setConnection(
  socketProxy: WebSocketProxy,
  name: string,
  connection: Connection,
  logger: Logger,
) {
  socketProxy.onConnection((socket: WebSocket) => {
    logger.log(`Got ${name} connection`);
    // eslint-disable-next-line no-param-reassign
    connection.isOpen = true;
    // eslint-disable-next-line no-param-reassign
    connection.socket = socket;

    socket.on('open', () => {
      // eslint-disable-next-line no-param-reassign
      connection.isOpen = true;
    });

    socket.on('close', () => {
      // eslint-disable-next-line no-param-reassign
      connection.socket = null;
      // eslint-disable-next-line no-param-reassign
      connection.isOpen = false;
    });
  });
}

function createConnection(
  nativeProxy: WebSocketProxy,
  haulProxy: WebSocketProxy,
  logger: Logger,
): ClientConnection {
  const nativeHotConnection: Connection = {
    socket: null,
    isOpen: false,
  };

  const haulHmrConnection: Connection = {
    socket: null,
    isOpen: false,
  };

  setConnection(nativeProxy, 'Native Hot', nativeHotConnection, logger);
  setConnection(haulProxy, 'Haul HMR', haulHmrConnection, logger);

  return {
    publishNativeEvent(action: string) {
      if (nativeHotConnection.isOpen && nativeHotConnection.socket) {
        nativeHotConnection.socket.send(JSON.stringify({ type: action }));
      }
    },
    publish(payload: any) {
      if (
        haulHmrConnection.isOpen &&
        haulHmrConnection.socket &&
        nativeHotConnection.isOpen
      ) {
        haulHmrConnection.socket.send(JSON.stringify(payload));
      }
    },
  };
}

function publishStats(
  action: string,
  stats: Object,
  connection: ClientConnection,
  logger: Logger,
) {
  // For multi-compiler, stats will be an object with a 'children' array of stats
  const bundles = extractBundles(stats.toJson({ errorDetails: false }));
  bundles.forEach(bundleStats => {
    logger.log(
      `webpack built ${bundleStats.name ? `${bundleStats.name} ` : ''}` +
        `${bundleStats.hash} in ${bundleStats.time}ms`,
    );

    connection.publish({
      name: bundleStats.name,
      action,
      time: bundleStats.time,
      hash: bundleStats.hash,
      warnings: bundleStats.warnings || [],
      errors: bundleStats.errors || [],
      modules: buildModuleMap(bundleStats.modules),
    });
  });
}

function extractBundles(stats: Object): Object[] {
  // Stats has modules, single bundle
  if (stats.modules) return [stats];

  // Stats has children, multiple bundles
  if (stats.children && stats.children.length) return stats.children;

  // Not sure, assume single
  return [stats];
}

function buildModuleMap(modules: Object[]): Object {
  const map = {};
  modules.forEach(module => {
    map[module.id] = module.name;
  });
  return map;
}

module.exports = hotMiddleware;
