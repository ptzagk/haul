/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/**
 * Ideally, this file SHOULD NOT be processed by prettier, since trailing commas
 * are not supported and will cause errors in bundle. This file is used by `babel-loader`
 * and `babel-register` won't be able to strip those trailing commas, thus anyone
 * modifiing this file MUST make sure that prettier won't screw it up - use prettier-ignore
 * or tweak code, so that it won't be formatted.
 */

const { isAbsolute } = require('path');
const clone = require('clone');

const HMR_IMPORT_NAME = 'withHMR';

function isValidChildPath(source) {
  if (/^\.\.?\//.test(source)) {
    return true;
  }

  if (isAbsolute(source) && !source.includes('node_modules')) {
    return true;
  }

  return false;
}

const codeSnippets = [
  `${HMR_IMPORT_NAME}.tryUpdateSelf();`,
  `if (!global.__HAUL_HMR__.isInitialised) {
    APP_REGISTRATION;
    global.__HAUL_HMR__.isInitialised = true;
  }`,
  `if (module.hot) {
    module.hot.accept(undefined, () => {
      // Self-accept
    });

    module.hot.accept(CHILDREN_IMPORTS, () => {
      delete require.cache[require.resolve(ROOT_SOURCE_FILEPATH)];
      ${HMR_IMPORT_NAME}.redraw(() => require(ROOT_SOURCE_FILEPATH).default);
    });
  }
  `,
];

// prettier-ignore
function createHmrLogic(template) {
  return codeSnippets.map(snippet => template(snippet));
}

// prettier-ignore
function applyHmrTweaks(
  { types: t, template },
  programPath,
  hmrImportPath,
  state
) {
  // Convert to named import: import 'haul-hmr' -> import withHMR from 'haul-hmr'
  const specifier = t.importDefaultSpecifier(t.identifier(HMR_IMPORT_NAME));
  hmrImportPath.node.specifiers.push(specifier);

  let hasValidDefaultExport = false;
  let appRegistrationAST = null;
  const childrenImports = [];
  const sourceFilepath = state.file.opts.filename;

  programPath.traverse({
    ImportDeclaration(subpath) {
      if (isValidChildPath(subpath.node.source.value)) {
        childrenImports.push(subpath.node.source.value);
      }
    },
    ExportDefaultDeclaration(subpath) {
      if (t.isClassDeclaration(subpath.node.declaration)) {
        hasValidDefaultExport = true;
      }
    },
    CallExpression(subpath) {
      // Tweak AppRegistry.registerComponent function call
      if (
        t.isMemberExpression(subpath.node.callee) &&
        subpath.node.callee.object.name === 'AppRegistry' &&
        subpath.node.callee.property.name === 'registerComponent'
      ) {
        // Original Root component factory function
        const rootFactory = subpath.node.arguments[1];

        // Wrap Root component factory using withHMR
        // eslint-disable-next-line no-param-reassign
        subpath.node.arguments = [
          subpath.node.arguments[0],
          t.callExpression(t.identifier(HMR_IMPORT_NAME), [rootFactory]),
        ];

        appRegistrationAST = clone(subpath);
        subpath.remove();
      }
    },
  });

  // Throw error if the root component is not a exported as default
  if (!hasValidDefaultExport) {
    throw new Error('Root component must be exported using `export default`');
  }

  if (!appRegistrationAST) {
    throw new Error(
      // prettier-ignore
      '`haul-hmr` must be imported in the Root component with the presense ' +
        'of `AppRegistry.registerComponent` call'
    );
  }

  programPath.node.body.push(
    ...createHmrLogic(template).map(tmpl =>
      // prettier-ignore
      tmpl({
        APP_REGISTRATION: appRegistrationAST,
        CHILDREN_IMPORTS: t.arrayExpression(
          // prettier-ignore
          childrenImports.map(item => t.stringLiteral(item))
        ),
        ROOT_SOURCE_FILEPATH: t.stringLiteral(sourceFilepath),
      }))
  );
}

module.exports = babel => {
  return {
    visitor: {
      Program(path, state) {
        path.traverse({
          ImportDeclaration(importPath) {
            if (
              importPath.node.source.value === 'haul-hmr' &&
              !importPath.node.specifiers.length
            ) {
              applyHmrTweaks(babel, path, importPath, state);
            }
          },
        });
      },
    },
  };
};
