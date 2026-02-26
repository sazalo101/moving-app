import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './UserWallet.css';

const UserWallet = () => {
  const { currentUser } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState(null);

  const fetchWalletData = useCallback(async () => {
    if (!currentUser || !currentUser.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/user/balance/${currentUser.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setBalance(data.balance || 0);
      } else {
        toast.error('Failed to load wallet balance');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWalletData();
    if (currentUser && currentUser.phone) {
      setPhoneNumber(currentUser.phone);
    }
  }, [currentUser, fetchWalletData]);

  useEffect(() => {
    return () => {
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
      }
    };
  }, [paymentTimeout]);

  const checkTransactionStatus = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/mpesa/check-status/${transactionId}`);
      const data = await response.json();
      
      if (response.ok) {
        return data.status;
      }
      return null;
    } catch (error) {
      console.error('Error checking status:', error);
      return null;
    }
  };

  const pollTransactionStatus = async (transactionId, maxAttempts = 20) => {
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      const status = await checkTransactionStatus(transactionId);
      
      if (status === 'completed') {
        setTransactions(prev => prev.map(t =>
          t.transaction_id === transactionId ? { ...t, status: 'completed' } : t
        ));
        // Refresh balance from server
        await fetchWalletData();
        toast.success('Payment completed successfully!', {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
        });
        setAmount('');
        setIsDepositing(false);
        return;
      } else if (status === 'failed') {
        setTransactions(prev => prev.map(t =>
          t.transaction_id === transactionId ? { ...t, status: 'failed' } : t
        ));
        toast.error('Payment failed. Please try again.', {
          position: "top-center",
          autoClose: 4000,
        });
        setIsDepositing(false);
        return;
      } else if (attempts < maxAttempts) {
        setTimeout(poll, 3000);
      } else {
        toast.warning('Payment is taking longer than expected. Check back later.', {
          position: "top-center",
          autoClose: 5000,
        });
        setIsDepositing(false);
      }
    };
    
    setTimeout(poll, 5000);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
      });
      return;
    }

    if (!phoneNumber) {
      toast.error('Please enter your M-Pesa phone number', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (!currentUser || !currentUser.id) {
      toast.error('User session not found. Please login again.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      setIsDepositing(true);
      
      const loadingToast = toast.loading('Initiating M-Pesa payment...', {
        position: "top-center",
      });

      const timeout = setTimeout(() => {
        setIsDepositing(false);
        toast.dismiss(loadingToast);
        toast.error('Payment timeout. Please try again and enter your PIN promptly.', {
          position: "top-center",
          autoClose: 5000,
        });
      }, 10000);

      setPaymentTimeout(timeout);

      const response = await fetch('http://localhost:5000/api/mpesa/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          amount: parseFloat(amount),
          phone_number: cleanPhone,
        }),
      });

      const data = await response.json();
      
      clearTimeout(timeout);
      setPaymentTimeout(null);
      toast.dismiss(loadingToast);

      if (response.ok && data.success) {
        const newTransaction = {
          id: data.transaction_id,
          transaction_id: data.transaction_id,
          type: 'deposit',
          amount: parseFloat(amount),
          created_at: new Date().toISOString(),
          status: 'pending'
        };

        setTransactions([newTransaction, ...transactions]);
        toast.success('Check your phone to complete payment', {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
        });

        pollTransactionStatus(data.transaction_id);

      } else {
        toast.error(data.error || 'Failed to initiate M-Pesa payment', {
          position: "top-center",
          autoClose: 4000,
        });
        setIsDepositing(false);
      }

    } catch (error) {
      console.error('Error:', error);
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
        setPaymentTimeout(null);
      }
      toast.error('Failed to connect to payment server. Please try again.', {
        position: "top-center",
        autoClose: 4000,
      });
      setIsDepositing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="user-wallet-container">
      <h1 className="user-wallet-title">My Wallet</h1>

      <div className="wallet-balance-card">
        <div className="balance-header">
          <h2 className="balance-label">Current Balance</h2>
          <span className="balance-amount">KES {balance.toFixed(2)}</span>
        </div>

        <form onSubmit={handleDeposit} className="deposit-form">
          <div className="form-fields">
            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="form-input"
                placeholder="e.g., 0712345678"
                required
              />
              <p className="form-hint">Enter your Safaricom number</p>
            </div>
            <div className="form-group">
              <label htmlFor="amount" className="form-label">
                Deposit Amount (KES)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                placeholder="Enter amount"
                min="1"
                step="1"
                required
              />
            </div>
          </div>
          <div className="form-button-group">
            <button
              type="submit"
              disabled={isDepositing || loading}
              className="deposit-button"
            >
              {isDepositing ? (
                <span>
                  <svg className="spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing</span>
                </span>
              ) : (
                <span>Pay via M-Pesa</span>
              )}
            </button>
          </div>
          {isDepositing && (
            <div className="payment-alert">
              <p className="payment-alert-text">
                <span>Check your phone - You have 10 seconds to enter PIN</span>
              </p>
            </div>
          )}
        </form>
      </div>

      <div className="transaction-history-card">
        <h2 className="transaction-title">Transaction History</h2>

        {loading ? (
          <div className="loading-state">
            <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="loading-text">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="empty-message">No transactions found</p>
            <p className="empty-hint">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="transaction-table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th className="text-center">Type</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="transaction-date">{formatDate(transaction.created_at)}</td>
                    <td className="transaction-id">{transaction.transaction_id.substring(0, 15)}...</td>
                    <td className="transaction-type">
                      <span className={`type-badge ${transaction.type}`}>
                        {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                      </span>
                    </td>
                    <td className="transaction-amount">
                      <span className={transaction.type === 'deposit' ? 'amount-positive' : 'amount-negative'}>
                        {transaction.type === 'deposit' ? '+' : '-'}KES {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="transaction-status">
                      <span className={`status-badge ${transaction.status}`}>
                        {transaction.status === 'completed' ? 'Completed' : transaction.status === 'pending' ? 'Pending' : 'Failed'}
                      </span>
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

export default UserWallet;
