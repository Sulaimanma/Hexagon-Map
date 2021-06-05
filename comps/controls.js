import React, { Component } from "react"
import { mapStylePicker, layerControl } from "./style"

export const HEXAGON_CONTROLS = {
  showHexagon: {
    displayName: "Show Hexagon",
    type: "boolean",
    value: true,
  },
  radius: {
    displayName: "Hexagon Radius",
    type: "range",
    value: 100,
    step: 50,
    min: 50,
    max: 1000,
  },
  coverage: {
    displayName: "Hexagon Coverage",
    type: "range",
    value: 1,
    step: 0.1,
    min: 0,
    max: 1,
  },
  upperPercentile: {
    displayName: "Hexagon Upper Percentile",
    type: "range",
    value: 100,
    step: 0.1,
    min: 80,
    max: 100,
  },
  showScatterplot: {
    displayName: "Show Scatterplot",
    type: "boolean",
    value: true,
  },
  radiusScale: {
    displayName: "Scatterplot Radius",
    type: "range",
    value: 5,
    step: 5,
    min: 1,
    max: 200,
  },
}
