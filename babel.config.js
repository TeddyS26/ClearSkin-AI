module.exports = function (api) {
  api.cache(true);
  return {
    // Use NativeWind as a preset (it returns a preset-style config)
    presets: ["babel-preset-expo", "nativewind/babel"],
    // Reanimated plugin must be listed last
    plugins: ["react-native-reanimated/plugin"],
  };
};
