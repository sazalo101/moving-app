import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const TrackDriver = () => {
  const { bookingId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reference for simulation interval
  const simulationIntervalRef = useRef(null);

  // Dummy data for tracking - Starting point in Nairobi
  const dummyTrackingData = {
    location: "-1.2864,36.8172", // Nairobi CBD coordinates
    heading: 45,
    speed: 35,
    last_updated: new Date().toISOString()
  };

  // Dummy data for booking details with Kenyan context
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
    // Simulate initial data loading
    const loadDummyData = () => {
      setTimeout(() => {
        setTrackingData(dummyTrackingData);
        setBookingDetails(dummyBookingDetails);
        setLoading(false);
      }, 1500); // Simulate a short loading time
    };

    loadDummyData();

    // Simulate real-time updates by slightly changing the location every few seconds
    let movingNorth = true;
    let movingEast = true;
    
    simulationIntervalRef.current = setInterval(() => {
      setTrackingData(prevData => {
        if (!prevData) return dummyTrackingData;
        
        const [lat, lng] = prevData.location.split(',').map(Number);
        
        // Randomly change direction occasionally
        if (Math.random() < 0.2) movingNorth = !movingNorth;
        if (Math.random() < 0.2) movingEast = !movingEast;
        
        // Update location by a small random amount
        const latDelta = (Math.random() * 0.001) * (movingNorth ? 1 : -1);
        const lngDelta = (Math.random() * 0.001) * (movingEast ? 1 : -1);
        
        return {
          ...prevData,
          location: `${(lat + latDelta).toFixed(6)},${(lng + lngDelta).toFixed(6)}`,
          speed: Math.floor(25 + Math.random() * 20), // Random speed between 25-45 kph
          last_updated: new Date().toISOString()
        };
      });
    }, 5000); // Update every 5 seconds

    // Cleanup interval on component unmount
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <Link to="/user/orders" className="text-blue-600 hover:text-blue-800">
          ← Back to Orders
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Track Driver</h1>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>Loading tracking information...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Booking Information */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              
              <div className="space-y-3">
                <p>
                  <span className="font-medium">Booking ID:</span> #{bookingDetails.booking_id}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {bookingDetails.status}
                </p>
                <p>
                  <span className="font-medium">From:</span> {bookingDetails.pickup_location}
                </p>
                <p>
                  <span className="font-medium">To:</span> {bookingDetails.dropoff_location}
                </p>
                
                <div className="border-t pt-3 mt-3">
                  <h3 className="font-medium mb-2">Driver Information</h3>
                  <p>
                    <span className="font-medium">Name:</span> {bookingDetails.driver_name}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {bookingDetails.driver_phone}
                  </p>
                  <p>
                    <span className="font-medium">Vehicle:</span> {bookingDetails.vehicle_color} {bookingDetails.vehicle}
                  </p>
                  <p>
                    <span className="font-medium">License:</span> {bookingDetails.license_plate}
                  </p>
                </div>
                
                <button className="mt-4 bg-blue-600 text-white w-full py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  Call Driver
                </button>
                
                <button className="mt-2 bg-gray-200 text-gray-800 w-full py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                  Message Driver
                </button>
              </div>
            </div>
            
            {/* Fare estimate */}
            <div className="bg-white rounded-lg shadow p-6 mt-4">
              <h2 className="text-xl font-semibold mb-4">Fare Estimate</h2>
              <div className="flex justify-between mb-2">
                <span>Base fare</span>
                <span>KSh 200</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Distance (5.3 km)</span>
                <span>KSh 350</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Time</span>
                <span>KSh 100</span>
              </div>
              <div className="border-t pt-2 mt-2 font-medium flex justify-between">
                <span>Total</span>
                <span>KSh 650</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Paid via M-PESA</p>
            </div>
          </div>
          
          {/* Tracking Map & Updates */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Driver Location</h2>
              {trackingData && trackingData.location ? (
                <div>
                  <div className="h-64 w-full bg-gray-200 flex items-center justify-center rounded-lg mb-4">
                    {/* Replace with an actual map component like Google Maps or Leaflet */}
                    <div className="text-center">
                      <p className="font-medium">Map Placeholder</p>
                      <p>Driver at coordinates: {trackingData.location}</p>
                      <p className="mt-2 text-sm text-gray-600">
                        Heading: {trackingData.heading}° | Speed: {trackingData.speed} km/h
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <p>Last updated: {formatDateTime(trackingData.last_updated)}</p>
                    <p className="text-green-600">Driver is on the way</p>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="flex">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        1
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">Driver accepted your booking</p>
                        <p className="text-sm text-gray-600">10:32 AM</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        2
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">Driver is on the way</p>
                        <p className="text-sm text-gray-600">10:36 AM</p>
                      </div>
                    </div>
                    <div className="flex opacity-50">
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">
                        3
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">Arriving at Junction Mall</p>
                        <p className="text-sm text-gray-600">Estimated: 10:45 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Location data unavailable.</p>
              )}
            </div>
            
            {/* Traffic info */}
            <div className="bg-white rounded-lg shadow p-6 mt-4">
              <h2 className="text-xl font-semibold mb-4">Traffic Information</h2>
              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <p className="text-amber-800 font-medium">Moderate traffic on Ngong Road</p>
                <p className="text-sm text-amber-700 mt-1">Expect slight delays of 5-10 minutes due to construction near Adams Arcade</p>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p>Estimated time of arrival: 10:45 AM</p>
                <p className="mt-1">Distance to pickup: 2.3 km</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackDriver;