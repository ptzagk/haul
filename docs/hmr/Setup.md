# Hot Module Replacement setup
Jump to: [Automatic setup](#autoamtic-setup) | [Manual setup](#manual-setup)

For smaller project, we provider automatic option for setting up Hot Module Replacement. If your project satisfy the following criteria, you're good to go to use automatic setup:

* Signle root component exported from the root file with `default` keyword (`export default`)
* Single `AppRegistry.registerComponent` call
* Root component and `AppRegistry.registerComponent` call are in the same file

So, the root file (`index.ios.js` or `index.android.js`) should look more or less like this:

```javascript
import React, { Component } from 'react';
import {
  AppRegistry,
  /* ... */
} from 'react-native';

export default class MyProject extends Component {
  /* ... */
}

/* ... */

AppRegistry.registerComponent('MyProject', () => MyProject);
```

All **default** `index.ios.js` and `index.android.js` files created by `react-native init` are fine for automatic setup.

## Automatic setup

In order to enable HMR add `import 'haul/hot';` at the top of the root file - usually `index.ios.js` or `index.android.js`. Then, from within _Developer menu_ tap _Enable Hot Reloading_.

## Manual setup
Navigate to: [API docs](./API.md)

Jump to: [Examples](#examples)

For advanced project or the ones with different structure, we provide hot API, which allows you to enable HMR regardless of which navigation library you use and how you structure yor code.

This guide is ___ of any naviagtion library, so if you're using one of the following, please refere to associated guide:

* [`react-native-naviagion`](./guides/react-native-navigation.md)

------

Haul uses `react-hot-loader` to support HMR, so the first step is to _patch_ React's `createElement` and `createFactory` functions to use proxied. Proxied component can be updated with a new implementation but it's state is presisted.
In order to do that, add the following line to the root file - the one that is used as an entrypoint, before any other code:

```javascript
import 'haul/hot/patch';
```

It's important that __the code from `haul/hot/patch` is evaluated before anything else!__

All of the functions used below can be imported with:

```javascript
import {
  makeHot,
  tryUpdateSelf,
  callOnce,
  clearCacheFor,
  redraw
} from 'haul/hot';
```

Now, we need to wrap root component factories using `makeHot` function. Root component factory is a function that returns a root component:

```javascript
() => RootComponent
```

You can encounter those in `AppRegistry.registerComponent` or `Navigation.registerComponent` calls:

```javascript
AppRegistry.registerComponent('MyApp', () => MyApp);
// or
Navigation.registerComponent('MyScreen', () => MyScreen);
```

After wrapping those with `makeHot` it should looke like this:

```javascript
AppRegistry.registerComponent('MyApp', makeHot(() => MyApp));
// or
Navigation.registerComponent('MyScreen', makeHot(() => MyScreen));
```

If your app has multiple root components (usually they're treated as screens), you need to pass second argument to `makeHot` call, which is a `id` of the component factory. It will be used later to tell which component needs to be redrawn:

```javascript
Navigation.registerComponent('MyScreen1', makeHot(() => MyScreen1, 'MyScreen1'));
Navigation.registerComponent('MyScreen2', makeHot(() => MyScreen2, 'MyScreen2'));
Navigation.registerComponent('MyScreen3', makeHot(() => MyScreen3, 'MyScreen3'));
```

Next step is optional, and __can be applied only if you have a single root component__ and `registerComponent` call in same file. In that case, when the file will be re-evaluated upon hot update, the app won't be refreshed unless you add

```javascript
tryUpdateSelf();
```

somewhere in the file. This function will try to rerender the root component.

There's also one thing to keep in mind, if you have the root component and `registerComponent` call in single file, you should use `callOnce` function and pass a callback with code that should run only once, not on every re-evaluation.

```javascript
callOnce(() => {
  AppRegistry.registerComponent('MyApp', makeHot(() => MyApp));
  /* ... other logic, which should run only once ... */
});
```

The last thing is to acually tell the Webpack which modules we want to accept and how to update them. You can safely copy-pase the following snippet:

```javascript
if (module.hot) {
  module.hot.accept(() => {})
  module.hot.accept('path/to/module/or/children', () => {
    clearCacheFor(require.resolve('path/to/module'));
    redraw(() => require('path/to/module').default);
  });
}
```

Now, you need to replace the path according to the following rules:
* If you have a single root component, `module.hot.accept` first argument should be an array of paths to children components and the rest of the paths should be to itself:
  ```javascript
  // file: index.js
  import Child1 from './Child1';
  import Child2 from './Child2';

  /* ... */

  export default MyApp { /* ... */ }

  /* ... */

  if (module.hot) {
    module.hot.accept(() => {})
    module.hot.accept(['./Child1', './Child2'], () => {
      clearCacheFor(require.resolve('./index'));
      redraw(() => require('./index').default);
    });
  }
  ```
* If you have a multi root component, all of the paths should be to the root component and each of the root components should have a separate `module.hot.accept` call:
  ```javascript
  // file: index.js
  import Root1 from './Root1';
  import Root2 from './Root2';

  /* ... */

  if (module.hot) {
    module.hot.accept(() => {})
    module.hot.accept('./Root1', () => {
      clearCacheFor(require.resolve('./Root1'));
      redraw(() => require('./Root1').default, 'Root1');
    });

    module.hot.accept('./Root2', () => {
      clearCacheFor(require.resolve('./Root2'));
      redraw(() => require('./Root2').default, 'Root2');
    });
  }
  ```

## Examples

### Single root component in a entry file

```javascript
import 'haul/hot/patch';
import {
  makeHot,
  tryUpdateSelf,
  callOnce,
  clearCacheFor,
  redraw
} from 'haul/hot';
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Header from './Header';

export default class MyApp extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Header />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});

trySelfUpdate();

callOnce(() => {
  AppRegistry.registerComponent('MyApp', makeHot(() => MyApp));
});

if (module.hot) {
  module.hot.accept(() => {})
  module.hot.accept(['./Header'], () => {
    clearCacheFor(require.resolve('./index'));
    redraw(() => require('./index').default);
  });
}
```

### Multi root component

```javascript
// index.js
import 'haul/hot/patch';
import './screens';
```

```javascript
// screens.js
import {
  makeHot,
  tryUpdateSelf,
  callOnce,
  clearCacheFor,
  redraw
} from 'haul/hot';
import Navigation from 'some-naviagtion-lib';

import Calendar from './Calendar';
import Location from './Location';

Navigation.registerComponent('Calendar', makeHot(() => Calendar, 'Calendar'));Navigation.registerComponent('Location', makeHot(() => Location, 'Location'));

if (module.hot) {
  module.hot.accept('./Calendar', () => {
    clearCacheFor(require.resolve('./Calendar'));
    redraw(() => require('./Calendar').default);
  });
  module.hot.accept('./Location', () => {
    clearCacheFor(require.resolve('./Location'));
    redraw(() => require('./Location').default);
  });
}
```