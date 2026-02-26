import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './DriverPages.css';

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);

  // Dummy data for available orders with more details
  const dummyOrders = [
    {
      booking_id: 1001,
      pickup_location: "JKIA - Jomo Kenyatta International Airport",
      dropoff_location: "Westlands, Nairobi",
      distance: 18.5,
      price: 1850,
      status: "pending",
      customer_name: "John Kamau",
      estimated_time: "25 mins",
      created_at: "5 mins ago",
      priority: "high"
    },
    {
      booking_id: 1002,
      pickup_location: "CBD, Moi Avenue",
      dropoff_location: "Karen Shopping Centre",
      distance: 12.2,
      price: 1220,
      status: "pending",
      customer_name: "Sarah Wanjiku",
      estimated_time: "18 mins",
      created_at: "8 mins ago",
      priority: "normal"
    },
    {
      booking_id: 1003,
      pickup_location: "Kilimani, Yaya Centre",
      dropoff_location: "Gigiri, UN Complex",
      distance: 7.5,
      price: 750,
      status: "pending",
      customer_name: "David Omondi",
      estimated_time: "12 mins",
      created_at: "12 mins ago",
      priority: "normal"
    },
    {
      booking_id: 1004,
      pickup_location: "Thika Road Mall",
      dropoff_location: "Ruiru Town",
      distance: 15.6,
      price: 1560,
      status: "pending",
      customer_name: "Grace Muthoni",
      estimated_time: "22 mins",
      created_at: "3 mins ago",
      priority: "normal"
    },
    {
      booking_id: 1005,
      pickup_location: "Upper Hill, Nairobi Hospital",
      dropoff_location: "South C, Mugoya Estate",
      distance: 6.3,
      price: 630,
      status: "pending",
      customer_name: "Peter Njoroge",
      estimated_time: "10 mins",
      created_at: "15 mins ago",
      priority: "low"
    }
  ];

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = () => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setOrders(dummyOrders);
      setIsLoading(false);
    }, 800);
  };

  const handleAcceptOrder = async (bookingId) => {
    try {
      setAcceptingOrderId(bookingId);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Remove the accepted order from the list
      setOrders(orders.filter(order => order.booking_id !== bookingId));
      toast.success('Order accepted successfully! You can now start the trip.');
      setAcceptingOrderId(null);
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order. Please try again.');
      setAcceptingOrderId(null);
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-700 border border-red-200',
      normal: 'bg-blue-100 text-blue-700 border border-blue-200',
      low: 'bg-gray-100 text-gray-700 border border-gray-200'
    };
    return badges[priority] || badges.normal;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '24px', color: '#4b5563', fontSize: '18px', fontWeight: '500' }}>
            Loading available orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '32px' }}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: 'linear-gradient(to right, #2563eb, #9333ea)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Available Orders
                </span>
                {orders.length > 0 && (
                  <span style={{
                    background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '3px 12px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {orders.length}
                  </span>
                )}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {orders.length === 0 
                  ? 'No orders available right now' 
                  : `${orders.length} order${orders.length !== 1 ? 's' : ''} waiting for you`}
              </p>
            </div>
            
            <button 
              onClick={fetchOrders}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg style={{ width: '20px', height: '20px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>No Orders Available</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px', maxWidth: '400px', margin: '0 auto 16px' }}>
              There are currently no pending orders. New orders will appear here automatically.
            </p>
            <div style={{
              background: 'linear-gradient(to right, #eff6ff, #f5f3ff)',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '12px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <p style={{ color: '#374151', fontSize: '12px' }}>
                <strong style={{ color: '#2563eb' }}>Tip:</strong> Keep this page open and we'll notify you when new orders arrive.
              </p>
            </div>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order.booking_id} className="order-card">
                {/* Card Header */}
                <div className="order-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: '500' }}>Order ID</p>
                      <p style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>#{order.booking_id}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: '500' }}>Earnings</p>
                      <p style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>KES {order.price.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="order-body">
                  {/* Priority & Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span className={`priority-badge-${order.priority}`}>
                      {order.priority.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Posted {order.created_at}</span>
                  </div>

                  {/* Customer Info */}
                  <div className="customer-info">
                    <div style={{ background: '#dbeafe', borderRadius: '50%', padding: '4px' }}>
                      <svg style={{ width: '12px', height: '12px', color: '#2563eb' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>Customer</p>
                      <p style={{ fontWeight: '600', color: '#1f2937' }}>{order.customer_name}</p>
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="route-display">
                    {/* Pickup */}
                    <div className="pickup-location">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="location-marker-pickup">
                          <svg style={{ width: '10px', height: '10px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                        <div className="location-connector"></div>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#059669', fontWeight: '600', marginBottom: '4px' }}>PICKUP</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', lineHeight: '1.3' }}>{order.pickup_location}</p>
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div className="dropoff-location">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="location-marker-dropoff">
                          <svg style={{ width: '10px', height: '10px' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', marginBottom: '4px' }}>DROP-OFF</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', lineHeight: '1.3' }}>{order.dropoff_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="trip-details-grid">
                    <div className="trip-detail-box trip-detail-box-blue">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <svg style={{ width: '11px', height: '11px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Distance</p>
                      </div>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>{order.distance} km</p>
                    </div>
                    
                    <div className="trip-detail-box trip-detail-box-purple">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <svg style={{ width: '11px', height: '11px', color: '#9333ea' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Est. Time</p>
                      </div>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#9333ea' }}>{order.estimated_time}</p>
                    </div>
                  </div>

                  {/* Accept Button */}
                  <button
                    onClick={() => handleAcceptOrder(order.booking_id)}
                    disabled={acceptingOrderId === order.booking_id}
                    className={`btn ${acceptingOrderId === order.booking_id ? '' : 'btn-success'}`}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      background: acceptingOrderId === order.booking_id ? '#9ca3af' : undefined,
                      cursor: acceptingOrderId === order.booking_id ? 'not-allowed' : undefined
                    }}
                  >
                    {acceptingOrderId === order.booking_id ? (
                      <>
                        <div className="loading-spinner" style={{ width: '14px', height: '14px', border: '2px solid #e5e7eb', borderTop: '2px solid white' }}></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Accept Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableOrders;