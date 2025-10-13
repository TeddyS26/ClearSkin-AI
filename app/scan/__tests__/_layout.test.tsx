import React from "react";
import { render } from "@testing-library/react-native";
import ScanLayout from "../_layout";

// Mock dependencies
jest.mock("expo-router", () => {
  const MockStack = ({ children }: any) => children;
  MockStack.Screen = () => null;
  return {
    Stack: MockStack,
  };
});

describe("ScanLayout", () => {
  it("should export a function", () => {
    expect(typeof ScanLayout).toBe("function");
  });

  it("should have the correct component name", () => {
    expect(ScanLayout.name).toBe("ScanLayout");
  });

  it("should render without crashing", () => {
    // Since we're using a mock Stack that returns children,
    // we just need to verify the component renders
    expect(() => render(<ScanLayout />)).not.toThrow();
  });
});

