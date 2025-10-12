import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Routine from "../routine";
import { latestCompletedScan } from "../../../src/lib/scan";
import { useRouter } from "expo-router";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/ctx/AuthContext";

jest.mock("../../../src/lib/scan");
jest.mock("expo-router");
jest.mock("../../../src/ctx/AuthContext");
jest.mock("lucide-react-native", () => ({
  Sun: "Sun",
  Moon: "Moon",
  CheckCircle2: "CheckCircle2",
  Sparkles: "Sparkles",
}));

describe("Routine", () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
    });
  });

  it("should show loading indicator initially", () => {
    (latestCompletedScan as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    expect(() => render(<Routine />)).not.toThrow();
  });

  it("should show empty state when no routine", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<Routine />);

    await waitFor(() => {
      expect(getByText("No routine yet")).toBeTruthy();
      expect(getByText("Complete a scan to get your personalized skincare routine.")).toBeTruthy();
      expect(getByText("Start a Scan")).toBeTruthy();
    });
  });

  it("should navigate to capture when Start a Scan pressed", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<Routine />);

    await waitFor(() => {
      expect(getByText("Start a Scan")).toBeTruthy();
    });

    fireEvent.press(getByText("Start a Scan"));
    expect(mockRouter.push).toHaveBeenCalledWith("/scan/capture");
  });

  it("should display AM routine when available", async () => {
    const mockScan = {
      id: "scan-1",
      am_routine: [
        { step: 1, what: "Cleanser", why: "Remove impurities" },
        { step: 2, what: "Moisturizer", why: "Hydrate skin" },
      ],
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Routine />);

    await waitFor(() => {
      expect(getByText("Morning Routine")).toBeTruthy();
      expect(getByText("Start your day fresh")).toBeTruthy();
      expect(getByText("Cleanser")).toBeTruthy();
      expect(getByText("Remove impurities")).toBeTruthy();
      expect(getByText("Moisturizer")).toBeTruthy();
      expect(getByText("Hydrate skin")).toBeTruthy();
    });
  });

  it("should display PM routine when available", async () => {
    const mockScan = {
      id: "scan-1",
      pm_routine: [
        { step: 1, what: "Double Cleanse", why: "Remove makeup and dirt" },
        { step: 2, what: "Night Cream", why: "Overnight repair" },
      ],
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Routine />);

    await waitFor(() => {
      expect(getByText("Evening Routine")).toBeTruthy();
      expect(getByText("Wind down and repair")).toBeTruthy();
      expect(getByText("Double Cleanse")).toBeTruthy();
      expect(getByText("Remove makeup and dirt")).toBeTruthy();
      expect(getByText("Night Cream")).toBeTruthy();
      expect(getByText("Overnight repair")).toBeTruthy();
    });
  });

  it("should display both AM and PM routines", async () => {
    const mockScan = {
      id: "scan-1",
      am_routine: [
        { step: 1, what: "Cleanser", why: "Remove impurities" },
      ],
      pm_routine: [
        { step: 1, what: "Night Cream", why: "Overnight repair" },
      ],
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Routine />);

    await waitFor(() => {
      expect(getByText("Morning Routine")).toBeTruthy();
      expect(getByText("Evening Routine")).toBeTruthy();
    });
  });

  it("should display recommended products when available", async () => {
    const mockScan = {
      id: "scan-1",
      am_routine: [{ step: 1, what: "Cleanser", why: "Remove impurities" }],
      products: [
        { name: "Cerave Hydrating Cleanser", type: "cleanser", reason: "Gentle and effective" },
        { name: "Cetaphil Moisturizer", type: "moisturizer", reason: "Hydrates without being greasy" },
      ],
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Routine />);

    await waitFor(() => {
      expect(getByText("Recommended Products")).toBeTruthy();
      expect(getByText("Cerave Hydrating Cleanser")).toBeTruthy();
      expect(getByText("Cetaphil Moisturizer")).toBeTruthy();
      expect(getByText("Gentle and effective")).toBeTruthy();
    });
  });

  it("should show empty state when scan exists but has no routines", async () => {
    const mockScan = {
      id: "scan-1",
      skin_score: 85,
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Routine />);

    await waitFor(() => {
      expect(getByText("No routine yet")).toBeTruthy();
    });
  });

  it("should show page header with empty routine arrays", async () => {
    const mockScan = {
      id: "scan-1",
      am_routine: [],
      pm_routine: [],
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Routine />);

    await waitFor(() => {
      expect(getByText("Your Routine")).toBeTruthy();
      expect(getByText("Personalized skincare recommendations")).toBeTruthy();
    });
  });

  it("should set up real-time subscription on mount", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    render(<Routine />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('routine_scan_changes');
    });
  });

  it("should clean up subscription on unmount", async () => {
    (latestCompletedScan as jest.Mock).mockResolvedValue(null);

    const { unmount } = render(<Routine />);

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalled();
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it("should handle pull-to-refresh", async () => {
    const mockScan = {
      id: "scan-1",
      am_routine: [{ step: 1, what: "Cleanser", why: "Remove impurities" }],
    };

    (latestCompletedScan as jest.Mock).mockResolvedValue(mockScan);

    const { UNSAFE_getByType } = render(<Routine />);

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

    render(<Routine />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("Error fetching latest scan:", expect.any(Error));
    });

    consoleError.mockRestore();
  });
});

