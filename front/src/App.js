import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import './App.css';
import SatelliteMap from './components/satellite_map';
import {computeVisis, fetchSatelliteData, fetchTLEs, STATIONS} from "./utils/functions";

// loading .env variables
const { REACT_APP_SATELLITE_FETCH_RATE, REACT_APP_TLE_FETCH_RATE } = process.env;

function App() {
    const [data, setData] = useState(null);
    const [TLEs, setTLEs] = useState(null);

    useEffect(() => {

        // getting the nb_windows parameter
        const params = queryString.parse(window.location.search);
        const nbWindows = params.nb_windows;

        // fetching satellite data immediately and update state
        fetchSatelliteData(nbWindows).then(setData);

        // setting up interval to fetch satellite data regularly, according to the .env value
        const intervalId = setInterval(() => {
            fetchSatelliteData(nbWindows).then(setData);
        }, REACT_APP_SATELLITE_FETCH_RATE);

        // clearing interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    // the following is for fetching TLE data of the ISS in order to draw its trajectory on the map
    useEffect(() => {
        // fetching TLE data immediately and update state
        fetchTLEs().then(setTLEs);

        // regularly fetching TLE data at the rate given in .env
        const TLEIntervalId = setInterval(() => {
            fetchTLEs().then(setTLEs);
        }, REACT_APP_TLE_FETCH_RATE);

        // clearing interval on component unmount
        return () => clearInterval(TLEIntervalId);
    }, []);
    let passages;
    if (TLEs) {

        let coordinates = TLEs.map(TLE => {
            return TLE.coordinates.map(coord => {
                let [lng, lat] = coord;
                return [lat, lng];
            });
        });
        passages = computeVisis(coordinates, STATIONS);
        console.log("les passages", passages);
    }

    // merging TLEData and data into single object
    let mergedData;
    if (data && TLEs && passages) {
        mergedData = {...data, TLEs, passages};
    } else if (!data && TLEs) {
        mergedData = {TLEs, passages};
    } else {
        mergedData = data;
    }

    return (
        <div className="App">
            <SatelliteMap data={mergedData} />
        </div>
    );
}

export default App;