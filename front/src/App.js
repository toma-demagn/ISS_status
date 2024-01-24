import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import './App.css';
import SatelliteMap from './components/satellite_map';
import {fetchSatelliteData, fetchTLE} from "./utils/functions";

// loading .env variables
const { REACT_APP_SATELLITE_FETCH_RATE, REACT_APP_TLE_FETCH_RATE } = process.env;

function App() {
    const [data, setData] = useState(null);
    const [TLEData, setTLEData] = useState(null);

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
        fetchTLE().then(setTLEData);

        // regularly fetching TLE data at the rate given in .env
        const TLEIntervalId = setInterval(() => {
            fetchTLE().then(setTLEData);
        }, REACT_APP_TLE_FETCH_RATE);

        // clearing interval on component unmount
        return () => clearInterval(TLEIntervalId);
    }, []);

    // merging TLEData and data into single object
    let mergedData;
    if (data && TLEData) {
        mergedData = {...data, TLEData};
    } else if (!data && TLEData) {
        mergedData = {TLEData};
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