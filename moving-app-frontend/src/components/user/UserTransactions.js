import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './UserTransactions.css';

const UserTransactions = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, pending, failed

  useEffect(() => {
    fetchTransactions();
  }, [currentUser]);

  const fetchTransactions = async () => {
    if (!currentUser || !currentUser.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/user/payment-history/${currentUser.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.payments || []);
      } else {
        toast.error('Failed to load transaction history');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'failed':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✗';
      default:
        return '•';
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'booking_payment':
        return 'Booking Payment';
      case 'deposit':
        return 'Wallet Deposit';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="transactions-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>Payment History</h1>
        <p className="transactions-subtitle">
          View all your M-Pesa payment transactions
        </p>
      </div>

      {/* Filter buttons */}
      <div className="filter-buttons">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({transactions.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({transactions.filter(t => t.status === 'completed').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({transactions.filter(t => t.status === 'pending').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
          onClick={() => setFilter('failed')}
        >
          Failed ({transactions.filter(t => t.status === 'failed').length})
        </button>
        <button 
          className="refresh-btn"
          onClick={fetchTransactions}
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Transactions list */}
      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h3>No Transactions Found</h3>
            <p>
              {filter === 'all' 
                ? 'You haven\'t made any payments yet.' 
                : `No ${filter} transactions.`}
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-main">
                <div className="transaction-icon" style={{ backgroundColor: getStatusColor(transaction.status) + '20' }}>
                  <span style={{ color: getStatusColor(transaction.status) }}>
                    {getStatusIcon(transaction.status)}
                  </span>
                </div>
                
                <div className="transaction-details">
                  <div className="transaction-type">
                    {getTransactionTypeLabel(transaction.type)}
                  </div>
                  <div className="transaction-id">
                    ID: {transaction.transaction_id.substring(0, 20)}...
                  </div>
                  <div className="transaction-date">
                    {formatDate(transaction.created_at)}
                  </div>
                  {transaction.phone_number && (
                    <div className="transaction-phone">
                      📱 {transaction.phone_number}
                    </div>
                  )}
                  {transaction.mpesa_receipt_number && (
                    <div className="transaction-receipt">
                      Receipt: {transaction.mpesa_receipt_number}
                    </div>
                  )}
                  {transaction.booking_id && (
                    <div className="transaction-booking">
                      Booking #{transaction.booking_id}
                    </div>
                  )}
                </div>

                <div className="transaction-right">
                  <div className="transaction-amount">
                    KES {transaction.amount.toFixed(2)}
                  </div>
                  <div 
                    className="transaction-status"
                    style={{ 
                      backgroundColor: getStatusColor(transaction.status) + '20',
                      color: getStatusColor(transaction.status)
                    }}
                  >
                    {transaction.status.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary section */}
      {transactions.length > 0 && (
        <div className="transactions-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Transactions:</span>
              <span className="summary-value">{transactions.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed:</span>
              <span className="summary-value" style={{ color: '#4caf50' }}>
                {transactions.filter(t => t.status === 'completed').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Pending:</span>
              <span className="summary-value" style={{ color: '#ff9800' }}>
                {transactions.filter(t => t.status === 'pending').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Failed:</span>
              <span className="summary-value" style={{ color: '#f44336' }}>
                {transactions.filter(t => t.status === 'failed').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Amount Paid:</span>
              <span className="summary-value">
                KES {transactions
                  .filter(t => t.status === 'completed')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTransactions;
