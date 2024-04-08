import axios from "axios";
import { getGroundTracks, getMeanMotion } from "tle.js";
import haversine from "haversine-distance";
var tle = require("tle");

const SECONDS_PER_DAY = 86400;
const RADIUS = 2500.64; // tan(70 deg) * 408 * 6471 / (6878);
//const PARIS = {lat: -34.9285, lng: 138.6007, rad:RADIUS};
//16.3630° S, 12.2548
//const PARIS = {latitude: -26.36, longitude: 28.25, rad:RADIUS, name:"Paris", color:"rgba(255,0,0)"};
const PARIS = {
  latitude: -22.36,
  longitude: -43.25,
  radius: RADIUS,
  name: "Paris",
  color: "rgba(255,0,0)",
};
const MADRID = {
  latitude: 40.4168,
  longitude: -3.7038,
  radius: RADIUS,
  name: "Madrid",
  color: "rgb(183,0,255)",
};
//const MADRID = {latitude: 45, longitude: 63, rad:RADIUS, name:"Madrid", color:"rgb(183,0,255)"};
//const KIRIBATI = {lat: 15.2574, lng: -83.7806, rad:RADIUS};
//35.6764° N, 139.6500° E
//const KIRIBATI = {latitude: 36.6764, longitude: 139.65, rad:RADIUS, name:"Kiribati", color:"rgb(255,219,0)"};
const KIRIBATI = {
  latitude: 35,
  longitude: 140,
  radius: RADIUS - 100,
  name: "Kiribati",
  color: "rgb(255,219,0)",
};
export const STATIONS = [PARIS, MADRID, KIRIBATI];

export const fetchSatelliteData = async (nb_windows) => {
  try {
    const response = await axios.get(
      "https://random.outpace.fr/backend/iss/position",
    );
    let data = response.data;
    const url = nb_windows
      ? `https://random.outpace.fr/backend/iss/illumination?limit=${nb_windows}`
      : "https://random.outpace.fr/backend/iss/illumination";
    const responseIllum = await axios.get(url);
    const illuminations = responseIllum.data;
    data = data && illuminations ? { ...data, illuminations } : data;
    console.log(data);
    return data;
  } catch (error) {
    console.error(`Error fetching satellite data: ${error}`);
  }
};

function gentles() {
  const line1 =
    "1 00005U          62165.28495062  .00000023  00000-0  28098-4 0    00";
  const line2 =
    "2 00005  34.2682 348.7242 1859667 331.7664  19.3264 10.82419157    07";
  const line11 =
    "1 00006U          62165.28495062  .00000023  00000-0  35098-4 0    09";
  const line22 =
    "2 00006  61.7167 234.1326 1859667 331.7664  25.0560 10.82419157    03";
  return [
    { line1: line1, line2: line2 },
    { line1: line11, line2: line22 },
  ];

  //return "1 48274U 21035A   24086.51943654  .00001374  00000-0  17794-4 0  9990\n" +
  //    "2 48274  41.4649 228.3616 0009793 250.2407 109.7377 15.64042462166158";
}

export const fetchTLE = async (norad) => {
  try {
    let response;
    if (norad === 25544) {
      response = await axios.get(
        "https://api.wheretheiss.at/v1/satellites/25544/tles",
      );
      const tle = response.data;
      const header = tle.header;
      const line1 = tle.line1;
      const line2 = tle.line2;
      const tleStr = `${header}\n${line1}\n${line2}`;
      const meanMotion = getMeanMotion(tleStr);
      const orbDur = SECONDS_PER_DAY / meanMotion;
      const threeOrbitsArr = await getGroundTracks({
        tle: tleStr,
        stepMS: 1000,
        isLngLatFormat: false,
      });

      console.log("l'orbite de l'ISS", threeOrbitsArr);
      return {
        coordinates: threeOrbitsArr[1],
        next_orb: threeOrbitsArr[2],
        updated_at: Date.now(),
        orb_duration: orbDur,
      };
    } else {
      const response = await axios.get(
        `https://random.outpace.fr/backend/tle/norad/${norad}`,
      );
      const tle = response.data;
      const tleStr2 = tle.line1 + "\n" + tle.line2;
      const groundTracksData = await getGroundTracks({
        tle: tleStr2,
        stepMS: 1000,
        isLngLatFormat: false,
      });
      return {
        coordinates: groundTracksData[1],
        orb_duration: SECONDS_PER_DAY / getMeanMotion(tleStr2),
        updated_at: Date.now(),
        next_orb: groundTracksData[2],
      };
    }
  } catch (error) {
    console.error(`Error fetching satellite data: ${error}`);
  }
};

export const fetchTLEs = async (satellites) => {
  try {
    let threeOrbitsArrs = [];
    for (const satel of satellites) {
      const tleData = await fetchTLE(satel.norad);
      threeOrbitsArrs.push(tleData);
    }
    console.log("theArr", threeOrbitsArrs);
    return threeOrbitsArrs;
  } catch (error) {
    console.error(`Error fetching satellite data: ${error}`);
  }
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

export function formatIllumination(illumination) {
  const start = new Date(illumination[0]);
  const end = new Date(illumination[1]);
  let timeWindow = "";
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

  for (var i = 0; i < n; i++) {
    var angle = Math.PI * 2 * (i / n);
    var dx = radius * Math.cos(angle);
    var dy = radius * Math.sin(angle);

    var newLat = latitude + (dy / earthRadius) * (180 / Math.PI);
    var newLon =
      longitude +
      (dx / (earthRadius * Math.cos((newLat * Math.PI) / 180))) *
        (180 / Math.PI);

    points.push([newLat, newLon]);
  }

  return points;
}

export function findClosestIndexDist(arr, target) {
  let minDist = Infinity;
  let closestIndex = -1;

  for (let i = 0; i < arr.length; i++) {
    let dist = myHaversine(arr[i][0], arr[i][1], target[0], target[1]);
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
    let closestIndex = findClosestIndexDist(
      stations.map((station) => [station.latitude, station.longitude]),
      [satelCoords[i][0], satelCoords[i][1]],
    );
    closestIndicesDists.push(closestIndex);
  }

  return closestIndicesDists;
}

function myHaversine(lat1, lon1, lat2, lon2, unit = "m") {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "m") {
      dist = dist * 1609.344;
    }
    if (unit == "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
}

function findNextVis(arr, targets) {
  let targetSet = new Set();
  let targetIndex = new Map();
  let targetLatLng = new Map();
  let targetObj = new Map();
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < targets.length; j++) {
      if (targetSet.has(j)) continue;
      let distance = myHaversine(
        arr[i][0],
        arr[i][1],
        targets[j].latitude,
        targets[j].longitude,
      );
      if (distance / 1000 <= targets[j].radius) {
        targetSet.add(j);
        targetIndex.set(j, i);
        targetLatLng.set(j, arr[i]);
        targetObj.set(j, {
          distance: distance / 1000,
          latlng: arr[i],
          targetLatLng: targets[j],
        });
      }
    }
  }
  let result = [];
  targetSet.forEach((target) => {
    result.push({
      targetIndex: target,
      index: targetIndex.get(target),
      latlng: targetLatLng.get(target),
      obj: targetObj.get(target),
    });
  });
  return result;
}

export function computeVis(arrs, targets) {
  let visis = [];
  arrs.forEach((arr) => {
    visis.push(findNextVis(arr, targets));
  });
  return visis;
}

export function nextVisiWaitTime(currIndex, visiIndex, TLE) {
  return ((visiIndex - currIndex) / TLE.coordinates.length) * TLE.orb_duration;
}
