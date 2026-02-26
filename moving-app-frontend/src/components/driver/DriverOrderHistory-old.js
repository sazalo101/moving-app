import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const DriverOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, accepted, cancelled
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  
  // Kenyan-localized dummy data
  const dummyOrders = [
    {
      booking_id: 5001,
      user_id: 123,
      user_name: "John Kamau",
      pickup_location: "JKIA - Jomo Kenyatta International Airport",
      dropoff_location: "Westlands, Nairobi",
      status: "completed",
      created_at: "2026-02-20T14:30:00Z",
      price: 1850,
      distance: 18.5,
      payment_method: "M-Pesa"
    },
    {
      booking_id: 5002,
      user_id: 124,
      user_name: "Mary Wanjiku",
      pickup_location: "Thika Road Mall",
      dropoff_location: "CBD, Moi Avenue",
      status: "accepted",
      created_at: "2026-02-22T09:15:00Z",
      price: 950,
      distance: 12.3,
      payment_method: "M-Pesa"
    },
    {
      booking_id: 5003,
      user_id: 125,
      user_name: "Peter Omondi",
      pickup_location: "Karen Shopping Centre",
      dropoff_location: "Nairobi Hospital, Upper Hill",
      status: "cancelled",
      created_at: "2026-02-18T17:45:00Z",
      price: 1200,
      distance: 8.7,
      payment_method: "M-Pesa"
    },
    {
      booking_id: 5004,
      user_id: 126,
      user_name: "Grace Akinyi",
      pickup_location: "Gigiri, UN Complex",
      dropoff_location: "Kilimani, Yaya Centre",
      status: "accepted",
      created_at: "2026-02-23T11:30:00Z",
      price: 850,
      distance: 6.4,
      payment_method: "M-Pesa"
    },
    {
      booking_id: 5005,
      user_id: 127,
      user_name: "David Kipchoge",
      pickup_location: "Ruiru Town",
      dropoff_location: "Two Rivers Mall",
      status: "completed",
      created_at: "2026-02-15T13:20:00Z",
      price: 1450,
      distance: 15.2,
      payment_method: "M-Pesa"
    },
    {
      booking_id: 5006,
      user_id: 128,
      user_name: "Sarah Njeri",
      pickup_location: "South C, Mugoya Estate",
      dropoff_location: "Garden City Mall",
      status: "completed",
      created_at: "2026-02-10T08:45:00Z",
      price: 650,
      distance: 4.8,
      payment_method: "M-Pesa"
    },
    {
      booking_id: 5007,
      user_id: 129,
      user_name: "James Mwangi",
      pickup_location: "Ngong Road, Prestige Plaza",
      dropoff_location: "Industrial Area",
      status: "completed",
      created_at: "2026-02-08T16:20:00Z",
      price: 890,
      distance: 9.1,
      payment_method: "M-Pesa"
    },
    {
      booking_id: 5008,
      user_id: 130,
      user_name: "Alice Wambui",
      pickup_location: "Kasarani, Mwiki",
      dropoff_location: "CBD, Railways Station",
      status: "completed",
      created_at: "2026-02-05T07:30:00Z",
      price: 1150,
      distance: 13.6,
      payment_method: "M-Pesa"
    }
  ];
  
  useEffect(() => {
    fetchOrderHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchOrderHistory = async () => {
    try {
      setIsLoading(true);
      // Simulate network delay
      setTimeout(() => {
        setOrders(dummyOrders);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('Failed to load order history');
      setIsLoading(false);
    }
  };
  
  const handleCompleteOrder = async (bookingId) => {
    try {
      setCompletingOrderId(bookingId);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the order status in the local state
      setOrders(orders.map(order => 
        order.booking_id === bookingId 
          ? {...order, status: 'completed'} 
          : order
      ));
      
      toast.success('Order completed! Funds released from escrow.');
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order');
    } finally {
      setCompletingOrderId(null);
    }
  };
  
  const handleCancelOrder = async (bookingId) => {
    try {
      setCancellingOrderId(bookingId);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the order status in the local state
      setOrders(orders.map(order => 
        order.booking_id === bookingId 
          ? {...order, status: 'cancelled'} 
          : order
      ));
      
      toast.success('Order cancelled. Refund processed.');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };
  
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300';
      case 'accepted':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-300';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-300';
      default:
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300';
    }
  };

  const getStatusIcon = (status) => {
    // Removed emoji icons for cleaner interface
    return null;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatistics = () => {
    const completed = orders.filter(o => o.status === 'completed').length;
    const active = orders.filter(o => o.status === 'accepted').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalEarnings = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.price, 0);
    return { completed, active, cancelled, totalEarnings };
  };

  const stats = getStatistics();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading order history...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Order History</h1>
          <p className="mt-1 text-sm text-gray-500">Track all your completed and active deliveries</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.completed}</p>
            <p className="text-green-100 text-sm">Completed Orders</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.active}</p>
            <p className="text-blue-100 text-sm">Active Orders</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.cancelled}</p>
            <p className="text-red-100 text-sm">Cancelled Orders</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">KES {stats.totalEarnings.toLocaleString()}</p>
            <p className="text-purple-100 text-sm">Total Earnings</p>
          </div>
        </div>
      
        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Filter Orders</h2>
            <span className="text-sm text-gray-500">{filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                📋 All Orders
              </span>
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                filter === 'accepted' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                🚗 Active ({stats.active})
              </span>
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                filter === 'completed' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                Completed ({stats.completed})
              </span>
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                filter === 'cancelled' 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                Cancelled ({stats.cancelled})
              </span>
            </button>
          </div>
        </div>
      
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No Orders Found</h2>
            <p className="text-lg text-gray-500 mb-6">
              {filter === 'all' 
                ? "You haven't taken any orders yet. Start accepting orders to see your history here." 
                : `You don't have any ${filter} orders.`}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                View All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.booking_id} className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-1 overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(order.status)}</span>
                      <div>
                        <p className="text-white font-bold text-lg">#{order.booking_id}</p>
                        <p className="text-blue-100 text-sm">Order ID</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-2xl font-bold">KES {order.price.toFixed(0)}</p>
                      <p className="text-blue-100 text-sm">{order.distance} km</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">CUSTOMER</p>
                          <p className="font-semibold text-gray-900">{order.user_name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Date & Status */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-purple-100 rounded-full p-2">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">DATE & TIME</p>
                          <p className="font-semibold text-gray-900 text-sm">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Display */}
                  <div className="space-y-3 mb-6">
                    {/* Pickup */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="bg-green-500 rounded-full p-2 shadow-md">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                        <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-red-500"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-green-600 font-bold mb-1">PICKUP LOCATION</p>
                        <p className="text-sm font-medium text-gray-900">{order.pickup_location}</p>
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div className="flex gap-3">
                      <div className="bg-red-500 rounded-full p-2 shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-red-600 font-bold mb-1">DROP-OFF LOCATION</p>
                        <p className="text-sm font-medium text-gray-900">{order.dropoff_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${getStatusBadgeClass(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {order.status === 'accepted' && (
                        <>
                          <button 
                            onClick={() => handleCompleteOrder(order.booking_id)}
                            disabled={completingOrderId === order.booking_id}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                          >
                            {completingOrderId === order.booking_id ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Completing...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Complete Order
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => handleCancelOrder(order.booking_id)}
                            disabled={cancellingOrderId === order.booking_id}
                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                          >
                            {cancellingOrderId === order.booking_id ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {(order.status === 'completed' || order.status === 'cancelled') && (
                        <div className="text-gray-400 italic text-sm py-2 px-4">
                          {order.status === 'completed' ? 'Order completed' : 'Order cancelled'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverOrderHistory;