import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Home from "../home";
import { useAuth } from "../../../src/ctx/AuthContext";
import { latestCompletedScan } from "../../../src/lib/scan";
import { useRouter } from "expo-router";

jest.mock("../../../src/ctx/AuthContext");
jest.mock("../../../src/lib/scan");
jest.mock("expo-router");
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

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: "test@example.com" },
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

    const { getByText, toJSON } = render(<Home />);

    await waitFor(() => {
      const tree = JSON.stringify(toJSON());
      expect(tree).toContain("There");
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
});

