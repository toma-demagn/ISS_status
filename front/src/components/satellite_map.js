import {GeoJson, Map, Marker, Overlay} from "pigeon-maps";
import React, {useState} from 'react';
import GeoJSONTerminator from "@webgeodatavore/geojson.terminator";


import markerImageMoon from '../assets/iss_moon.png';
import markerImageSun from '../assets/iss_sun.png';
import {formatIllumination} from "../utils/functions";

// constants to help draw the map
const TILE_SIZE = 256;
const ISS_ORBIT_INCLINATION_DEG = 51.6
// this HEIGHT_RATIO takes into accound the orbit inclination in order to crop out some area that the ISS doesn't cover
const HEIGHT_RATIO = ISS_ORBIT_INCLINATION_DEG / 90.0;

const ISS_ORBIT_TIME_MS = 324000000;

const {REACT_APP_MAPBOX_ACCESS_TOKEN} = process.env;

function mapboxProvider(x, y, z, dpr) {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}?access_token=${REACT_APP_MAPBOX_ACCESS_TOKEN}`;
}

function SatelliteMap({data}) {
    let latitude = data?.latitude;
    let longitude = data?.longitude;

    // placing ISS at null island if lat,lng are not set
    latitude = latitude || 0;
    longitude = longitude || 0;

    const isIlluminated = data?.is_illuminated;

    // setting the image accoring to the illumination status of the ISS
    const pathImage = isIlluminated ? markerImageSun : markerImageMoon;
    const [showPopup, setShowPopup] = useState(false);

    const TLEData = data?.TLEData;

    // reversing lng, and lat in the array
    let coordinates = TLEData ? TLEData.coordinates.map(([lng, lat]) => [lat, lng]) : [];

    const updated_at = TLEData?.updated_at || Date.now();
    // when the ISS crossed the +180 longitude, we take the second orbit retrived in the call to fetchTLEData
    // otherwise, the position of the ISS appeared out of the orbit line until next fetchTLEData call
    if (longitude < 0 && Date.now() - updated_at > 180 * ISS_ORBIT_TIME_MS/2 / (longitude + 180)) {
        console.log("Using TLE of the next orbit")
        coordinates = TLEData ? TLEData.next_orb.map(([lng, lat]) => [lat, lng]) : [];
    }

    // adjusting the zoomValue according to screeWidth to TILE_SIZE ratio, with 2^zoomValue = screenWidth/TILE_SIZE
    // see https://evilmartians.com/chronicles/how-to-build-a-better-react-map-with-pigeon-maps-and-mapbox for ref
    const screenWidth = window.innerWidth;
    const zoomValue = Math.log2(screenWidth / TILE_SIZE);

    const illuminations = data?.illuminations;

    // getting the night area for adding shade to the map
    const nightAreaGeoJson = new GeoJSONTerminator();

    return (
        <Map height={screenWidth * HEIGHT_RATIO}
             width={screenWidth}
             defaultCenter={[0, 0]}
             defaultZoom={zoomValue}
             provider={mapboxProvider}>

            <GeoJson
                data={nightAreaGeoJson}
                styleCallback={() => ({ fill: 'rgba(0, 0, 0, 0.5)' })}
            />


            {TLEData && (
                <GeoJson
                    data={{
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates,
                            },
                            properties: {
                                prop0: 'value0',
                                prop1: 0.0,
                            },
                        },
                        ],
                    }}
                    styleCallback={(feature, hover) => {
                        if (feature.geometry.type === 'LineString') {
                            return {strokeWidth: '2', stroke: 'black'}
                        }
                        return {fill: '#d4e6ec99', strokeWidth: '1', stroke: 'white', r: '20'}
                    }}
                />
            )}

            {/*marker to show popup on mouse over*/}
            <Marker
                anchor={[latitude, longitude]}
                onMouseOver={() => setShowPopup(true)}
                onMouseOut={() => setShowPopup(false)}
                width={window.innerWidth * 0.08}
                height={window.innerHeight * 0.08}
            />
            {/*marker with the image of the iss at the right position*/}
            <Marker
                anchor={[latitude, longitude]}
            >
                <img src={pathImage} alt="marker" className="imageISS"/>
            </Marker>

            {/*creating the popup with formatted illumination string*/}
            {showPopup && (
                <Overlay anchor={[latitude, longitude]} offset={[120, 79]}>
                    <div style={{background: 'white', borderRadius: '10px', padding: '10px'}}>
                        {showPopup && (
                            <Overlay anchor={[latitude, longitude]} offset={[120, 79]}>
                                <div style={{background: 'white', borderRadius: '10px', padding: '10px'}}>
                                    {illuminations && illuminations.length > 0 ? (
                                        <>
                                            <h2>{`Last ${illuminations.length} illuminations:`}</h2>
                                            {illuminations.map((illumination, index) => (
                                                <pre key={index}>{formatIllumination(illumination)}</pre>
                                            ))}
                                        </>
                                    ) : (
                                        <p>No illuminations registered yet</p>
                                    )}
                                </div>
                            </Overlay>
                        )}
                    </div>
                </Overlay>
            )}


        </Map>
    );
}

export default SatelliteMap;
