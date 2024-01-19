import {GeoJson, Map, Marker, Overlay} from "pigeon-maps";
import React, {useState} from 'react';

import markerImageMoon from '../assets/iss_moon.png';
import markerImageSun from '../assets/iss_sun.png';

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
    const latitude = data.latitude;
    const longitude = data.longitude;
    const isIlluminated = data.is_illuminated;
    const pathImage = isIlluminated ? markerImageMoon : markerImageSun;
    const [showPopup, setShowPopup] = useState(false);
    const TlEData = data.TLEData;
    // The map function is used to reverse lats and lngs
    const coordinates = TlEData ? TlEData.coordinates.map(([lng, lat]) => [lat, lng]) : [];
    const screenWidth = window.innerWidth;
    const zoomValue = Math.log2(screenWidth / TILE_SIZE);
    const illuminations = data.illuminations;
    return (
        <Map height={screenWidth * HEIGHT_RATIO}
             width={screenWidth}
             defaultCenter={[0, 0]}
             defaultZoom={zoomValue}
             provider={mapboxProvider}>
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
                        {illuminations ? (
                            <pre>{illuminations.join('\n')}</pre>
                        ) : (
                            <p>No illuminations registered yet</p>
                        )}
                    </div>
                </Overlay>
            )}

        </Map>
    );
}

export default SatelliteMap;
