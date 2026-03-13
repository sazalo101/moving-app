import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import API_ENDPOINTS from '../../config/api';
import './DriversNearMe.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom driver marker icon
const createDriverIcon = (color = '#2563eb') => {
  return L.divIcon({
    className: 'driver-marker',
    html: `<div style="
      background-color: ${color};
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    ">
      🚗
    </div>`,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
  });
};

// Auto-fit map bounds
const FitBounds = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
    }
  }, [positions, map]);
  
  return null;
};

const DriversNearMe = () => {
  const [drivers, setDrivers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedDistance, setSelectedDistance] = useState(10); // km
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Get user's current location
  useEffect(() => {
    const getUserLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLoc = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation(userLoc);
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Use default location if permission denied
            setUserLocation({
              latitude: -1.2865,
              longitude: 36.8172, // Nairobi, Kenya
            });
          }
        );
      }
    };

    getUserLocation();
  }, []);

  // Fetch available drivers
  const fetchAvailableDrivers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.AVAILABLE_ORDERS());
      const data = await response.json();

      if (response.ok && data.orders) {
        // Extract unique drivers with their locations
        const driversMap = new Map();

        data.orders.forEach((order) => {
          if (order.driver_id && order.live_location) {
            const [lat, lng] = order.live_location.split(',').map(Number);

            if (!driversMap.has(order.driver_id)) {
              driversMap.set(order.driver_id, {
                driver_id: order.driver_id,
                driver_name: order.driver_name || 'Unknown Driver',
                driver_phone: order.driver_phone,
                vehicle_type: order.vehicle_type,
                vehicle_color: order.vehicle_color,
                license_plate: order.license_plate,
                is_verified: order.is_verified,
                latitude: lat,
                longitude: lng,
                rating: order.driver_rating || 4.5,
                completedJobs: order.completed_jobs || 0,
                status: 'available',
              });
            }
          }
        });

        setDrivers(Array.from(driversMap.values()));
        setError(null);
      } else {
        setDrivers([]);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchAvailableDrivers();

    if (autoRefresh) {
      const interval = setInterval(fetchAvailableDrivers, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Filter drivers based on criteria
  useEffect(() => {
    let filtered = drivers;

    // Filter by rating
    if (selectedRating > 0) {
      filtered = filtered.filter((d) => d.rating >= selectedRating);
    }

    // Filter by distance if user location exists
    if (userLocation && selectedDistance > 0) {
      filtered = filtered.filter((driver) => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          driver.latitude,
          driver.longitude
        );
        return distance <= selectedDistance;
      });
    }

    setFilteredDrivers(filtered);
  }, [drivers, selectedRating, selectedDistance, userLocation]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Prepare marker positions for map fitting
  const markerPositions = filteredDrivers.map((d) => [d.latitude, d.longitude]);
  if (userLocation) {
    markerPositions.unshift([userLocation.latitude, userLocation.longitude]);
  }

  return (
    <div className="drivers-near-me">
      {/* Header */}
      <div className="drivers-header">
        <h1 className="drivers-title">🗺️ Available Drivers Near You</h1>
        <p className="drivers-subtitle">
          {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} available in your area
        </p>
      </div>

      {/* Controls */}
      <div className="drivers-controls">
        <div className="control-group">
          <label className="control-label">Rating</label>
          <select
            className="control-select"
            value={selectedRating}
            onChange={(e) => setSelectedRating(Number(e.target.value))}
          >
            <option value={0}>All Ratings</option>
            <option value={4.5}>⭐ 4.5+ Stars</option>
            <option value={4}>⭐ 4.0+ Stars</option>
            <option value={3.5}>⭐ 3.5+ Stars</option>
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Distance (km)</label>
          <select
            className="control-select"
            value={selectedDistance}
            onChange={(e) => setSelectedDistance(Number(e.target.value))}
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={20}>Within 20 km</option>
            <option value={50}>Within 50 km</option>
            <option value={999}>All Distances</option>
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            {' '}Auto Refresh
          </label>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchAvailableDrivers}
          disabled={loading}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh Now'}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Map Section */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Finding drivers near you...</p>
        </div>
      ) : (
        <div className="drivers-content">
          {/* Map */}
          <div className="drivers-map">
            {userLocation && (
              <MapContainer
                center={[userLocation.latitude, userLocation.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />

                {/* User location marker */}
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                  })}
                >
                  <Popup>
                    <div className="popup-content">
                      <strong>📍 Your Location</strong>
                    </div>
                  </Popup>
                </Marker>

                {/* Driver markers */}
                {filteredDrivers.map((driver) => (
                  <Marker
                    key={driver.driver_id}
                    position={[driver.latitude, driver.longitude]}
                    icon={createDriverIcon('#2563eb')}
                  >
                    <Popup>
                      <div className="driver-popup">
                        <p className="driver-name">{driver.driver_name}</p>
                        <p className="driver-vehicle">
                          {driver.vehicle_color} {driver.vehicle_type}
                        </p>
                        <p className="driver-plate">{driver.license_plate}</p>
                        <p className="driver-rating">
                          ⭐ {driver.rating} ({driver.completedJobs} jobs)
                        </p>
                        {driver.is_verified && (
                          <p className="driver-verified">✓ Verified</p>
                        )}
                        <button className="popup-book-btn">Book Now</button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Service radius circle */}
                {userLocation && selectedDistance < 999 && (
                  <CircleMarker
                    center={[userLocation.latitude, userLocation.longitude]}
                    radius={selectedDistance / 0.111319} // Convert km to map units
                    fill={true}
                    fillColor="#3b82f6"
                    fillOpacity={0.1}
                    color="#3b82f6"
                    weight={2}
                    dashArray="5, 5"
                  />
                )}

                {/* Fit map bounds */}
                {markerPositions.length > 0 && (
                  <FitBounds positions={markerPositions} />
                )}
              </MapContainer>
            )}
          </div>

          {/* Driver List */}
          <div className="drivers-list">
            <h2 className="list-title">Driver List</h2>

            {filteredDrivers.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🚗</p>
                <p className="empty-text">No drivers available in your area</p>
                <p className="empty-subtext">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="driver-cards">
                {filteredDrivers.map((driver) => {
                  const distance = userLocation
                    ? calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        driver.latitude,
                        driver.longitude
                      ).toFixed(1)
                    : 'N/A';

                  return (
                    <div key={driver.driver_id} className="driver-card">
                      <div className="card-header">
                        <div className="driver-avatar">
                          <span className="avatar-icon">👤</span>
                        </div>
                        <div className="driver-basic-info">
                          <h3 className="driver-card-name">
                            {driver.driver_name}
                            {driver.is_verified && (
                              <span className="verified-badge">✓</span>
                            )}
                          </h3>
                          <p className="driver-card-vehicle">
                            {driver.vehicle_color} {driver.vehicle_type}
                          </p>
                        </div>
                      </div>

                      <div className="card-info">
                        <div className="info-row">
                          <span className="info-label">Distance:</span>
                          <span className="info-value">{distance} km</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Rating:</span>
                          <span className="info-value">
                            ⭐ {driver.rating} ({driver.completedJobs} trips)
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Plate:</span>
                          <span className="info-value plate">{driver.license_plate}</span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <a href={`tel:${driver.driver_phone}`} className="action-btn call-btn">
                          📞 Call
                        </a>
                        <button className="action-btn book-btn">
                          🚗 Book Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversNearMe;
