import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import * as React from "react"
import { useState, useCallback, useEffect } from "react"
import ReactMapGL from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import DeckGL, {
  AmbientLight,
  PointLight,
  LightingEffect,
  HexagonLayer,
} from "deck.gl"
import taxiData from "../comps/taxi"
import axios from "axios"
import csv from "csv"
import BounceLoader from "react-spinners/BounceLoader"

// Source data CSV
const DATA_URL =
  "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/3d-heatmap/heatmap-data.csv"

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
})

const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-0.144528, 49.739968, 80000],
})

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-3.807751, 54.104682, 8000],
})

const lightingEffect = new LightingEffect({
  ambientLight,
  pointLight1,
  pointLight2,
})
const material = {
  ambient: 0.64,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [51, 51, 51],
}

const INITIAL_VIEW_STATE = {
  latitude: -27.362875842,
  longitude: 152.962180055,

  zoom: 9,
  minZoom: 5,
  maxZoom: 15,
  pitch: 40.5,
  bearing: -27,
}

export const colorRange = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78],
]

export default function Home() {
  const [viewport, setViewport] = useState({
    latitude: -27.362875842,
    longitude: 152.962180055,
    zoom: 6.6,
    minZoom: 5,
    maxZoom: 15,
    pitch: 40.5,
    bearing: -27,
  })
  const [layers, setLayers] = useState([])
  // mapbox Token
  const REACT_APP_MAPBOX_TOKEN =
    "pk.eyJ1IjoiZ3VuZXJpYm9pIiwiYSI6ImNrMnM0NjJ1dzB3cHAzbXVpaXhrdGd1YjIifQ.1TmNd7MjX3AhHdXprT4Wjg"
  const handleViewportChange = useCallback((viewport) => {
    setViewport(viewport)
  }, [])
  //Resize window function
  const resize = () => {
    setViewport({
      ...viewport,
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }
  useEffect(() => {
    window.addEventListener("resize", resize)
    return function cleanUp() {
      window.removeEventListener("resize", resize)
    }
  }, [])
  //Change style of the map
  const [style, setStyle] = useState(
    "mapbox://styles/guneriboi/ckp6b4elp0jvv18o2lvpg1708"
  )
  //Tooltip
  function getTooltip({ object }) {
    if (!object) {
      return null
    }
    // console.log("tooltip", object)
    const lat = object.position[1]
    const lng = object.position[0]
    const count = object.points.length

    return `\
      latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ""}
      longitude: ${Number.isFinite(lng) ? lng.toFixed(6) : ""}
      ${count} Accidents`
  }

  //fetch data
  const fetch = async () => {
    try {
      const res = await axios(
        //UK DATA "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/3d-heatmap/heatmap-data.csv"
        "https://www.data.qld.gov.au/datastore/dump/e88943c0-5968-4972-a15f-38e120d72ec0?format=json"
      )
      const data = await res.data.records

      const cleanData = await data.map((d) => [Number(d[9]), Number(d[10])])
      console.log("dataaaa", data)
      //setting value
      const radius = 200
      const upperPercentile = 100
      const coverage = 1

      var layers = [
        new HexagonLayer({
          id: "heatmap",
          colorRange,
          coverage,
          data: cleanData,
          elevationRange: [0, 2000],
          elevationScale: cleanData && cleanData.length ? 50 : 0,
          extruded: true,
          getPosition: (d) => d,
          pickable: true,
          radius,
          upperPercentile,
          material,

          transitions: {
            elevationScale: 2000,
          },
        }),
      ]
      setLayers(layers)
    } catch (err) {
      console.log("error on fetching data", err)
    }

    // csv.parse(data, async (err, data) => {

    //   var keys = data.shift()
    //   const cleanData = await data.map((d) => [Number(d[0]), Number(d[1])])

    //   console.log("dataaaaaaaaaaaaaa", cleanData)
    //   err && alert("errorrrrrr", err)
    //   //setting value
    //   const radius = 2000
    //   const upperPercentile = 100
    //   const coverage = 1
  }
  useEffect(() => {
    fetch()
  }, [])

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {layers.length === 0 ? (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <BounceLoader color="#36D7B7" />
        </div>
      ) : (
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          layers={layers}
          effects={[lightingEffect]}
          controller={true}
          getTooltip={getTooltip}
        >
          <ReactMapGL
            {...viewport}
            onViewportChange={(nextViewport) => setViewport(nextViewport)}
            mapboxApiAccessToken={REACT_APP_MAPBOX_TOKEN}
            onViewportChange={handleViewportChange}
            mapStyle="mapbox://styles/guneriboi/ckp6b4elp0jvv18o2lvpg1708"
          />
        </DeckGL>
      )}
    </div>
  )
}
