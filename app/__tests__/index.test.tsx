import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Welcome from "../index";

// Mock lucide icons
jest.mock("lucide-react-native", () => ({
  Sparkles: "Sparkles",
}));

describe("Welcome", () => {
  it("should render welcome screen", () => {
    const { getByText } = render(<Welcome />);
    
    expect(getByText("ClearSkin AI")).toBeTruthy();
    expect(getByText("Your personal AI-powered skin analysis companion")).toBeTruthy();
  });

  it("should render Get Started button", () => {
    const { getByText } = render(<Welcome />);
    
    expect(getByText("Get Started")).toBeTruthy();
  });

  it("should render sign in button", () => {
    const { getByText } = render(<Welcome />);
    
    expect(getByText("I already have an account")).toBeTruthy();
  });

  it("should have pressable Get Started button", () => {
    const { getByText } = render(<Welcome />);
    const button = getByText("Get Started");
    
    expect(button).toBeTruthy();
    fireEvent.press(button.parent!);
  });

  it("should have pressable sign in button", () => {
    const { getByText } = render(<Welcome />);
    const button = getByText("I already have an account");
    
    expect(button).toBeTruthy();
    fireEvent.press(button.parent!);
  });

  it("should render app icon placeholder", () => {
    const { toJSON } = render(<Welcome />);
    expect(toJSON()).toBeTruthy();
  });

  it("should match snapshot", () => {
    const { toJSON } = render(<Welcome />);
    expect(toJSON()).toMatchSnapshot();
  });
});

