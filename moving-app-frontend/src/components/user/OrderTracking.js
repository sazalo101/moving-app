import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './OrderTracking.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons
const createCustomIcon = (color, iconHtml) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 50px; height: 50px; border-radius: 50% 50% 50% 0; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;">
      <div style="transform: rotate(45deg); font-size: 24px;">${iconHtml}</div>
    </div>`,
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
  });
};

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
    } else if (positions && positions.length === 1) {
      map.flyTo(positions[0], 12);
    }
  }, [positions, map]);
  return null;
};

const OrderTracking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch order from real user order history
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user) {
          setError('Please log in to view tracking');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://127.0.0.1:5000/api/user/order-history/${user.id}`);
        if (!response.ok) throw new Error('Failed to load orders');

        const data = await response.json();
        const foundOrder = data.orders?.find(o => String(o.booking_id) === String(bookingId));

        if (!foundOrder) {
          setError('Order not found in your history');
          setLoading(false);
          return;
        }

        setOrder(foundOrder);
        setLastUpdate(new Date());
        generateLocationHistory(foundOrder);
        setLoading(false);

      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load order');
        setLoading(false);
      }
    };

    if (bookingId) fetchOrder();
  }, [bookingId]);

  // Generate realistic location journey
  const generateLocationHistory = (orderData) => {
    const history = [];
    const createdDate = new Date(orderData.created_at);

    // Step 1: Ordered
    history.push({
      step: 1,
      status: 'Ordered',
      description: 'Order placed',
      time: createdDate,
      location: orderData.pickup_location,
      icon: '📦',
    });

    // Step 2: In Transit
    if (orderData.status === 'in_progress' || orderData.status === 'completed') {
      const pickupCoords = parseCoordinates(orderData.pickup_location);
      const dropoffCoords = parseCoordinates(orderData.dropoff_location);

      if (pickupCoords && dropoffCoords) {
        const midLat = (pickupCoords[0] + dropoffCoords[0]) / 2;
        const midLng = (pickupCoords[1] + dropoffCoords[1]) / 2;
        const transitTime = new Date(createdDate.getTime() + 30 * 60000);

        history.push({
          step: 2,
          status: 'In Transit',
          description: 'Driver en route',
          time: transitTime,
          location: `${midLat},${midLng}`,
          icon: '🚗',
        });
      }
    }

    // Step 3: Signed/Delivered
    if (orderData.status === 'completed') {
      const deliveryTime = new Date(createdDate.getTime() + 60 * 60000);

      history.push({
        step: 3,
        status: 'Signed',
        description: 'Package delivered',
        time: deliveryTime,
        location: orderData.dropoff_location,
        icon: '✅',
      });
    } else if (orderData.status === 'in_progress') {
      history.push({
        step: 3,
        status: 'Arriving',
        description: 'Almost there',
        time: null,
        location: orderData.dropoff_location,
        icon: '🎯',
      });
    }

    setLocationHistory(history);
  };

  const parseCoordinates = (coordString) => {
    if (!coordString) return null;
    const parts = coordString.split(',');
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      accepted: '#3b82f6',
      in_progress: '#06b6d4',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="order-tracking">
        <div className="tracking-loading">
          <div className="tracking-spinner"></div>
          <p>Loading order tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-tracking">
        <div className="tracking-error">
          <p>❌ {error || 'Order not found'}</p>
          <button onClick={() => navigate('/user/orders')} className="btn-back">
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const pickupCoords = parseCoordinates(order.pickup_location);
  const dropoffCoords = parseCoordinates(order.dropoff_location);
  const allCoords = locationHistory.map(h => parseCoordinates(h.location)).filter(Boolean);

  return (
    <div className="order-tracking">
      {/* Header */}
      <div className="tracking-header">
        <button onClick={() => navigate(-1)} className="tracking-back-btn">
          ← Back
        </button>
        <h1 className="tracking-title">📦 Order #{order.booking_id}</h1>
        <div className="tracking-status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
          {order.status.toUpperCase()}
        </div>
      </div>

      {/* Journey Steps */}
      <div className="journey-container">
        <div className="journey-steps">
          {locationHistory.map((item, idx) => (
            <div key={idx} className="journey-step">
              <div className="step-number">{item.icon}</div>
              <div className="step-info">
                <h3 className="step-title">{item.status}</h3>
                <p className="step-description">{item.description}</p>
                {item.time && <p className="step-time">{item.time.toLocaleString()}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map and Details */}
      <div className="tracking-container">
        {/* Map */}
        <div className="tracking-map-section">
          <div className="tracking-map-container">
            {allCoords.length > 0 ? (
              <MapContainer center={allCoords[0]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />

                {pickupCoords && (
                  <Marker position={pickupCoords} icon={createCustomIcon('#10b981', '📍')}>
                    <Popup><div style={{ fontSize: '12px' }}><strong>Pickup</strong><br />{order.pickup_location}</div></Popup>
                  </Marker>
                )}

                {allCoords.map((coord, idx) => (
                  idx > 0 && idx < allCoords.length - 1 && (
                    <Marker key={idx} position={coord} icon={createCustomIcon('#3b82f6', '🚗')}>
                      <Popup><div style={{ fontSize: '12px' }}><strong>{locationHistory[idx]?.status}</strong><br />{locationHistory[idx]?.time?.toLocaleTimeString()}</div></Popup>
                    </Marker>
                  )
                ))}

                {dropoffCoords && (
                  <Marker position={dropoffCoords} icon={createCustomIcon('#f97316', '🎯')}>
                    <Popup><div style={{ fontSize: '12px' }}><strong>Delivery</strong><br />{order.dropoff_location}</div></Popup>
                  </Marker>
                )}

                {allCoords.length > 1 && (
                  <>
                    <Polyline positions={allCoords} color="#10b981" weight={3} opacity={0.7} />
                    <FitBounds positions={allCoords} />
                  </>
                )}
              </MapContainer>
            ) : (
              <div className="map-placeholder"><p>📍 Map loading...</p></div>
            )}
          </div>

          <div className="tracking-controls">
            <span className={order.status === 'completed' ? 'historical-badge' : 'live-badge'}>
              {order.status === 'completed' ? '📜 Completed' : '🔴 Active'}
            </span>
            <span className="update-time">Last updated: {lastUpdate?.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Details */}
        <div className="tracking-details-section">
          <div className="tracking-info-card">
            <h3 className="info-title">📋 Order Info</h3>
            <div className="info-group"><label>Booking ID:</label><p>#{order.booking_id}</p></div>
            <div className="info-group"><label>Status:</label><p style={{ color: getStatusColor(order.status) }}>{order.status.toUpperCase()}</p></div>
            <div className="info-group"><label>Date:</label><p>{new Date(order.created_at).toLocaleDateString()}</p></div>
            <div className="info-group"><label>Price:</label><p>KES {order.price || order.total_price || 'N/A'}</p></div>
          </div>

          <div className="tracking-info-card">
            <h3 className="info-title">📍 Locations</h3>
            <div className="location-item">
              <span>📍</span>
              <div><p className="location-label">From:</p><p className="location-text">{order.pickup_location}</p></div>
            </div>
            <div className="location-item">
              <span>🎯</span>
              <div><p className="location-label">To:</p><p className="location-text">{order.dropoff_location}</p></div>
            </div>
            {pickupCoords && dropoffCoords && (
              <div className="distance-info">
                <p className="distance-label">Distance:</p>
                <p className="distance-value">{calculateDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1])} km</p>
              </div>
            )}
          </div>

          {order.driver_id && (
            <div className="tracking-info-card">
              <h3 className="info-title">👤 Driver</h3>
              <div className="info-group"><label>Name:</label><p>{order.driver_name || 'N/A'}</p></div>
              <div className="info-group"><label>Rating:</label><p>⭐ {order.driver_rating || 'N/A'}</p></div>
              {order.vehicle_type && (
                <div className="info-group"><label>Vehicle:</label><p>{order.vehicle_type} - {order.license_plate || 'N/A'}</p></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="tracking-history-section">
        <h3 className="history-title">📍 Journey Timeline</h3>
        <div className="location-timeline">
          <div className="timeline">
            {locationHistory.map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <p className="timeline-status">{item.status}</p>
                  {item.time && <p className="timeline-time">{item.time.toLocaleTimeString()}</p>}
                  <p className="timeline-location">{item.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
