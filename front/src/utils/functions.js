import axios from 'axios';
import {getGroundTracks, getMeanMotion} from "tle.js";
import haversine from 'haversine-distance';
var TLE = require('tle');


const SECONDS_PER_DAY = 86400;
const RADIUS = 2500.64; // tan(70 deg) * 408 * 6471 / (6878);
//const PARIS = {lat: -34.9285, lng: 138.6007, rad:RADIUS};
//16.3630° S, 12.2548
const PARIS = {lat: -26.36, lng: 28.25, rad:RADIUS, name:"Paris"};
const MADRID = {lat: 40.4168, lng: -3.7038, rad:RADIUS, name:"Madrid"};
//const KIRIBATI = {lat: 15.2574, lng: -83.7806, rad:RADIUS};
//35.6764° N, 139.6500° E
const KIRIBATI = {lat: 36.6764, lng: 139.65, rad:RADIUS, name:"Kiribati"};
export const STATIONS = [PARIS, MADRID, KIRIBATI];


export const fetchSatelliteData = async(nb_windows) => {
    try {
        const response = await axios.get('https://random.outpace.fr/backend/iss/position');
        let data = response.data;
        const url = nb_windows
            ? `https://random.outpace.fr/backend/iss/illumination?limit=${nb_windows}`
            : 'https://random.outpace.fr/backend/iss/illumination';
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

function gentles() {
    const line1 = "1 00005U          62165.28495062  .00000023  00000-0  28098-4 0    00"
    const line2 = "2 00005  34.2682 348.7242 1859667 331.7664  19.3264 10.82419157    07"
    const line11 = '1 00006U          62165.28495062  .00000023  00000-0  35098-4 0    09'
    const line22 = '2 00006  61.7167 234.1326 1859667 331.7664  25.0560 10.82419157    03'
    return [{"line1": line1, "line2": line2}, {"line1": line11, "line2": line22}];

    //return "1 48274U 21035A   24086.51943654  .00001374  00000-0  17794-4 0  9990\n" +
    //    "2 48274  41.4649 228.3616 0009793 250.2407 109.7377 15.64042462166158";
}


export const fetchTLEs = async() =>  {
    try {
        const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544/tles');
        const tle = response.data;
        const header = tle.header;
        const line1 = tle.line1;
        const line2 = tle.line2;
        const tleStr = `${header}\n${line1}\n${line2}`;
        const meanMotion = getMeanMotion(tleStr);
        const orbDur = SECONDS_PER_DAY/meanMotion;
        const threeOrbitsArr = await getGroundTracks({
            tle: tleStr,
            stepMS: 1000,
            isLngLatFormat: false,
        });
        let threeOrbitsArrs = [];
        const lesTLEs = gentles();
        for (const TLE of lesTLEs) {
            const tleStr2 = TLE.line1 + "\n" + TLE.line2;
            const groundTracksData = await getGroundTracks({
                tle: tleStr2,
                stepMS: 1000,
                isLngLatFormat: false,
            });
            threeOrbitsArrs.push({"coordinates": groundTracksData[1], "orb_duration":
                    SECONDS_PER_DAY/getMeanMotion(tleStr2)});
        }
        threeOrbitsArrs.unshift({"coordinates": threeOrbitsArr[1], "next_orb": threeOrbitsArr[2],
            "updated_at": Date.now(), "orb_duration":orbDur});
        // getting the current time to store the last call's timestamp
        console.log("theArr", threeOrbitsArrs)
        return threeOrbitsArrs;
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

export function generatePoints(latitude, longitude, radius, n) {
    var points = [];
    var earthRadius = 6371; // Earth's radius in km

    for(var i = 0; i < n; i++) {
        var angle = (Math.PI * 2) * (i / n);
        var dx = radius * Math.cos(angle);
        var dy = radius * Math.sin(angle);

        var newLat = latitude + (dy / earthRadius) * (180 / Math.PI);
        var newLon = longitude + (dx / (earthRadius * Math.cos(newLat * Math.PI/180))) * (180 / Math.PI);

        points.push([newLat, newLon]);
    }

    return points;
}

export function findClosestIndexDist(arr, target) {
    let minDist = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < arr.length; i++) {
        let dist = haversine(arr[i], target);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    }

    return [closestIndex, minDist];
}

export function findClosestIndicesDists(satelCoords, stations) {
    let closestIndicesDists = [];

    for (let i = 0; i < satelCoords.length; i++) {
        let closestIndex = findClosestIndexDist(stations, satelCoords[i]);
        closestIndicesDists.push(closestIndex);
    }

    return closestIndicesDists;
}

function findNextVisis(arr, targets) {
    let targetSet = new Set();
    let targetIndex = new Map();
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < targets.length; j++) {
            if (targetSet.has(j)) continue;
            let distance = haversine(arr[i], targets[j]);
            if (distance/1000 <= targets[j].rad) {
                targetSet.add(j);
                targetIndex.set(j, i);
            }
        }
    }
    let result = [];
    targetSet.forEach(target => {
        result.push({"targetIndex": target, "index": targetIndex.get(target)});
    });
    return result;
}

export function computeVisis(arrs, targets) {
    let visis = [];
    arrs.forEach((arr) => {
        visis.push(findNextVisis(arr, targets));
    });
    return visis;
}

export function nextVisiWaitTime(currIndex, visiIndex, TLE) {
    return (visiIndex - currIndex)/TLE.coordinates.length * TLE.orb_duration;
}


