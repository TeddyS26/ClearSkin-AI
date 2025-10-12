import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import Loading from "../loading";
import {
  createScanSession,
  uploadThreePhotos,
  callAnalyzeFunction,
  waitForScanComplete,
} from "../../../src/lib/scan";
import { useRouter, useLocalSearchParams } from "expo-router";

jest.mock("../../../src/lib/scan");
jest.mock("expo-router");
jest.mock("lucide-react-native", () => ({
  Sparkles: "Sparkles",
  Upload: "Upload",
  Brain: "Brain",
  CheckCircle: "CheckCircle",
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
    });

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
    });

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
});

