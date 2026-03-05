const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// מציאת שורש הפרויקט ושורש ה-workspace
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. מעקב אחר כל הקבצים ב-monorepo
config.watchFolders = [monorepoRoot];

// 2. הגדרת מיקומי החבילות וסדר הפתרון שלהן
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. כפיית Metro לפתור תלויות רק מהנתיבים המוגדרים
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
