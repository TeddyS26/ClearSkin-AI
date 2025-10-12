import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Latest from "../latest";
import { latestCompletedScan, signStoragePaths } from "../../../src/lib/scan";
import { useRouter } from "expo-router";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/ctx/AuthContext";

jest.mock("../../../src/lib/scan");
jest.mock("expo-router");
jest.mock("../../../src/ctx/AuthContext");
jest.mock("../../../src/lib/supabase", () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));
jest.mock("lucide-react-native", () => ({
  Camera: "Camera",
  TrendingUp: "TrendingUp",
  Heart: "Heart",
  Droplet: "Droplet",
  AlertCircle: "AlertCircle",
  FileText: "FileText",
}));

describe("Latest", () => {
  const mockRouter = { push: jest.fn() };
  const mockSubscribe = jest.fn();
  const mockOn = jest.fn();
  const mockChannel = {
    on: mockOn,
    subscribe: mockSubscribe,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOn.mockReturnValue(mockChannel);
    mockSubscribe.mockReturnValue(mockChannel);
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
    });
  });

  it("should show loading indicator initially", () => {
    (latestCompletedScan as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    expect(() => render(<Latest />)).not.toThrow();
  });

  it("should show empty state when no scans", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<Latest />);

    await waitFor(() => {
      expect(getByText("No scans yet")).toBeTruthy();
      expect(getByText("Start your first scan to see your latest results here.")).toBeTruthy();
      expect(getByText("Start a Scan")).toBeTruthy();
    });
  });

  it("should navigate to capture when Start a Scan pressed", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<Latest />);

    await waitFor(() => {
      expect(getByText("Start a Scan")).toBeTruthy();
    });

    fireEvent.press(getByText("Start a Scan"));
    expect(mockRouter.push).toHaveBeenCalledWith("/scan/capture");
  });

  it("should display latest scan results", async () => {
    const mockScan = {
      id: "scan-1",
      skin_score: 85,
      skin_potential: 90,
      skin_health_percent: 88,
      skin_type: "normal",
      breakout_level: "low",
      acne_prone_level: "mild",
      redness_percent: 15,
      oiliness_percent: 20,
      pore_health: 75,
      front_path: "path/front.jpg",
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);
    (signStoragePaths as jest.Mock).mockResolvedValue({
      "path/front.jpg": "https://signed-url.com/front.jpg",
    });

    const { getByText } = render(<Latest />);

    await waitFor(() => {
      expect(getByText("Latest Result")).toBeTruthy();
      expect(getByText("85/100")).toBeTruthy();
      expect(getByText("90/100")).toBeTruthy();
      expect(getByText("88%")).toBeTruthy();
    });
  });

  it("should display skin conditions", async () => {
    const mockScan = {
      id: "scan-1",
      skin_score: 85,
      breakout_level: "low",
      acne_prone_level: "mild",
      redness_percent: 15,
      oiliness_percent: 20,
      pore_health: 75,
      front_path: "path/front.jpg",
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { getByText } = render(<Latest />);

    await waitFor(() => {
      expect(getByText("Conditions")).toBeTruthy();
      expect(getByText("low")).toBeTruthy();
      expect(getByText("mild")).toBeTruthy();
      expect(getByText("15%")).toBeTruthy();
      expect(getByText("20%")).toBeTruthy();
      expect(getByText("75/100")).toBeTruthy();
    });
  });

  it("should navigate to full report when button pressed", async () => {
    const mockScan = {
      id: "scan-1",
      skin_score: 85,
      front_path: "path/front.jpg",
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { getByText } = render(<Latest />);

    await waitFor(() => {
      expect(getByText("View Full Report")).toBeTruthy();
    });

    fireEvent.press(getByText("View Full Report"));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/scan/result",
      params: { id: "scan-1" },
    });
  });

  it("should display skin type", async () => {
    const mockScan = {
      id: "scan-1",
      skin_score: 85,
      skin_type: "combination",
      front_path: "path/front.jpg",
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { getByText } = render(<Latest />);

    await waitFor(() => {
      expect(getByText("combination")).toBeTruthy();
    });
  });

  it("should handle missing optional fields", async () => {
    const mockScan = {
      id: "scan-1",
      front_path: "path/front.jpg",
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { getByText } = render(<Latest />);

    await waitFor(() => {
      expect(getByText("Latest Result")).toBeTruthy();
    });
  });

  it("should set up real-time subscription on mount", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    render(<Latest />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('latest_scan_changes');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scan_sessions',
          filter: 'user_id=eq.user-123'
        },
        expect.any(Function)
      );
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  it("should clean up subscription on unmount", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { unmount } = render(<Latest />);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it("should handle pull-to-refresh", async () => {
    const mockScan = {
      id: "scan-1",
      skin_score: 85,
      front_path: "path/front.jpg",
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { UNSAFE_getByType } = render(<Latest />);

    await waitFor(() => {
      expect(latestCompletedScan).toHaveBeenCalled();
    });

    // Find ScrollView and trigger refresh
    const ScrollView = require("react-native").ScrollView;
    const scrollView = UNSAFE_getByType(ScrollView);
    const refreshControl = scrollView.props.refreshControl;

    // Simulate pull-to-refresh
    await refreshControl.props.onRefresh();

    await waitFor(() => {
      expect(latestCompletedScan).toHaveBeenCalledTimes(2);
    });
  });

  it("should handle fetchData error gracefully", async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (latestCompletedScan as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<Latest />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("Error fetching latest scan:", expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it("should set frontUrl to null when no front_path", async () => {
    const mockScan = {
      id: "scan-1",
      skin_score: 85,
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Latest />);

    await waitFor(() => {
      expect(getByText("85/100")).toBeTruthy();
    });
  });
});

