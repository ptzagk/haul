# Setting up Hot Module Reloading
> __This guide assumes you have your project already created.__

In order to use HMR please follow this __one-time__ setup process:

1. Rename `index.ios.js` to `app.ios.js` or `index.android.js` to `app.andoid.js`.
2. Create `index.ios.js` or `index.andoid.js`.
3. Move last line from `app.ios.js` to `index.ios.js` or `app.android.js` to `index.andoid.js`:
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


# Enabling Hot Module Reloading
To enable HMR, open _Developer menu_ -> _Enable Hot Reloading_.
