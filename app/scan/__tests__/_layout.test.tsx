import React from "react";
import { render } from "@testing-library/react-native";
import ScanLayout from "../_layout";

// Mock dependencies
jest.mock("expo-router", () => ({
  Stack: "Stack",
}));

describe("ScanLayout", () => {
  it("should export a function", () => {
    expect(typeof ScanLayout).toBe("function");
  });

  it("should have the correct component name", () => {
    expect(ScanLayout.name).toBe("ScanLayout");
  });

  it("should render without crashing", () => {
    const { toJSON } = render(<ScanLayout />);
    expect(toJSON()).toBeTruthy();
  });
});

