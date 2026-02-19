import React, { useState, useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

const UserDashboard = () => {
  // Get current user from AuthContext
  const { currentUser } = useContext(AuthContext);

  // State variables
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
  });

  // Styles
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "30px 20px",
      fontFamily: "Arial, sans-serif",
    },
    welcomeTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: "30px",
      textAlign: "center",
    },
    welcomeEmail: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "#00ced1",
      marginBottom: "10px",
      textAlign: "center",
    },
    welcomeSubtitle: {
      fontSize: "18px",
      color: "#7f8c8d",
      marginBottom: "30px",
      textAlign: "center",
    },
    card: {
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
      padding: "25px",
      width: "100%",
      maxWidth: "800px",
      marginBottom: "30px",
    },
    cardTitle: {
      fontSize: "22px",
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: "20px",
      textAlign: "center",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
    },
    statBox: {
      padding: "20px",
      borderRadius: "8px",
      textAlign: "center",
    },
    activeBox: {
      backgroundColor: "#e3f2fd",
    },
    completedBox: {
      backgroundColor: "#e8f5e9",
    },
    cancelledBox: {
      backgroundColor: "#ffebee",
    },
    statLabel: {
      fontSize: "16px",
      fontWeight: "500",
      marginBottom: "10px",
      color: "#34495e",
    },
    activeValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1976d2",
    },
    completedValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#388e3c",
    },
    cancelledValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#d32f2f",
    },
    headerContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "20px",
    },
    viewAllLink: {
      color: "#1976d2",
      textDecoration: "none",
      fontSize: "14px",
      marginTop: "5px",
    },
    bookingsList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    bookingItem: {
      borderBottom: "1px solid #e0e0e0",
      paddingBottom: "20px",
    },
    bookingHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
      flexWrap: "wrap",
    },
    bookingId: {
      fontWeight: "bold",
      color: "#2c3e50",
      fontSize: "16px",
    },
    bookingDate: {
      color: "#7f8c8d",
      fontSize: "14px",
    },
    locationInfo: {
      margin: "10px 0",
      lineHeight: "1.5",
    },
    locationLabel: {
      fontWeight: "bold",
      color: "#34495e",
    },
    statusBadge: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      marginTop: "10px",
    },
    badgeCompleted: {
      backgroundColor: "#e8f5e9",
      color: "#388e3c",
    },
    badgeCancelled: {
      backgroundColor: "#ffebee",
      color: "#d32f2f",
    },
    badgeAccepted: {
      backgroundColor: "#e3f2fd",
      color: "#1976d2",
    },
    badgePending: {
      backgroundColor: "#fff8e1",
      color: "#ffa000",
    },
    trackLink: {
      color: "#1976d2",
      textDecoration: "none",
      marginTop: "10px",
      display: "inline-block",
      fontWeight: "500",
    },
    emptyMessage: {
      color: "#7f8c8d",
      fontSize: "16px",
      textAlign: "center",
      padding: "20px",
    },
    supportButton: {
      backgroundColor: "#7e57c2",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      border: "none",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "background-color 0.3s",
    },
    loadingText: {
      color: "#7f8c8d",
      fontSize: "16px",
      textAlign: "center",
      padding: "20px",
    },
  };

  // Dummy bookings data
  const dummyBookings = [
    {
      booking_id: "BK-10045",
      created_at: "2025-03-20T14:30:00",
      pickup_location: "123 Main Street",
      dropoff_location: "456 Park Avenue",
      status: "completed",
      driver_name: "Alex Johnson",
      fare: 24.5,
    },
    {
      booking_id: "BK-10052",
      created_at: "2025-03-22T09:15:00",
      pickup_location: "Grand Central Station",
      dropoff_location: "JFK Airport Terminal 4",
      status: "accepted",
      driver_name: "Emma Williams",
      fare: 67.75,
    },
    {
      booking_id: "BK-10060",
      created_at: "2025-03-23T11:45:00",
      pickup_location: "Brooklyn Heights",
      dropoff_location: "Manhattan Financial District",
      status: "pending",
      fare: 32.25,
    },
  ];

  // Simulate API call
  useEffect(() => {
    const timer = setTimeout(() => {
      setRecentBookings(dummyBookings);
      setStats({
        activeBookings: 2,
        completedBookings: 15,
        cancelledBookings: 3,
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div style={styles.container}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={styles.welcomeTitle}>Welcome Back!</h1>
        <p style={styles.welcomeEmail}>{currentUser?.email}</p>
        <p style={styles.welcomeSubtitle}>Here's an overview of your moving activities</p>
      </div>

      {/* Statistics */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Your Statistics</h2>
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statBox, ...styles.activeBox }}>
            <p style={styles.statLabel}>Active Bookings</p>
            <p style={styles.activeValue}>{stats.activeBookings}</p>
          </div>
          <div style={{ ...styles.statBox, ...styles.completedBox }}>
            <p style={styles.statLabel}>Completed Trips</p>
            <p style={styles.completedValue}>{stats.completedBookings}</p>
          </div>
          <div style={{ ...styles.statBox, ...styles.cancelledBox }}>
            <p style={styles.statLabel}>Cancelled Bookings</p>
            <p style={styles.cancelledValue}>{stats.cancelledBookings}</p>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={styles.card}>
        <div style={styles.headerContainer}>
          <h2 style={styles.cardTitle}>Recent Bookings</h2>
          <a href="/user/orders" style={styles.viewAllLink}>
            View All
          </a>
        </div>

        {loading ? (
          <p style={styles.loadingText}>Loading recent bookings...</p>
        ) : recentBookings.length > 0 ? (
          <div style={styles.bookingsList}>
            {recentBookings.map((booking) => (
              <div key={booking.booking_id} style={styles.bookingItem}>
                <div style={styles.bookingHeader}>
                  <p style={styles.bookingId}>Booking #{booking.booking_id}</p>
                  <p style={styles.bookingDate}>
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={styles.locationInfo}>
                  <p>
                    <span style={styles.locationLabel}>From:</span>{" "}
                    {booking.pickup_location}
                  </p>
                  <p>
                    <span style={styles.locationLabel}>To:</span>{" "}
                    {booking.dropoff_location}
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(booking.status === "completed"
                        ? styles.badgeCompleted
                        : booking.status === "cancelled"
                        ? styles.badgeCancelled
                        : booking.status === "accepted"
                        ? styles.badgeAccepted
                        : styles.badgePending),
                    }}
                  >
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </span>
                </div>
                {booking.status === "accepted" && (
                  <div>
                    <a
                      href={`/user/track/${booking.booking_id}`}
                      style={styles.trackLink}
                    >
                      Track Driver
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyMessage}>You don't have any bookings yet.</p>
        )}
      </div>

      {/* Contact Support Button */}
      <button style={styles.supportButton} onClick={navigateToSupport}>
        Contact Support
      </button>
    </div>
  );
};

export default UserDashboard;
