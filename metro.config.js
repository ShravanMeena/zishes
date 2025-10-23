const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const blockList = exclusionList([
  new RegExp(`${escapeRegExp(path.resolve(__dirname, 'unity'))}\\/.*`),
  new RegExp(`${escapeRegExp(path.resolve(__dirname, 'ios', 'Pods'))}\\/.*`),
  new RegExp(`${escapeRegExp(path.resolve(__dirname, 'ios', 'build'))}\\/.*`),
  new RegExp(`${escapeRegExp(path.resolve(__dirname, 'android', 'build'))}\\/.*`),
  new RegExp(
    `${escapeRegExp(path.resolve(__dirname, 'android', 'app', 'build'))}\\/.*`,
  ),
]);

const config = {
  resolver: {
    blockList,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
