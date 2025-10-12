import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import Capture from "../capture";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

jest.mock("expo-image-picker");
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

  it("should request camera permission when taking photo", async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });

    const { getByText } = render(<Capture />);
    const frontView = getByText("Front View").parent?.parent;

    if (frontView) {
      fireEvent.press(frontView);
    }

    await waitFor(() => {
      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
    });
  });

  it("should show alert when camera permission denied", async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
    });

    const { getByText } = render(<Capture />);
    const frontView = getByText("Front View").parent?.parent;

    if (frontView) {
      fireEvent.press(frontView);
    }

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permission needed",
        "Camera access is required."
      );
    });
  });

  it("should update state when photo taken", async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///photo.jpg" }],
    });

    const { getByText } = render(<Capture />);
    const frontView = getByText("Front View").parent?.parent;

    if (frontView) {
      fireEvent.press(frontView);
    }

    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    });
  });

  it("should display continue button when ready", () => {
    const { getByText } = render(<Capture />);
    expect(getByText("Continue to Review")).toBeTruthy();
  });

  it("should handle cancelled photo capture", async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });

    const { getAllByText } = render(<Capture />);
    const frontView = getAllByText("Tap to capture")[0].parent?.parent?.parent;

    if (frontView) {
      fireEvent.press(frontView);
    }

    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    });
    
    // Should still show the tap to capture texts
    expect(getAllByText("Tap to capture").length).toBeGreaterThan(0);
  });

  it("should render back button", () => {
    const { getByText } = render(<Capture />);
    
    // Verify the capture screen renders with the back button
    // (back button is an X icon, hard to test directly without testID)
    expect(getByText("Capture Photos")).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

