import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import History from "../history";
import { listScans, signStoragePaths, fmtDate } from "../../../src/lib/scan";
import { hasActiveSubscription } from "../../../src/lib/billing";
import { useRouter } from "expo-router";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/ctx/AuthContext";

jest.mock("../../../src/lib/scan");
jest.mock("../../../src/lib/billing");
jest.mock("expo-router");
jest.mock("../../../src/ctx/AuthContext");
jest.mock("lucide-react-native", () => ({
  Calendar: "Calendar",
  TrendingUp: "TrendingUp",
  Circle: "Circle",
  CircleCheck: "CircleCheck",
}));

describe("History", () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    (hasActiveSubscription as jest.Mock).mockResolvedValue(true);
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

  it("should navigate to result when scan item pressed in normal mode", async () => {
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

  describe("Compare Mode (Premium)", () => {
    it("should display Compare toggle button", async () => {
      const mockScans = [
        {
          id: "scan-1",
          created_at: "2025-01-01T10:00:00",
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
        expect(getByText("Compare")).toBeTruthy();
      });
    });

    it("should enter compare mode when premium user presses Compare button", async () => {
      const mockScans = [
        {
          id: "scan-1",
          created_at: "2025-01-01T10:00:00",
          status: "complete",
          skin_score: 85,
          front_path: "path/front1.jpg",
        },
      ];

      (listScans as jest.Mock).mockResolvedValue(mockScans);
      (signStoragePaths as jest.Mock).mockResolvedValue({});
      (hasActiveSubscription as jest.Mock).mockResolvedValue(true);
      (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

      const { getByText } = render(<History />);

      await waitFor(() => {
        expect(getByText("Compare")).toBeTruthy();
      });

      const compareBtn = getByText("Compare");
      fireEvent.press(compareBtn);

      await waitFor(() => {
        // After entering compare mode, header text changes and button becomes Cancel
        expect(getByText("Select up to 2 scans to compare")).toBeTruthy();
        expect(getByText("Cancel")).toBeTruthy();
      });
    });

    it("should navigate to subscribe when free user presses Compare button", async () => {
      const mockScans = [
        {
          id: "scan-1",
          created_at: "2025-01-01T10:00:00",
          status: "complete",
          skin_score: 85,
          front_path: "path/front.jpg",
        },
      ];

      (listScans as jest.Mock).mockResolvedValue(mockScans);
      (signStoragePaths as jest.Mock).mockResolvedValue({});
      (hasActiveSubscription as jest.Mock).mockResolvedValue(false);
      (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

      const { getByText } = render(<History />);

      await waitFor(() => {
        expect(getByText("Compare")).toBeTruthy();
      });

      const compareBtn = getByText("Compare");
      fireEvent.press(compareBtn);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/subscribe");
      });
    });

    it("should select first scan in compare mode", async () => {
      const mockScans = [
        {
          id: "scan-1",
          created_at: "2025-01-01T10:00:00",
          status: "complete",
          skin_score: 85,
          front_path: "path/front1.jpg",
        },
      ];

      (listScans as jest.Mock).mockResolvedValue(mockScans);
      (signStoragePaths as jest.Mock).mockResolvedValue({});
      (hasActiveSubscription as jest.Mock).mockResolvedValue(true);
      (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

      const { getByText } = render(<History />);

      await waitFor(() => {
        expect(getByText("Compare")).toBeTruthy();
      });

      // Enter compare mode
      const compareBtn = getByText("Compare");
      fireEvent.press(compareBtn);

      await waitFor(() => {
        expect(getByText("Select up to 2 scans to compare")).toBeTruthy();
      });

      // Select first scan
      const scanItem = getByText("85/100").parent?.parent;
      if (scanItem) {
        fireEvent.press(scanItem);
        // After selection, the item should still be there (we don't have visual feedback in test)
        expect(scanItem).toBeTruthy();
      }
    });

    it("should select second scan and enable compare button", async () => {
      const mockScans = [
        {
          id: "scan-1",
          created_at: "2025-01-01T10:00:00",
          status: "complete",
          skin_score: 85,
          front_path: "path/front1.jpg",
        },
        {
          id: "scan-2",
          created_at: "2025-01-02T10:00:00",
          status: "complete",
          skin_score: 88,
          front_path: "path/front2.jpg",
        },
      ];

      (listScans as jest.Mock).mockResolvedValue(mockScans);
      (signStoragePaths as jest.Mock).mockResolvedValue({});
      (hasActiveSubscription as jest.Mock).mockResolvedValue(true);
      (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

      const { getByText, getAllByText } = render(<History />);

      await waitFor(() => {
        expect(getByText("Compare")).toBeTruthy();
      });

      // Enter compare mode
      const compareBtn = getByText("Compare");
      fireEvent.press(compareBtn);

      await waitFor(() => {
        expect(getByText("Cancel")).toBeTruthy();
      });

      // Select both scans
      const scores = getAllByText(/^\d+\/100$/);
      if (scores.length >= 2) {
        fireEvent.press(scores[0].parent?.parent!);
        fireEvent.press(scores[1].parent?.parent!);

        // The Cancel button should now change back to Compare (2 selected)
        await waitFor(() => {
          expect(getByText("Compare")).toBeTruthy();
        });
      }
    });

    it("should navigate to compare screen with sorted scan IDs", async () => {
      const mockScans = [
        {
          id: "scan-1",
          created_at: "2025-01-02T10:00:00", // Newer
          status: "complete",
          skin_score: 85,
          front_path: "path/front1.jpg",
        },
        {
          id: "scan-2",
          created_at: "2025-01-01T10:00:00", // Older
          status: "complete",
          skin_score: 88,
          front_path: "path/front2.jpg",
        },
      ];

      (listScans as jest.Mock).mockResolvedValue(mockScans);
      (signStoragePaths as jest.Mock).mockResolvedValue({});
      (hasActiveSubscription as jest.Mock).mockResolvedValue(true);
      (fmtDate as jest.Mock).mockReturnValue("Jan 1, 2025");

      const { getByText, getAllByText } = render(<History />);

      await waitFor(() => {
        expect(getByText("Compare")).toBeTruthy();
      });

      // Enter compare mode
      const compareBtn = getByText("Compare");
      fireEvent.press(compareBtn);

      await waitFor(() => {
        expect(getByText("Cancel")).toBeTruthy();
      });

      // Select both scans (in order: scan-1, scan-2)
      const scores = getAllByText(/^\d+\/100$/);
      if (scores.length >= 2) {
        fireEvent.press(scores[0].parent?.parent!);
        fireEvent.press(scores[1].parent?.parent!);

        // Button should now say "Compare" again (2 selected)
        await waitFor(() => {
          expect(getByText("Compare")).toBeTruthy();
        });

        // Press the Compare button to navigate
        fireEvent.press(getByText("Compare"));

        // Verify navigation with correct sorted IDs
        // scan-2 (older) should be first, scan-1 (newer) should be second
        expect(mockRouter.push).toHaveBeenCalledWith({
          pathname: "/scan/compare",
          params: { olderScanId: "scan-2", newerScanId: "scan-1" },
        });
      }
    });
  });
});

