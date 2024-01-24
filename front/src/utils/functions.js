import axios from 'axios';
import {getGroundTracks} from "tle.js";

export const fetchSatelliteData = async(nb_windows) => {
    try {
        const response = await axios.get('http://127.0.0.1:8000/iss/position');
        var data = response.data;
        const url = nb_windows
            ? `http://127.0.0.1:8000/iss/illumination?limit=${nb_windows}`
            : 'http://127.0.0.1:8000/iss/illumination';
        const responseIllum = await axios.get(url);
        const illuminations = responseIllum.data;
        data = data && illuminations ? {...data, illuminations} : data
        console.log(data);
        return data;
    } catch (error) {
        console.error(`Error fetching satellite data: ${error}`);
    }
}


export const fetchTLE = async() =>  {
    try {
        const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544/tles');
        const tle = response.data;
        const header = tle.header;
        const line1 = tle.line1;
        const line2 = tle.line2;
        const tleStr = `${header}\n${line1}\n${line2}`;
        const threeOrbitsArr = await getGroundTracks({
            tle: tleStr,
            stepMS: 1000,
            isLngLatFormat: false,
        });

        // getting the current time to store the last call's timestamp
        return {"coordinates": threeOrbitsArr[1], "next_orb": threeOrbitsArr[2], "updated_at": Date.now()};
    } catch (error) {
        console.error(`Error fetching satellite data: ${error}`);
    }
}


function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

export function formatIllumination(illumination) {
    const start = new Date(illumination[0]);
    const end = new Date(illumination[1]);
    let timeWindow = '';
    if (start.toDateString() === end.toDateString()) {
        // If the start and end are on the same day, show only the time
        timeWindow = `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
    } else {
        // If the start and end are on different days, show the full date and time
        timeWindow = `${formatDate(illumination[0])} - ${formatDate(illumination[1])}`;
    }
    return timeWindow;
}
