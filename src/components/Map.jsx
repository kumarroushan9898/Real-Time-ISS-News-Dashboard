import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom ISS Icon
const issIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [50, 30],
  iconAnchor: [25, 15],
  popupAnchor: [0, -15],
});

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);
  return null;
}

export default function Map({ positions, currentPosition }) {
  const center = currentPosition ? [currentPosition.lat, currentPosition.lng] : [0, 0];
  const path = positions.map(pos => [pos.lat, pos.lng]);

  return (
    <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {currentPosition && (
        <Marker position={[currentPosition.lat, currentPosition.lng]} icon={issIcon}>
          <Popup>
            <strong>ISS Current Location</strong><br/>
            Lat: {currentPosition.lat.toFixed(4)}<br/>
            Lng: {currentPosition.lng.toFixed(4)}
          </Popup>
        </Marker>
      )}
      <Polyline positions={path} color="red" weight={3} opacity={0.7} />
      <MapUpdater position={currentPosition} />
    </MapContainer>
  );
}
