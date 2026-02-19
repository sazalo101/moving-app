import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  // Dummy data for available orders
  const dummyOrders = [
    {
      booking_id: 1001,
      pickup_location: "123 Main St, Downtown",
      dropoff_location: "456 Park Ave, Uptown",
      distance: 5.8,
      price: 24.50,
      status: "pending"
    },
    {
      booking_id: 1002,
      pickup_location: "789 Oak Dr, Westside",
      dropoff_location: "321 Pine St, Eastside",
      distance: 3.2,
      price: 18.75,
      status: "pending"
    },
    {
      booking_id: 1003,
      pickup_location: "555 Maple Rd, Northend",
      dropoff_location: "777 Elm Blvd, Southside",
      distance: 7.5,
      price: 32.20,
      status: "pending"
    },
    {
      booking_id: 1004,
      pickup_location: "888 Cedar Ln, Riverside",
      dropoff_location: "999 Birch Ave, Lakefront",
      distance: 4.6,
      price: 21.30,
      status: "pending"
    },
    {
      booking_id: 1005,
      pickup_location: "444 Willow St, College Town",
      dropoff_location: "222 Aspen Ct, Business District",
      distance: 6.3,
      price: 27.80,
      status: "pending"
    }
  ];

  useEffect(() => {
    // Simulate API call with dummy data
    const fetchOrders = () => {
      setIsLoading(true);
      // Simulate network delay
      setTimeout(() => {
        setOrders(dummyOrders);
        setIsLoading(false);
      }, 1000);
    };

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = () => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setOrders(dummyOrders);
      setIsLoading(false);
    }, 1000);
  };

  const handleAcceptOrder = async (bookingId) => {
    try {
      setIsAccepting(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Remove the accepted order from the list
      setOrders(orders.filter(order => order.booking_id !== bookingId));
      toast.success('Order accepted successfully!');
      setIsAccepting(false);
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Available Orders</h1>
        <button 
          onClick={fetchOrders}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Available Orders</h2>
          <p className="text-gray-500 mb-4">
            There are no pending orders available for acceptance at the moment.
          </p>
          <p className="text-gray-500">
            Check back later or refresh to see new orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.booking_id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Booking #{order.booking_id}</h2>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-gray-600 text-sm">Pickup Location:</p>
                    <p className="font-medium">{order.pickup_location}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Dropoff Location:</p>
                    <p className="font-medium">{order.dropoff_location}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Distance:</p>
                      <p className="font-medium">{order.distance} km</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600 text-sm">Price:</p>
                      <p className="font-medium text-green-600">${order.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAcceptOrder(order.booking_id)}
                  disabled={isAccepting}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isAccepting ? 'Accepting...' : 'Accept Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableOrders;