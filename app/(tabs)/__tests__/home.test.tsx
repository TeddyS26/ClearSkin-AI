import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Home from "../home";
import { useAuth } from "../../../src/ctx/AuthContext";
import { getRecentCompletedScans } from "../../../src/lib/scan";
import { hasActiveSubscription } from "../../../src/lib/billing";
import { useRouter } from "expo-router";
import { supabase } from "../../../src/lib/supabase";

jest.mock("../../../src/ctx/AuthContext");
jest.mock("../../../src/lib/scan");
jest.mock("../../../src/lib/billing");
jest.mock("expo-router");
jest.mock("lucide-react-native", () => ({
  Camera: "Camera",
  TrendingUp: "TrendingUp",
  TrendingDown: "TrendingDown",
  Droplet: "Droplet",
  Zap: "Zap",
  LogOut: "LogOut",
  Crown: "Crown",
  Lock: "Lock",
}));
jest.mock("react-native-svg", () => ({
  __esModule: true,
  default: "Svg",
  Svg: "Svg",
  Circle: "Circle",
}));

describe("Home", () => {
  const mockRouter = { push: jest.fn() };
  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      signOut: mockSignOut,
    });
    (hasActiveSubscription as jest.Mock).mockResolvedValue(false);
    (getRecentCompletedScans as jest.Mock).mockResolvedValue([]);
  });

  it("should render welcome message with user name", async () => {
    (getRecentCompletedScans as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/Hello/)).toBeTruthy();
      expect(getByText(/test/)).toBeTruthy();
    });
  });

  it("should show no scans message when no latest scan", async () => {
    (getRecentCompletedScans as jest.Mock).mockResolvedValue([]);

    const { getAllByText } = render(<Home />);

    await waitFor(() => {
      const elements = getAllByText("No scans yet");
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("should display latest scan score", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("85")).toBeTruthy();
    });
  });

  it("should calculate days ago correctly", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const mockScan = {
      id: "scan-1",
      created_at: yesterday.toISOString(),
      skin_score: 85,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/day/)).toBeTruthy();
    });
  });

  it("should navigate to subscribe when scan button pressed (unsubscribed)", async () => {
    (hasActiveSubscription as jest.Mock).mockResolvedValue(false);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Subscribe to Scan")).toBeTruthy();
    });

    fireEvent.press(getByText("Subscribe to Scan"));
    expect(mockRouter.push).toHaveBeenCalledWith("/subscribe");
  });

  it("should navigate to capture when scan button pressed (subscribed)", async () => {
    (hasActiveSubscription as jest.Mock).mockResolvedValue(true);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Take a New Scan")).toBeTruthy();
    });

    fireEvent.press(getByText("Take a New Scan"));
    expect(mockRouter.push).toHaveBeenCalledWith("/scan/capture");
  });

  it("should render scan button when no scans", async () => {
    (hasActiveSubscription as jest.Mock).mockResolvedValue(false);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Subscribe to Scan")).toBeTruthy();
    });
  });

  it("should handle missing user email", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {},
      signOut: mockSignOut,
    });
    (getRecentCompletedScans as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/Hello/)).toBeTruthy();
      expect(getByText(/There/)).toBeTruthy();
    });
  });

  it("should display skin type when available", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
      skin_type: "combination",
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/combination/i)).toBeTruthy();
    });
  });

  it("should render circular progress component", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { toJSON } = render(<Home />);

    await waitFor(() => {
      expect(toJSON()).toBeTruthy();
    });
  });

  it("should navigate to latest scan when card pressed", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 75,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("75")).toBeTruthy();
    });

    // Press the latest scan card
    const scoreText = getByText("75");
    const card = scoreText.parent?.parent?.parent?.parent;
    if (card) {
      fireEvent.press(card);
    }

    expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/latest");
  });

  it("should display oiliness status low", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
      oiliness_percent: 25,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Low")).toBeTruthy();
    });
  });

  it("should display oiliness status high", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
      oiliness_percent: 65,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("High")).toBeTruthy();
    });
  });

  it("should display oiliness status very high", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
      oiliness_percent: 75,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Very High")).toBeTruthy();
    });
  });

  it("should set up real-time subscription on mount", async () => {
    (getRecentCompletedScans as jest.Mock).mockResolvedValue([]);

    render(<Home />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('scan_sessions_changes');
    });
  });

  it("should clean up subscription on unmount", async () => {
    (getRecentCompletedScans as jest.Mock).mockResolvedValue([]);

    const { unmount } = render(<Home />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalled();
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it("should handle pull-to-refresh", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { UNSAFE_getByType } = render(<Home />);

    await waitFor(() => {
      expect(getRecentCompletedScans).toHaveBeenCalled();
    });

    // Find ScrollView and trigger refresh
    const ScrollView = require("react-native").ScrollView;
    const scrollView = UNSAFE_getByType(ScrollView);
    const refreshControl = scrollView.props.refreshControl;

    // Simulate pull-to-refresh
    await refreshControl.props.onRefresh();

    await waitFor(() => {
      expect(getRecentCompletedScans).toHaveBeenCalledTimes(2);
    });
  });

  it("should handle fetchData error gracefully", async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (getRecentCompletedScans as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("Error fetching latest scan:", expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it("should not set up subscription when user is null", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      signOut: mockSignOut,
    });
    (getRecentCompletedScans as jest.Mock).mockResolvedValue([]);

    render(<Home />);

    await waitFor(() => {
      expect(getRecentCompletedScans).toHaveBeenCalled();
    });

    // Channel should not be created without a user
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it("should not set up subscription when user is null and then set it up when user appears", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      signOut: mockSignOut,
    });
    (getRecentCompletedScans as jest.Mock).mockResolvedValue([]);

    const { rerender } = render(<Home />);

    await waitFor(() => {
      expect(getRecentCompletedScans).toHaveBeenCalled();
    });

    // Channel should not be created without a user
    expect(supabase.channel).not.toHaveBeenCalled();

    // Now provide a user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      signOut: mockSignOut,
    });

    rerender(<Home />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalled();
    });
  });

  it("should show multiple days ago correctly", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const mockScan = {
      id: "scan-1",
      created_at: threeDaysAgo.toISOString(),
      skin_score: 85,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/3 days ago/)).toBeTruthy();
    });
  });

  it("should display score improvement with previous scan", async () => {
    const latestScan = {
      id: "scan-2",
      created_at: new Date().toISOString(),
      skin_score: 85,
    };
    const previousScan = {
      id: "scan-1",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      skin_score: 80,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([latestScan, previousScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/\+5 from last scan/)).toBeTruthy();
    });
  });

  it("should display score decline with previous scan", async () => {
    const latestScan = {
      id: "scan-2",
      created_at: new Date().toISOString(),
      skin_score: 75,
    };
    const previousScan = {
      id: "scan-1",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      skin_score: 80,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([latestScan, previousScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/-5 from last scan/)).toBeTruthy();
    });
  });

  it("should display pore health as Excellent", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
      pore_health: 85,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Excellent")).toBeTruthy();
    });
  });

  it("should display pore health as Good", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
      pore_health: 65,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Good")).toBeTruthy();
    });
  });

  it("should display pore health as Fair", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
      pore_health: 45,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Fair")).toBeTruthy();
    });
  });

  it("should display pore health as Needs attention", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
      pore_health: 35,
    };

    (getRecentCompletedScans as jest.Mock).mockResolvedValue([mockScan]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Needs attention")).toBeTruthy();
    });
  });

});

