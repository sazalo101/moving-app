import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    openSupportTickets: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const usersResponse = await fetch('http://127.0.0.1:5000/api/admin/manage-users');
      const usersData = await usersResponse.json();
      
      const totalUsers = usersData.users ? usersData.users.filter(user => user.role === 'user').length : 0;
      const totalDrivers = usersData.users ? usersData.users.filter(user => user.role === 'driver').length : 0;

      const ordersResponse = await fetch('http://127.0.0.1:5000/api/admin/escrow');
      const ordersData = await ordersResponse.json();
      
      const escrows = ordersData.escrows || [];
      const summary = ordersData.summary || {};
      
      setStats({
        totalUsers,
        totalDrivers,
        totalBookings: escrows.length,
        pendingBookings: summary.held_count || 0,
        completedBookings: summary.released_count || 0,
        totalRevenue: summary.total_platform_fees || 0,
        openSupportTickets: 8
      });
      
      setRecentBookings(escrows.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        {[
          { label: "Total Users", value: stats.totalUsers, link: "/admin/manage-users" },
          { label: "Total Drivers", value: stats.totalDrivers, link: "/admin/manage-drivers" },
          { label: "Completed Bookings", value: stats.completedBookings, extra: `Out of ${stats.totalBookings} total bookings` },
          { label: "Total Revenue", value: `KES ${stats.totalRevenue.toFixed(2)}`, link: "/admin/escrow" }
        ].map((stat, index) => (
          <div className="stat-card" key={index}>
            <h3>{stat.label}</h3>
            <p>{stat.value}</p>
            {stat.extra && <span className="stat-extra">{stat.extra}</span>}
            {stat.link && <Link to={stat.link} className="stat-link">View more</Link>}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="activity-grid">
        <div className="activity-card">
          <div className="card-header">
            <h2>Recent Bookings</h2>
            <span className="pending-badge">{stats.pendingBookings} pending</span>
          </div>
          {recentBookings.length > 0 ? (
            <ul className="booking-list">
              {recentBookings.map((booking) => (
                <li key={booking.booking_id}>
                  <div>
                    <p className="booking-id">Booking #{booking.booking_id}</p>
                    <p className="booking-info">{booking.user_name} → {booking.driver_name}</p>
                    <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                  </div>
                  <p className="booking-price">KES {booking.total_amount.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No recent bookings</p>
          )}
        </div>

        <div className="activity-card">
          <div className="card-header">
            <h2>Support Tickets</h2>
            <span className="pending-badge">{stats.openSupportTickets} open</span>
          </div>
          
          <div className="ticket-info">
            <p>Open Tickets</p>
            <p className="ticket-description">{stats.openSupportTickets} tickets require attention</p>
            <Link to="/admin/support-tickets" className="primary-btn">View Tickets</Link>
          </div>

          <div className="quick-links">
            <h3>Quick Links</h3>
            <div className="link-grid">
              <Link to="/admin/driver-verification" className="link-box">Driver Verification</Link>
              <Link to="/admin/promo-codes" className="link-box">Manage Promo Codes</Link>
              <Link to="/admin/escrow" className="link-box">Escrow Management</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
