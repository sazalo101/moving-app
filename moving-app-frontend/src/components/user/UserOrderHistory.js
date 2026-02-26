import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './UserOrderHistory.css';

const UserOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('Please log in to view your orders');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/api/user/order-history/${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  const handleCancelOrder = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/user/cancel-order/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Order cancelled successfully!');
        fetchOrders(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    }
  };

  const openReviewModal = (order) => {
    setSelectedOrder(order);
    setRating(0);
    setComment('');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedOrder(null);
    setRating(0);
    setComment('');
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await fetch('http://127.0.0.1:5000/api/user/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          driver_id: selectedOrder.driver_id,
          rating: rating,
          comment: comment
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('✅ ' + data.message);
        closeReviewModal();
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
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

  if (loading) {
    return (
      <div className="user-order-container">
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="user-order-container">
      <div className="user-order-header">
        <h1 className="user-order-title">Your Order History</h1>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs-container">
        <div className="filter-tabs">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state-box">
          <p className="empty-state-text">
            No {filter !== 'all' ? filter : ''} orders found.
          </p>
          <Link to="/user/book-driver" className="book-driver-link">
            Book a Driver
          </Link>
        </div>
      ) : (
        <div className="orders-list-grid">
          {filteredOrders.map(order => (
            <div key={order.booking_id} className="order-card-item">
              <div className="order-card-layout">
                <div className="order-info-section">
                  <div className="order-header-row">
                    <p className="order-booking-id">Booking #{order.booking_id}</p>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="order-date">{formatDate(order.created_at)}</p>
                  <p className="order-detail-row">
                    <span className="order-detail-label">From:</span> {order.pickup_location}
                  </p>
                  <p className="order-detail-row">
                    <span className="order-detail-label">To:</span> {order.dropoff_location}
                  </p>
                  <p className="order-detail-row">
                    <span className="order-detail-label">Driver ID:</span> {order.driver_id}
                  </p>
                </div>
                <div className="order-actions-section">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order.booking_id)}
                      className="action-btn action-btn-cancel"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {order.status === 'accepted' && (
                    <Link
                      to={`/user/track/${order.booking_id}`}
                      className="action-btn action-btn-track"
                    >
                      Track Driver
                    </Link>
                  )}
                  {order.status === 'completed' && (
                    <button 
                      className="action-btn action-btn-review"
                      onClick={() => openReviewModal(order)}
                    >
                      Leave a Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Leave a Review</h2>
              <button className="modal-close" onClick={closeReviewModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <p className="review-order-info">
                Booking #{selectedOrder?.booking_id}
              </p>
              
              <div className="rating-section">
                <label className="rating-label">Rating:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= rating ? 'star-filled' : 'star-empty'}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="rating-text">
                  {rating === 0 && 'Select a rating'}
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              </div>

              <div className="comment-section">
                <label className="comment-label">Comment (Optional):</label>
                <textarea
                  className="comment-textarea"
                  placeholder="Share your experience with this driver..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={closeReviewModal}
                disabled={submittingReview}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSubmitReview}
                disabled={submittingReview || rating === 0}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory;
