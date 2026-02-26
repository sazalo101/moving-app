import React, { useState } from "react";
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

// Kenyan drivers data
const KENYAN_DRIVERS = [
  {
    driver_id: 1,
    name: "David Kamau",
    vehicle_type: "Sedan",
    ratings: 4.8,
    completed_orders: 237,
    price: 1500,
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    driver_id: 2,
    name: "Faith Wanjiku",
    vehicle_type: "SUV",
    ratings: 4.9,
    completed_orders: 412,
    price: 1850,
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    driver_id: 3,
    name: "Brian Odhiambo",
    vehicle_type: "Luxury",
    ratings: 4.7,
    completed_orders: 187,
    price: 2200,
    image: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    driver_id: 4,
    name: "Esther Muthoni",
    vehicle_type: "Economy",
    ratings: 4.6,
    completed_orders: 153,
    price: 1200,
    image: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    driver_id: 5,
    name: "John Mwangi",
    vehicle_type: "Boda Boda",
    ratings: 4.5,
    completed_orders: 292,
    price: 500,
    image: "https://randomuser.me/api/portraits/men/42.jpg",
  },
];

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

const containerStyles = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "20px",
  fontFamily: "Arial, sans-serif",
};

const headingStyles = {
  fontSize: "28px",
  fontWeight: "bold",
  marginBottom: "20px",
  color: "#333",
  borderBottom: "2px solid #e67e22",
  paddingBottom: "10px",
};

const cardStyles = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  padding: "25px",
  marginBottom: "25px",
};

const stepIndicatorContainerStyles = {
  display: "flex",
  marginBottom: "30px",
};

const formGroupStyles = {
  marginBottom: "20px",
};

const labelStyles = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  fontSize: "16px",
  color: "#444",
};

const inputStyles = {
  width: "100%",
  padding: "12px 15px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "16px",
  boxSizing: "border-box",
  transition: "border-color 0.3s ease",
  backgroundColor: "#f9f9f9",
  color: "black",
};

const buttonPrimaryStyles = {
  backgroundColor: "#e67e22", // Kenyan-inspired orange
  color: "white",
  padding: "12px 20px",
  border: "none",
  borderRadius: "6px",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "bold",
  width: "100%",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  transition: "all 0.3s ease",
};

const buttonSecondaryStyles = {
  backgroundColor: "transparent",
  color: "#e67e22",
  padding: "10px 16px",
  border: "1px solid #e67e22",
  borderRadius: "6px",
  fontSize: "14px",
  cursor: "pointer",
  fontWeight: "600",
  transition: "all 0.3s ease",
};

const driverCardStyles = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "15px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const mapContainerStyles = {
  height: "300px",
  borderRadius: "8px",
  overflow: "hidden",
  border: "1px solid #ddd",
  marginBottom: "20px",
};

