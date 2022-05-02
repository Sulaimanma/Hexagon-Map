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
import { StaticMap } from "react-map-gl"
import dynamic from "next/dynamic"
import { FirstPersonView } from "@deck.gl/core"
import AwesomeDebouncePromise from "awesome-debounce-promise"

const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

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
  latitude: -27.534623325818668,
  longitude: 153.02295713763687,

  zoom: 11,
  minZoom: 5,
  maxZoom: 15,
  pitch: 54.5,
  bearing: 54,
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
    zoom: 12,
    minZoom: 5,
    maxZoom: 15,
    pitch: 40.5,
    bearing: -27,
  })
  const [layers, setLayers] = useState([])
  // mapbox Token
  const REACT_APP_MAPBOX_TOKEN =
    "pk.eyJ1Ijoic3VsYWltYW4yNzUiLCJhIjoiY2ttMDlmOGduMGV4NTJ1bXJrYzcwMzVkOCJ9.OItwZwGpZdFDVaXdM69YxA"

  const [crashTimeData, setCrashTimeData] = useState([0, 0, 0, 0])
  const [crashRef, setCrashRef] = useState([0, 0, 0])
  const [crashNature, setCrashNature] = useState(["", "", ""])
  const [uniqueCrash, setUniqueCrash] = useState(["", "", ""])
  let chartSetting = {
    series: [
      {
        name: "column",
        type: "column",
        data: crashTimeData,
      },
      {
        name: "area",
        type: "area",
        data: crashTimeData,
      },
      {
        name: "line",
        type: "line",
        data: crashTimeData,
      },
    ],
    title: {
      text: "Traffic Sources",
    },

    options: {
      chart: {
        height: 350,
        type: "line",
        stacked: false,
        background: "#f2f5fa",
      },
      stroke: {
        width: [0, 2, 5],
        curve: "smooth",
      },

      plotOptions: {
        bar: {
          columnWidth: "50%",
        },
      },

      fill: {
        opacity: [0.85, 0.25, 1],
        gradient: {
          inverseColors: false,
          shade: "light",
          type: "vertical",
          opacityFrom: 0.85,
          opacityTo: 0.55,
          stops: [0, 100, 100, 100],
        },
      },
      labels: crashRef,
      markers: {
        size: 0,
      },
      xaxis: {
        title: {
          text: "Crash Referece Number",
        },
        type: "categories",
      },
      yaxis: {
        title: {
          text: "Crash Time",
        },
        min: 0,
        max: 24,
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return "Crash time:" + y.toFixed(0) + ""
            }
            return y
          },
        },
      },
    },
  }
  let chartSetting1 = {
    series: crashNature,
    options: {
      chart: {
        width: 380,
        type: "donut",
        background: "#f2f5fa",
      },
      labels: uniqueCrash,
      dataLabels: {
        enabled: false,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300,
            },
            legend: {
              show: false,
            },
          },
        },
      ],
      legend: {
        position: "right",
        offsetY: 0,
        height: 300,
      },
    },
  }

  const handleViewportChange = useCallback(
    (viewport) => {
      setViewport(viewport)
    },
    [viewport]
  )
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

  //Get unique value
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index
  }
  // Count how many times it appears
  function getOccurrence(array, value) {
    return array.filter((v) => v === value).length
  }
  //Onclick
  const onClick = async ({ object }) => {
    if (!object) {
      return null
    }
    console.log("tooltip", object)
    const carshTime = await object.points.map((set) => {
      let time = set.source[2]
      return time
    })
    const crashRef = await object.points.map((set) => {
      let ref = set.source[3]
      return ref
    })

    const carCrashNature = await object.points.map((set) => {
      let nature = set.source[4]
      return nature
    })
    let uniqueNature = await carCrashNature.filter(onlyUnique)
    const natureCountArr = await uniqueNature.map((value) => {
      let valueCount = getOccurrence(carCrashNature, value)
      return valueCount
    })
    // console.log("crashshhshs", carshTime)
    // console.log("crashRef", crashRef)
    // console.log("uniqueValue", uniqueNature)
    setCrashNature(natureCountArr)
    setUniqueCrash(uniqueNature)
    setCrashTimeData(carshTime)
    setCrashRef(crashRef)
  }

  //Tooltip
  function getTooltip({ object }) {
    if (!object) {
      return null
    }

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

      const cleanData = await data.map((d) => {
        let d7 = "unkonw"
        if (d[7].length == 0) {
          d7 = "Unknown"
        }
        return [
          Number(d[9]),
          Number(d[10]),
          Number(d[6]),
          Number(d[1]),
          Number(d[3]),
        ]
      })
      console.log("dataaaa", data)
      //setting value
      const radius = 100
      const upperPercentile = 100
      const coverage = 1

      var layers = [
        new HexagonLayer({
          id: "heatmap",
          colorRange,
          coverage,
          data: cleanData,
          elevationRange: [0, 200],
          elevationScale: cleanData && cleanData.length ? 50 : 0,
          extruded: true,
          getPosition: (d) => d,
          pickable: true,
          radius,
          upperPercentile,
          material,

          transitions: {
            // elevationScale: 2000,
            getElevation: {
              duration: 1000,
              enter: () => [0],
            },
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
  const state = {
    series: [
      {
        name: "TEAM A",
        type: "column",
        data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30],
      },
      {
        name: "TEAM B",
        type: "area",
        data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43],
      },
      {
        name: "TEAM C",
        type: "line",
        data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39],
      },
    ],
    options: {
      chart: {
        height: 350,
        type: "line",
        stacked: false,
        background: "#f2f5fa",
      },
      stroke: {
        width: [0, 2, 5],
        curve: "smooth",
      },

      plotOptions: {
        bar: {
          columnWidth: "50%",
        },
      },

      fill: {
        opacity: [0.85, 0.25, 1],
        gradient: {
          inverseColors: false,
          shade: "light",
          type: "vertical",
          opacityFrom: 0.85,
          opacityTo: 0.55,
          stops: [0, 100, 100, 100],
        },
      },
      labels: [
        "01/01/2003",
        "02/01/2003",
        "03/01/2003",
        "04/01/2003",
        "05/01/2003",
        "06/01/2003",
        "07/01/2003",
        "08/01/2003",
        "09/01/2003",
        "10/01/2003",
        "11/01/2003",
      ],
      markers: {
        size: 0,
      },
      xaxis: {
        type: "datetime",
      },
      yaxis: {
        title: {
          text: "Points",
        },
        min: 0,
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return y.toFixed(0) + " points"
            }
            return y
          },
        },
      },
    },
  }

  return (
    <div>
      <Head>
        <title>Hexagon Map of Accidents in Brisbane| Sulaiman</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {layers.length === 0 ? (
        <>
          <div
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundImage: ` url(
              "https://maiwar-react-storage04046-devsecond.s3.ap-southeast-2.amazonaws.com/public/mapSourceImg/deckMap.png"
            )`,
              filter: `blur(20px)`,
            }}
          ></div>
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "fixed",
            zIndex: "999",
            top: "25vh",
            left: "34vw",
          }}>
            <h1 style={{
              color: "white",
              fontSize: "3rem",
              fontFamily: "Proxima Nova,Arial,Helvetica,sans-serif",
            }}>
              Queensland Car Crash Map
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "fixed",
              zIndex: "999",
              top: "49vh",
              left: "49vw",
            }}
          >
            <BounceLoader color="#f2f5fa" />
          </div>
        </>
      ) : (
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          layers={layers}
          effects={[lightingEffect]}
          controller={true}
          getTooltip={getTooltip}
          onClick={onClick}
        >
          <StaticMap
            mapStyle="mapbox://styles/sulaiman275/cl2nyxxio001614ojsmz3ka04"
            mapboxApiAccessToken={REACT_APP_MAPBOX_TOKEN}
          />
          <div
            className="mixed-chart"
            style={{
              position: "fixed",
              height: "100vh",
              top: "66vh",
              width: "100vw",
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <ApexCharts
              options={chartSetting.options}
              series={chartSetting.series}
              type="line"
              height={300}
              width={600}
            />
            <ApexCharts
              options={chartSetting1.options}
              series={chartSetting1.series}
              type="pie"
              width={380}
            />
          </div>


          <FirstPersonView width="50%" x="50%" fovy={50} />
        </DeckGL>
          // <ReactMapGL
          //   {...viewport}
          //   mapboxApiAccessToken={REACT_APP_MAPBOX_TOKEN}
          //   onViewportChange={handleViewportChange}
          //   mapStyle="mapbox://styles/sulaiman275/cl2nyxxio001614ojsmz3ka04"
          // /> 
      )}
    </div>
  )
}
