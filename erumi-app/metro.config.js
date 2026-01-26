const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Monorepo 설정: erumi-core 패키지 경로 추가
const erumiCorePath = path.resolve(__dirname, '../erumi-core');

config.watchFolders = [erumiCorePath];

config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(erumiCorePath, 'node_modules'),
];

// erumi-core 패키지를 extraNodeModules로 등록
config.resolver.extraNodeModules = {
    'erumi-core': erumiCorePath,
};

module.exports = config;
