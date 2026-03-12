import React, { useState, useEffect, useContext } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./UserDashboard.css";

const UserDashboard = () => {
  // Get current user from AuthContext
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // State variables
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
  });

  // Fetch real data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!currentUser || !currentUser.id) {
          setLoading(false);
          return;
        }

        // Fetch recent bookings
        const response = await fetch(`http://127.0.0.1:5000/api/user/order-history/${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          const bookings = data.orders || [];
          
          // Get last 3 bookings
          setRecentBookings(bookings.slice(0, 3));
          
          // Calculate stats based on real data
          const active = bookings.filter(b => 
            b.status === 'pending' || 
            b.status === 'accepted' || 
            b.status === 'pending_payment'
          ).length;
          const completed = bookings.filter(b => b.status === 'completed').length;
          const cancelled = bookings.filter(b => b.status === 'cancelled').length;
          
          setStats({
            activeBookings: active,
            completedBookings: completed,
            cancelledBookings: cancelled,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  // Handle support navigation - MODIFIED TO OPEN GMAIL
  const navigateToSupport = () => {
    const subject = "Support Request";
    const body = `Hello Support Team,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nUser Email: ${currentUser.email}`;
    const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=support@movers.com&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, "_blank");
  };

  // Redirect if not logged in
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <h1 className="dashboard-welcome-title">Welcome Back!</h1>
        <p className="dashboard-welcome-email">{currentUser?.email}</p>
        <p className="dashboard-welcome-subtitle">Here's an overview of your moving activities</p>
      </div>

      {/* Statistics */}
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Your Statistics</h2>
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-box dashboard-stat-active">
            <p className="dashboard-stat-label">Active Bookings</p>
            <p className="dashboard-stat-value active">{stats.activeBookings}</p>
          </div>
          <div className="dashboard-stat-box dashboard-stat-completed">
            <p className="dashboard-stat-label">Completed Trips</p>
            <p className="dashboard-stat-value completed">{stats.completedBookings}</p>
          </div>
          <div className="dashboard-stat-box dashboard-stat-cancelled">
            <p className="dashboard-stat-label">Cancelled Bookings</p>
            <p className="dashboard-stat-value cancelled">{stats.cancelledBookings}</p>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="dashboard-card">
        <div className="dashboard-header-container">
          <h2 className="dashboard-card-title">Recent Bookings</h2>
          <Link to="/user/orders" className="dashboard-view-all">
            View All
          </Link>
        </div>

        {loading ? (
          <p className="dashboard-loading-text">Loading recent bookings...</p>
        ) : recentBookings.length > 0 ? (
          <div className="dashboard-bookings-list">
            {recentBookings.map((booking) => (
              <div key={booking.booking_id} className="dashboard-booking-item">
                <div className="dashboard-booking-header">
                  <p className="dashboard-booking-id">Booking #{booking.booking_id}</p>
                  <p className="dashboard-booking-date">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="dashboard-location-info">
                  <p>
                    <span className="dashboard-location-label">From:</span>{" "}
                    {booking.pickup_location}
                  </p>
                  <p>
                    <span className="dashboard-location-label">To:</span>{" "}
                    {booking.dropoff_location}
                  </p>
                </div>
                <div>
                  <span className={`dashboard-status-badge dashboard-badge-${booking.status}`}>
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </span>
                </div>
                {booking.status === "accepted" && (
                  <div>
                    <Link
                      to={`/user/track/${booking.booking_id}`}
                      className="dashboard-track-link"
                    >
                      Track Driver
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty-message">You don't have any bookings yet.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="dashboard-button-container">
        <button 
          className="dashboard-book-btn"
          onClick={() => navigate('/user/book-driver')}
        >
          📦 Book a Mover
        </button>
        <button className="dashboard-support-btn" onClick={navigateToSupport}>
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default UserDashboard;
