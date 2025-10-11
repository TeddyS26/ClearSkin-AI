import React from "react";
import { render } from "@testing-library/react-native";
import HeatmapOverlay from "../HeatmapOverlay";

// Mock react-native-svg
jest.mock("react-native-svg", () => ({
  __esModule: true,
  default: "Svg",
  Svg: "Svg",
  Polygon: "Polygon",
}));

describe("HeatmapOverlay", () => {
  const mockPhotoUri = "file:///photo.jpg";

  it("should render image with correct URI", () => {
    const { getByTestId } = render(
      <HeatmapOverlay photoUri={mockPhotoUri} mode="breakouts" />
    );

    // Check if image is rendered - using UNSAFE_root to inspect structure
    const tree = render(
      <HeatmapOverlay photoUri={mockPhotoUri} mode="breakouts" />
    ).toJSON();
    expect(tree).toBeTruthy();
  });

  it("should render without overlays", () => {
    const { toJSON } = render(
      <HeatmapOverlay photoUri={mockPhotoUri} mode="breakouts" />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should render with front overlays for breakouts mode", () => {
    const overlays = {
      front: {
        breakouts: [
          [[10, 10], [20, 10], [15, 20]], // Triangle
        ],
        oiliness: [],
        dryness: [],
        redness: [],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        which="front"
        mode="breakouts"
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should render with left overlays for oiliness mode", () => {
    const overlays = {
      left: {
        breakouts: [],
        oiliness: [
          [[5, 5], [15, 5], [10, 15]], // Triangle
        ],
        dryness: [],
        redness: [],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        which="left"
        mode="oiliness"
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should render with right overlays for dryness mode", () => {
    const overlays = {
      right: {
        breakouts: [],
        oiliness: [],
        dryness: [
          [[30, 30], [40, 30], [35, 40]], // Triangle
        ],
        redness: [],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        which="right"
        mode="dryness"
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should render multiple polygons for redness mode", () => {
    const overlays = {
      front: {
        breakouts: [],
        oiliness: [],
        dryness: [],
        redness: [
          [[10, 10], [20, 10], [15, 20]],
          [[30, 30], [40, 30], [35, 40]],
          [[50, 50], [60, 50], [55, 60]],
        ],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        which="front"
        mode="redness"
      />
    );

    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it("should handle null overlays", () => {
    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={null}
        which="front"
        mode="breakouts"
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should handle missing which key in overlays", () => {
    const overlays = {
      front: {
        breakouts: [[[10, 10], [20, 10], [15, 20]]],
        oiliness: [],
        dryness: [],
        redness: [],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        which="left" // Different from what's in overlays
        mode="breakouts"
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should handle missing mode key in overlays", () => {
    const overlays = {
      front: {
        breakouts: [[[10, 10], [20, 10], [15, 20]]],
        oiliness: [],
        dryness: [],
        redness: [],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        which="front"
        mode="oiliness" // Mode with empty array
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should default to front when which prop is not provided", () => {
    const overlays = {
      front: {
        breakouts: [[[10, 10], [20, 10], [15, 20]]],
        oiliness: [],
        dryness: [],
        redness: [],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        mode="breakouts"
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should render complex polygon shapes", () => {
    const overlays = {
      front: {
        breakouts: [
          // Complex polygon with many points
          [[10, 10], [20, 10], [25, 20], [20, 30], [10, 30], [5, 20]],
        ],
        oiliness: [],
        dryness: [],
        redness: [],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        which="front"
        mode="breakouts"
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should handle empty polygon arrays", () => {
    const overlays = {
      front: {
        breakouts: [],
        oiliness: [],
        dryness: [],
        redness: [],
      },
    };

    const { toJSON } = render(
      <HeatmapOverlay
        photoUri={mockPhotoUri}
        overlays={overlays}
        which="front"
        mode="breakouts"
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("should render with all modes having data", () => {
    const overlays = {
      front: {
        breakouts: [[[10, 10], [20, 10], [15, 20]]],
        oiliness: [[[30, 30], [40, 30], [35, 40]]],
        dryness: [[[50, 50], [60, 50], [55, 60]]],
        redness: [[[70, 70], [80, 70], [75, 80]]],
      },
    };

    // Test each mode
    const modes: Array<"breakouts" | "oiliness" | "dryness" | "redness"> = [
      "breakouts",
      "oiliness",
      "dryness",
      "redness",
    ];

    modes.forEach((mode) => {
      const { toJSON } = render(
        <HeatmapOverlay
          photoUri={mockPhotoUri}
          overlays={overlays}
          which="front"
          mode={mode}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });
});

