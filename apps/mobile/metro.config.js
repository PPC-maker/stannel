const { getDefaultConfig } = require('expo/metro-config');

// Expo configures workspace resolution for this pnpm monorepo.
module.exports = getDefaultConfig(__dirname);
