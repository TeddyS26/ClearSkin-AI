import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Compare from "../compare";
import { getScan, signStoragePaths, fmtDate } from "../../../src/lib/scan";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../../src/lib/supabase";

jest.mock("../../../src/lib/scan");
jest.mock("../../../src/lib/supabase");
jest.mock("expo-router");
jest.mock("lucide-react-native", () => ({
  ArrowLeft: "ArrowLeft",
  TrendingUp: "TrendingUp",
  AlertCircle: "AlertCircle",
  MapPin: "MapPin",
  Sun: "Sun",
  Moon: "Moon",
  Package: "Package",
  Clock: "Clock",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
}));
jest.mock("../../../components/HeatmapOverlay", () => "HeatmapOverlay");
jest.mock("../../../components/HeatmapLegend", () => "HeatmapLegend");

const MOCK_BEFORE = {
  id: "scan-older",
  status: "complete",
  created_at: "2025-01-01T10:00:00Z",
  skin_score: 72,
  skin_potential: 85,
  skin_health_percent: 65,
  skin_type: "oily",
  skin_age: 32,
  skin_age_comparison: "3 years older than actual age",
  skin_age_confidence: 75,
  breakout_level: "moderate",
  acne_prone_level: "high",
  scarring_level: "mild",
  redness_percent: 45,
  razor_burn_level: "mild",
  blackheads_level: "moderate",
  blackheads_estimated_count: 47,
  oiliness_percent: 65,
  pore_health: 55,
  front_path: "user/scan-older/front.jpg",
  left_path: "user/scan-older/left.jpg",
  right_path: "user/scan-older/right.jpg",
  overlays: { front: { breakouts: [], oiliness: [], dryness: [], redness: [] } },
  watchlist_areas: [{ area: "Chin", reason: "Recurring breakouts" }],
  am_routine: [{ step: 1, what: "Cleanser", why: "Remove oil" }],
  pm_routine: [{ step: 1, what: "Night cream", why: "Hydration" }],
  products: [{ name: "Product A", type: "cleanser", reason: "For oily skin" }],
};

const MOCK_AFTER = {
  id: "scan-newer",
  status: "complete",
  created_at: "2025-02-01T10:00:00Z",
  skin_score: 85,
  skin_potential: 92,
  skin_health_percent: 78,
  skin_type: "combination",
  skin_age: 28,
  skin_age_comparison: "1 year younger than actual age",
  skin_age_confidence: 82,
  breakout_level: "minimal",
  acne_prone_level: "moderate",
  scarring_level: "mild",
  redness_percent: 30,
  razor_burn_level: "none",
  blackheads_level: "mild",
  blackheads_estimated_count: 23,
  oiliness_percent: 55,
  pore_health: 70,
  front_path: "user/scan-newer/front.jpg",
  left_path: "user/scan-newer/left.jpg",
  right_path: "user/scan-newer/right.jpg",
  overlays: { front: { breakouts: [], oiliness: [], dryness: [], redness: [] } },
  watchlist_areas: [],
  am_routine: [{ step: 1, what: "Gentle Cleanser", why: "Better for combination" }],
  pm_routine: [{ step: 1, what: "Retinol", why: "Anti-aging" }],
  products: [{ name: "Product B", type: "serum", reason: "For combination skin" }],
};

