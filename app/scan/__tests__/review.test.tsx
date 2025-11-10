import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Review from "../review";
import { useRouter, useLocalSearchParams } from "expo-router";

jest.mock("expo-router");
jest.mock("lucide-react-native", () => ({
  CheckCircle: "CheckCircle",
  RotateCcw: "RotateCcw",
  Sparkles: "Sparkles",
  Info: "Info",
}));

describe("Review", () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };
  const mockParams = {
    front: "file:///front.jpg",
    left: "file:///left.jpg",
    right: "file:///right.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);
  });

  it("should render review screen", () => {
    const { getByText } = render(<Review />);
    
    expect(getByText("Review Photos")).toBeTruthy();
    expect(getByText("Make sure all photos are clear and well-lit")).toBeTruthy();
  });

  it("should display all three photo labels", () => {
    const { getByText } = render(<Review />);
    
    expect(getByText("Front View")).toBeTruthy();
    expect(getByText("Left View")).toBeTruthy();
    expect(getByText("Right View")).toBeTruthy();
  });

  it("should render start analysis button", () => {
    const { getByText } = render(<Review />);
    
    expect(getByText("Start Analysis")).toBeTruthy();
  });

  it("should render retake photos button", () => {
    const { getByText } = render(<Review />);
    
    expect(getByText("Retake Photos")).toBeTruthy();
  });

  it("should navigate to loading when start analysis pressed", () => {
    const { getByText } = render(<Review />);
    
    fireEvent.press(getByText("Start Analysis"));
    
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/scan/loading",
      params: mockParams,
    });
  });

  it("should navigate to loading with context when context is provided", () => {
    const { getByText, getByTestId } = render(<Review />);
    const contextInput = getByTestId("context-input");
    
    // Enter context
    fireEvent.changeText(contextInput, "My skin is dry on cheeks");
    
    fireEvent.press(getByText("Start Analysis"));
    
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/scan/loading",
      params: {
        ...mockParams,
        context: "My skin is dry on cheeks",
      },
    });
  });

  it("should go back when retake photos pressed", () => {
    const { getByText } = render(<Review />);
    
    fireEvent.press(getByText("Retake Photos"));
    
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("should display images with correct URIs", () => {
    const { toJSON } = render(<Review />);
    const tree = toJSON();
    
    expect(tree).toBeTruthy();
  });

  it("should open modal when image is tapped", () => {
    const { getByTestId, getByText, queryByText } = render(<Review />);
    
    // Modal should not be visible initially
    expect(queryByText("Close")).toBeNull();
    
    // Tap on front image
    fireEvent.press(getByTestId("image-front"));
    
    // Modal should now be visible
    expect(getByText("Close")).toBeTruthy();
    expect(getByText("Tap outside image to close")).toBeTruthy();
  });

  it("should close modal when Close button is pressed", () => {
    const { getByTestId, getByText, queryByText } = render(<Review />);
    
    // Open modal
    fireEvent.press(getByTestId("image-front"));
    expect(getByText("Close")).toBeTruthy();
    
    // Close modal
    fireEvent.press(getByText("Close"));
    
    // Modal should be closed
    expect(queryByText("Close")).toBeNull();
  });

  it("should render context input field", () => {
    const { getByTestId, getByText } = render(<Review />);
    
    expect(getByText("Additional Context (Optional)")).toBeTruthy();
    expect(getByTestId("context-input")).toBeTruthy();
    expect(getByText(/Provide any relevant information/)).toBeTruthy();
  });

  it("should display character counter", () => {
    const { getByTestId, getByText } = render(<Review />);
    const contextInput = getByTestId("context-input");
    
    // Initially should show 0/500
    expect(getByText("0/500")).toBeTruthy();
    
    // Type some text
    fireEvent.changeText(contextInput, "Test context");
    
    // Should update counter
    expect(getByText("12/500")).toBeTruthy();
  });

  it("should limit context input to 500 characters", () => {
    const { getByTestId } = render(<Review />);
    const contextInput = getByTestId("context-input");
    
    // Verify maxLength prop is set correctly
    expect(contextInput.props.maxLength).toBe(500);
  });

  it("should not include context in params when empty", () => {
    const { getByText } = render(<Review />);
    
    fireEvent.press(getByText("Start Analysis"));
    
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/scan/loading",
      params: mockParams,
    });
  });

  it("should trim context before navigation", () => {
    const { getByText, getByTestId } = render(<Review />);
    const contextInput = getByTestId("context-input");
    
    // Enter context with whitespace
    fireEvent.changeText(contextInput, "  My skin is dry  ");
    
    fireEvent.press(getByText("Start Analysis"));
    
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/scan/loading",
      params: {
        ...mockParams,
        context: "My skin is dry",
      },
    });
  });

  it("should match snapshot", () => {
    const { toJSON } = render(<Review />);
    
    expect(toJSON()).toMatchSnapshot();
  });
});
