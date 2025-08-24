module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
            '@context': './src/context',
            '@utils': './src/utils',
            '@assets': './src/assets',
            '@constants': './src/constants',
            '@services': './src/services',
            '@types': './src/types'
          }
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};
