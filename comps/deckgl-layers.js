import { ScatterplotLayer, HexagonLayer } from "deck.gl"

const PICKUP_COLOR = [114, 19, 108]
const DROPOFF_COLOR = [243, 185, 72]

const HEATMAP_COLORS = [
  [255, 255, 204],
  [199, 233, 180],
  [127, 205, 187],
  [65, 182, 196],
  [44, 127, 184],
  [37, 52, 148],
]

const LIGHT_SETTINGS = {
  lightsPosition: [-73.8, 40.5, 8000, -74.2, 40.9, 8000],
  ambientRatio: 0.4,
  diffuseRatio: 0.6,
  specularRatio: 0.2,
  lightsStrength: [0.8, 0.0, 0.8, 0.0],
  numberOfLights: 2,
}

const elevationRange = [0, 1000]

export default function renderLayers(props) {
  return <div></div>
}
