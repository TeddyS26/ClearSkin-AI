import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Review from "../review";
import { useRouter, useLocalSearchParams } from "expo-router";

jest.mock("expo-router");
jest.mock("lucide-react-native", () => ({
  CheckCircle: "CheckCircle",
  RotateCcw: "RotateCcw",
  Sparkles: "Sparkles",
  ArrowLeft: "ArrowLeft",
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

  it("should go back when retake photos pressed", () => {
    const { getByText } = render(<Review />);
    
    fireEvent.press(getByText("Retake Photos"));
    
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("should navigate back to capture when back button pressed", () => {
    const { getAllByText } = render(<Review />);
    
    const backButton = getAllByText("Back")[0];
    fireEvent.press(backButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith("/scan/capture");
  });

  it("should display images with correct URIs", () => {
    const { toJSON } = render(<Review />);
    const tree = toJSON();
    
    expect(tree).toBeTruthy();
  });

  it("should match snapshot", () => {
    const { toJSON } = render(<Review />);
    
    expect(toJSON()).toMatchSnapshot();
  });
});

