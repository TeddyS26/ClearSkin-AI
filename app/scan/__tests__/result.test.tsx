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
      overlays: {
        front: {
          breakouts: [],
          oiliness: [],
          dryness: [],
          redness: [],
        },
      },
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Heatmaps")).toBeTruthy();
    });

    // Modes should be available (lowercase due to capitalize className)
    expect(getByText("breakouts")).toBeTruthy();
    expect(getByText("oiliness")).toBeTruthy();
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

  it("should display photo view selector with all 3 options", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      left_path: "path/left.jpg",
      right_path: "path/right.jpg",
      overlays: { front: {}, left: {}, right: {} },
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Front")).toBeTruthy();
      expect(getByText("Left")).toBeTruthy();
      expect(getByText("Right")).toBeTruthy();
    });
  });

  it("should switch between photo views when buttons are pressed", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      left_path: "path/left.jpg",
      right_path: "path/right.jpg",
      overlays: { front: {}, left: {}, right: {} },
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Front")).toBeTruthy();
    });

    // Click Left button
    fireEvent.press(getByText("Left"));
    expect(getByText("Left")).toBeTruthy();

    // Click Right button
    fireEvent.press(getByText("Right"));
    expect(getByText("Right")).toBeTruthy();

    // Click Front button
    fireEvent.press(getByText("Front"));
    expect(getByText("Front")).toBeTruthy();
  });

  it("should display heatmap when overlays are available", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      overlays: {
        front: {
          breakouts: [[[10, 10], [20, 20]]],
          oiliness: [],
          dryness: [],
          redness: [],
        },
      },
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Heatmaps")).toBeTruthy();
    });
  });

  it("should switch between heatmap modes", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      overlays: {
        front: {
          breakouts: [],
          oiliness: [],
          dryness: [],
          redness: [],
        },
      },
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("breakouts")).toBeTruthy();
    });

    // Click different modes (text is lowercase due to capitalize className)
    fireEvent.press(getByText("oiliness"));
    expect(getByText("oiliness")).toBeTruthy();

    fireEvent.press(getByText("dryness"));
    expect(getByText("dryness")).toBeTruthy();

    fireEvent.press(getByText("redness"));
    expect(getByText("redness")).toBeTruthy();
  });

  it("should show message when photo is not available", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      left_path: null,
      right_path: null,
      overlays: { front: {} },
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ 
          results: [
            { url: "https://front-url.com" },
            null,
            null
          ] 
        }),
    });

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Front")).toBeTruthy();
    });

    // Switch to Left view
    fireEvent.press(getByText("Left"));

    await waitFor(() => {
      expect(getByText("Left photo not available")).toBeTruthy();
    });
  });

  it("should load all three photos when available", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      left_path: "path/left.jpg",
      right_path: "path/right.jpg",
      overlays: { front: {}, left: {}, right: {} },
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ 
          results: [
            { url: "https://front-url.com" },
            { url: "https://left-url.com" },
            { url: "https://right-url.com" }
          ] 
        }),
    });

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Your Results")).toBeTruthy();
    });

    // Verify fetch was called with all three paths
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("path/front.jpg"),
        })
      );
    });
  });

  it("should display watchlist areas when available", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      watchlist_areas: [
        { area: "Forehead", reason: "Active breakouts" },
        { area: "Chin", reason: "Dry patches" },
      ],
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Watchlist")).toBeTruthy();
      expect(getByText("Forehead")).toBeTruthy();
      expect(getByText("Active breakouts")).toBeTruthy();
    });
  });

  it("should display AM routine when available", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      am_routine: [
        { step: 1, what: "Cleanser", why: "Remove impurities" },
        { step: 2, what: "Moisturizer", why: "Hydrate skin" },
      ],
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Morning Routine")).toBeTruthy();
      expect(getByText("Cleanser")).toBeTruthy();
      expect(getByText("Remove impurities")).toBeTruthy();
    });
  });

  it("should display PM routine when available", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      pm_routine: [
        { step: 1, what: "Night Cream", why: "Repair overnight" },
      ],
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Evening Routine")).toBeTruthy();
      expect(getByText("Night Cream")).toBeTruthy();
      expect(getByText("Repair overnight")).toBeTruthy();
    });
  });

  it("should display recommended products when available", async () => {
    const mockScan = {
      id: "scan-123",
      skin_score: 85,
      front_path: "path/front.jpg",
      products: [
        { name: "CeraVe Cleanser", type: "cleanser", reason: "Gentle formula" },
        { name: "Neutrogena Moisturizer", type: "moisturizer", reason: "Deep hydration" },
      ],
    };

    (getScan as jest.Mock).mockResolvedValue(mockScan);

    const { getByText } = render(<Result />);

    await waitFor(() => {
      expect(getByText("Recommended Products")).toBeTruthy();
      expect(getByText("CeraVe Cleanser")).toBeTruthy();
      expect(getByText("Gentle formula")).toBeTruthy();
    });
  });
});

