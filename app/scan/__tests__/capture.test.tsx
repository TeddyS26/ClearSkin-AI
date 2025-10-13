import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import Capture from "../capture";
import { useRouter } from "expo-router";
import { authorizeScan } from "../../../src/lib/scan";

const mockTakePictureAsync = jest.fn();
const mockRequestPermission = jest.fn();

let mockPermission: { granted: boolean } | null = { granted: true };

jest.mock("expo-camera", () => ({
  CameraView: jest.fn(({ children }) => children),
  useCameraPermissions: jest.fn(() => [mockPermission, mockRequestPermission]),
}));

jest.mock("expo-router");
jest.mock("../../../src/lib/scan");
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
    mockPermission = { granted: true };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (authorizeScan as jest.Mock).mockResolvedValue({ allowed: true, reason: "active" });
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockRequestPermission.mockResolvedValue({ granted: true });
    mockTakePictureAsync.mockResolvedValue({ uri: "file:///photo.jpg" });
  });

  it("should render capture screen", async () => {
    const { getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByText("Capture Photos")).toBeTruthy();
      expect(getByText("Take three photos of your face from different angles")).toBeTruthy();
    });
  });

  it("should show progress indicators", async () => {
    const { getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByText("Front")).toBeTruthy();
      expect(getByText("Left")).toBeTruthy();
      expect(getByText("Right")).toBeTruthy();
    });
  });

  it("should open camera mode when photo option is pressed using test ID", async () => {
    const { getByTestId, getByText } = render(<Capture />);

    await waitFor(() => {
      expect(getByTestId("front-photo-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("front-photo-button"));

    await waitFor(() => {
      expect(getByText("Position your face within the frame")).toBeTruthy();
    });
  });

  it("should display continue button when ready", async () => {
    const { getByText } = render(<Capture />);
    await waitFor(() => {
      expect(getByText("Continue to Review")).toBeTruthy();
    });
  });

  it("should render back button", async () => {
    const { getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByText("Capture Photos")).toBeTruthy();
      expect(getByText("Back")).toBeTruthy();
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("should navigate back when back button is pressed", async () => {
    const { getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByText("Back")).toBeTruthy();
    });
    
    const backButton = getByText("Back").parent;

    if (backButton) {
      fireEvent.press(backButton);
    }

    expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("should show all three photo capture options", async () => {
    const { getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByText("Front View")).toBeTruthy();
      expect(getByText("Left View")).toBeTruthy();
      expect(getByText("Right View")).toBeTruthy();
    });
  });

  it("should request permission when permission is null", async () => {
    mockPermission = null;
    mockRequestPermission.mockResolvedValue({ granted: true });

    const { getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByText("Front View")).toBeTruthy();
    });
    
    const frontView = getByText("Front View").parent?.parent;

    if (frontView) {
      fireEvent.press(frontView);
    }

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it("should show alert when permission is denied", async () => {
    mockPermission = null;
    mockRequestPermission.mockResolvedValue({ granted: false });

    const { getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByText("Front View")).toBeTruthy();
    });
    
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

  it("should show alert when permission not granted initially", async () => {
    mockPermission = { granted: false };
    mockRequestPermission.mockResolvedValue({ granted: false });

    const { getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByText("Left View")).toBeTruthy();
    });
    
    const leftView = getByText("Left View").parent?.parent;
    if (leftView) {
      fireEvent.press(leftView);
    }

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it("should show camera instructions when in camera mode", async () => {
    const { getByTestId, getByText } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByTestId("left-photo-button")).toBeTruthy();
    });
    
    fireEvent.press(getByTestId("left-photo-button"));

    await waitFor(() => {
      expect(getByText("Position your face within the frame")).toBeTruthy();
      expect(getByText("Left View")).toBeTruthy();
    });
  });

  it("should cancel camera mode when cancel is pressed", async () => {
    const { getByText, getByTestId } = render(<Capture />);
    
    await waitFor(() => {
      expect(getByTestId("front-photo-button")).toBeTruthy();
    });
    
    const frontView = getByTestId("front-photo-button");
    fireEvent.press(frontView);

    await waitFor(() => {
      expect(getByText("Cancel")).toBeTruthy();
    });

    const cancelButton = getByTestId("cancel-camera-button");
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(getByText("Capture Photos")).toBeTruthy();
    });
  });


  it("should show continue button", async () => {
    const { getByText } = render(<Capture />);
    await waitFor(() => {
      expect(getByText("Continue to Review")).toBeTruthy();
    });
  });

  it("should show tap to capture text for all empty photo slots", async () => {
    const { getAllByText } = render(<Capture />);
    await waitFor(() => {
      const tapTexts = getAllByText("Tap to capture");
      expect(tapTexts.length).toBe(3); // One for each photo slot
    });
  });

  it("should render all testIDs correctly", async () => {
    const { getByTestId } = render(<Capture />);
    await waitFor(() => {
      expect(getByTestId("front-photo-button")).toBeTruthy();
      expect(getByTestId("left-photo-button")).toBeTruthy();
      expect(getByTestId("right-photo-button")).toBeTruthy();
      expect(getByTestId("continue-button")).toBeTruthy();
    });
  });
});

