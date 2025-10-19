module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|lucide-react-native)"
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!app/settings.tsx",
    "!app/privacy-policy.tsx",
    "!app/terms-of-service.tsx",
    "!app/auth/confirm.tsx",
    "!app/subscribe.tsx",
    "!app/auth/sign-in.tsx",
    "!app/checkout/*.tsx",
    "!app/(tabs)/_layout.tsx"
  ],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60
    }
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.css$": "<rootDir>/__mocks__/styleMock.js"
  }
};

