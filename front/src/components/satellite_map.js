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

function SatelliteMap({ satellites, passes, TLEs }) {
  let ISS = satellites.filter((satel) => {
    return satel.name === "ISS";
  })[0];
  console.log("l'iss", ISS);
  let issLatitude = ISS.latitude ? ISS.latitude : 0;
  let issLongitude = ISS.longitude ? ISS.longitude : 0;

  const satelCoords = satellites.map((satel) => [
    satel.latitude,
    satel.longitude,
  ]);

  const stations = STATIONS;

  const isIlluminated = ISS.is_illuminated;
  const [hoverIndex, setHoverIndex] = useState(null);

  // setting the image accoring to the illumination status of the ISS
  const pathImage = isIlluminated ? markerImageSun : markerImageMoon;
  const [showPopup, setShowPopup] = useState(false);

  const TLEData = TLEs ? TLEs[0] : undefined;

  // reversing lng, and lat in the array
  let satelTrajectories = TLEs
    ? TLEs.map((TLEData) => TLEData.coordinates)
    : [];

  let satelIndices = [];
  let distISS;
  if (satelTrajectories[0]) {
    for (let i = 0; i < satelTrajectories.length; i++) {
      const indexDist = findClosestIndexDist(
        satelTrajectories[i],
        [satelCoords[i][0], satelCoords[i][1]],
      );
      satelIndices.push(indexDist[0]);
      if (i == 0) {
        distISS = indexDist[1];
      }
    }

    console.log("indices là ", satelIndices)

    // when the ISS crossed the +180 longitude, we take the second orbit retrived in the call to fetchTLEData
    // otherwise, the position of the ISS appeared out of the orbit line until next fetchTLEData call
    if (distISS > 4000000) {
      satelTrajectories[0] = TLEData
        ? TLEData.next_orb
        : [];
    }

    // adjusting the zoomValue according to screeWidth to TILE_SIZE ratio, with 2^zoomValue = screenWidth/TILE_SIZE
    // see https://evilmartians.com/chronicles/how-to-build-a-better-react-map-with-pigeon-maps-and-mapbox for ref
    const screenWidth = window.innerWidth;
    const zoomValue = Math.log2(screenWidth / TILE_SIZE);

    const illuminations = ISS.illuminations;

    const aroundCoords = stations.map((station) =>
      generatePoints(station.lat, station.lng, station.rad, 10000).map(
        (point) => [point[1], point[0]],
      ),
    );
    const closestIndicesDists = findClosestIndicesDists(
      satelCoords,
      stations,
    );

    const nightAreaGeoJson = new GeoJSONTerminator();
    fixTerminator(nightAreaGeoJson);

    return (
      <Map
        height={screenWidth * HEIGHT_RATIO}
        width={screenWidth}
        defaultCenter={[0, 0]}
        defaultZoom={zoomValue}
        provider={mapboxProvider}
      >
        <GeoJson
          data={nightAreaGeoJson}
          styleCallback={() => ({ fill: "rgba(0, 0, 0, 0.5)" })}
        />

        <Marker
          anchor={[issLatitude, issLongitude]}
          onMouseOver={() => setShowPopup(true)}
          onMouseOut={() => setShowPopup(false)}
          width={window.innerWidth * 0.08}
          height={window.innerHeight * 0.08}
        />
        {aroundCoords.map((aroundStation, index) => (
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
                return { strokeWidth: "2", stroke: stations[index].color };
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

        {satelTrajectories.map((coord) =>
          coord ? (
            <GeoJson
              data={{
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates: coord.map(([lat, lng]) => [lng, lat]),
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
        <Marker anchor={[issLatitude, issLongitude]}>
          <img src={pathImage} alt="marker" className="imageISS" />
        </Marker>

        {hoverIndex &&
          passes[hoverIndex].map((obj) => (
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
          <Overlay anchor={[issLatitude, issLongitude]} offset={[120, 79]}>
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
              {passes && passes[hoverIndex].length > 0 ? (
                <>
                  <h2>{`Next ${passes[hoverIndex].length} visibilities:`}</h2>
                  {passes[hoverIndex].map((pass, index) => (
                    <pre
                      key={index}
                    >{`${stations[pass.targetIndex].name} in ${parseInt(
                      nextVisiWaitTime(
                        satelIndices[hoverIndex],
                        pass.index,
                        TLEs[hoverIndex],
                      ),
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
