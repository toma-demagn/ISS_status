import { GeoJson, Map, Marker, Overlay } from "pigeon-maps";
import React, { useState } from "react";
import GeoJSONTerminator from "@webgeodatavore/geojson.terminator";

import markerImageMoon from "../assets/iss_moon.png";
import markerImageSun from "../assets/iss_sun.png";
import {
  findClosestIndexDist,
  findClosestIndicesDists,
  formatIllumination,
  generatePoints,
  nextVisiWaitTime,
  STATIONS,
} from "../utils/functions";

// constants to help draw the map
const TILE_SIZE = 256;
const ISS_ORBIT_INCLINATION_DEG = 51.6;
// this HEIGHT_RATIO takes into accound the orbit inclination in order to crop out some area that the ISS doesn't cover
const HEIGHT_RATIO = ISS_ORBIT_INCLINATION_DEG / 90.0;

const ISS_ORBIT_TIME_MS = 324000000;

const { REACT_APP_MAPBOX_ACCESS_TOKEN } = process.env;

function mapboxProvider(x, y, z, dpr) {
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${z}/${x}/${y}${dpr >= 2 ? "@2x" : ""}?access_token=${REACT_APP_MAPBOX_ACCESS_TOKEN}`;
}

function fixTerminator(nightAreaGeoJson) {
  const coords = nightAreaGeoJson.features[0].geometry.coordinates[0];
  coords.splice(0, 1);
  coords[coords.length - 1][1] = -89;
  coords[0][1] = -89;
}

function SatelliteMap({ data }) {
  let latitude = data?.latitude;
  let longitude = data?.longitude;
  let passages = data?.passages;

  console.log("les passages ici ", passages);

  const stations = STATIONS;

  const isIlluminated = data?.is_illuminated;
  const [hoverIndex, setHoverIndex] = useState(null);

  // setting the image accoring to the illumination status of the ISS
  const pathImage = isIlluminated ? markerImageSun : markerImageMoon;
  const [showPopup, setShowPopup] = useState(false);

  const TLEs = data?.TLEs;

  const TLEData = TLEs ? TLEs[0] : undefined;

  // reversing lng, and lat in the array
  let coordinates = TLEs
    ? TLEs.map((TLEData) =>
        TLEData.coordinates?.map(([lat, lng]) => [lng, lat]),
      )
    : [];

  let satelIndices = [];
  if (coordinates[0]) {
    const indexDistISS = findClosestIndexDist(
      coordinates[0].map(([lng, lat]) => [lat, lng]),
      [latitude, longitude],
    );
    const indexISS = indexDistISS[0];
    satelIndices.push(indexISS);
    const distISS = indexDistISS[1];
    const satelCoords = [[latitude, longitude]];
    for (let i = 1; i < coordinates.length; i++) {
      const index = (indexISS + 1000 * (i + 1)) % coordinates[i]?.length;
      const coords = coordinates[i][index];
      satelCoords.push([coords[1], coords[0]]);
      satelIndices.push(index);
    }

    const updated_at = TLEData?.updated_at || Date.now();
    let showLine = false;
    // when the ISS crossed the +180 longitude, we take the second orbit retrived in the call to fetchTLEData
    // otherwise, the position of the ISS appeared out of the orbit line until next fetchTLEData call
    if (distISS > 4000000) {
      coordinates[0] = TLEData
        ? TLEData.next_orb.map(([lng, lat]) => [lat, lng])
        : [];
    }

  // adjusting the zoomValue according to screeWidth to TILE_SIZE ratio, with 2^zoomValue = screenWidth/TILE_SIZE
  // see https://evilmartians.com/chronicles/how-to-build-a-better-react-map-with-pigeon-maps-and-mapbox for ref
  const screenWidth = window.innerWidth;
  const zoomValue = Math.log2(screenWidth / TILE_SIZE);

  const illuminations = data?.illuminations;

  // getting the night area for adding shade to the map
  const nightAreaGeoJson = new GeoJSONTerminator();
  fixTerminator(nightAreaGeoJson);
    const aroundCoords = stations.map((station) =>
      generatePoints(station.lat, station.lng, station.rad, 10000).map(
        (point) => [point[1], point[0]],
      ),
    );
    const closestIndicesDists = findClosestIndicesDists(
      satelCoords.map(([lng, lat]) => [lat, lng]),
      stations,
    );
    console.log(
      "l'index",
      hoverIndex,
      satelCoords[hoverIndex],
      passages[hoverIndex],
    );
    if (passages && hoverIndex) {
      passages[hoverIndex].forEach((obj) => {
        console.log(
          "la station",
          stations[obj.targetIndex],
          stations[obj.targetIndex].name,
          stations[obj.targetIndex].lat,
          stations[obj.targetIndex].lng,
        );
      });
    }

    return (
      <Map
        height={screenWidth * HEIGHT_RATIO}
        width={screenWidth}
        defaultCenter={[0, 0]}
        defaultZoom={zoomValue}
        provider={mapboxProvider}
      >
        <Marker
          anchor={[latitude, longitude]}
          onMouseOver={() => setShowPopup(true)}
          onMouseOut={() => setShowPopup(false)}
          width={window.innerWidth * 0.08}
          height={window.innerHeight * 0.08}
        />
        {aroundCoords.map((aroundStation) => (
          <GeoJson
            data={{
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: aroundStation,
                  },
                  properties: {
                    prop0: "value0",
                    prop1: 0.0,
                  },
                },
              ],
            }}
            styleCallback={(feature, hover) => {
              if (feature.geometry.type === "LineString") {
                return { strokeWidth: "2", stroke: "black" };
              }
              return {
                fill: "#d4e6ec99",
                strokeWidth: "1",
                stroke: "white",
                r: "20",
              };
            }}
          />
        ))}

        {coordinates.map((coord) =>
          coord ? (
            <GeoJson
              data={{
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates: coord,
                    },
                    properties: {
                      prop0: "value0",
                      prop1: 0.0,
                    },
                  },
                ],
              }}
              styleCallback={(feature, hover) => {
                if (feature.geometry.type === "LineString") {
                  return { strokeWidth: "2", stroke: "black" };
                }
                return {
                  fill: "#d4e6ec99",
                  strokeWidth: "1",
                  stroke: "white",
                  r: "20",
                };
              }}
            />
          ) : null,
        )}

        {/*marker with the image of the iss at the right position*/}
        <Marker anchor={[latitude, longitude]}>
          <img src={pathImage} alt="marker" className="imageISS" />
        </Marker>

        {hoverIndex &&
          passages[hoverIndex].map((obj) => (
            <GeoJson
              data={{
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates: [
                        [
                          satelCoords[hoverIndex][1],
                          satelCoords[hoverIndex][0],
                        ],
                        [
                          stations[obj.targetIndex].lng,
                          stations[obj.targetIndex].lat,
                        ],
                      ],
                    },
                    properties: {
                      prop0: "value0",
                      prop1: 0.0,
                    },
                  },
                ],
              }}
              styleCallback={(feature, hover) => {
                if (feature.geometry.type === "LineString") {
                  return { strokeWidth: "2", stroke: "black" };
                }
                return {
                  fill: "#d4e6ec99",
                  strokeWidth: "1",
                  stroke: "white",
                  r: "20",
                };
              }}
            />
          ))}

        {satelCoords.map(
          (coords, index) =>
            closestIndicesDists[index][1] / 1000 <=
              stations[closestIndicesDists[index][0]].rad && (
              <GeoJson
                data={{
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: {
                        type: "LineString",
                        coordinates: [
                          [coords[1], coords[0]],
                          [
                            stations[closestIndicesDists[index][0]].lng,
                            stations[closestIndicesDists[index][0]].lat,
                          ],
                        ],
                      },
                      properties: {
                        prop0: "value0",
                        prop1: 0.0,
                      },
                    },
                  ],
                }}
                styleCallback={(feature, hover) => {
                  if (feature.geometry.type === "LineString") {
                    return { strokeWidth: "2", stroke: "black" };
                  }
                  return {
                    fill: "#d4e6ec99",
                    strokeWidth: "1",
                    stroke: "white",
                    r: "20",
                  };
                }}
              />
            ),
        )}

        <GeoJson
          data={{
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [longitude, latitude],
                    [coordinates[0][indexISS][0], coordinates[0][indexISS][1]],
                  ],
                },
                properties: {
                  prop0: "value0",
                  prop1: 0.0,
                },
              },
            ],
          }}
          styleCallback={(feature, hover) => {
            if (feature.geometry.type === "LineString") {
              return { strokeWidth: "2", stroke: "black" };
            }
            return {
              fill: "#d4e6ec99",
              strokeWidth: "1",
              stroke: "white",
              r: "20",
            };
          }}
        />

        {satelCoords.slice(1).map((coordinate, index) => (
          <Marker
            anchor={[coordinate[0], coordinate[1]]}
            width={window.innerWidth * 0.08}
            height={window.innerHeight * 0.08}
            onMouseOver={() => setHoverIndex(index + 1)} //because we sliced the array
            onMouseOut={() => setHoverIndex(null)}
          />
        ))}

        {/*creating the popup with formatted illumination string*/}
        {showPopup && (
          <Overlay anchor={[latitude, longitude]} offset={[120, 79]}>
            <div
              style={{
                background: "white",
                borderRadius: "10px",
                padding: "10px",
              }}
            >
              {illuminations && illuminations.length > 0 ? (
                <>
                  <h2>{`Last ${illuminations.length} illuminations:`}</h2>
                  {illuminations.map((illumination, index) => (
                    <pre key={index}>{formatIllumination(illumination)}</pre>
                  ))}
                </>
              ) : (
                <p>No illuminations registered yet</p>
              )}
            </div>
          </Overlay>
        )}

        {hoverIndex && (
          <Overlay
            anchor={[satelCoords[hoverIndex][0], satelCoords[hoverIndex][1]]}
          >
            <div
              style={{
                background: "white",
                borderRadius: "10px",
                padding: "10px",
              }}
            >
              {passages && passages[hoverIndex].length > 0 ? (
                <>
                  <h2>{`Next ${passages[hoverIndex].length} visibilities:`}</h2>
                  {passages[hoverIndex].map((passage, index) => (
                    <pre
                      key={index}
                    >{`${stations[passage.targetIndex].name} in ${nextVisiWaitTime(
                      satelIndices[hoverIndex],
                      passage.index,
                      TLEs[hoverIndex],
                    )}s`}</pre>
                  ))}
                </>
              ) : (
                <p>No passages registered yet</p>
              )}
            </div>
          </Overlay>
        )}
      </Map>
    );
  } else {
    return <div>Loading...</div>;
  }
}

export default SatelliteMap;
