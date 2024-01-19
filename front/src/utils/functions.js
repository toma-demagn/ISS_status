import axios from 'axios';
import {getGroundTracks} from "tle.js";

export const fetchSatelliteData = async() => {
    try {
        const response = await axios.get('http://127.0.0.1:8000/iss/position');
        var data = response.data;
        const responseIllum = await axios.get('http://127.0.0.1:8000/iss/illumination');
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
            startTimeMS: tle.timestamp*1000,
            stepMS: 1000,
            isLngLatFormat: false,
        });
        return {"coordinates": threeOrbitsArr[1]};
    } catch (error) {
        console.error(`Error fetching satellite data: ${error}`);
    }
}
