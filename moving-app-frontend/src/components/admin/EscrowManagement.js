import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './EscrowManagement.css';

const EscrowManagement = () => {
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscrowData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/escrow');
        setEscrowOrders(res.data.escrows || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching escrow data:', error);
        toast.error('Failed to load escrow data');
        setEscrowOrders([]);
        setLoading(false);
      }
    };

    fetchEscrowData();
  }, []);

  const handleReleasePayment = async (bookingId, driverId, amount) => {
    try {
      const response = await axios.post('https://api.intasend.com/v1/payouts/', {
        currency: 'KES',
        transactions: [
          {
            account: driverId, // Assuming the driver's bank account is stored in the user object
            amount: parseFloat(amount),
            narrative: 'Payment release from escrow'
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_INTASEND_SECRET_KEY}`
        }
      });

      if (response.data.status === 'success') {
        setEscrowOrders(escrowOrders.filter(order => order.booking_id !== bookingId));
        toast.success('Payment released successfully!');
      } else {
        toast.error('Failed to release payment');
      }
    } catch (error) {
      console.error('Error releasing payment:', error);
      toast.error('Failed to release payment');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="escrow-container">
      <h2 className="escrow-title">Escrow Management</h2>
      
      <div className="escrow-stats">
        <div className="escrow-stat-card blue">
          <h3 className="stat-card-title blue">Total Orders in Escrow</h3>
          <p className="stat-card-value blue">{escrowOrders.length}</p>
        </div>
        <div className="escrow-stat-card green">
          <h3 className="stat-card-title green">Total Value</h3>
          <p className="stat-card-value green">
            KES {escrowOrders.reduce((total, order) => total + (order.total_amount || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="escrow-stat-card orange">
          <h3 className="stat-card-title orange">Total Platform Fees</h3>
          <p className="stat-card-value orange">
            KES {escrowOrders.reduce((total, order) => total + (order.platform_fee || 0), 0).toFixed(2)}
          </p>
          <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
            From all {escrowOrders.length} escrow(s)
          </p>
        </div>
        <div className="escrow-stat-card purple">
          <h3 className="stat-card-title purple">Released Platform Fees</h3>
          <p className="stat-card-value purple">
            KES {escrowOrders.filter(o => o.status === 'released').reduce((total, order) => total + (order.platform_fee || 0), 0).toFixed(2)}
          </p>
          <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
            From {escrowOrders.filter(o => o.status === 'released').length} completed
          </p>
        </div>
      </div>
      
      <div className="table-container">
        <table className="escrow-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Driver</th>
              <th>Amount</th>
              <th>Driver Earnings</th>
              <th style={{ background: '#fff7ed', color: '#c2410c' }}>Platform Fee (10%)</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {escrowOrders.length > 0 ? (
              escrowOrders.map((order) => (
                <tr key={order.escrow_id}>
                  <td>#{order.booking_id}</td>
                  <td>
                    <div>{order.user_name}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{order.user_email}</div>
                  </td>
                  <td>
                    <div>{order.driver_name}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{order.driver_email}</div>
                  </td>
                  <td>KES {order.total_amount ? order.total_amount.toFixed(2) : '0.00'}</td>
                  <td>KES {order.driver_amount ? order.driver_amount.toFixed(2) : '0.00'}</td>
                  <td style={{ 
                    fontWeight: '600', 
                    color: '#ea580c',
                    background: '#fff7ed'
                  }}>
                    KES {order.platform_fee ? order.platform_fee.toFixed(2) : '0.00'}
                    <div style={{ fontSize: '10px', color: '#9a3412', marginTop: '2px' }}>
                      (10% fee)
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${order.status}`} style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: order.status === 'held' ? '#fef3c7' : order.status === 'released' ? '#d1fae5' : '#fee2e2',
                      color: order.status === 'held' ? '#92400e' : order.status === 'released' ? '#065f46' : '#991b1b'
                    }}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-state">No escrow records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EscrowManagement;