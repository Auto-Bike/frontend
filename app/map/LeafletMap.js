'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './LeafletMap.module.css';

// Fix Leaflet default icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create a different colored icon for the fixed position
const fixedPositionIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


// Component to show both current and fixed position markers
function MapMarkers ({ position, destinationPosition, showDestination }) {
  return (
    <>
      {/* Current position marker */}
      <Marker position={[position.lat, position.lng]} icon={defaultIcon}>
        <Popup>
          Current Location
          <br />
          Lat: {position.lat.toFixed(5)}
          <br />
          Lng: {position.lng.toFixed(5)}
        </Popup>
      </Marker>

      {/* Destination marker - only show if destination is set */}
      {showDestination && destinationPosition.lat !== null && destinationPosition.lng !== null && (
        <>
          <Marker position={[destinationPosition.lat, destinationPosition.lng]} icon={fixedPositionIcon}>
            <Popup>
              Destination
              <br />
              Lat: {destinationPosition.lat.toFixed(5)}
              <br />
              Lng: {destinationPosition.lng.toFixed(5)}
            </Popup>
          </Marker>
          :
          {/* /* Fallback straight line if no route available */}
          <Polyline
            positions={[
              [position.lat, position.lng],
              [destinationPosition.lat, destinationPosition.lng]
            ]}
            color="red"
            weight={3}
            opacity={0.7}
            dashArray="5, 10"
          />
        </>
      )}
    </>
  );
}

// Custom control component for centering the map
function CenterMapControl ({ position }) {
  const map = useMap();

  const centerMap = () => {
    map.setView([position.lat, position.lng], map.getZoom());
  };

  useEffect(() => {
    // Create a custom control
    const centerControl = L.Control.extend({
      options: {
        position: 'topright'
      },

      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', container);

        button.innerHTML = '⌖';
        button.title = 'Center on current location';
        button.className = styles.centerButton;

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        L.DomEvent.on(button, 'click', centerMap);

        return container;
      }
    });

    // Add the control to the map
    const control = new centerControl();
    map.addControl(control);

    // Clean up when component unmounts
    return () => {
      map.removeControl(control);
    };
  }, [map, position]);

  return null;
}


export default function LeafletMap ({ position, destinationPosition, showDestination }) {
  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapContainer}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapMarkers position={position} destinationPosition={destinationPosition} showDestination={showDestination} />
          <CenterMapControl position={position} />
        </MapContainer>
      </div>
    </div>
  );
} 