const hintTextStyles = {
  fontSize: "12px",
  color: "#777",
  marginTop: "5px",
  fontStyle: "italic",
};

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

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First geocode the addresses using our dummy geocoder
      const pickupCoords = await geocodeAddress(formData.pickup_location);
      const dropoffCoords = await geocodeAddress(formData.dropoff_location);

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

      // Calculate actual distance using Haversine formula
      const distance = calculateDistance(
        pickupCoords.lat,
        pickupCoords.lon,
        dropoffCoords.lat,
        dropoffCoords.lon
      );

      // Calculate base price based on distance (in KES)
      const basePrice = 200 + distance * 50;

      // Prepare drivers with individualized pricing
      const drivers = KENYAN_DRIVERS.map((driver) => ({
        ...driver,
        // Add some variation to driver prices
        price: Math.round((basePrice * (0.9 + Math.random() * 0.3)) / 10) * 10, // round to nearest 10
      }));

      // Create search results
      setSearchResults({
        drivers: drivers,
        distance: distance.toFixed(2),
        price: basePrice,
        calculated_route: {
          from: pickupCoords,
          to: dropoffCoords,
        },
      });

      setBookingStep(2);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 700));
      setLoading(false);
    } catch (error) {
      console.error("Error in search:", error);
      toast.error("Failed to search for drivers. Please try again.");
      setLoading(false);
    }
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

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
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
      const newPrice = searchResults.price * (1 - discount);
      setSearchResults({
        ...searchResults,
        price: newPrice,
        appliedPromoCode: promoCode,
        discount: discount * 100,
      });

      toast.success(
        `Promo code ${promoCode} applied! ${discount * 100}% discount`
      );
    } else {
      toast.error("Invalid or inactive promo code");
    }
  };

  const handleBookDriver = async () => {
    setLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Generate a random booking ID
    const bookingId = Math.floor(100000 + Math.random() * 900000);

    toast.success("Driver booked successfully!");

    // Redirect to a fictional tracking page
    // Note: If the navigate function isn't available in the test environment,
    // we'll just log the navigation and handle booking completion in this component
    try {
      navigate(`/user/track/${bookingId}`);
    } catch (error) {
      console.log(`Would navigate to: /user/track/${bookingId}`);
      toast.info(
        `Booking #${bookingId} confirmed. Your driver will arrive shortly.`
      );
      setLoading(false);
      setBookingStep(1);
      setFormData({
        pickup_location: "",
        dropoff_location: "",
        promo_code: "",
      });
    }
  };

  const getStepIndicatorStyle = (stepNumber) => {
    const baseStyle = {
      flex: 1,
      textAlign: "center",
      padding: "12px",
      fontWeight: bookingStep >= stepNumber ? "bold" : "normal",
      borderBottom: "3px solid",
      borderBottomColor: bookingStep >= stepNumber ? "#e67e22" : "#ddd",
      color: bookingStep >= stepNumber ? "#e67e22" : "#888",
      position: "relative",
    };

    return baseStyle;
  };

  return (
    <div style={containerStyles}>
      <h1 style={headingStyles}>MOVERS WEB APP</h1>

      {/* Step indicators */}
      <div style={stepIndicatorContainerStyles}>
        <div style={getStepIndicatorStyle(1)}>1. Enter Locations</div>
        <div style={getStepIndicatorStyle(2)}>2. Select Driver</div>
        <div style={getStepIndicatorStyle(3)}>3. Confirm Booking</div>
      </div>

      {/* Step 1: Enter locations */}
      {bookingStep === 1 && (
        <div style={cardStyles}>
          <form onSubmit={handleSearch}>
            <div style={formGroupStyles}>
              <label style={labelStyles} htmlFor="pickup_location">
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
                  style={{
                    ...inputStyles,
                    borderColor: showPickupSuggestions ? "#e67e22" : "#ddd",
                  }}
                  required
                  placeholder="Enter pickup address"
                />
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      width: "100%",
                      backgroundColor: "black",
                      color: "orange",
                      border: "1px solid #ddd",
                      borderRadius: "0 0 6px 6px",
                      zIndex: 10,
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    {pickupSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "10px 15px",
                          cursor: "pointer",
                          borderBottom:
                            index < pickupSuggestions.length - 1
                              ? "1px solid #eee"
                              : "none",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#f5f5f5")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "transparent")
                        }
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
              <p style={hintTextStyles}>
                Popular: CBD, Westlands, Kilimani, Karen, etc.
              </p>
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles} htmlFor="dropoff_location">
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
                  style={{
                    ...inputStyles,
                    borderColor: showDropoffSuggestions ? "#e67e22" : "#ddd",
                  }}
                  required
                  placeholder="Enter destination address"
                />
                {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      width: "100%",
                      backgroundColor: "black",
                      color: "orange",
                      border: "1px solid #ddd",
                      borderRadius: "0 0 6px 6px",
                      zIndex: 10,
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    {dropoffSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "10px 15px",
                          cursor: "pointer",
                          borderBottom:
                            index < dropoffSuggestions.length - 1
                              ? "1px solid #eee"
                              : "none",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#f5f5f5")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "transparent")
                        }
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
              <p style={hintTextStyles}>
                Popular: JKIA, Lavington, Ngong, Kiambu, etc.
              </p>
            </div>

            <button
              type="submit"
              style={{
                ...buttonPrimaryStyles,
                backgroundColor: loading ? "#ccc" : "#e67e22",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "Searching..." : "Find Drivers"}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Select driver with map */}
      {bookingStep === 2 && searchResults && (
        <div style={cardStyles}>
          {/* Map display */}
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "15px",
                color: "#444",
              }}
            >
              Trip Route
            </h2>
            <div style={mapContainerStyles}>
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

          <div
            style={{
              backgroundColor: "#f8f4e5",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              borderLeft: "4px solid #e67e22",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              Trip Details
            </h2>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p>
                  <span style={{ fontWeight: "bold", color: "black" }}>
                    From:
                  </span>{" "}
                  <span style={{ color: "black" }}>
                    {formData.pickup_location}
                  </span>
                </p>
                <p>
                  <span style={{ fontWeight: "bold", color: "black" }}>
                    To:
                  </span>{" "}
                  <span style={{ color: "black" }}>
                    {formData.dropoff_location}
                  </span>
                </p>
                <p>
                  <span style={{ fontWeight: "bold", color: "black" }}>
                    Distance:
                  </span>{" "}
                  <span style={{ color: "black" }}>
                    {searchResults.distance} km
                  </span>
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#e67e22",
                    backgroundColor: "#fff",
                    padding: "10px 15px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  KES {searchResults.price.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "15px",
              color: "#444",
            }}
          >
            Available Drivers
          </h2>

          {searchResults.drivers && searchResults.drivers.length > 0 ? (
            <div>
              {searchResults.drivers.map((driver) => (
                <div
                  key={driver.driver_id}
                  style={{
                    ...driverCardStyles,
                    backgroundColor:
                      selectedDriver?.driver_id === driver.driver_id
                        ? "#fdf2e9"
                        : "#fff",
                    borderColor:
                      selectedDriver?.driver_id === driver.driver_id
                        ? "#e67e22"
                        : "#ddd",
                  }}
                  onClick={() => handleSelectDriver(driver)}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        marginRight: "15px",
                        border: "2px solid #e67e22",
                      }}
                    >
                      <img
                        src={driver.image}
                        alt={driver.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          marginBottom: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        {driver.name}
                        {driver.is_verified && (
                          <span style={{
                            backgroundColor: "#10b981",
                            color: "white",
                            fontSize: "11px",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)"
                          }}>
                            <span style={{ fontSize: "12px" }}>✓</span> VERIFIED
                          </span>
                        )}
                        {!driver.is_verified && (
                          <span style={{
                            backgroundColor: "#f3f4f6",
                            color: "#6b7280",
                            fontSize: "10px",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontWeight: "600"
                          }}>
                            Unverified
                          </span>
                        )}
                      </p>
                      <p
                        style={{
                          color: "#666",
                          fontSize: "14px",
                          marginBottom: "4px",
                        }}
                      >
                        Vehicle: {driver.vehicle_type}
                      </p>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ color: "#f39c12", marginRight: "5px" }}>
                          ★
                        </span>
                        <span style={{ fontWeight: "bold" }}>
                          {driver.ratings.toFixed(1)}
                        </span>
                        <span
                          style={{
                            color: "#777",
                            fontSize: "13px",
                            marginLeft: "5px",
                          }}
                        >
                          ({driver.completed_orders} trips)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "18px",
                        marginBottom: "10px",
                        color: "#e67e22",
                      }}
                    >
                      KES {driver.price.toFixed(0)}
                    </p>
                    <button
                      style={{
                        ...buttonSecondaryStyles,
                        backgroundColor: "#e67e22",
                        color: "white",
                      }}
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
            <p
              style={{
                color: "#666",
                fontStyle: "italic",
                textAlign: "center",
                padding: "20px",
              }}
            >
              No drivers available at the moment. Please try again later.
            </p>
          )}

          <button
            style={{
              background: "none",
              border: "none",
              color: "#e67e22",
              fontWeight: "bold",
              cursor: "pointer",
              padding: "10px 0",
              marginTop: "15px",
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => setBookingStep(1)}
          >
            ← Back to locations
          </button>
        </div>
      )}

      {/* Step 3: Confirm booking with map */}
      {bookingStep === 3 && selectedDriver && (
        <div style={cardStyles}>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "#444",
              textAlign: "center",
            }}
          >
            Confirm Your Booking
          </h2>

          {/* Map in confirmation */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ ...mapContainerStyles, height: "200px" }}>
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              backgroundColor: "#f8f4e5",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              borderLeft: "4px solid #e67e22",
            }}
          >
            <div style={{ flex: "1" }}>
              <div style={{ marginBottom: "15px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "10px",
                    color: "#555",
                  }}
                >
                  Trip Details
                </h3>
                <p style={{ marginBottom: "5px" }}>
                  <span style={{ fontWeight: "bold" }}>From:</span>{" "}
                  {formData.pickup_location}
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <span style={{ fontWeight: "bold" }}>To:</span>{" "}
                  {formData.dropoff_location}
                </p>
                <p>
                  <span style={{ fontWeight: "bold" }}>Distance:</span>{" "}
                  {searchResults.distance} km
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "10px",
                    color: "#555",
                  }}
                >
                  Driver Info
                </h3>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      marginRight: "10px",
                      border: "2px solid #e67e22",
                    }}
                  >
                    <img
                      src={selectedDriver.image}
                      alt={selectedDriver.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div>
                    <p style={{ fontWeight: "bold", marginBottom: "2px" }}>
                      {selectedDriver.name}
                    </p>
                    <p style={{ fontSize: "13px", color: "#666" }}>
                      {selectedDriver.vehicle_type} ·{" "}
                      {selectedDriver.ratings.toFixed(1)} ★
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                flex: "0 0 auto",
                marginLeft: "20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "15px 20px",
                  borderRadius: "6px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  marginBottom: "10px",
                  minWidth: "150px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "#777",
                    marginBottom: "5px",
                  }}
                >
                  Total Price
                </p>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#e67e22",
                  }}
                >
                  KES {searchResults.price.toFixed(0)}
                </p>
              </div>

              {searchResults.appliedPromoCode && (
                <div
                  style={{
                    backgroundColor: "#e8f5e9",
                    border: "1px solid #c8e6c9",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    marginTop: "5px",
                    fontSize: "13px",
                    color: "#2e7d32",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {searchResults.appliedPromoCode}
                  </span>
                  : {searchResults.discount}% off applied
                </div>
              )}
            </div>
          </div>

          {/* Promo code section */}
          <div
            style={{
              marginBottom: "25px",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "8px",
              border: "1px dashed #ddd",
            }}
          >
            <label
              style={{ ...labelStyles, marginBottom: "10px" }}
              htmlFor="promo_code"
            >
              Have a Promo Code?
            </label>
            <div style={{ display: "flex" }}>
              <input
                type="text"
                id="promo_code"
                name="promo_code"
                value={formData.promo_code}
                onChange={handleChange}
                style={{
                  ...inputStyles,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: 0,
                }}
                placeholder="Enter promo code"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                style={{
                  backgroundColor: "#e67e22",
                  color: "white",
                  border: "none",
                  padding: "0 20px",
                  borderTopRightRadius: "6px",
                  borderBottomRightRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
                disabled={loading}
              >
                Apply
              </button>
            </div>
            <p style={hintTextStyles}>
              Try: KARIBU10, SAFARI20, NAIROBI25, MADARAKA50, UHURU30
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #eee",
              paddingTop: "20px",
            }}
          >
            <button
              style={{
                background: "none",
                border: "none",
                color: "#e67e22",
                fontWeight: "bold",
                cursor: "pointer",
                padding: "10px 0",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => setBookingStep(2)}
              disabled={loading}
            >
              ← Back to drivers
            </button>

            <button
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                padding: "12px 25px",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={handleBookDriver}
              disabled={loading}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <span>Confirm & Book Now</span>
              )}
            </button>
          </div>

          {/* Additional information */}
          <div
            style={{
              marginTop: "25px",
              padding: "15px",
              backgroundColor: "#f9f9f9",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <p style={{ marginBottom: "5px", fontWeight: "bold" }}>
              Booking Information:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "5px" }}>
              <li style={{ marginBottom: "3px" }}>
                Payment will be processed after your trip is completed.
              </li>
              <li style={{ marginBottom: "3px" }}>
                Cancel up to 5 minutes before pickup with no fee.
              </li>
              <li style={{ marginBottom: "3px" }}>
                Contact your driver directly after booking is confirmed.
              </li>
              <li>Track your driver in real-time after booking.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: "30px",
          borderTop: "1px solid #eee",
          paddingTop: "20px",
          color: "#888",
          fontSize: "14px",
        }}
      >
        <p>© 2025 Movers Web App. All Rights Reserved.</p>
        <p style={{ marginTop: "5px" }}>
          Safe, Reliable Transport Across Kenya
        </p>
      </div>
    </div>
  );
};

export default BookDriver;
