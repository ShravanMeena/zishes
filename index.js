/**
 * @format
 */

import {AppRegistry} from 'react-native';
// Register background handlers for notifications
import './src/notifications/background';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
