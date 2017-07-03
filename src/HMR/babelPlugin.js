/* @flow */

function traverseUpUntil(path, checkFn) {
  let current = path.parentPath;
  while (current && !checkFn(current)) {
    current = current.parentPath;
  }
  return current;
}

// prettier-ignore
const createModuleAcceptSnippet = template => template(`
if (module.hot) {
  module.hot.accept(APP_SOURCE, () => {
    withHmr.redraw();
  });
}`);

function applyHmrTweaks({ types: t, template }, hmrImportPath) {
  // Convert to named import: import 'haul-hmr' -> import withHmr from 'haul-hmr'
  hmrImportPath.node.specifiers.push(
    // prettier-ignore
    t.importDefaultSpecifier(t.identifier('withHmr')),
  );

  // Get the root (Program) path
  const program = traverseUpUntil(hmrImportPath, t.isProgram);
  program.traverse({
    CallExpression(subpath) {
      // Tweak AppRegistry.registerComponent function call
      if (
        t.isMemberExpression(subpath.node.callee) &&
        subpath.node.callee.object.name === 'AppRegistry' &&
        subpath.node.callee.property.name === 'registerComponent'
      ) {
        // Original Root component factory function
        const rootFactory = subpath.node.arguments[1];

        // Wrap Root component factory using withHmr
        // eslint-disable-next-line no-param-reassign
        subpath.node.arguments = [
          subpath.node.arguments[0],
          t.callExpression(t.identifier('withHmr'), [rootFactory]),
        ];

        // Check if body of app factory is a require call and use source file path
        // to generate module accept snippet, it should look like this:
        // withHmr(() => require('./file').default)
        if (
          t.isMemberExpression(rootFactory.body) &&
          t.isCallExpression(rootFactory.body.object) &&
          rootFactory.body.object.callee.name === 'require'
        ) {
          program.node.body.push(
            // prettier-ignore
            createModuleAcceptSnippet(template)({
              APP_SOURCE: rootFactory.body.object.arguments[0],
            }),
          );
        } else if (
          // Try with CommonJS module system
          t.isCallExpression(rootFactory.body) &&
          rootFactory.body.callee.name === 'require'
        ) {
          program.node.body.push(
            // prettier-ignore
            createModuleAcceptSnippet(template)({
              APP_SOURCE: rootFactory.body.arguments[0],
            }),
          );
        } else {
          // prettier-ignore
          throw new Error('Root component must be imported using `require` function');
        }
      }
    },
  });
}

module.exports = babel => {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (
          path.node.source.value === 'haul-hmr' && !path.node.specifiers.length
        ) {
          applyHmrTweaks(babel, path);
        }
      },
    },
  };
};
