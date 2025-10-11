import React from "react";
import { render } from "@testing-library/react-native";
import ScanPlaceholder from "../scan-placeholder";

describe("ScanPlaceholder", () => {
  it("should render empty view", () => {
    const { toJSON } = render(<ScanPlaceholder />);
    expect(toJSON()).toBeTruthy();
  });

  it("should match snapshot", () => {
    const { toJSON } = render(<ScanPlaceholder />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("should export a function", () => {
    expect(typeof ScanPlaceholder).toBe("function");
  });
});

