import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./BookDriver.css";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// No hardcoded drivers - all drivers come from database via API

// Kenyan promo codes
const KENYAN_PROMO_CODES = {
  KARIBU10: 0.1, // 10% off
  SAFARI20: 0.2, // 20% off
  NAIROBI25: 0.25, // 25% off
  MADARAKA50: 0.5, // 50% off for Madaraka Day
  UHURU30: 0.3, // 30% off for Independence Day
};

// Kenyan popular locations for suggestions
const POPULAR_LOCATIONS = [
  "CBD",
  "Westlands",
  "Kilimani",
  "Karen",
  "JKIA",
  "Lavington",
  "Ngong",
  "Thika",
  "Kiambu",
  "Upper Hill",
  "Eastleigh",
  "Gigiri",
  "Parklands",
  "South B",
  "South C",
];

const BookDriver = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickup_location: "",
    dropoff_location: "",
    promo_code: "",
  });
  const [searchResults, setSearchResults] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [locations, setLocations] = useState({
    pickup: null,
    dropoff: null,
  });
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]); // Default center on Nairobi
  const [mapZoom, setMapZoom] = useState(13);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Get user phone number on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.phone) {
      setPhoneNumber(user.phone);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Show location suggestions
    if (name === "pickup_location" && value.length > 1) {
      const filteredSuggestions = POPULAR_LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setPickupSuggestions(filteredSuggestions);
      setShowPickupSuggestions(true);
    } else if (name === "dropoff_location" && value.length > 1) {
      const filteredSuggestions = POPULAR_LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setDropoffSuggestions(filteredSuggestions);
      setShowDropoffSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion, locationType) => {
    if (locationType === "pickup") {
      setFormData({
        ...formData,
        pickup_location: suggestion,
      });
      setShowPickupSuggestions(false);
    } else {
      setFormData({
        ...formData,
        dropoff_location: suggestion,
      });
      setShowDropoffSuggestions(false);
    }
  };

  // Simulate geocoding with predefined responses for Kenyan locations
  const geocodeAddress = async (address) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mapping of Kenyan addresses to coordinates
    const geocodeMap = {
      nairobi: { lat: -1.2921, lon: 36.8219 },
      mombasa: { lat: -4.0435, lon: 39.6682 },
      kisumu: { lat: -0.1022, lon: 34.7617 },
      nakuru: { lat: -0.3031, lon: 36.08 },
      eldoret: { lat: 0.5143, lon: 35.2698 },
      thika: { lat: -1.0396, lon: 37.09 },
      kitale: { lat: 1.0167, lon: 35.0 },
      malindi: { lat: -3.2175, lon: 40.1192 },
      westlands: { lat: -1.2637, lon: 36.8029 },
      karen: { lat: -1.3179, lon: 36.7062 },
      kilimani: { lat: -1.2898, lon: 36.7718 },
      cbd: { lat: -1.2864, lon: 36.8172 },
      lavington: { lat: -1.2802, lon: 36.7645 },
      ngong: { lat: -1.3611, lon: 36.655 },
      jkia: { lat: -1.3236, lon: 36.926 },
      nyali: { lat: -4.021, lon: 39.72 },
      kiambu: { lat: -1.1711, lon: 36.8255 },
      "upper hill": { lat: -1.2974, lon: 36.8094 },
      eastleigh: { lat: -1.2728, lon: 36.8502 },
      gigiri: { lat: -1.2329, lon: 36.805 },
      parklands: { lat: -1.2654, lon: 36.8107 },
      "south b": { lat: -1.3105, lon: 36.8359 },
      "south c": { lat: -1.3233, lon: 36.8243 },
    };

    // Try to match the address to our map (case insensitive)
    const lowerCaseAddress = address.toLowerCase();
    for (const [key, coords] of Object.entries(geocodeMap)) {
      if (lowerCaseAddress.includes(key)) {
        return coords;
      }
    }

    // Fallback: return random coordinates near Nairobi
    return {
      lat: -1.2921 + (Math.random() - 0.5) * 0.1,
      lon: 36.8219 + (Math.random() - 0.5) * 0.1,
    };
  };

  // Helper function to convert degrees to radians
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Geocode addresses for map display and distance calculation
      const pickupCoords = await geocodeAddress(formData.pickup_location);
      const dropoffCoords = await geocodeAddress(formData.dropoff_location);

      // Calculate actual distance using Haversine formula
      const calculatedDistance = calculateDistance(
        pickupCoords.lat,
        pickupCoords.lon,
        dropoffCoords.lat,
        dropoffCoords.lon
      );

      // Call backend API to search for real registered verified drivers
      const response = await fetch('http://127.0.0.1:5000/api/user/search-drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_location: formData.pickup_location,
          dropoff_location: formData.dropoff_location,
          distance: calculatedDistance
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to search for drivers');
        setLoading(false);
        return;
      }

      // Update the locations state
      setLocations({
        pickup: pickupCoords,
        dropoff: dropoffCoords,
      });

      // Calculate the center of the two points for the map
      const centerLat = (pickupCoords.lat + dropoffCoords.lat) / 2;
      const centerLon = (pickupCoords.lon + dropoffCoords.lon) / 2;
      setMapCenter([centerLat, centerLon]);

      // Adjust zoom to fit both markers
      setMapZoom(12);

      // Use data from backend API (only verified available drivers)
      if (!data.drivers || data.drivers.length === 0) {
        toast.warning('No verified drivers available at the moment. Please try again later.');
        setLoading(false);
        return;
      }

      // Create search results with real driver data
      setSearchResults({
        drivers: data.drivers,
        distance: data.distance,
        base_price: data.base_price,
        calculated_route: {
          from: pickupCoords,
          to: dropoffCoords,
        },
      });

      setBookingStep(2);
      setLoading(false);
    } catch (error) {
      console.error("Error in search:", error);
      toast.error("Failed to search for drivers. Please try again.");
      setLoading(false);
    }
  };

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setBookingStep(3);
  };

  const handleApplyPromo = async () => {
    if (!formData.promo_code.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    // Simulate API delay
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);

    const promoCode = formData.promo_code.toUpperCase();
    const discount = KENYAN_PROMO_CODES[promoCode];

    if (discount) {
      // Apply discount to the selected driver's price
      const currentPrice = selectedDriver.price || searchResults.base_price;
      const newPrice = currentPrice * (1 - discount);
      
      // Update the selected driver's price
      setSelectedDriver({
        ...selectedDriver,
        price: newPrice
      });
      
      setSearchResults({
        ...searchResults,
        appliedPromoCode: promoCode,
        discount: discount * 100,
      });

      toast.success(
        `Promo code ${promoCode} applied! ${discount * 100}% discount - Saved KES ${(currentPrice - newPrice).toFixed(0)}`
      );
    } else {
      toast.error("Invalid or inactive promo code");
    }
  };

  const checkPaymentStatus = async (txnId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/mpesa/check-status/${txnId}`);
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  };

  const pollPaymentStatus = async (txnId, maxAttempts = 30) => {
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      const status = await checkPaymentStatus(txnId);
      
      if (status === 'completed') {
        setIsPaymentProcessing(false);
        toast.success('Payment successful! Your booking is confirmed.');
        setTimeout(() => {
          navigate('/user/order-history');
        }, 2000);
        return;
      } else if (status === 'failed') {
        setIsPaymentProcessing(false);
        toast.error('Payment failed. Please try again.');
        setBookingStep(3); // Go back to confirmation
        return;
      } else if (attempts < maxAttempts) {
        setTimeout(poll, 3000); // Check every 3 seconds
      } else {
        setIsPaymentProcessing(false);
        toast.warning('Payment is taking longer than expected. Please check your order history.');
        setTimeout(() => {
          navigate('/user/order-history');
        }, 2000);
      }
    };
    
    setTimeout(poll, 5000); // Start checking after 5 seconds
  };

  const handleProceedToPayment = () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === '') {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }
    
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    setBookingStep(4);
  };

  const handleBookDriver = async () => {
    setLoading(true);
    setIsPaymentProcessing(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('Please log in to book a driver');
        setLoading(false);
        setIsPaymentProcessing(false);
        return;
      }

      // Validate phone number
      if (!phoneNumber || phoneNumber.trim() === '') {
        toast.error('Please enter your M-Pesa phone number');
        setLoading(false);
        setIsPaymentProcessing(false);
        return;
      }

      const finalPrice = selectedDriver.price || searchResults.base_price;

      // Call backend API to initiate M-Pesa payment
      const response = await fetch('http://127.0.0.1:5000/api/user/book-driver-mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          driver_id: selectedDriver.driver_id,
          pickup_location: formData.pickup_location,
          dropoff_location: formData.dropoff_location,
          distance: parseFloat(searchResults.distance),
          price: finalPrice,
          phone_number: phoneNumber,
          promo_code: formData.promo_code || null
        })
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok || !data.success) {
        toast.error(data.error || 'Failed to initiate payment');
        setIsPaymentProcessing(false);
        return;
      }

      // Show success message
      toast.success(data.message || 'Check your phone to complete payment');
      toast.info('📱 Enter your M-Pesa PIN on your phone', { autoClose: 8000 });

      // Start polling for payment status
      pollPaymentStatus(data.transaction_id);

    } catch (error) {
      console.error('Error booking driver:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setLoading(false);
      setIsPaymentProcessing(false);
    }
  };

  return (
    <div className="book-driver-container">
      <h1 className="book-driver-title">MOVERS WEB APP</h1>

      {/* Step indicators */}
      <div className="step-indicator-container">
        <div className={`step-indicator ${bookingStep >= 1 ? 'active' : ''}`}>1. Enter Locations</div>
        <div className={`step-indicator ${bookingStep >= 2 ? 'active' : ''}`}>2. Select Driver</div>
        <div className={`step-indicator ${bookingStep >= 3 ? 'active' : ''}`}>3. Confirm Details</div>
        <div className={`step-indicator ${bookingStep >= 4 ? 'active' : ''}`}>4. Pay via M-Pesa</div>
      </div>

      {/* Step 1: Enter locations */}
      {bookingStep === 1 && (
        <div className="booking-card">
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label className="form-label" htmlFor="pickup_location">
                Pickup Location
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  id="pickup_location"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleChange}
                  onFocus={() => setShowPickupSuggestions(true)}
                  className={`form-input ${showPickupSuggestions ? 'form-input-focused' : ''}`}
                  required
                  placeholder="Enter pickup address"
                />
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {pickupSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() =>
                          handleSuggestionClick(suggestion, "pickup")
                        }
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="hint-text">
                Popular: CBD, Westlands, Kilimani, Karen, etc.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dropoff_location">
                Dropoff Location
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  id="dropoff_location"
                  name="dropoff_location"
                  value={formData.dropoff_location}
                  onChange={handleChange}
                  onFocus={() => setShowDropoffSuggestions(true)}
                  className={`form-input ${showDropoffSuggestions ? 'form-input-focused' : ''}`}
                  required
                  placeholder="Enter destination address"
                />
                {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {dropoffSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() =>
                          handleSuggestionClick(suggestion, "dropoff")
                        }
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="hint-text">
                Popular: JKIA, Lavington, Ngong, Kiambu, etc.
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Searching..." : "Find Drivers"}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Select driver with map */}
      {bookingStep === 2 && searchResults && (
        <div className="booking-card">
          {/* Map display */}
          <div className="map-wrapper">
            <h2 className="section-title">
              Trip Route
            </h2>
            <div className="map-container">
              {locations.pickup && locations.dropoff && (
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={[locations.pickup.lat, locations.pickup.lon]}
                  >
                    <Popup>Pickup: {formData.pickup_location}</Popup>
                  </Marker>
                  <Marker
                    position={[locations.dropoff.lat, locations.dropoff.lon]}
                  >
                    <Popup>Dropoff: {formData.dropoff_location}</Popup>
                  </Marker>
                  <Polyline
                    positions={[
                      [locations.pickup.lat, locations.pickup.lon],
                      [locations.dropoff.lat, locations.dropoff.lon],
                    ]}
                    color="#e67e22"
                  />
                </MapContainer>
              )}
            </div>
          </div>

          <div className="trip-details-card">
            <h2 className="section-subtitle">
              Trip Details
            </h2>
            <div className="trip-details-flex">
              <div>
                <p className="trip-detail-item">
                  <span className="trip-detail-label">From:</span>{" "}
                  <span className="trip-detail-value">{formData.pickup_location}</span>
                </p>
                <p className="trip-detail-item">
                  <span className="trip-detail-label">To:</span>{" "}
                  <span className="trip-detail-value">{formData.dropoff_location}</span>
                </p>
                <p className="trip-detail-item">
                  <span className="trip-detail-label">Distance:</span>{" "}
                  <span className="trip-detail-value">{searchResults.distance} km</span>
                </p>
              </div>
              <div>
                <p className="price-display">
                  KES {searchResults.base_price ? searchResults.base_price.toFixed(0) : '0'}
                </p>
              </div>
            </div>
          </div>

          <h2 className="section-title">
            Available Drivers
          </h2>

          {searchResults.drivers && searchResults.drivers.length > 0 ? (
            <div className="drivers-list">
              {searchResults.drivers.map((driver) => (
                <div
                  key={driver.driver_id}
                  className={`driver-card ${selectedDriver?.driver_id === driver.driver_id ? 'selected' : ''}`}
                  onClick={() => handleSelectDriver(driver)}
                >
                  <div className="driver-info">
                    <div className="driver-avatar">
                      <img
                        src={driver.image}
                        alt={driver.name}
                      />
                    </div>
                    <div className="driver-details">
                      <p className="driver-name">
                        {driver.name}
                        {driver.is_verified && (
                          <span className="verified-badge">
                            <span style={{ fontSize: "12px" }}>✓</span> VERIFIED
                          </span>
                        )}
                        {!driver.is_verified && (
                          <span className="unverified-badge">
                            Unverified
                          </span>
                        )}
                      </p>
                      <p className="driver-vehicle">
                        Vehicle: {driver.vehicle_type}
                      </p>
                      <div className="driver-rating">
                        <span className="rating-star">★</span>
                        <span className="rating-value">{driver.ratings ? driver.ratings.toFixed(1) : '0.0'}</span>
                        <span className="rating-trips">
                          ({driver.completed_orders} trips)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="driver-price-section">
                    <p className="driver-price">
                      KES {driver.price ? driver.price.toFixed(0) : '0'}
                    </p>
                    <button
                      className="btn-secondary filled"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDriver(driver);
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-drivers">
              No drivers available at the moment. Please try again later.
            </p>
          )}

          <button
            className="btn-back"
            onClick={() => setBookingStep(1)}
          >
            ← Back to locations
          </button>
        </div>
      )}

      {/* Step 3: Confirm booking with map */}
      {bookingStep === 3 && selectedDriver && (
        <div className="booking-card">
          <h2 className="confirmation-title">
            Confirm Your Booking
          </h2>

          {/* Map in confirmation */}
          <div className="map-wrapper">
            <div className="map-container compact">
              {locations.pickup && locations.dropoff && (
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={[locations.pickup.lat, locations.pickup.lon]}
                  >
                    <Popup>Pickup: {formData.pickup_location}</Popup>
                  </Marker>
                  <Marker
                    position={[locations.dropoff.lat, locations.dropoff.lon]}
                  >
                    <Popup>Dropoff: {formData.dropoff_location}</Popup>
                  </Marker>
                  <Polyline
                    positions={[
                      [locations.pickup.lat, locations.pickup.lon],
                      [locations.dropoff.lat, locations.dropoff.lon],
                    ]}
                    color="#e67e22"
                  />
                </MapContainer>
              )}
            </div>
          </div>

          <div className="confirmation-details">
            <div className="confirmation-left">
              <div className="confirmation-section">
                <h3 className="confirmation-section-title">
                  Trip Details
                </h3>
                <p className="trip-detail-item">
                  <span className="trip-detail-label">From:</span>{" "}
                  {formData.pickup_location}
                </p>
                <p className="trip-detail-item">
                  <span className="trip-detail-label">To:</span>{" "}
                  {formData.dropoff_location}
                </p>
                <p className="trip-detail-item">
                  <span className="trip-detail-label">Distance:</span>{" "}
                  {searchResults.distance} km
                </p>
              </div>

              <div className="confirmation-section">
                <h3 className="confirmation-section-title">
                  Driver Info
                </h3>
                <div className="driver-info-compact">
                  <div className="driver-avatar-compact">
                    <img
                      src={selectedDriver.image}
                      alt={selectedDriver.name}
                    />
                  </div>
                  <div>
                    <p className="driver-name-compact">
                      {selectedDriver.name}
                    </p>
                    <p className="driver-meta-compact">
                      {selectedDriver.vehicle_type} ·{" "}
                      {selectedDriver.ratings ? selectedDriver.ratings.toFixed(1) : '0.0'} ★
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="confirmation-right">
              <div className="price-box">
                <p className="price-label">
                  Total Price
                </p>
                <p className="price-value">
                  KES {selectedDriver.price ? selectedDriver.price.toFixed(0) : (searchResults.base_price ? searchResults.base_price.toFixed(0) : '0')}
                </p>
              </div>

              {searchResults.appliedPromoCode && (
                <div className="promo-applied">
                  <span className="promo-code">
                    {searchResults.appliedPromoCode}
                  </span>
                  : {searchResults.discount}% off applied
                </div>
              )}
            </div>
          </div>

          {/* Promo code section */}
          <div className="promo-section">
            <label
              className="form-label"
              htmlFor="promo_code"
            >
              Have a Promo Code? (Optional)
            </label>
            <div className="promo-input-group">
              <input
                type="text"
                id="promo_code"
                name="promo_code"
                value={formData.promo_code}
                onChange={handleChange}
                className="form-input promo-input"
                placeholder="Enter promo code (optional)"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="promo-button"
                disabled={loading}
              >
                Apply
              </button>
            </div>
            <p className="hint-text">
              Optional: Try KARIBU10, SAFARI20, NAIROBI25, MADARAKA50, UHURU30 for discounts
            </p>
          </div>

          <div className="action-buttons">
            <button
              className="btn-back"
              onClick={() => setBookingStep(2)}
              disabled={loading}
            >
              ← Back to drivers
            </button>

            <button
              className="btn-confirm"
              onClick={handleProceedToPayment}
              disabled={loading}
            >
              Proceed to Payment →
            </button>
          </div>

          {/* Additional information */}
          <div className="booking-info">
            <p className="booking-info-title">
              Payment Information:
            </p>
            <ul className="booking-info-list">
              <li>
                You will pay via M-Pesa in the next step.
              </li>
              <li>
                Payment is securely held in escrow until service completion.
              </li>
              <li>
                Funds are released to the driver after you confirm service completion.
              </li>
              <li>
                Cancel before driver accepts for a full refund.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 4: M-Pesa Payment */}
      {bookingStep === 4 && selectedDriver && (
        <div className="booking-card">
          <h2 className="confirmation-title">
            💳 Complete Payment via M-Pesa
          </h2>

          <div className="payment-summary">
            <div className="payment-detail">
              <span>Amount to Pay:</span>
              <strong style={{fontSize: '24px', color: '#27ae60'}}>KES {selectedDriver.price ? selectedDriver.price.toFixed(2) : (searchResults.base_price ? searchResults.base_price.toFixed(2) : '0')}</strong>
            </div>
            <div className="payment-detail">
              <span>From:</span>
              <span>{formData.pickup_location}</span>
            </div>
            <div className="payment-detail">
              <span>To:</span>
              <span>{formData.dropoff_location}</span>
            </div>
            <div className="payment-detail">
              <span>Driver:</span>
              <span>{selectedDriver.name} - {selectedDriver.vehicle_type}</span>
            </div>
          </div>

          <div className="mpesa-form">
            <div className="form-group">
              <label className="form-label" htmlFor="phoneNumber">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="form-input"
                placeholder="e.g., 0712345678 or 254712345678"
                disabled={isPaymentProcessing}
              />
              <p className="hint-text">
                Enter the M-Pesa phone number you want to pay with
              </p>
            </div>

            {isPaymentProcessing && (
              <div className="payment-processing">
                <div className="spinner"></div>
                <p style={{color: '#e67e22', fontWeight: 'bold', margin: '10px 0'}}>
                  📱 Check your phone and enter your M-Pesa PIN
                </p>
                <p style={{fontSize: '14px', color: '#7f8c8d'}}>
                  Waiting for payment confirmation...
                </p>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button
              className="btn-back"
              onClick={() => setBookingStep(3)}
              disabled={loading || isPaymentProcessing}
            >
              ← Back 
            </button>

            <button
              className="btn-confirm"
              onClick={handleBookDriver}
              disabled={loading || isPaymentProcessing || !phoneNumber}
              style={{backgroundColor: isPaymentProcessing ? '#95a5a6' : '#27ae60'}}
            >
              {loading || isPaymentProcessing ? (
                <span>Processing Payment...</span>
              ) : (
                <span>Pay KES {selectedDriver.price ? selectedDriver.price.toFixed(0) : (searchResults.base_price ? searchResults.base_price.toFixed(0) : '0')}</span>
              )}
            </button>
          </div>

          <div className="booking-info">
            <p className="booking-info-title">
              M-Pesa Payment Steps:
            </p>
            <ul className="booking-info-list">
              <li>Click the "Pay" button above</li>
              <li>You'll receive an M-Pesa prompt on your phone</li>
              <li>Enter your M-Pesa PIN to complete payment</li>
              <li>Wait for payment confirmation</li>
              <li>Your booking will be confirmed automatically</li>
            </ul>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="book-driver-footer">
        <p>© 2025 Movers Web App. All Rights Reserved.</p>
        <p className="footer-text">
          Safe, Reliable Transport Across Kenya
        </p>
      </div>
    </div>
  );
};

export default BookDriver;
