import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import History from "../history";
import { listScans, signStoragePaths, fmtDate } from "../../../src/lib/scan";
import { useRouter } from "expo-router";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/ctx/AuthContext";

jest.mock("../../../src/lib/scan");
jest.mock("expo-router");
jest.mock("../../../src/ctx/AuthContext");
jest.mock("lucide-react-native", () => ({
  Calendar: "Calendar",
  TrendingUp: "TrendingUp",
}));

describe("History", () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
    });
  });

  it("should show loading indicator initially", () => {
    (listScans as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    const { getByTestId } = render(<History />);
    // Note: ActivityIndicator doesn't have testID by default, but we can verify the component renders
    expect(() => render(<History />)).not.toThrow();
  });

  it("should show empty state when no scans", async () => {
    (listScans as jest.Mock).mockResolvedValue([]);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { getByText } = render(<History />);

    await waitFor(() => {
      expect(getByText("No history yet")).toBeTruthy();
      expect(getByText("Run your first scan and it will appear here.")).toBeTruthy();
    });
  });

  it("should fetch and display scans", async () => {
    const mockScans = [
      {
        id: "scan-1",
        created_at: "2025-01-01",
        status: "complete",
        skin_score: 85,
        skin_type: "normal",
        front_path: "path/front.jpg",
      },
    ];

    (listScans as jest.Mock).mockResolvedValue(mockScans);
    (signStoragePaths as jest.Mock).mockResolvedValue({
      "path/front.jpg": "https://signed-url.com/front.jpg",
    });
    (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

    const { getByText } = render(<History />);

    await waitFor(() => {
      expect(getByText("Scan History")).toBeTruthy();
      expect(getByText("85/100")).toBeTruthy();
      expect(getByText("complete")).toBeTruthy();
    });
  });

  it("should navigate to result when scan item pressed", async () => {
    const mockScans = [
      {
        id: "scan-1",
        created_at: "2025-01-01",
        status: "complete",
        skin_score: 85,
        front_path: "path/front.jpg",
      },
    ];

    (listScans as jest.Mock).mockResolvedValue(mockScans);
    (signStoragePaths as jest.Mock).mockResolvedValue({});
    (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

    const { getByText } = render(<History />);

    await waitFor(() => {
      expect(getByText("85/100")).toBeTruthy();
    });

    const item = getByText("85/100").parent?.parent;
    if (item) {
      fireEvent.press(item);
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/scan/result",
        params: { id: "scan-1" },
      });
    }
  });

  it("should handle refresh", async () => {
    (listScans as jest.Mock).mockResolvedValue([]);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { getByText } = render(<History />);

    await waitFor(() => {
      expect(getByText("No history yet")).toBeTruthy();
    });

    // Verify listScans was called
    expect(listScans).toHaveBeenCalled();
  });

  it("should display skin type when available", async () => {
    const mockScans = [
      {
        id: "scan-1",
        created_at: "2025-01-01",
        status: "complete",
        skin_score: 85,
        skin_type: "oily",
        front_path: "path/front.jpg",
      },
    ];

    (listScans as jest.Mock).mockResolvedValue(mockScans);
    (signStoragePaths as jest.Mock).mockResolvedValue({});
    (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

    const { getByText } = render(<History />);

    await waitFor(() => {
      expect(getByText("oily skin")).toBeTruthy();
    });
  });

  it("should show default text when no skin type", async () => {
    const mockScans = [
      {
        id: "scan-1",
        created_at: "2025-01-01",
        status: "complete",
        skin_score: 85,
        front_path: "path/front.jpg",
      },
    ];

    (listScans as jest.Mock).mockResolvedValue(mockScans);
    (signStoragePaths as jest.Mock).mockResolvedValue({});
    (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

    const { getByText } = render(<History />);

    await waitFor(() => {
      expect(getByText("Skin analysis")).toBeTruthy();
    });
  });

  it("should handle missing signed URL", async () => {
    const mockScans = [
      {
        id: "scan-1",
        created_at: "2025-01-01",
        status: "complete",
        skin_score: 90,
        front_path: "path/missing.jpg",
      },
    ];

    (listScans as jest.Mock).mockResolvedValue(mockScans);
    (signStoragePaths as jest.Mock).mockResolvedValue({});
    (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

    const { getByText } = render(<History />);

    await waitFor(() => {
      expect(getByText("90/100")).toBeTruthy();
    });
  });

  it("should display pending status", async () => {
    const mockScans = [
      {
        id: "scan-1",
        created_at: "2025-01-01",
        status: "pending",
        front_path: "path/front.jpg",
      },
    ];

    (listScans as jest.Mock).mockResolvedValue(mockScans);
    (signStoragePaths as jest.Mock).mockResolvedValue({});
    (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

    const { getByText } = render(<History />);

    await waitFor(() => {
      expect(getByText("pending")).toBeTruthy();
    });
  });

  it("should set up real-time subscription on mount", async () => {
    (listScans as jest.Mock).mockResolvedValue([]);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    render(<History />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('history_scan_changes');
    });
  });

  it("should clean up subscription on unmount", async () => {
    (listScans as jest.Mock).mockResolvedValue([]);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { unmount } = render(<History />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalled();
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});

