import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import API_ENDPOINTS from '../../config/api';
import DriverLocationTracker from './DriverLocationTracker';
import './DriverPages.css';
import './DriverDashboard.css';

const DriverDashboard = () => {
  // State variables
  const [driver, setDriver] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [pendingEscrow, setPendingEscrow] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [cancelledOrders, setCancelledOrders] = useState(0);
  const [ratings, setRatings] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('Please log in to view dashboard');
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

      // Fetch wallet/earnings data
      const earningsResponse = await fetch(API_ENDPOINTS.DRIVER_EARNINGS(driverId));
      const earningsData = await earningsResponse.json();

      if (earningsResponse.ok) {
        setEarnings(earningsData.available_earnings || 0);
        setPendingEscrow(earningsData.pending_in_escrow || 0);
        setCompletedOrders(earningsData.completed_orders || 0);
        setPendingOrders(earningsData.pending_orders || 0);
        setRatings(earningsData.ratings || 0);
      }

      // Fetch verification status
      try {
        const verifyResponse = await fetch(API_ENDPOINTS.VERIFICATION_STATUS(driverId));
        const verifyData = await verifyResponse.json();
        if (verifyResponse.ok) {
          setVerificationStatus(verifyData.verification_status || 'pending');
        }
      } catch (err) {
        console.error('Error fetching verification status:', err);
      }

      // Fetch available orders (pending orders assigned to driver)
      try {
        const ordersResponse = await fetch(API_ENDPOINTS.AVAILABLE_ORDERS(driverId));
        const ordersData = await ordersResponse.json();
        if (ordersResponse.ok) {
          setAvailableOrders(ordersData.orders || []);
        }
      } catch (err) {
        console.error('Error fetching available orders:', err);
      }

      // Fetch order history to get cancelled and active counts
      try {
        const historyResponse = await fetch(API_ENDPOINTS.DRIVER_ORDER_HISTORY(driverId));
        const historyData = await historyResponse.json();
        if (historyResponse.ok) {
          const allOrders = historyData.orders || [];
          setTotalOrders(allOrders.length);
          
          // Count cancelled orders
          const cancelled = allOrders.filter(order => order.status === 'cancelled').length;
          setCancelledOrders(cancelled);
          
          // Set active orders (accepted orders)
          const active = allOrders.filter(order => order.status === 'accepted');
          setActiveOrders(active);
        }
      } catch (err) {
        console.error('Error fetching order history:', err);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    toast.success(`You are now ${!isAvailable ? 'available' : 'unavailable'} for new orders`);
  };

  const updateLocation = () => {
    toast.info('Getting your location...');
    setTimeout(() => {
      toast.success('Location updated successfully');
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const totalPotential = earnings + pendingEscrow;

  return (
    <div className="driver-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-container">
          <div className="header-content">
            <div>
              <h1 className="header-title">
                Driver Dashboard
              </h1>
              <p className="header-subtitle">
                Welcome back! Manage your rides and earnings
              </p>
            </div>
            <button onClick={fetchDriverData} className="btn btn-primary">
              <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Verification Alert */}
        {verificationStatus !== 'approved' && (
          <div className={`verification-alert ${verificationStatus === 'rejected' ? 'rejected' : 'pending'}`}>
            <div className="alert-content">
              <div className="verification-alert-icon">
                {verificationStatus === 'pending' && '⚠️'}
                {verificationStatus === 'under_review' && '🔍'}
                {verificationStatus === 'rejected' && '❌'}
              </div>
              <div className="alert-message">
                <h3>
                  {verificationStatus === 'pending' && 'Account Verification Required'}
                  {verificationStatus === 'under_review' && 'Verification Under Review'}
                  {verificationStatus === 'rejected' && 'Verification Rejected'}
                </h3>
                <p>
                  {verificationStatus === 'pending' && 'You need to submit verification documents to start accepting orders.'}
                  {verificationStatus === 'under_review' && 'Your verification documents are being reviewed by our admin team.'}
                  {verificationStatus === 'rejected' && 'Your verification was rejected. Please resubmit with correct documents.'}
                </p>
                <Link 
                  to="/driver/verification"
                  className={`btn ${verificationStatus === 'rejected' ? 'btn-danger' : 'btn-warning'}`}
                >
                  {verificationStatus === 'pending' ? 'Submit Documents' : 'View Status'}
                  <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Driver Status Card */}
        <div className="status-card">
          <div className="status-card-content">
            <div className="status-info">
              <div className={isAvailable ? 'status-indicator-available' : 'status-indicator-unavailable'}>
                <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="status-title">
                  Driver Status
                  {verificationStatus === 'approved' ? (
                    <span className="badge-verified">✓ VERIFIED</span>
                  ) : (
                    <span className="badge-unverified">UNVERIFIED</span>
                  )}
                </h2>
                <p className={`status-text ${isAvailable ? 'status-available' : 'status-unavailable'}`}>
                  {isAvailable ? 'Available for Orders' : 'Unavailable'}
                </p>
              </div>
            </div>
            <div className="status-actions">
              <button onClick={updateLocation} className="btn btn-primary">
                <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Update Location
              </button>
              <button
                onClick={toggleAvailability}
                className={`btn ${isAvailable ? 'btn-danger' : 'btn-success'}`}
              >
                {isAvailable ? (
                  <>
                    <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Go Offline
                  </>
                ) : (
                  <>
                    <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Go Online
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Summary Card */}
        <div className="wallet-summary">
          <div className="wallet-header">
            <div>
              <h2>
                <svg className="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Driver Wallet
              </h2>
              <p>Your earnings and escrow balance</p>
            </div>
            <Link
              to="/driver/wallet"
              className="btn btn-primary wallet-link"
            >
              <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Full Wallet
            </Link>
          </div>

          {/* Money Flow Visualization */}
          <div className="wallet-metrics">
            {/* Available Balance */}
            <div className="wallet-metric">
              <div className="wallet-metric-header">
                <div className="wallet-metric-icon">
                  <svg className="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3>Available Now</h3>
              </div>
              <p className="amount">KES {earnings.toFixed(2)}</p>
              <p className="label">Ready to withdraw to M-Pesa</p>
            </div>

            {/* Pending in Escrow */}
            <div className="wallet-metric">
              <div className="wallet-metric-header">
                <div className="wallet-metric-icon">
                  <svg className="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3>In Escrow</h3>
              </div>
              <p className="amount">KES {pendingEscrow.toFixed(2)}</p>
              <p className="label">{pendingOrders} pending {pendingOrders === 1 ? 'order' : 'orders'}</p>
            </div>

            {/* Total Potential */}
            <div className="wallet-metric">
              <div className="wallet-metric-header">
                <div className="wallet-metric-icon">
                  <svg className="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3>Total Potential</h3>
              </div>
              <p className="amount">KES {totalPotential.toFixed(2)}</p>
              <p className="label">Complete orders to release</p>
            </div>
          </div>

          {/* Escrow Explanation */}
          {pendingOrders > 0 && (
            <div className="escrow-explanation">
              <div className="escrow-content">
                <svg className="icon-md" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="escrow-title">About Escrow</p>
                  <p>
                    When customers book your service, payment is held in escrow. After you complete delivery, funds are automatically released to your available balance for withdrawal.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* GPS Location Tracker */}
        {driver && (
          <DriverLocationTracker driverId={driver.driver_id || JSON.parse(localStorage.getItem('user'))?.driver_id} />
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Available Orders */}
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber">
              <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="stat-title">Available Orders</h3>
            <p className="stat-value stat-value-amber">{availableOrders.length}</p>
            <p className="stat-label">To accept or complete</p>
          </div>

          {/* Active Orders */}
          <div className="stat-card">
            <div className="stat-icon-blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="stat-title">Active Orders</h3>
            <p className="stat-value stat-value-blue">{activeOrders.length}</p>
            <p className="stat-label">In progress</p>
          </div>

          {/* Completed Orders */}
          <div className="stat-card">
            <div className="stat-icon-green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="stat-title">Completed Orders</h3>
            <p className="stat-value stat-value-green">{completedOrders}</p>
            <p className="stat-label">Total deliveries</p>
          </div>

          {/* Cancelled Orders */}
          <div className="stat-card">
            <div className="stat-icon-purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="stat-title">Cancelled Orders</h3>
            <p className="stat-value stat-value-purple">{cancelledOrders}</p>
            <p className="stat-label">Cancellations</p>
          </div>

          {/* Total Orders */}
          <div className="stat-card">
            <div className="stat-icon-blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="stat-title">Total Orders</h3>
            <p className="stat-value stat-value-blue">{totalOrders}</p>
            <p className="stat-label">All time</p>
          </div>

          {/* Rating */}
          <div className="stat-card">
            <div className="stat-icon-amber">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h3 className="stat-title">Your Rating</h3>
            <p className="stat-value stat-value-amber">{ratings.toFixed(1)} / 5.0</p>
            <p className="stat-label">Customer rating</p>
          </div>

          {/* Average Per Order */}
          <div className="stat-card">
            <div className="stat-icon-green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="stat-title">Avg Per Order</h3>
            <p className="stat-value stat-value-green">
              KES {completedOrders > 0 ? (earnings / completedOrders).toFixed(0) : '0'}
            </p>
            <p className="stat-label">Average earnings</p>
          </div>

          {/* Pending in Escrow Count */}
          <div className="stat-card">
            <div className="stat-icon-purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="stat-title">Pending in Escrow</h3>
            <p className="stat-value stat-value-purple">{pendingOrders}</p>
            <p className="stat-label">Orders to complete</p>
          </div>
        </div>

        {/* Recent Available Orders */}
        {availableOrders.length > 0 && (
          <div className="orders-section">
            <div className="orders-header">
              <h2>
                <svg className="icon-lg orders-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Available Orders
              </h2>
              <Link to="/driver/orders" className="btn btn-primary">
                View All
                <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="orders-list">
              {availableOrders.slice(0, 3).map((order) => (
                <div key={order.booking_id} className="order-item">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Booking #{order.booking_id}</h3>
                      <p>Customer: {order.customer_name}</p>
                      {order.customer_phone && (
                        <p className="customer-phone">
                          📞 {order.customer_phone}
                        </p>
                      )}
                    </div>
                    <div className="order-earnings">
                      <p className="order-earnings-amount">KES {(order.price * 0.9).toFixed(2)}</p>
                      <p className="order-earnings-total">Total: KES {order.price.toFixed(2)} (10% fee)</p>
                    </div>
                  </div>
                  <div className="order-route">
                    <div className="location-item">
                      <div className="location-marker pickup">📍</div>
                      <div className="location-info">
                        <p>From</p>
                        <address>{order.pickup_location}</address>
                      </div>
                    </div>
                    <div className="location-item">
                      <div className="location-marker dropoff">📍</div>
                      <div className="location-info">
                        <p>To</p>
                        <address>{order.dropoff_location}</address>
                      </div>
                    </div>
                  </div>
                  <div className="order-footer">
                    <span>Distance: {order.distance.toFixed(2)} km</span>
                    <span>
                      {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {availableOrders.length > 3 && (
              <div className="orders-more">
                <Link to="/driver/orders">
                  View {availableOrders.length - 3} more available {availableOrders.length - 3 === 1 ? 'order' : 'orders'} →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/driver/orders" className="action-card">
            <div className="action-icon action-icon-blue">
              <svg className="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="action-content">
              <h3>Available Orders</h3>
              <p>View and accept new orders</p>
            </div>
          </Link>

          <Link to="/driver/wallet" className="action-card">
            <div className="action-icon action-icon-green">
              <svg className="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="action-content">
              <h3>Wallet & Withdrawals</h3>
              <p>Manage earnings & withdraw</p>
            </div>
          </Link>

          <Link to="/driver/order-history" className="action-card">
            <div className="action-icon action-icon-purple">
              <svg className="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="action-content">
              <h3>Order History</h3>
              <p>View completed deliveries</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;