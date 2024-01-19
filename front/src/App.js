import React, { useState, useEffect } from 'react';
import './App.css';
import SatelliteMap from './components/satellite_map';
import {fetchSatelliteData, fetchTLE} from "./utils/functions";

function App() {
    const [data, setData] = useState(null);
    const [TLEData, setTLEData] = useState(null);

    useEffect(() => {
        // Fetch satellite data immediately and update state
        fetchSatelliteData().then(setData);

        // Set up interval to fetch satellite data every 10 seconds
        const intervalId = setInterval(() => {
            fetchSatelliteData().then(setData);
        }, 10000); // 10000 milliseconds

        // Clear interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        // Fetch TLE data immediately and update state
        fetchTLE().then(setTLEData);

        // Set up interval to fetch TLE data every hour
        const TLEIntervalId = setInterval(() => {
            fetchTLE().then(setTLEData);
        }, 3600000); // 3600000 milliseconds

        // Clear interval on component unmount
        return () => clearInterval(TLEIntervalId);
    }, []);

    // Merge TLEData into data
    const mergedData = data && TLEData ? {...data, TLEData} : data;

    return (
        <div className="App">
            {mergedData && <SatelliteMap data={mergedData} />}
        </div>
    );
}

export default App;
