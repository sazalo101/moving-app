import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import './TrackDriver.css';

const TrackDriver = () => {
  const { bookingId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const simulationIntervalRef = useRef(null);

  const dummyTrackingData = {
    location: "-1.2864,36.8172",
    heading: 45,
    speed: 35,
    last_updated: new Date().toISOString()
  };

  const dummyBookingDetails = {
    booking_id: parseInt(bookingId || 12345),
    pickup_location: "Junction Mall, Ngong Road, Nairobi",
    dropoff_location: "Lavington Mall, James Gichuru Road",
    status: "in_progress",
    driver_name: "David Kamau",
    driver_phone: "0722 123 456",
    vehicle: "Toyota Fielder",
    vehicle_color: "Silver",
    license_plate: "KCF 234P"
  };

  useEffect(() => {
    const loadDummyData = () => {
      setTimeout(() => {
        setTrackingData(dummyTrackingData);
        setBookingDetails(dummyBookingDetails);
        setLoading(false);
      }, 1500);
    };

    loadDummyData();

    let movingNorth = true;
    let movingEast = true;
    
    simulationIntervalRef.current = setInterval(() => {
      setTrackingData(prevData => {
        if (!prevData) return dummyTrackingData;
        
        const [lat, lng] = prevData.location.split(',').map(Number);
        
        if (Math.random() < 0.2) movingNorth = !movingNorth;
        if (Math.random() < 0.2) movingEast = !movingEast;
        
        const latDelta = (Math.random() * 0.001) * (movingNorth ? 1 : -1);
        const lngDelta = (Math.random() * 0.001) * (movingEast ? 1 : -1);
        
        return {
          ...prevData,
          location: `${(lat + latDelta).toFixed(6)},${(lng + lngDelta).toFixed(6)}`,
          speed: Math.floor(25 + Math.random() * 20),
          last_updated: new Date().toISOString()
        };
      });
    }, 5000);

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [bookingId]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                  </p>
                  <p className="detail-item">
                    <span className="detail-label">Phone:</span> {bookingDetails.driver_phone}
                  </p>
                  <p className="detail-item">
                    <span className="detail-label">Vehicle:</span> {bookingDetails.vehicle_color} {bookingDetails.vehicle}
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
              <h2 className="location-title">Driver Location</h2>
              {trackingData && trackingData.location ? (
                <div>
                  <div className="map-placeholder">
                    <div className="map-content">
                      <p className="map-title">Map Placeholder</p>
                      <p className="map-coordinates">Driver at coordinates: {trackingData.location}</p>
                      <p className="map-details">
                        Heading: {trackingData.heading}° | Speed: {trackingData.speed} km/h
                      </p>
                    </div>
                  </div>
                  <div className="location-meta">
                    <p className="last-updated">Last updated: {formatDateTime(trackingData.last_updated)}</p>
                    <p className="driver-status">Driver is on the way</p>
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
              <h2 className="traffic-title">Traffic Information</h2>
              <div className="traffic-alert">
                <p className="traffic-heading">Moderate traffic on Ngong Road</p>
                <p className="traffic-description">Expect slight delays of 5-10 minutes due to construction near Adams Arcade</p>
              </div>
              <div className="traffic-details">
                <p>Estimated time of arrival: 10:45 AM</p>
                <p>Distance to pickup: 2.3 km</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackDriver;