describe("Compare", () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      olderScanId: "scan-older",
      newerScanId: "scan-newer",
    });
    (require("expo-router").useRouter as jest.Mock).mockReturnValue(mockRouter);
    (fmtDate as jest.Mock).mockImplementation((dt?: string) => dt ? new Date(dt).toLocaleDateString() : "");
    (signStoragePaths as jest.Mock).mockResolvedValue({
      "user/scan-older/front.jpg": "https://signed/older-front.jpg",
      "user/scan-older/left.jpg": "https://signed/older-left.jpg",
      "user/scan-older/right.jpg": "https://signed/older-right.jpg",
      "user/scan-newer/front.jpg": "https://signed/newer-front.jpg",
      "user/scan-newer/left.jpg": "https://signed/newer-left.jpg",
      "user/scan-newer/right.jpg": "https://signed/newer-right.jpg",
    });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
  });

  it("should show loading state initially", () => {
    (getScan as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByText } = render(<Compare />);

    expect(getByText("Loading comparison...")).toBeTruthy();
  });

  it("should display error when fetch fails", async () => {
    (getScan as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Network error")).toBeTruthy();
    });
  });

  it("should render both scans with section titles", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText, getAllByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Compare Scans")).toBeTruthy();
      expect(getByText("Overview")).toBeTruthy();
      // "Skin Age" appears as both section title and field label
      expect(getAllByText("Skin Age").length).toBeGreaterThanOrEqual(1);
      expect(getByText("Conditions")).toBeTruthy();
    });
  });

  it("should display Before and After labels", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getAllByText } = render(<Compare />);

    await waitFor(() => {
      const beforeLabels = getAllByText("Before");
      const afterLabels = getAllByText("After");
      expect(beforeLabels.length).toBeGreaterThan(0);
      expect(afterLabels.length).toBeGreaterThan(0);
    });
  });

  it("should display numeric deltas for overview fields", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getAllByText, getByText } = render(<Compare />);

    await waitFor(() => {
      // skin_score: 72 → 85 = +13, skin_health_percent: 65 → 78 = +13 (both are +13)
      expect(getAllByText("+13").length).toBeGreaterThanOrEqual(1);
      // skin_potential: 85 → 92 = +7
      expect(getAllByText("+7").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should display skin age deltas correctly (inverted polarity)", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      // skin_age: 32 → 28 = -4 (this is an improvement for lower_better)
      expect(getByText("-4")).toBeTruthy();
    });
  });

  it("should display condition deltas for numeric fields", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      // redness_percent: 45 → 30 = -15
      expect(getByText("-15")).toBeTruthy();
      // pore_health: 55 → 70 = +15
      expect(getByText("+15")).toBeTruthy();
    });
  });

  it("should display categorical fields side-by-side", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Breakouts")).toBeTruthy();
      expect(getByText("Acne-prone")).toBeTruthy();
    });
  });

  it("should handle null skin_age by hiding section", async () => {
    const beforeNoAge = { ...MOCK_BEFORE, skin_age: null, skin_age_comparison: null, skin_age_confidence: null };
    const afterNoAge = { ...MOCK_AFTER, skin_age: null, skin_age_comparison: null, skin_age_confidence: null };

    (getScan as jest.Mock)
      .mockResolvedValueOnce(beforeNoAge)
      .mockResolvedValueOnce(afterNoAge);

    const { queryByText, getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Overview")).toBeTruthy();
      expect(queryByText("Skin Age")).toBeNull();
    });
  });

  it("should handle null numeric fields gracefully", async () => {
    const beforeWithNulls = { ...MOCK_BEFORE, redness_percent: null, pore_health: null };
    const afterWithNulls = { ...MOCK_AFTER, redness_percent: null, pore_health: null };

    (getScan as jest.Mock)
      .mockResolvedValueOnce(beforeWithNulls)
      .mockResolvedValueOnce(afterWithNulls);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      // Should still render without crashing
      expect(getByText("Conditions")).toBeTruthy();
    });
  });

  it("should render watchlist section when either scan has watchlist areas", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Watchlist")).toBeTruthy();
      expect(getByText("Chin")).toBeTruthy();
      expect(getByText("Recurring breakouts")).toBeTruthy();
    });
  });

  it("should render routines section", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Morning Routine")).toBeTruthy();
      expect(getByText("Evening Routine")).toBeTruthy();
    });
  });

  it("should render products section", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Recommended Products")).toBeTruthy();
      expect(getByText("Product A")).toBeTruthy();
      expect(getByText("Product B")).toBeTruthy();
    });
  });

  it("should navigate back when back button is pressed", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Back")).toBeTruthy();
    });

    fireEvent.press(getByText("Back"));
    expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/history");
  });

  it("should display the medical disclaimer", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(
        getByText("This is not medical advice. Consult a healthcare professional for diagnosis or treatment.")
      ).toBeTruthy();
    });
  });

  it("should call getScan with both scan IDs in parallel", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    render(<Compare />);

    await waitFor(() => {
      expect(getScan).toHaveBeenCalledWith("scan-older");
      expect(getScan).toHaveBeenCalledWith("scan-newer");
      expect(getScan).toHaveBeenCalledTimes(2);
    });
  });

  it("should render heatmap mode selectors", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("breakouts")).toBeTruthy();
      expect(getByText("oiliness")).toBeTruthy();
      expect(getByText("dryness")).toBeTruthy();
      expect(getByText("redness")).toBeTruthy();
    });
  });

  it("should render photo view selectors", async () => {
    (getScan as jest.Mock)
      .mockResolvedValueOnce(MOCK_BEFORE)
      .mockResolvedValueOnce(MOCK_AFTER);

    const { getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Front")).toBeTruthy();
      expect(getByText("Left")).toBeTruthy();
      expect(getByText("Right")).toBeTruthy();
    });
  });

  it("should hide heatmaps when neither scan has overlays or photos", async () => {
    const noHeatmapsBefore = { ...MOCK_BEFORE, overlays: null, front_path: null, left_path: null, right_path: null };
    const noHeatmapsAfter = { ...MOCK_AFTER, overlays: null, front_path: null, left_path: null, right_path: null };

    (getScan as jest.Mock)
      .mockResolvedValueOnce(noHeatmapsBefore)
      .mockResolvedValueOnce(noHeatmapsAfter);
    (signStoragePaths as jest.Mock).mockResolvedValue({});

    const { queryByText, getByText } = render(<Compare />);

    await waitFor(() => {
      expect(getByText("Overview")).toBeTruthy();
      expect(queryByText("Heatmaps")).toBeNull();
    });
  });
});
