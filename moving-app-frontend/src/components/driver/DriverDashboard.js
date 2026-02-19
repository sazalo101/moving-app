import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const DriverDashboard = () => {
  // Dummy user data
  const currentUser = { id: 'driver123', name: 'John Driver' };
  
  // State variables
  const [driver, setDriver] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [ratings, setRatings] = useState(0);

  // Styles
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    headerTitle: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: '0 0 10px 0'
    },
    statusCard: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    statusTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: '0 0 10px 0'
    },
    statusInfo: {
      fontWeight: 'bold',
      fontSize: '18px'
    },
    availableStatus: {
      color: '#27ae60'
    },
    unavailableStatus: {
      color: '#e74c3c'
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      margin: '15px 0 0 0'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      transition: 'all 0.3s ease'
    },
    primaryButton: {
      backgroundColor: '#3498db',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#e74c3c',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#27ae60',
      color: 'white'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      textAlign: 'center'
    },
    statTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '10px'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: '10px 0'
    },
    blueValue: {
      color: '#3498db'
    },
    yellowValue: {
      color: '#f39c12'
    },
    greenValue: {
      color: '#27ae60'
    },
    link: {
      color: '#3498db',
      textDecoration: 'none',
      fontSize: '14px'
    },
    linkHover: {
      textDecoration: 'underline'
    },
    ordersCard: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      marginBottom: '30px'
    },
    ordersHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    ordersTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: '0'
    },
    tableContainer: {
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left'
    },
    tableHead: {
      backgroundColor: '#f8f9fa'
    },
    tableHeaderCell: {
      padding: '12px 15px',
      color: '#2c3e50',
      fontSize: '14px',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    },
    tableCell: {
      padding: '12px 15px',
      borderBottom: '1px solid #ecf0f1',
      fontSize: '14px',
      color: '#34495e'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    acceptedBadge: {
      backgroundColor: '#e1f7ea',
      color: '#27ae60'
    },
    pendingBadge: {
      backgroundColor: '#fef9e7',
      color: '#f39c12'
    },
    detailButton: {
      color: '#3498db',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '0'
    },
    emptyMessage: {
      textAlign: 'center',
      color: '#7f8c8d',
      padding: '20px'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px'
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: '5px solid rgba(0, 0, 0, 0.1)',
      borderTop: '5px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  // Dummy data for the dashboard
  const dummyOrders = [
    {
      booking_id: "ORD-42891",
      pickup_location: "Downtown Business Center",
      dropoff_location: "Central Park Residence",
      status: "accepted",
      customer_name: "Michael Chen",
      fare: 18.75,
      estimated_time: "15 min"
    },
    {
      booking_id: "ORD-42895",
      pickup_location: "Airport Terminal 2",
      dropoff_location: "Grand Hotel",
      status: "accepted",
      customer_name: "Sarah Johnson",
      fare: 35.50,
      estimated_time: "25 min"
    }
  ];

  // Simulate API call
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveOrders(dummyOrders);
      setCompletedOrders(147);
      setRatings(4.8);
      setEarnings(1250.75);
      setIsLoading(false);
      
      setDriver({
        id: currentUser.id,
        completedOrders: 147,
        ratings: 4.8,
        earnings: 1250.75
      });
    }, 1000);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Driver Dashboard</h1>
      </header>

      {/* Status Toggle */}
      <div style={styles.statusCard}>
        <div>
          <h2 style={styles.statusTitle}>Driver Status</h2>
          <p style={{...styles.statusInfo, ...(isAvailable ? styles.availableStatus : styles.unavailableStatus)}}>
            {isAvailable ? 'Available for Orders' : 'Unavailable'}
          </p>
        </div>
        <div style={styles.buttonGroup}>
          <button
            onClick={updateLocation}
            style={{...styles.button, ...styles.primaryButton}}
          >
            Update Location
          </button>
          <button
            onClick={toggleAvailability}
            style={{...styles.button, ...(isAvailable ? styles.dangerButton : styles.successButton)}}
          >
            {isAvailable ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Completed Orders</h3>
          <p style={{...styles.statValue, ...styles.blueValue}}>{completedOrders}</p>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Rating</h3>
          <p style={{...styles.statValue, ...styles.yellowValue}}>{ratings} / 5</p>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Available Balance</h3>
          <p style={{...styles.statValue, ...styles.greenValue}}>${earnings.toFixed(2)}</p>
          <a href="/driver/wallet" style={styles.link}>View Wallet</a>
        </div>
      </div>

      {/* Active Orders */}
      <div style={styles.ordersCard}>
        <div style={styles.ordersHeader}>
          <h2 style={styles.ordersTitle}>Active Orders</h2>
          <a href="/driver/available-orders" style={styles.link}>View All Available Orders</a>
        </div>

        {activeOrders.length === 0 ? (
          <p style={styles.emptyMessage}>No active orders at the moment.</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.tableHeaderCell}>Booking ID</th>
                  <th style={styles.tableHeaderCell}>Pickup</th>
                  <th style={styles.tableHeaderCell}>Dropoff</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order) => (
                  <tr key={order.booking_id}>
                    <td style={styles.tableCell}>{order.booking_id}</td>
                    <td style={styles.tableCell}>{order.pickup_location}</td>
                    <td style={styles.tableCell}>{order.dropoff_location}</td>
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(order.status === 'accepted'
                            ? styles.acceptedBadge
                            : styles.pendingBadge)
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <button 
                        style={styles.detailButton}
                        onClick={() => toast.info(`Viewing details for order ${order.booking_id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;