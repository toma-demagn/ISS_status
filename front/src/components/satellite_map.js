import {GeoJson, Map, Marker, Overlay} from "pigeon-maps";
import React, {useState} from 'react';
import GeoJSONTerminator from "@webgeodatavore/geojson.terminator";


import markerImageMoon from '../assets/iss_moon.png';
import markerImageSun from '../assets/iss_sun.png';
import {formatIllumination} from "../utils/functions";

const TILE_SIZE = 256;
const ISS_ORBIT_INCLINATION_DEG = 51.6
const HEIGHT_RATIO = ISS_ORBIT_INCLINATION_DEG / 90.0;

// Mapbox access token
const {REACT_APP_MAPBOX_ACCESS_TOKEN} = process.env;

// Mapbox provider function
function mapboxProvider(x, y, z, dpr) {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}?access_token=${REACT_APP_MAPBOX_ACCESS_TOKEN}`;
}

function SatelliteMap({data}) {
    let latitude = data?.latitude;
    let longitude = data?.longitude;

    // If latitude and longitude are not set, default them to 0
    latitude = latitude || 0;
    longitude = longitude || 0;
    const isIlluminated = data?.is_illuminated;
    const pathImage = isIlluminated ? markerImageSun : markerImageMoon;
    console.log(data, "illum", isIlluminated)
    const [showPopup, setShowPopup] = useState(false);
    const TlEData = data?.TLEData;
    // The map function is used to reverse lats and lngs
    const coordinates = TlEData ? TlEData.coordinates.map(([lng, lat]) => [lat, lng]) : [];
    const screenWidth = window.innerWidth;
    const zoomValue = Math.log2(screenWidth / TILE_SIZE);
    const illuminations = data?.illuminations;

    var nightAreaGeoJson = new GeoJSONTerminator();

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


            {TlEData && (
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
            <Marker
                anchor={[latitude, longitude]}
                onMouseOver={() => setShowPopup(true)}
                onMouseOut={() => setShowPopup(false)}
                width={window.innerWidth * 0.08}
                height={window.innerHeight * 0.08}
            />
            <Marker
                anchor={[latitude, longitude]}
            >
                <img src={pathImage} alt="marker" className="imageISS"/>
            </Marker>

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
