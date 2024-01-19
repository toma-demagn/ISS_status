import axios from 'axios';
import {getGroundTracks} from "tle.js";

// Function to fetch satellite data
export const fetchSatelliteData = async() => {
    try {
        const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544');
        const data = response.data;

        // Retrieve TLE data
        const tle = (await fetchSatelliteTLE()).data;
        const header = tle.header;
        const line1 = tle.line1;
        const line2 = tle.line2;

        const tleStr = `${header}\n${line1}\n${line2}`;

        const threeOrbitsArr = await getGroundTracks({
            tle: tleStr,
            startTimeMS: tle.timestamp*1000,
            stepMS: 1000,
            isLngLatFormat: false,
        });
        data.threeOrbitsArr = threeOrbitsArr;
        console.log(data)
        return data;
    } catch (error) {
        console.error(`Error fetching satellite data: ${error}`);
    }
}


export const fetchSatelliteTLE = async() =>  {
    try {
        return await axios.get('https://api.wheretheiss.at/v1/satellites/25544/tles');
    } catch (error) {
        console.error(`Error fetching satellite data: ${error}`);
    }
}

