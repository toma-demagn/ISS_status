import React, { useState, useEffect } from "react";
import SATELLITES from './assets/satellites.json'
import queryString from "query-string";
import "./App.css";
import SatelliteMap from "./components/satellite_map";
import {
  computeVis,
  fetchSatelliteData,
  fetchTLEs,
  findClosestIndexDist,
  STATIONS,
} from "./utils/functions";

// loading .env variables
const { REACT_APP_SATELLITE_FETCH_RATE, REACT_APP_TLE_FETCH_RATE } =
  process.env;


function App() {
  const [issData, setIssData] = useState(null);
  const [TLEs, setTLEs] = useState(null);

  useEffect(() => {
    // getting the nb_windows parameter
    const params = queryString.parse(window.location.search);
    const nbWindows = params.nb_windows;

    // fetching satellite data immediately and update state
    fetchSatelliteData(nbWindows).then(setIssData);

    // setting up interval to fetch satellite data regularly, according to the .env value
    const intervalId = setInterval(() => {
      fetchSatelliteData(nbWindows).then(setIssData);
    }, REACT_APP_SATELLITE_FETCH_RATE);

    // clearing interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // the following is for fetching TLE data of the ISS in order to draw its trajectory on the map
  useEffect(() => {
    // fetching TLE data immediately and update state
    fetchTLEs(SATELLITES).then(setTLEs);

    // regularly fetching TLE data at the rate given in .env
    const TLEIntervalId = setInterval(() => {
      fetchTLEs().then(setTLEs);
    }, REACT_APP_TLE_FETCH_RATE);

    // clearing interval on component unmount
    return () => clearInterval(TLEIntervalId);
  }, []);
  let vis;
  if (TLEs && issData) {
    let coordinates = TLEs.map((TLE) => TLE.coordinates);
    let coordinatesExtended = TLEs.map((TLE) => TLE.coordinates.concat(TLE.next_orb));

    vis = computeVis(coordinatesExtended, STATIONS);
    const satellites = [
      ...SATELLITES.slice(0, SATELLITES.length-1), { ...issData, ...SATELLITES[2] }
    ];
    const indexDistISS = findClosestIndexDist(coordinates[0], [
      issData.latitude,
      issData.longitude,
    ]);
    for (let i = 0; i < satellites.length; i++) {
      if (satellites[i].name != "ISS"){
        const index = (indexDistISS[0] + 1500 * i) % coordinates[i].length;
        satellites[i].latitude = coordinates[i][index][0];
        satellites[i].longitude = coordinates[i][index][1];
      }
    }
    for (let i = 0; i<satellites.length; i++){
      satellites[i].TLE = TLEs[i];
      satellites[i].vis = vis[i];
    }
    return (
      <div className="App">
        <SatelliteMap satellites={satellites}/>
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
}

export default App;
