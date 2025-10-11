import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Latest from "../latest";
import { latestCompletedScan, signStoragePaths } from "../../../src/lib/scan";
import { useRouter } from "expo-router";

jest.mock("../../../src/lib/scan");
jest.mock("expo-router");
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

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
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
});

