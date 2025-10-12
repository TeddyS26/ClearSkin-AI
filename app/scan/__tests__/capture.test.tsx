import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import Capture from "../capture";
import { useRouter } from "expo-router";

const mockTakePictureAsync = jest.fn();
const mockRequestPermission = jest.fn();

jest.mock("expo-camera", () => ({
  CameraView: "CameraView",
  useCameraPermissions: () => [
    { granted: true },
    mockRequestPermission,
  ],
}));

jest.mock("expo-router");
jest.mock("lucide-react-native", () => ({
  Camera: "Camera",
  CheckCircle: "CheckCircle",
  Circle: "Circle",
  ArrowLeft: "ArrowLeft",
}));

describe("Capture", () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockRequestPermission.mockResolvedValue({ granted: true });
  });

  it("should render capture screen", () => {
    const { getByText } = render(<Capture />);
    
    expect(getByText("Capture Photos")).toBeTruthy();
    expect(getByText("Take three photos of your face from different angles")).toBeTruthy();
  });

  it("should show progress indicators", () => {
    const { getByText } = render(<Capture />);
    
    expect(getByText("Front")).toBeTruthy();
    expect(getByText("Left")).toBeTruthy();
    expect(getByText("Right")).toBeTruthy();
  });

  it("should show camera view when photo option is pressed", async () => {
    const { getByText, queryByText } = render(<Capture />);
    const frontView = getByText("Front View").parent?.parent;

    if (frontView) {
      fireEvent.press(frontView);
    }

    await waitFor(() => {
      // After pressing, we should see the camera view instructions
      expect(queryByText("Capture Photos")).toBeFalsy();
    });
  });

  it("should display continue button when ready", () => {
    const { getByText } = render(<Capture />);
    expect(getByText("Continue to Review")).toBeTruthy();
  });

  it("should render back button", () => {
    const { getByText } = render(<Capture />);
    
    expect(getByText("Capture Photos")).toBeTruthy();
    expect(getByText("Back")).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("should navigate back when back button is pressed", () => {
    const { getByText } = render(<Capture />);
    const backButton = getByText("Back").parent;

    if (backButton) {
      fireEvent.press(backButton);
    }

    expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("should show all three photo capture options", () => {
    const { getByText } = render(<Capture />);
    
    expect(getByText("Front View")).toBeTruthy();
    expect(getByText("Left View")).toBeTruthy();
    expect(getByText("Right View")).toBeTruthy();
  });
});

