/* @flow */

export default function AppContainer(rootFactory: Function) {
  return rootFactory();
}

AppContainer.redraw = () => {};
