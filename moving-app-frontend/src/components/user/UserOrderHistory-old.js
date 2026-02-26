import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserOrderHistory = () => {
  const dummyOrders = [
    {
      id: 1001,
      status: 'pending',
      created_at: new Date(2025, 2, 18, 10, 30).toISOString(),
      pickup_location: '123 Main St, Downtown',
      dropoff_location: '456 Park Ave, Uptown',
      driver_id: 'D-501',
      price: 25.5
    },
    {
      id: 1002,
      status: 'accepted',
      created_at: new Date(2025, 2, 17, 14, 15).toISOString(),
      pickup_location: '789 Broadway, Midtown',
      dropoff_location: '321 River Rd, Westside',
      driver_id: 'D-342',
      price: 18.75
    },
    {
      id: 1003,
      status: 'completed',
      created_at: new Date(2025, 2, 15, 9, 45).toISOString(),
      pickup_location: '555 Ocean Dr, Seaside',
      dropoff_location: '777 Mountain View, Highlands',
      driver_id: 'D-128',
      price: 32.0
    },
    {
      id: 1004,
      status: 'cancelled',
      created_at: new Date(2025, 2, 10, 16, 20).toISOString(),
      pickup_location: '999 College Blvd, University',
      dropoff_location: '888 Market St, Financial District',
      driver_id: 'D-205',
      price: 15.25
    }
  ];

  const [orders, setOrders] = useState(dummyOrders);
  const [filter, setFilter] = useState('all');

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  const handleCancelOrder = bookingId => {
    try {
      setOrders(
        orders.map(order =>
          order.id === bookingId ? { ...order, status: 'cancelled' } : order
        )
      );
      toast.success('Order cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-6">Your Order History</h1>

      {/* Filter tabs */}
      <div className="mb-6 border-b flex justify-center">
        <div className="flex space-x-6">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              className={`py-2 px-1 border-b-2 ${
                filter === status ? 'border-blue-500 text-blue-500' : 'border-transparent'
              }`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">
            No {filter !== 'all' ? filter : ''} orders found.
          </p>
          <Link
            to="/user/book-driver"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Book a Driver
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4 text-center">
              <div className="md:flex md:justify-between md:items-center">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start">
                    <p className="font-medium text-lg">Booking #{order.id}</p>
                    <span
                      className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : order.status === 'accepted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{formatDate(order.created_at)}</p>
                  <p className="mt-2">
                    <span className="font-medium">From:</span> {order.pickup_location}
                  </p>
                  <p>
                    <span className="font-medium">To:</span> {order.dropoff_location}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Driver ID:</span> {order.driver_id}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Price:</span> ${order.price.toFixed(2)}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-center md:text-right">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="bg-red-100 text-red-700 py-1 px-3 rounded-md hover:bg-red-200 transition-colors mr-2"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {order.status === 'accepted' && (
                    <Link
                      to={`/user/track/${order.id}`}
                      className="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Track Driver
                    </Link>
                  )}
                  {order.status === 'completed' && (
                    <button className="bg-yellow-100 text-yellow-700 py-1 px-3 rounded-md hover:bg-yellow-200 transition-colors">
                      Leave a Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory;
