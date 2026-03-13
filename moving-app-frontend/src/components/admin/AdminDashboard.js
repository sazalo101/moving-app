import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_ENDPOINTS from '../../config/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalPayments: 0,
    totalAmountPaid: 0,
    openSupportTickets: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const usersResponse = await fetch(API_ENDPOINTS.MANAGE_USERS);
      const usersData = await usersResponse.json();
      
      const totalUsers = usersData.users ? usersData.users.filter(user => user.role === 'user').length : 0;
      const totalDrivers = usersData.users ? usersData.users.filter(user => user.role === 'driver').length : 0;

      // Fetch real payment data from M-Pesa transactions
      const paymentsResponse = await fetch(API_ENDPOINTS.PAYMENTS_SUMMARY);
      const paymentsData = await paymentsResponse.json();
      
      setStats({
        totalUsers,
        totalDrivers,
        totalBookings: paymentsData.total_bookings || 0,
        pendingBookings: paymentsData.pending_bookings || 0,
        completedBookings: paymentsData.completed_bookings || 0,
        totalRevenue: paymentsData.total_platform_revenue || 0,
        totalPayments: paymentsData.total_payments || 0,
        totalAmountPaid: paymentsData.total_amount_paid || 0,
        openSupportTickets: 0
      });
      
      setRecentPayments(paymentsData.recent_payments || []);
      
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
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <h1 className="dashboard-title">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        {[
          { label: "Total Users", value: stats.totalUsers, link: "/admin/manage-users" },
          { label: "Total Drivers", value: stats.totalDrivers, link: "/admin/manage-drivers" },
          { label: "Total M-Pesa Payments", value: `${stats.totalPayments} payments`, extra: `KES ${stats.totalAmountPaid.toFixed(2)} paid` },
          { label: "Platform Revenue (10%)", value: `KES ${stats.totalRevenue.toFixed(2)}`, extra: `From ${stats.completedBookings} completed bookings` }
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
            <h2>Recent M-Pesa Payments</h2>
            <span className="pending-badge">{stats.totalPayments} total payments</span>
          </div>
          {recentPayments.length > 0 ? (
            <ul className="booking-list">
              {recentPayments.map((payment, index) => (
                <li key={payment.transaction_id || index}>
                  <div>
                    <p className="booking-id">Receipt: {payment.mpesa_receipt || 'N/A'}</p>
                    <p className="booking-info">
                      {payment.user_name} → {payment.driver_name}
                      {payment.driver_verified ? (
                        <span style={{ marginLeft: '6px', padding: '2px 6px', background: '#10b981', color: 'white', borderRadius: '3px', fontSize: '10px', fontWeight: '600' }}>✓</span>
                      ) : (
                        <span style={{ marginLeft: '6px', padding: '2px 6px', background: '#ef4444', color: 'white', borderRadius: '3px', fontSize: '10px', fontWeight: '600' }}>✗</span>
                      )}
                    </p>
                    <span className="status-badge completed">{payment.status}</span>
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      {payment.phone_number} • {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="booking-price">KES {payment.amount.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No M-Pesa payments yet</p>
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
    </div>
  );
};

export default AdminDashboard;
