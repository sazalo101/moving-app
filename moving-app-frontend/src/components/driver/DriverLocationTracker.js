import React, { useState, useEffect, useRef } from 'react';
import API_ENDPOINTS from '../../config/api';
import './DriverLocationTracker.css';

const DriverLocationTracker = ({ driverId }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Check if geolocation is supported
  const isGeolocationSupported = 'geolocation' in navigator;

  // Request location permission
  const requestLocationPermission = async () => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by your browser');
      return false;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(result.state);
      
      result.onchange = () => {
        setLocationPermission(result.state);
      };
      
      return result.state === 'granted' || result.state === 'prompt';
    } catch (err) {
      // Some browsers don't support permissions API
      return true;
    }
  };

  // Get current position
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString()
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Send location to backend
  const sendLocationToBackend = async (latitude, longitude) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_DRIVER_LOCATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: driverId,
          live_location: `${latitude},${longitude}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      setLastUpdate(new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error('Error updating location:', err);
      setError('Failed to send location to server');
    }
  };

  // Start tracking
  const startTracking = async () => {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      setError('Location permission is required');
      return;
    }

    try {
      // Get initial position
      const location = await getCurrentPosition();
      setCurrentLocation(location);
      await sendLocationToBackend(location.latitude, location.longitude);
      
      setIsTracking(true);
      setError(null);

      // Watch position for continuous updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString()
          };
          setCurrentLocation(newLocation);
        },
        (error) => {
          console.error('Error watching position:', error);
          setError(`Location error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );

      // Send updates to backend every 10 seconds
      updateIntervalRef.current = setInterval(async () => {
        try {
          const location = await getCurrentPosition();
          await sendLocationToBackend(location.latitude, location.longitude);
        } catch (err) {
          console.error('Error in periodic update:', err);
        }
      }, 10000);

    } catch (err) {
      setError(`Failed to get location: ${err.message}`);
      setIsTracking(false);
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    setIsTracking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="location-tracker-card">
      <div className="tracker-header">
        <h3 className="tracker-title">📍 GPS Location Tracker</h3>
        <div className="tracker-status">
          {isTracking ? (
            <span className="status-badge active">
              <span className="status-pulse"></span>
              Live Tracking Active
            </span>
          ) : (
            <span className="status-badge inactive">Tracking Inactive</span>
          )}
        </div>
      </div>

      {!isGeolocationSupported && (
        <div className="tracker-alert error">
          ❌ Your browser doesn't support geolocation
        </div>
      )}

      {error && (
        <div className="tracker-alert error">
          ⚠️ {error}
        </div>
      )}

      {locationPermission === 'denied' && (
        <div className="tracker-alert warning">
          🔒 Location permission denied. Please enable location access in your browser settings.
        </div>
      )}

      <div className="tracker-info">
        {currentLocation ? (
          <div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Latitude:</span>
                <span className="info-value">{currentLocation.latitude.toFixed(6)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Longitude:</span>
                <span className="info-value">{currentLocation.longitude.toFixed(6)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Accuracy:</span>
                <span className="info-value">{currentLocation.accuracy.toFixed(0)}m</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Backend Update:</span>
                <span className="info-value">{formatDateTime(lastUpdate)}</span>
              </div>
            </div>
            <div className="coordinates-display">
              <span className="coordinates-label">Full Coordinates:</span>
              <code className="coordinates-code">
                {currentLocation.latitude},{currentLocation.longitude}
              </code>
            </div>
          </div>
        ) : (
          <p className="no-location">No location data available</p>
        )}
      </div>

      <div className="tracker-actions">
        {!isTracking ? (
          <button 
            onClick={startTracking} 
            className="tracker-button start"
            disabled={!isGeolocationSupported || locationPermission === 'denied'}
          >
            🚀 Start Live Tracking
          </button>
        ) : (
          <button 
            onClick={stopTracking} 
            className="tracker-button stop"
          >
            ⏹️ Stop Tracking
          </button>
        )}
      </div>

      <div className="tracker-info-box">
        <p className="info-box-title">ℹ️ How it works:</p>
        <ul className="info-box-list">
          <li>Click "Start Live Tracking" to share your real-time location</li>
          <li>Your location is updated every 10 seconds automatically</li>
          <li>Customers can see your position on their map in real-time</li>
          <li>Keep this page open while delivering orders</li>
        </ul>
      </div>
    </div>
  );
};

export default DriverLocationTracker;
