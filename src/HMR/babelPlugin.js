/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* @flow */

/**
 * Ideally, this file SHOULD NOT be processed by prettier, since trailing commas
 * are not supported and will cause errors in bundle. This file is used by `babel-loader`
 * and `babel-register` won't be able to strip those trailing commas, thus anyone
 * modifiing this file MUST make sure that prettier won't screw it up - use prettier-ignore
 * or tweak code, so that it won't be formatted.
 */

type Path = {
  node: Object,
  parentPath: Path,
  type: string,
  traverse: Function,
};

function traverseUpUntil(path: Path, checkFn: (path: Path) => boolean): Path {
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

function applyHmrTweaks({ types: t, template }, hmrImportPath: Path) {
  // Convert to named import: import 'haul-hmr' -> import withHmr from 'haul-hmr'
  const specifier = t.importDefaultSpecifier(t.identifier('withHmr'));
  hmrImportPath.node.specifiers.push(specifier);

  // Get the root (Program) path
  const program: Path = traverseUpUntil(hmrImportPath, t.isProgram);
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
          const moduleAcceptAST = createModuleAcceptSnippet(template)({
            APP_SOURCE: rootFactory.body.object.arguments[0],
          });
          program.node.body.push(moduleAcceptAST);
        } else {
          const message = 'Root component must be exported using `export default` ' +
            'and imported using `require("filename").default`';
          throw new Error(message);
        }
      }
    },
  });
}

module.exports = (babel: Object) => {
  return {
    visitor: {
      ImportDeclaration(path: Path) {
        if (
          path.node.source.value === 'haul-hmr' && !path.node.specifiers.length
        ) {
          applyHmrTweaks(babel, path);
        }
      },
    },
  };
};
