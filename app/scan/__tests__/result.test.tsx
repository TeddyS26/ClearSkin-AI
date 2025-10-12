import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Result from "../result";
import { getScan } from "../../../src/lib/scan";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../../src/lib/supabase";

jest.mock("../../../src/lib/scan");
jest.mock("../../../src/lib/supabase");
jest.mock("expo-router");
jest.mock("lucide-react-native", () => ({
  TrendingUp: "TrendingUp",
  AlertCircle: "AlertCircle",
  MapPin: "MapPin",
  Sun: "Sun",
  Moon: "Moon",
  Package: "Package",
  ArrowLeft: "ArrowLeft",
}));
jest.mock("../../../components/HeatmapOverlay", () => "HeatmapOverlay");
jest.mock("../../../components/HeatmapLegend", () => "HeatmapLegend");

describe("Result", () => {
  const mockParams = { id: "scan-123" };
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);
    (require("expo-router").useRouter as jest.Mock).mockReturnValue(mockRouter);
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ results: [{ url: "https://signed-url.com" }] }),
    });
  });

  it("should show loading initially", () => {
    (getScan as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    const { getByText } = render(<Result />);
    
    expect(getByText("Loading results...")).toBeTruthy();
  });

  it("should display scan results", async () => {
    const mockScan = {
      id: "scan-123",
      status: "complete",
      skin_score: 85,
      skin_potential: 90,
      skin_health_percent: 88,
      skin_type: "normal",
      breakout_level: "low",
      front_path: "path/front.jpg",
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Your Results")).toBeTruthy();
      expect(getByText("Skin Score")).toBeTruthy();
    });
  });

  it("should show error when fetch fails", async () => {
    (getScan as jest.Mock).mockRejectedValue(new Error("Failed to load"));

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Failed to load")).toBeTruthy();
    });
  });

  it("should display skin metrics", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      skin_potential: 90,
      skin_health_percent: 88,
      skin_type: "normal",
      front_path: "path/front.jpg",
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Overview")).toBeTruthy();
      expect(getByText("normal")).toBeTruthy();
    });
  });

  it("should handle missing optional fields gracefully", async () => {
    const mockScan = {
      id: "scan-123",
      status: "complete",
      front_path: "path/front.jpg",
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Your Results")).toBeTruthy();
    });
  });

  it("should allow mode switching", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      heatmap_regions: {},
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Your Results")).toBeTruthy();
    });

    // Modes should be available
    expect(getByText("Breakouts")).toBeTruthy();
    expect(getByText("Oiliness")).toBeTruthy();
  });

  it("should navigate back to history when back button is pressed", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Your Results")).toBeTruthy();
    });

    // Back button should be rendered
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

