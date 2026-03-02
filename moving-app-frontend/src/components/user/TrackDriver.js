import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API_ENDPOINTS from '../../config/api';
import LiveTrackingMap from './LiveTrackingMap';
import './TrackDriver.css';

const TrackDriver = () => {
  const { bookingId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.TRACK_DRIVER(bookingId));
        const data = await response.json();
        
        if (response.ok && data.live_location) {
          setBookingDetails(data);
          setTrackingData({
            location: data.live_location,
            heading: 45,
            speed: 35,
            last_updated: new Date().toISOString()
          });
          setLoading(false);
          setError(null);
        } else {
          // If no live location, show error
          setError('Driver location not available');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching tracking data:', err);
        setError('Failed to load tracking information');
        setLoading(false);
      }
    };

    // Initial fetch
    fetchTrackingData();

    // Real-time polling every 5 seconds when live tracking is enabled
    if (isLiveTracking) {
      pollingIntervalRef.current = setInterval(() => {
        fetchTrackingData();
      }, 5000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [bookingId, isLiveTracking]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleLiveTracking = () => {
    setIsLiveTracking(!isLiveTracking);
  };

  const calculateDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return 0;
    const [lat1, lon1] = loc1.split(',').map(Number);
    const [lat2, lon2] = loc2.split(',').map(Number);
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  return (
    <div className="track-driver-container">
      <div>
        <Link to="/user/orders" className="back-link">
          ← Back to Orders
        </Link>
      </div>
      
      <h1 className="track-driver-title">Track Driver</h1>
      
      {loading ? (
        <div className="loading-card">
          <p>Loading tracking information...</p>
        </div>
      ) : error ? (
        <div className="error-alert">
          {error}
        </div>
      ) : (
        <div className="track-grid">
          <div>
            <div className="booking-details-card">
              <h2 className="booking-details-title">Booking Details</h2>
              
              <div className="details-list">
                <p className="detail-item">
                  <span className="detail-label">Booking ID:</span> #{bookingDetails.booking_id}
                </p>
                <p className="detail-item">
                  <span className="detail-label">Status:</span> {bookingDetails.status}
                </p>
                <p className="detail-item">
                  <span className="detail-label">From:</span> {bookingDetails.pickup_location}
                </p>
                <p className="detail-item">
                  <span className="detail-label">To:</span> {bookingDetails.dropoff_location}
                </p>
                
                <div className="driver-section">
                  <h3 className="driver-section-title">Driver Information</h3>
                  <p className="detail-item">
                    <span className="detail-label">Name:</span> {bookingDetails.driver_name}
                    {bookingDetails.is_verified ? (
                      <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#10b981', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>✓ VERIFIED</span>
                    ) : (
                      <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#ef4444', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>UNVERIFIED</span>
                    )}
                  </p>
                  <p className="detail-item">
                    <span className="detail-label">Phone:</span> {bookingDetails.driver_phone}
                  </p>
                  <p className="detail-item">
                    <span className="detail-label">Vehicle:</span> {bookingDetails.vehicle_color} {bookingDetails.vehicle_type}
                  </p>
                  <p className="detail-item">
                    <span className="detail-label">License:</span> {bookingDetails.license_plate}
                  </p>
                </div>
                
                <button className="action-button call-button">
                  Call Driver
                </button>
                
                <button className="action-button message-button">
                  Message Driver
                </button>
              </div>
            </div>
            
            <div className="fare-card">
              <h2 className="fare-title">Fare Estimate</h2>
              <div className="fare-row">
                <span>Base fare</span>
                <span>KSh 200</span>
              </div>
              <div className="fare-row">
                <span>Distance (5.3 km)</span>
                <span>KSh 350</span>
              </div>
              <div className="fare-row">
                <span>Time</span>
                <span>KSh 100</span>
              </div>
              <div className="fare-row fare-total">
                <span>Total</span>
                <span>KSh 650</span>
              </div>
              <p className="payment-method">Paid via M-PESA</p>
            </div>
          </div>
          
          <div>
            <div className="location-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="location-title">Driver Location - Real-Time GPS Tracking</h2>
                <button 
                  onClick={toggleLiveTracking}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isLiveTracking ? '#10b981' : '#6b7280',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isLiveTracking ? '🟢 Live' : '⏸️ Paused'}
                </button>
              </div>
              {trackingData && trackingData.location ? (
                <div>
                  <div style={{ height: '450px', marginBottom: '16px' }}>
                    <LiveTrackingMap
                      driverLocation={trackingData.location}
                      pickupLocation={bookingDetails?.pickup_coordinates || trackingData.location}
                      dropoffLocation={bookingDetails?.dropoff_coordinates}
                      driverName={bookingDetails?.driver_name || 'Driver'}
                    />
                  </div>
                  <div className="location-meta">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p className="last-updated">
                          🕐 Last updated: {formatDateTime(trackingData.last_updated)}
                          {isLiveTracking && <span style={{ marginLeft: '8px', color: '#10b981' }}>• Auto-refreshing every 5s</span>}
                        </p>
                        <p className="driver-status">🚗 Driver is on the way</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
                          📍 Current coordinates
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '13px', fontFamily: 'monospace', color: '#2563eb' }}>
                          {trackingData.location}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="progress-steps">
                    <div className="progress-step">
                      <div className="step-icon">1</div>
                      <div className="step-content">
                        <p className="step-title">Driver accepted your booking</p>
                        <p className="step-time">10:32 AM</p>
                      </div>
                    </div>
                    <div className="progress-step">
                      <div className="step-icon">2</div>
                      <div className="step-content">
                        <p className="step-title">Driver is on the way</p>
                        <p className="step-time">10:36 AM</p>
                      </div>
                    </div>
                    <div className="progress-step inactive">
                      <div className="step-icon">3</div>
                      <div className="step-content">
                        <p className="step-title">Arriving at Junction Mall</p>
                        <p className="step-time">Estimated: 10:45 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Location data unavailable.</p>
              )}
            </div>
            
            <div className="traffic-card">
              <h2 className="traffic-title">Trip Information</h2>
              {trackingData && bookingDetails && (
                <div>
                  <div className="traffic-details">
                    <p style={{ marginBottom: '12px' }}>
                      <strong>📏 Distance to pickup:</strong> {calculateDistance(trackingData.location, bookingDetails.pickup_coordinates || trackingData.location)} km
                    </p>
                    <p style={{ marginBottom: '12px' }}>
                      <strong>⏱️ Estimated arrival:</strong> 10-15 minutes
                    </p>
                    <p style={{ marginBottom: '12px' }}>
                      <strong>🚦 Current status:</strong> <span style={{ color: '#10b981', fontWeight: '600' }}>En route</span>
                    </p>
                  </div>
                  <div className="traffic-alert" style={{ marginTop: '16px' }}>
                    <p className="traffic-heading">💡 Live Tracking Active</p>
                    <p className="traffic-description">
                      Your driver's location is updated automatically every 5 seconds. 
                      The map shows the real-time position of your driver with the route to your pickup location.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackDriver;
