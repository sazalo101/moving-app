import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API_ENDPOINTS from '../../config/api';
import './AvailableOrders.css';
import './DriverPages.css';

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const [completingOrderId, setCompletingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Get driver ID from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('Please log in to view available orders');
        setIsLoading(false);
        return;
      }

      let driverId = user.driver_id;

      // Fallback: fetch driver_id if not in localStorage
      if (!driverId && user.id && user.role === 'driver') {
        try {
          const driverResponse = await fetch(API_ENDPOINTS.GET_DRIVER_BY_USER(user.id));
          const driverData = await driverResponse.json();
          if (driverResponse.ok && driverData.driver_id) {
            driverId = driverData.driver_id;
            user.driver_id = driverId;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (err) {
          console.error('Error fetching driver info:', err);
        }
      }

      if (!driverId) {
        toast.error('Driver information not found');
        setIsLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.AVAILABLE_ORDERS(driverId));
      const data = await response.json();
      
      if (response.ok) {
        // Enhance orders with calculated fields
        const enhancedOrders = data.orders.map(order => ({
          ...order,
          estimated_time: calculateEstimatedTime(order.distance),
          priority: calculatePriority(order.created_at, order.price),
          created_at: formatTimeAgo(order.created_at)
        }));
        setOrders(enhancedOrders);
      } else {
        toast.error('Failed to load available orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load available orders');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimatedTime = (distance) => {
    // Assuming average speed of 40 km/h in city traffic
    const minutes = Math.ceil((distance / 40) * 60);
    return `${minutes} mins`;
  };

  const calculatePriority = (createdAt, price) => {
    const now = new Date();
    const created = new Date(createdAt);
    const minutesAgo = (now - created) / (1000 * 60);
    
    // High priority: Order is more than 15 mins old OR price is high
    if (minutesAgo > 15 || price > 1500) return 'high';
    // Low priority: Order is less than 5 mins old AND price is low
    if (minutesAgo < 5 && price < 800) return 'low';
    // Normal priority: Everything else
    return 'normal';
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'just now';
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const handleAcceptOrder = async (bookingId) => {
    try {
      setAcceptingOrderId(bookingId);
      
      const response = await fetch(API_ENDPOINTS.ACCEPT_ORDER(bookingId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the order status to 'accepted' instead of removing it
        setOrders(orders.map(order => 
          order.booking_id === bookingId 
            ? { ...order, status: 'accepted' }
            : order
        ));
        toast.success('Order accepted successfully! You can now complete the trip.');
      } else {
        toast.error(data.error || 'Failed to accept order');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order. Please try again.');
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleCompleteOrder = async (bookingId) => {
    try {
      setCompletingOrderId(bookingId);
      
      const response = await fetch(API_ENDPOINTS.COMPLETE_ORDER(bookingId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Remove the completed order from the list
        setOrders(orders.filter(order => order.booking_id !== bookingId));
        toast.success('Order completed successfully! Payment has been released.');
      } else {
        toast.error(data.error || 'Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order. Please try again.');
    } finally {
      setCompletingOrderId(null);
    }
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
                  : `${orders.filter(o => o.status === 'pending').length} to accept, ${orders.filter(o => o.status === 'accepted').length} to complete`}
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
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: '500' }}>Your Earnings (90%)</p>
                      <p style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>KES {(order.price * 0.9).toFixed(0)}</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '8px', fontWeight: '400' }}>Total: KES {order.price.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="order-body">
                  {/* Priority & Time & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span className={`priority-badge-${order.priority}`}>
                      {order.priority.toUpperCase()}
                    </span>
                    {order.status === 'accepted' && (
                      <span style={{ 
                        padding: '4px 8px', 
                        fontSize: '11px', 
                        background: '#10b981', 
                        color: 'white', 
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        ✓ ACCEPTED
                      </span>
                    )}
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
                      {order.customer_phone && (
                        <p style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>
                          📞 {order.customer_phone}
                        </p>
                      )}
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

                  {/* Action Button */}
                  {order.status === 'pending' ? (
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
                  ) : (
                    <button
                      onClick={() => handleCompleteOrder(order.booking_id)}
                      disabled={completingOrderId === order.booking_id}
                      className={`btn ${completingOrderId === order.booking_id ? '' : 'btn-primary'}`}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '14px',
                        background: completingOrderId === order.booking_id ? '#9ca3af' : '#3b82f6',
                        cursor: completingOrderId === order.booking_id ? 'not-allowed' : undefined
                      }}
                    >
                      {completingOrderId === order.booking_id ? (
                        <>
                          <div className="loading-spinner" style={{ width: '14px', height: '14px', border: '2px solid #e5e7eb', borderTop: '2px solid white' }}></div>
                          Completing...
                        </>
                      ) : (
                        <>
                          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Complete Order
                        </>
                      )}
                    </button>
                  )}
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