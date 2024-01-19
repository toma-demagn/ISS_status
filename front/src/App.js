import React, { useState, useEffect } from 'react';
import './App.css';
import SatelliteMap from './components/satellite_map';
import {fetchSatelliteData} from "./utils/functions";

function App() {
    const [data, setData] = useState(null);

    useEffect(() => {
        // Fetch satellite data immediately and update state
        fetchSatelliteData().then(setData);

        // Set up interval to fetch satellite data every 10 seconds
        const intervalId = setInterval(() => {
            fetchSatelliteData().then(setData);
        }, 10000); // 10000 milliseconds = 10 seconds

        // Clear interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="App">
            {data && <SatelliteMap data={data} />} {}
        </div>
    );
}

export default App;
