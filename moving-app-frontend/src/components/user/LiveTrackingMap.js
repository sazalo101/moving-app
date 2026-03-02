import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different markers
const createCustomIcon = (color, iconHtml) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="transform: rotate(45deg); font-size: 20px;">
        ${iconHtml}
      </div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const driverIcon = createCustomIcon('#2563eb', '🚗');
const pickupIcon = createCustomIcon('#10b981', '📍');
const dropoffIcon = createCustomIcon('#f97316', '🎯');

// Component to auto-fit map bounds
const FitBounds = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [positions, map]);
  
  return null;
};

// Component to animate driver marker movement
const AnimatedDriverMarker = ({ position, driverName }) => {
  const markerRef = useRef(null);
  const prevPositionRef = useRef(position);

  useEffect(() => {
    if (markerRef.current && prevPositionRef.current) {
      const marker = markerRef.current;
      const startLatLng = prevPositionRef.current;
      const endLatLng = position;
      
      // Animate smooth transition
      let start = null;
      const duration = 3000; // 3 seconds

      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        
        const lat = startLatLng[0] + (endLatLng[0] - startLatLng[0]) * progress;
        const lng = startLatLng[1] + (endLatLng[1] - startLatLng[1]) * progress;
        
        marker.setLatLng([lat, lng]);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
    
    prevPositionRef.current = position;
  }, [position]);

  return (
    <Marker 
      position={position} 
      icon={driverIcon}
      ref={markerRef}
    >
      <Popup>
        <div style={{ textAlign: 'center' }}>
          <strong style={{ fontSize: '16px' }}>🚗 {driverName}</strong>
          <p style={{ margin: '5px 0', color: '#10b981' }}>Driver on the way</p>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

const LiveTrackingMap = ({ driverLocation, pickupLocation, dropoffLocation, driverName = "Driver" }) => {
  // Parse coordinates
  const parseCoordinates = (coordString) => {
    if (!coordString) return null;
    const parts = coordString.split(',').map(c => parseFloat(c.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts;
    }
    return null;
  };

  const driverPos = parseCoordinates(driverLocation);
  const pickupPos = parseCoordinates(pickupLocation);
  const dropoffPos = parseCoordinates(dropoffLocation);

  // Default center if no coordinates
  const center = driverPos || pickupPos || [-1.286389, 36.817223]; // Nairobi default

  // Calculate positions for auto-fit
  const allPositions = [driverPos, pickupPos, dropoffPos].filter(pos => pos !== null);

  // Route line positions (driver to pickup to dropoff)
  const routePositions = [];
  if (driverPos) routePositions.push(driverPos);
  if (pickupPos) routePositions.push(pickupPos);
  if (dropoffPos) routePositions.push(dropoffPos);

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Auto-fit bounds */}
        <FitBounds positions={allPositions} />
        
        {/* Route line */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            color="#2563eb"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
        
        {/* Driver marker with animation */}
        {driverPos && (
          <AnimatedDriverMarker position={driverPos} driverName={driverName} />
        )}
        
        {/* Pickup location marker */}
        {pickupPos && (
          <Marker position={pickupPos} icon={pickupIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ fontSize: '16px' }}>📍 Pickup Location</strong>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>
                  {pickupPos[0].toFixed(4)}, {pickupPos[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Dropoff location marker */}
        {dropoffPos && (
          <Marker position={dropoffPos} icon={dropoffIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ fontSize: '16px' }}>🎯 Dropoff Location</strong>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>
                  {dropoffPos[0].toFixed(4)}, {dropoffPos[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
