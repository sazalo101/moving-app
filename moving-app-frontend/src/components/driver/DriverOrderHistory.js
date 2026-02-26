import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './DriverOrderHistory.css';

const DriverOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      <div className="order-history-loading">
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner-container">
            <div className="loading-spinner-outer"></div>
            <div className="loading-spinner-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="loading-text">Loading order history...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <div className="order-history-header-content">
          <h1 className="order-history-title">Order History</h1>
          <p className="order-history-subtitle">Track all your completed and active deliveries</p>
        </div>
      </div>

      <div className="order-history-content">
        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-completed">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="stat-value">{stats.completed}</p>
            <p className="stat-label">Completed Orders</p>
          </div>

          <div className="stat-card stat-card-active">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="stat-value">{stats.active}</p>
            <p className="stat-label">Active Orders</p>
          </div>

          <div className="stat-card stat-card-cancelled">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="stat-value">{stats.cancelled}</p>
            <p className="stat-label">Cancelled Orders</p>
          </div>

          <div className="stat-card stat-card-earnings">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="stat-value">KES {stats.totalEarnings.toLocaleString()}</p>
            <p className="stat-label">Total Earnings</p>
          </div>
        </div>
      
        {/* Filter Controls */}
        <div className="filter-section">
          <div className="filter-header">
            <h2 className="filter-title">Filter Orders</h2>
            <span className="filter-count">{filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}</span>
          </div>
          <div className="filter-buttons">
            <button
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`filter-btn ${filter === 'accepted' ? 'filter-btn-active-status' : 'filter-btn-inactive'}`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`filter-btn ${filter === 'completed' ? 'filter-btn-completed' : 'filter-btn-inactive'}`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`filter-btn ${filter === 'cancelled' ? 'filter-btn-cancelled' : 'filter-btn-inactive'}`}
            >
              Cancelled ({stats.cancelled})
            </button>
          </div>
        </div>
      
        {filteredOrders.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-icon-wrapper">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="empty-title">No Orders Found</h2>
            <p className="empty-description">
              {filter === 'all' 
                ? "You haven't taken any orders yet. Start accepting orders to see your history here." 
                : `You don't have any ${filter} orders.`}
            </p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="empty-action-btn">
                View All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.booking_id} className="order-card">
                <div className="order-card-header">
                  <div className="order-header-content">
                    <div className="order-header-left">
                      <div>
                        <p className="order-id-label">#{order.booking_id}</p>
                        <p className="order-id-text">Order ID</p>
                      </div>
                    </div>
                    <div className="order-header-right">
                      <p className="order-price">KES {order.price.toFixed(0)}</p>
                      <p className="order-distance">{order.distance} km</p>
                    </div>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-info-grid">
                    <div className="info-box">
                      <div className="info-box-header">
                        <div className="info-icon-blue">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="info-label">CUSTOMER</p>
                          <p className="info-value">{order.user_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="info-box">
                      <div className="info-box-header">
                        <div className="info-icon-purple">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="info-label">DATE & TIME</p>
                          <p className="info-value">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Display */}
                  <div className="route-container">
                    <div className="route-item">
                      <div className="route-icon-column">
                        <div className="route-marker-pickup">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                        <div className="route-connector"></div>
                      </div>
                      <div className="route-details">
                        <p className="route-label-pickup">PICKUP LOCATION</p>
                        <p className="route-address">{order.pickup_location}</p>
                      </div>
                    </div>

                    <div className="route-item">
                      <div className="route-marker-dropoff">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="route-details">
                        <p className="route-label-dropoff">DROP-OFF LOCATION</p>
                        <p className="route-address">{order.dropoff_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge and Actions */}
                  <div className="order-footer">
                    <div>
                      <span className={`status-badge status-badge-${order.status === 'accepted' ? 'active' : order.status}`}>
                        {order.status === 'accepted' ? 'Active' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="action-buttons">
                      {order.status === 'accepted' && (
                        <>
                          <button 
                            onClick={() => handleCompleteOrder(order.booking_id)}
                            disabled={completingOrderId === order.booking_id}
                            className="action-btn action-btn-complete"
                          >
                            {completingOrderId === order.booking_id ? (
                              <>
                                <svg className="action-btn-spinner" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Completing...
                              </>
                            ) : (
                              <>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Complete
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => handleCancelOrder(order.booking_id)}
                            disabled={cancellingOrderId === order.booking_id}
                            className="action-btn action-btn-cancel"
                          >
                            {cancellingOrderId === order.booking_id ? (
                              <>
                                <svg className="action-btn-spinner" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {(order.status === 'completed' || order.status === 'cancelled') && (
                        <div className="order-completed-text">
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
