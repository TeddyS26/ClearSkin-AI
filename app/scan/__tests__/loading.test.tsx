import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Loading from "../loading";
import {
  createScanSession,
  uploadThreePhotos,
  callAnalyzeFunction,
  waitForScanComplete,
  isValidScan,
  deleteScan,
} from "../../../src/lib/scan";
import {
  requestNotificationPermissions,
  notifyScanComplete,
  scheduleScanReminder,
} from "../../../src/lib/notifications";
import { useRouter, useLocalSearchParams } from "expo-router";

jest.mock("../../../src/lib/scan");
jest.mock("../../../src/lib/notifications");
jest.mock("expo-router");
jest.mock("lucide-react-native", () => ({
  Sparkles: "Sparkles",
  Upload: "Upload",
  Brain: "Brain",
  CheckCircle: "CheckCircle",
  Camera: "Camera",
  BellRing: "BellRing",
}));

describe("Loading", () => {
  const mockRouter = { replace: jest.fn() };
  const mockParams = {
    front: "file:///front.jpg",
    left: "file:///left.jpg",
    right: "file:///right.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);
    // Default to valid scan
    (isValidScan as jest.Mock).mockReturnValue(true);
    (deleteScan as jest.Mock).mockResolvedValue(undefined);
    // Mock notification functions
    (requestNotificationPermissions as jest.Mock).mockResolvedValue(true);
    (notifyScanComplete as jest.Mock).mockResolvedValue(undefined);
    (scheduleScanReminder as jest.Mock).mockResolvedValue(undefined);
  });

  it("should show initial loading message", () => {
    (createScanSession as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByText } = render(<Loading />);
    
    expect(getByText("Analyzing your skin")).toBeTruthy();
  });

  it("should go through all loading stages", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({
      frontPath: "path/front.jpg",
      leftPath: "path/left.jpg",
      rightPath: "path/right.jpg",
    });
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: 85,
    });
    (isValidScan as jest.Mock).mockReturnValue(true);

    const { getByText, unmount } = render(<Loading />);

    await waitFor(
      () => {
        expect(createScanSession).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(uploadThreePhotos).toHaveBeenCalledWith(
          "scan-123",
          "user-456",
          expect.objectContaining({
            front: "file:///front.jpg",
            left: "file:///left.jpg",
            right: "file:///right.jpg",
          })
        );
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(callAnalyzeFunction).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(waitForScanComplete).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for navigation to complete
    await waitFor(
      () => {
        expect(mockRouter.replace).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Cleanup
    unmount();
  });

  it("should navigate to result when analysis complete", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({});
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: 85,
    });
    (isValidScan as jest.Mock).mockReturnValue(true);

    render(<Loading />);

    await waitFor(
      () => {
        expect(mockRouter.replace).toHaveBeenCalledWith({
          pathname: "/scan/result",
          params: { id: "scan-123" },
        });
      },
      { timeout: 5000 }
    );
  });

  it("should show error when analysis fails", async () => {
    (createScanSession as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    const { getByText } = render(<Loading />);

    await waitFor(() => {
      expect(getByText("Something went wrong")).toBeTruthy();
      expect(getByText("Network error")).toBeTruthy();
    });
  });

  it("should show error when scan status is not complete", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({});
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "failed",
    });

    const { getByText } = render(<Loading />);

    await waitFor(() => {
      expect(getByText("Analysis failed. Please try again.")).toBeTruthy();
    });
  });

  it("should show error when scan is invalid (no face detected)", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({});
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: null, // Invalid scan - no face detected
    });
    (isValidScan as jest.Mock).mockReturnValue(false);

    const { getByText } = render(<Loading />);

    await waitFor(() => {
      expect(getByText("Face Not Detected")).toBeTruthy();
      expect(getByText(/couldn't detect a face/i)).toBeTruthy();
    });
  });

  it("should delete invalid scan and show try again button", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({});
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: null,
    });
    (isValidScan as jest.Mock).mockReturnValue(false);

    const { getByText } = render(<Loading />);

    await waitFor(() => {
      expect(deleteScan).toHaveBeenCalledWith("scan-123");
      expect(getByText("Try Again")).toBeTruthy();
    });
  });

  it("should navigate to capture when try again is pressed", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({});
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: null,
    });
    (isValidScan as jest.Mock).mockReturnValue(false);

    const { getByText } = render(<Loading />);

    await waitFor(() => {
      expect(getByText("Try Again")).toBeTruthy();
    });

    fireEvent.press(getByText("Try Again"));

    expect(mockRouter.replace).toHaveBeenCalledWith("/scan/capture");
  });

  it("should pass context to callAnalyzeFunction when provided", async () => {
    const mockParamsWithContext = {
      ...mockParams,
      context: "My skin is dry on cheeks",
    };
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParamsWithContext);

    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({
      frontPath: "path/front.jpg",
      leftPath: "path/left.jpg",
      rightPath: "path/right.jpg",
    });
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: 85,
    });

    render(<Loading />);

    await waitFor(
      () => {
        expect(callAnalyzeFunction).toHaveBeenCalledWith(
          "scan-123",
          {
            frontPath: "path/front.jpg",
            leftPath: "path/left.jpg",
            rightPath: "path/right.jpg",
          },
          "My skin is dry on cheeks"
        );
      },
      { timeout: 3000 }
    );
  });

  it("should pass undefined context when not provided", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({
      frontPath: "path/front.jpg",
      leftPath: "path/left.jpg",
      rightPath: "path/right.jpg",
    });
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: 85,
    });

    render(<Loading />);

    await waitFor(
      () => {
        expect(callAnalyzeFunction).toHaveBeenCalledWith(
          "scan-123",
          {
            frontPath: "path/front.jpg",
            leftPath: "path/left.jpg",
            rightPath: "path/right.jpg",
          },
          undefined
        );
      },
      { timeout: 3000 }
    );
  });

  it("should trim context before passing to callAnalyzeFunction", async () => {
    const mockParamsWithWhitespace = {
      ...mockParams,
      context: "  My skin is dry  ",
    };
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParamsWithWhitespace);

    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({
      frontPath: "path/front.jpg",
      leftPath: "path/left.jpg",
      rightPath: "path/right.jpg",
    });
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: 85,
    });

    render(<Loading />);

    await waitFor(
      () => {
        expect(callAnalyzeFunction).toHaveBeenCalledWith(
          "scan-123",
          {
            frontPath: "path/front.jpg",
            leftPath: "path/left.jpg",
            rightPath: "path/right.jpg",
          },
          "My skin is dry"
        );
      },
      { timeout: 3000 }
    );
  });

  it("should request notification permissions on mount", async () => {
    (createScanSession as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<Loading />);

    await waitFor(() => {
      expect(requestNotificationPermissions).toHaveBeenCalled();
    });
  });

  it("should schedule bi-weekly reminder after successful scan", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({});
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: 85,
    });
    (isValidScan as jest.Mock).mockReturnValue(true);

    render(<Loading />);

    await waitFor(
      () => {
        expect(scheduleScanReminder).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );
  });

  it("should not schedule reminder for invalid scan (no face detected)", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({});
    (callAnalyzeFunction as jest.Mock).mockResolvedValue({});
    (waitForScanComplete as jest.Mock).mockResolvedValue({
      status: "complete",
      skin_score: null,
    });
    (isValidScan as jest.Mock).mockReturnValue(false);

    render(<Loading />);

    await waitFor(() => {
      expect(isValidScan).toHaveBeenCalled();
    });

    // Wait a bit to ensure scheduleScanReminder was not called
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(scheduleScanReminder).not.toHaveBeenCalled();
  });

  it("should show 'This may take up to a minute' message during analysis", async () => {
    (createScanSession as jest.Mock).mockResolvedValue({
      scanId: "scan-123",
      userId: "user-456",
    });
    (uploadThreePhotos as jest.Mock).mockResolvedValue({});
    (callAnalyzeFunction as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByText } = render(<Loading />);

    await waitFor(() => {
      expect(getByText(/This may take up to a minute/)).toBeTruthy();
    });
  });
});
