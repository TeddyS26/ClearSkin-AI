import React from "react";
import { render } from "@testing-library/react-native";
import HeatmapLegend from "../HeatmapLegend";

describe("HeatmapLegend", () => {
  it("should render with breakouts mode", () => {
    const { getByText } = render(<HeatmapLegend mode="breakouts" />);

    expect(getByText("Good")).toBeTruthy();
    expect(getByText("Severe")).toBeTruthy();
    expect(getByText("Green = clear, Red = more breakouts")).toBeTruthy();
  });

  it("should render with oiliness mode", () => {
    const { getByText } = render(<HeatmapLegend mode="oiliness" />);

    expect(getByText("Good")).toBeTruthy();
    expect(getByText("Severe")).toBeTruthy();
    expect(getByText("Green = less oily, Red = very oily")).toBeTruthy();
  });

  it("should render with dryness mode", () => {
    const { getByText } = render(<HeatmapLegend mode="dryness" />);

    expect(getByText("Good")).toBeTruthy();
    expect(getByText("Severe")).toBeTruthy();
    expect(getByText("Green = hydrated, Red = very dry")).toBeTruthy();
  });

  it("should render with redness mode", () => {
    const { getByText } = render(<HeatmapLegend mode="redness" />);

    expect(getByText("Good")).toBeTruthy();
    expect(getByText("Severe")).toBeTruthy();
    expect(getByText("Green = low redness, Red = high redness")).toBeTruthy();
  });

  it("should render gradient color bars", () => {
    const { toJSON } = render(<HeatmapLegend mode="breakouts" />);
    const tree = toJSON();

    expect(tree).toBeTruthy();
  });

  it("should display correct label for breakouts", () => {
    const { queryByText } = render(<HeatmapLegend mode="breakouts" />);

    expect(queryByText("Green = clear, Red = more breakouts")).toBeTruthy();
    expect(queryByText("Green = less oily, Red = very oily")).toBeFalsy();
    expect(queryByText("Green = hydrated, Red = very dry")).toBeFalsy();
    expect(queryByText("Green = low redness, Red = high redness")).toBeFalsy();
  });

  it("should display correct label for oiliness", () => {
    const { queryByText } = render(<HeatmapLegend mode="oiliness" />);

    expect(queryByText("Green = less oily, Red = very oily")).toBeTruthy();
    expect(queryByText("Green = clear, Red = more breakouts")).toBeFalsy();
    expect(queryByText("Green = hydrated, Red = very dry")).toBeFalsy();
    expect(queryByText("Green = low redness, Red = high redness")).toBeFalsy();
  });

  it("should display correct label for dryness", () => {
    const { queryByText } = render(<HeatmapLegend mode="dryness" />);

    expect(queryByText("Green = hydrated, Red = very dry")).toBeTruthy();
    expect(queryByText("Green = clear, Red = more breakouts")).toBeFalsy();
    expect(queryByText("Green = less oily, Red = very oily")).toBeFalsy();
    expect(queryByText("Green = low redness, Red = high redness")).toBeFalsy();
  });

  it("should display correct label for redness", () => {
    const { queryByText } = render(<HeatmapLegend mode="redness" />);

    expect(queryByText("Green = low redness, Red = high redness")).toBeTruthy();
    expect(queryByText("Green = clear, Red = more breakouts")).toBeFalsy();
    expect(queryByText("Green = less oily, Red = very oily")).toBeFalsy();
    expect(queryByText("Green = hydrated, Red = very dry")).toBeFalsy();
  });

  it("should match snapshot for breakouts mode", () => {
    const { toJSON } = render(<HeatmapLegend mode="breakouts" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("should match snapshot for oiliness mode", () => {
    const { toJSON } = render(<HeatmapLegend mode="oiliness" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("should match snapshot for dryness mode", () => {
    const { toJSON } = render(<HeatmapLegend mode="dryness" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("should match snapshot for redness mode", () => {
    const { toJSON } = render(<HeatmapLegend mode="redness" />);
    expect(toJSON()).toMatchSnapshot();
  });
});

