import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Home from "../home";
import { useAuth } from "../../../src/ctx/AuthContext";
import { latestCompletedScan } from "../../../src/lib/scan";
import { useRouter } from "expo-router";
import { supabase } from "../../../src/lib/supabase";

jest.mock("../../../src/ctx/AuthContext");
jest.mock("../../../src/lib/scan");
jest.mock("expo-router");
jest.mock("../../../src/lib/supabase", () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));
jest.mock("lucide-react-native", () => ({
  Camera: "Camera",
  TrendingUp: "TrendingUp",
  Droplet: "Droplet",
  Zap: "Zap",
  LogOut: "LogOut",
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
      signOut: mockSignOut,
    });
  });

  it("should render welcome message with user name", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/Hello/)).toBeTruthy();
      expect(getByText(/test/)).toBeTruthy();
    });
  });

  it("should show no scans message when no latest scan", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

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

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

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

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText(/day/)).toBeTruthy();
    });
  });

  it("should navigate to capture when scan button pressed", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Take a New Scan")).toBeTruthy();
    });

    fireEvent.press(getByText("Take a New Scan"));
    expect(mockRouter.push).toHaveBeenCalledWith("/scan/capture");
  });

  it("should render scan button when no scans", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Take a New Scan")).toBeTruthy();
    });
  });

  it("should handle missing user email", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {},
      signOut: mockSignOut,
    });
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

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

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

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

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

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

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

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

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

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

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

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

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText("Very High")).toBeTruthy();
    });
  });

  it("should set up real-time subscription on mount", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    render(<Home />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('scan_sessions_changes');
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

    const { unmount } = render(<Home />);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it("should handle pull-to-refresh", async () => {
    const mockScan = {
      id: "scan-1",
      created_at: new Date().toISOString(),
      skin_score: 85,
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { UNSAFE_getByType } = render(<Home />);

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
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    render(<Home />);

    await waitFor(() => {
      expect(latestCompletedScan).toHaveBeenCalled();
    });

    // Channel should not be created without a user
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it("should refresh data when subscription receives update", async () => {
    let subscriptionCallback: Function;
    mockOn.mockImplementation((event: string, config: any, callback: Function) => {
      subscriptionCallback = callback;
      return mockChannel;
    });

    (latestCompletedScan as jest.Mock).mockResolvedValue({
      id: "scan-1",
      skin_score: 85,
    });

    render(<Home />);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    // Simulate a database change
    (latestCompletedScan as jest.Mock).mockResolvedValue({
      id: "scan-2",
      skin_score: 90,
    });

    subscriptionCallback!({ new: { id: "scan-2" } });

    await waitFor(() => {
      expect(latestCompletedScan).toHaveBeenCalledTimes(2);
    });
  });

});

