# Setting up Hot Module Reloading
> __This guide assumes you have your project already created.__

In order to use HMR please follow this __one-time__ setup process:

1. Rename `index.ios.js` to `app.ios.js` or `index.android.js` to `app.android.js`.

2. Create `index.ios.js` or `index.android.js`.

3. Move `AppRegistry` import and the last line from `app.ios.js` to `index.ios.js` or 
`app.android.js` to `index.android.js`:

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
4. Require Root Component in `registerComponent`'s 2nd argument in `index.ios.js` / `index.android.js`:
```diff
import { AppRegistry } from 'react-native';

- AppRegistry.registerComponent('myApp', () => myApp);
+ AppRegistry.registerComponent('myApp', () => require('./app.ios.js')); // use `app.android.js` for `index.andoid.js`
```

5. In `index.ios.js` or `index.android.js`, import `haul-hmr` at the top of the file - __it must come before any other line of code__:

```diff
+ import 'haul-hmr';
import { AppRegistry } from 'react-native';

AppRegistry.registerComponent('myApp', () => require('./app.ios.js'));
```

6. Profit.

`import 'haul-hmr'` works like a switch - if preset, it will tweak you bundle for Hot Reloading
in development. You can safely leave it when bundling your app, since in production (`NODE_ENV=production`)
it's a NO-OP.


# Enabling Hot Module Reloading
To enable HMR, open _Developer menu_ -> _Enable Hot Reloading_.
