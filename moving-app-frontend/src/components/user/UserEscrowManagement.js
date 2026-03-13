import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './UserEscrowManagement.css';

const UserEscrowManagement = () => {
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [summary, setSummary] = useState({
    total_orders: 0,
    held_count: 0,
    released_count: 0,
    refunded_count: 0,
    held_total: 0,
    released_total: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, held, released, refunded

  useEffect(() => {
    fetchEscrowOrders();
  }, []);

  const fetchEscrowOrders = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      toast.error('Please login to view escrow details');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/user/escrow-orders/${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setEscrowOrders(data.escrow_orders || []);
        setSummary(data.summary || {});
      } else {
        toast.error(data.error || 'Failed to load escrow data');
        setEscrowOrders([]);
      }
    } catch (error) {
      console.error('Error fetching escrow orders:', error);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'held':
        return '#f59e0b'; // amber
      case 'released':
        return '#10b981'; // emerald
      case 'refunded':
        return '#3b82f6'; // blue
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'held':
        return '🔒';
      case 'released':
        return '✅';
      case 'refunded':
        return '💰';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  };

  const getBookingStatusBadge = (status) => {
    const badges = {
      'pending': { label: 'Pending Driver', color: '#f97316' },
      'accepted': { label: 'Accepted', color: '#3b82f6' },
      'in_progress': { label: 'In Progress', color: '#8b5cf6' },
      'completed': { label: 'Completed', color: '#10b981' },
      'cancelled': { label: 'Cancelled', color: '#ef4444' }
    };
    return badges[status] || { label: status, color: '#6b7280' };
  };

  const filteredOrders = selectedStatus === 'all'
    ? escrowOrders
    : escrowOrders.filter(order => order.escrow_status === selectedStatus);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-escrow-management">
      {/* Header */}
      <div className="escrow-header">
        <div className="escrow-title-section">
          <h1 className="escrow-title">🔐 Escrow Management</h1>
          <p className="escrow-subtitle">Track funds held in escrow for your orders</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="escrow-summary-grid">
        <div className="summary-card total-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <p className="summary-label">Total Orders</p>
            <p className="summary-value">{summary.total_orders}</p>
          </div>
        </div>

        <div className="summary-card held-card">
          <div className="summary-icon">🔒</div>
          <div className="summary-content">
            <p className="summary-label">In Escrow</p>
            <p className="summary-value">KES {summary.held_total.toFixed(2)}</p>
            <p className="summary-count">{summary.held_count} order{summary.held_count !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="summary-card released-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <p className="summary-label">Released Funds</p>
            <p className="summary-value">KES {summary.released_total.toFixed(2)}</p>
            <p className="summary-count">{summary.released_count} order{summary.released_count !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="summary-card refunded-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <p className="summary-label">Refunded</p>
            <p className="summary-value">{summary.refunded_count}</p>
            <p className="summary-count">order{summary.refunded_count !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="escrow-filters">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            All ({summary.total_orders})
          </button>
          <button
            className={`filter-tab ${selectedStatus === 'held' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('held')}
          >
            Held ({summary.held_count})
          </button>
          <button
            className={`filter-tab ${selectedStatus === 'released' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('released')}
          >
            Released ({summary.released_count})
          </button>
          <button
            className={`filter-tab ${selectedStatus === 'refunded' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('refunded')}
          >
            Refunded ({summary.refunded_count})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="escrow-loading">
          <div className="spinner"></div>
          <p>Loading escrow details...</p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && (
        <div className="escrow-content">
          {filteredOrders.length === 0 ? (
            <div className="escrow-empty">
              <div className="empty-icon">📭</div>
              <h3>No {selectedStatus !== 'all' ? selectedStatus : ''} orders</h3>
              <p>
                {selectedStatus === 'all'
                  ? 'You have no escrow orders yet. Book a driver to start!'
                  : `No orders with status "${selectedStatus}"`}
              </p>
            </div>
          ) : (
            <div className="escrow-orders-list">
              {filteredOrders.map((order, index) => (
                <div key={order.escrow_id} className="escrow-order-card">
                  {/* Order Header */}
                  <div className="order-card-header">
                    <div className="order-info-left">
                      <div className="booking-number">Order #{order.booking_id}</div>
                      <div className="driver-info">
                        <span className="driver-verify-badge">
                          {order.is_verified ? '✓' : 'unverified'} {order.driver_name}
                        </span>
                      </div>
                    </div>
                    <div className="escrow-status-badge" style={{ borderColor: getStatusColor(order.escrow_status) }}>
                      <span className="status-icon">{getStatusIcon(order.escrow_status)}</span>
                      <span className="status-text">{order.escrow_status.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="order-details-grid">
                    {/* Location Info */}
                    <div className="detail-item location-item">
                      <div className="detail-icon">📍</div>
                      <div className="detail-content">
                        <div className="location-from">
                          <span className="location-label">From:</span>
                          <span className="location-text">{order.pickup_location}</span>
                        </div>
                        <div className="location-arrow">→</div>
                        <div className="location-to">
                          <span className="location-label">To:</span>
                          <span className="location-text">{order.dropoff_location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Distance */}
                    <div className="detail-item">
                      <div className="detail-icon">📏</div>
                      <div className="detail-content">
                        <p className="detail-label">Distance</p>
                        <p className="detail-value">{order.distance} km</p>
                      </div>
                    </div>

                    {/* Booking Status */}
                    <div className="detail-item">
                      <div className="detail-icon">🚗</div>
                      <div className="detail-content">
                        <p className="detail-label">Booking Status</p>
                        <span className="booking-status-badge" style={{ backgroundColor: getBookingStatusBadge(order.booking_status).color }}>
                          {getBookingStatusBadge(order.booking_status).label}
                        </span>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="detail-item">
                      <div className="detail-icon">📅</div>
                      <div className="detail-content">
                        <p className="detail-label">Created</p>
                        <p className="detail-value">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Amount Breakdown */}
                  <div className="escrow-breakdown">
                    <div className="breakdown-section">
                      <div className="breakdown-item">
                        <span className="breakdown-label">Total Amount Paid</span>
                        <span className="breakdown-value primary">KES {order.amount_paid.toFixed(2)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Platform Fee (10%)</span>
                        <span className="breakdown-value fee">KES {order.platform_fee.toFixed(2)}</span>
                      </div>
                      <div className="breakdown-divider"></div>
                      <div className="breakdown-item total">
                        <span className="breakdown-label">Driver Will Receive</span>
                        <span className="breakdown-value">KES {order.driver_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="status-timeline">
                    <div className={`timeline-step ${order.escrow_status !== 'cancelled' && order.escrow_status !== 'refunded' ? 'active' : ''}`}>
                      <div className="timeline-marker">1</div>
                      <div className="timeline-content">
                        <p className="timeline-title">Payment Held</p>
                        <p className="timeline-time">{formatDate(order.created_at)}</p>
                      </div>
                    </div>

                    <div className={`timeline-step ${(order.escrow_status === 'released' || order.booking_status === 'completed') ? 'active' : ''}`}>
                      <div className="timeline-marker">2</div>
                      <div className="timeline-content">
                        <p className="timeline-title">Delivery Completed</p>
                        <p className="timeline-time">{order.booking_status === 'completed' ? 'Completed' : 'Pending'}</p>
                      </div>
                    </div>

                    <div className={`timeline-step ${order.escrow_status === 'released' ? 'active' : ''}`}>
                      <div className="timeline-marker">3</div>
                      <div className="timeline-content">
                        <p className="timeline-title">Funds Released</p>
                        <p className="timeline-time">{order.escrow_status === 'released' ? formatDate(order.released_at) : 'Awaiting'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="status-message" style={{ borderLeftColor: getStatusColor(order.escrow_status) }}>
                    {order.escrow_status === 'held' && (
                      <>
                        <span className="message-icon">🔒</span>
                        <div className="message-text">
                          <p className="message-title">Payment in Escrow</p>
                          <p className="message-detail">Your payment of KES {order.amount_paid.toFixed(2)} is held securely. Once the driver completes the delivery, funds will automatically be released to them.</p>
                        </div>
                      </>
                    )}
                    {order.escrow_status === 'released' && (
                      <>
                        <span className="message-icon">✅</span>
                        <div className="message-text">
                          <p className="message-title">Payment Released</p>
                          <p className="message-detail">Funds of KES {order.driver_amount.toFixed(2)} were released on {formatDate(order.released_at)}. The driver can now withdraw to M-Pesa.</p>
                        </div>
                      </>
                    )}
                    {order.escrow_status === 'refunded' && (
                      <>
                        <span className="message-icon">💰</span>
                        <div className="message-text">
                          <p className="message-title">Payment Refunded</p>
                          <p className="message-detail">Your payment of KES {order.amount_paid.toFixed(2)} was refunded on {formatDate(order.refunded_at)}.</p>
                        </div>
                      </>
                    )}
                    {order.escrow_status === 'cancelled' && (
                      <>
                        <span className="message-icon">❌</span>
                        <div className="message-text">
                          <p className="message-title">Order Cancelled</p>
                          <p className="message-detail">This order was cancelled. Check your order history for more details.</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Driver Info Card */}
                  <div className="driver-info-card">
                    <div className="driver-header">
                      <div className="driver-badge">
                        <span className="vehicle-emoji">🚗</span>
                      </div>
                      <div className="driver-details">
                        <p className="driver-name">{order.driver_name}</p>
                        <p className="driver-vehicle">{order.vehicle_type} • {order.license_plate}</p>
                        <p className="driver-phone">📞 {order.driver_phone}</p>
                      </div>
                      {order.is_verified && (
                        <div className="driver-verification">
                          <span className="verified-badge">✓ VERIFIED</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="escrow-info-section">
        <h3>How Escrow Works</h3>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">1️⃣</div>
            <div className="info-content">
              <h4>Payment Held</h4>
              <p>When you book a driver, your payment is held securely in escrow to protect both you and the driver.</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">2️⃣</div>
            <div className="info-content">
              <h4>Delivery Complete</h4>
              <p>The driver completes the delivery and marks the order as completed.</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">3️⃣</div>
            <div className="info-content">
              <h4>Automatic Release</h4>
              <p>Once the delivery is complete, funds are automatically released to the driver. A 10% platform fee is deducted.</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">4️⃣</div>
            <div className="info-content">
              <h4>Driver Withdraws</h4>
              <p>The driver can then withdraw released funds to their M-Pesa account instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEscrowManagement;
