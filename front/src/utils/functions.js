import stations from '../assets/stations.json';
import axios from "axios";
import { getGroundTracks, getMeanMotion } from "tle.js";
import haversine from "haversine-distance";
var tle = require("tle");

const SECONDS_PER_DAY = 86400;


export const STATIONS = stations;

const { REACT_APP_BACKEND_URL } = process.env;

export const fetchSatelliteData = async (nb_windows) => {
  try {
    const response = await axios.get(
      `${REACT_APP_BACKEND_URL}/iss/position`,
    );
    let data = response.data;
    const url = nb_windows
      ? `${REACT_APP_BACKEND_URL}/iss/illumination?limit=${nb_windows}`
      : `${REACT_APP_BACKEND_URL}/iss/illumination`;
    const responseIllum = await axios.get(url);
    const illuminations = responseIllum.data;
    data = data && illuminations ? { ...data, illuminations } : data;
    console.log(data);
    return data;
  } catch (error) {
    console.error(`Error fetching satellite data: ${error}`);
  }
};

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
        `${REACT_APP_BACKEND_URL}/tle/norad/${norad}`,
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
