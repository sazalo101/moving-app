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
        setEscrowOrders(res.data.escrow);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching escrow data:', error);
        toast.error('Failed to load escrow data');
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
            ${escrowOrders.reduce((total, order) => total + order.price, 0).toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="table-container">
        <table className="escrow-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>User ID</th>
              <th>Driver ID</th>
              <th>Price</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {escrowOrders.length > 0 ? (
              escrowOrders.map((order) => (
                <tr key={order.booking_id}>
                  <td>{order.booking_id}</td>
                  <td>{order.user_id}</td>
                  <td>{order.driver_id}</td>
                  <td>${order.price.toFixed(2)}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <button 
                      onClick={() => handleReleasePayment(order.booking_id, order.driver_id, order.price)}
                      className="release-button"
                    >
                      Release Payment
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colspan="6" className="empty-state">No orders in escrow</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EscrowManagement;