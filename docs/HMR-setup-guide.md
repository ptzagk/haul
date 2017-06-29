# Setting up Hot Module Reloading
> __This guide assumes you have your project already created.__

In order to use HMR please follow this __one-time__ setup process:

1. Rename `index.ios.js` to `app.ios.js` or `index.android.js` to `app.andoid.js`.

2. Create `index.ios.js` or `index.andoid.js`.

3. Move `AppRegistry` import and the last line from `app.ios.js` to `index.ios.js` or 
`app.android.js` to `index.andoid.js`:

#### `app.ios.js` / `app.android.js`
```diff
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
-  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default class myApp extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native! haha
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.ios.js
        </Text>
        <Text style={styles.instructions}>
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu
        </Text>
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
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

- AppRegistry.registerComponent('myApp', () => myApp);

```

#### `index.ios.js` / `index.android.js`
```diff
+ import { AppRegistry } from 'react-native';

+ AppRegistry.registerComponent('myApp', () => myApp);
```

4. In `index.ios.js` or `index.andoid.js`, import `haul-hmr` at the top of the file - __it must be the first line__:

```diff
+ import withHmr from 'haul-hmr';
import { AppRegistry } from 'react-native';

AppRegistry.registerComponent('myApp', () => myApp);
```

5. Replace 2nd argument of `registerComponent` function call with `withHMR(() => require('./app.ios.js').default)` in `index.ios.js` / `index.android.js`:

```diff
import withHmr from 'haul-hmr';
import { AppRegistry } from 'react-native';

- AppRegistry.registerComponent('myApp', () => myApp);
+ AppRegistry.registerComponent(
+   'myApp',
+   withHMR(() => require('./app.ios.js').default)
+ );
```

6. Add the following snippet at the end of the `index.ios.js` / `index.android.js` file:

```diff
import withHmr from 'haul-hmr';
import { AppRegistry } from 'react-native';

AppRegistry.registerComponent(
  'myApp',
  withHMR(() => require('./app.ios.js').default)
);

+ if (module.hot) {
+   module.hot.accept('./app.ios.js', () => {
+     withHMR.redraw();
+   });
+ }
```

7. Profit.

`withHMR` will add everything needed to support HMR in development and in production (`NODE_ENV=production`) will just pass through component from `app.ios.js` or `app.andoid.js`.


# Enabling Hot Module Reloading
To enable HMR, open _Developer menu_ -> _Enable Hot Reloading_.
