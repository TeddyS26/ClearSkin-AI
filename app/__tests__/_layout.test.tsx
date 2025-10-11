import RootLayout from "../_layout";

// Mock dependencies
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: "GestureHandlerRootView",
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: "SafeAreaProvider",
}));
jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

describe("RootLayout", () => {
  it("should export a function", () => {
    expect(typeof RootLayout).toBe("function");
  });

  it("should have the correct component name", () => {
    expect(RootLayout.name).toBe("RootLayout");
  });
});

