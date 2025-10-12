import React from "react";
import { render } from "@testing-library/react-native";
import { Platform, BackHandler } from "react-native";
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
jest.mock("expo-router", () => ({
  Stack: "Stack",
}));
jest.mock("../../src/ctx/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
}));

describe("RootLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should export a function", () => {
    expect(typeof RootLayout).toBe("function");
  });

  it("should have the correct component name", () => {
    expect(RootLayout.name).toBe("RootLayout");
  });

  it("should render without crashing", () => {
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeTruthy();
  });

  it("should set up BackHandler on Android", () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, "OS", {
      get: () => "android",
    });

    const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener");
    
    render(<RootLayout />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "hardwareBackPress",
      expect.any(Function)
    );

    // Restore original platform
    Object.defineProperty(Platform, "OS", {
      get: () => originalPlatform,
    });
  });

  it("should not set up BackHandler on iOS", () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, "OS", {
      get: () => "ios",
    });

    const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener");
    
    render(<RootLayout />);

    expect(addEventListenerSpy).not.toHaveBeenCalled();

    // Restore original platform
    Object.defineProperty(Platform, "OS", {
      get: () => originalPlatform,
    });
  });
});

