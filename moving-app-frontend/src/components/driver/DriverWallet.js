import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API_ENDPOINTS from '../../config/api';
import './DriverWallet.css';

const DriverWallet = () => {
  const [earnings, setEarnings] = useState(0);
  const [pendingEscrow, setPendingEscrow] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [ratings, setRatings] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  useEffect(() => {
    fetchDriverEarnings();
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.phone) {
      setPhoneNumber(user.phone);
    }
  }, []);

  const fetchDriverEarnings = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('Please log in to view your earnings');
        return;
      }

      let driverId = user.driver_id;

      if (!driverId && user.id && user.role === 'driver') {
        try {
          const driverResponse = await fetch(API_ENDPOINTS.GET_DRIVER_BY_USER(user.id));
          const driverData = await driverResponse.json();
          if (driverResponse.ok && driverData.driver_id) {
            driverId = driverData.driver_id;
            user.driver_id = driverId;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (err) {
          console.error('Error fetching driver info:', err);
        }
      }

      if (!driverId) {
        toast.error('Driver information not found. Please log out and log in again.');
        return;
      }

      const response = await fetch(API_ENDPOINTS.DRIVER_EARNINGS(driverId));
      const data = await response.json();

      if (response.ok) {
        setEarnings(data.available_earnings || 0);
        setPendingEscrow(data.pending_in_escrow || 0);
        setCompletedOrders(data.completed_orders || 0);
        setPendingOrders(data.pending_orders || 0);
        setRatings(data.ratings || 0);
        setWithdrawals(data.withdrawals || []);
      } else {
        toast.error(data.error || 'Failed to fetch earnings');
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load wallet data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < 100) {
      toast.error('Minimum withdrawal amount is KES 100');
      return;
    }

    if (amount > 50000) {
      toast.error('Maximum withdrawal amount is KES 50,000 per transaction');
      return;
    }

    if (amount > earnings) {
      toast.error(`Insufficient earnings. Available: KES ${earnings.toFixed(2)}`);
      return;
    }

    if (!phoneNumber) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.driver_id) {
      toast.error('Driver information not found. Please refresh the page.');
      return;
    }

    setIsWithdrawing(true);

    try {
      const response = await fetch(API_ENDPOINTS.DRIVER_WITHDRAW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: user.driver_id,
          amount: amount,
          phone_number: phoneNumber
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        setWithdrawAmount('');
        setShowWithdrawForm(false);
        fetchDriverEarnings();
      } else {
        toast.error(data.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleQuickWithdraw = (amount) => {
    if (amount > earnings) {
      toast.error(`Insufficient earnings. Available: KES ${earnings.toFixed(2)}`);
      return;
    }
    setWithdrawAmount(amount.toString());
    setShowWithdrawForm(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="wallet-loading">
          <div className="loading-spinner"></div>
          <p>Loading your wallet...</p>
        </div>
      </div>
    );
  }

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="wallet-container">
      {/* Header */}
      <div className="wallet-header">
        <div className="wallet-header-content">
          <div className="wallet-title-section">
            <h1>Driver Wallet</h1>
            <p>Manage your earnings and withdraw to M-Pesa</p>
          </div>
          <button onClick={() => fetchDriverEarnings()} className="btn btn-primary wallet-refresh-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="wallet-content">
        {/* Key Metrics Cards */}
        <div className="wallet-metrics-grid">
          {/* Available Earnings Card */}
          <div className="metric-card metric-card-earnings">
            <div className="metric-card-header">
              <div className="metric-icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="metric-badge">AVAILABLE</span>
            </div>
            <h3 className="metric-value">KES {earnings.toFixed(2)}</h3>
            <p className="metric-label">Ready to withdraw now</p>
          </div>

          {/* Pending Escrow Card */}
          <div className="metric-card metric-card-escrow">
            <div className="metric-card-header">
              <div className="metric-icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="metric-badge">IN ESCROW</span>
            </div>
            <h3 className="metric-value">KES {pendingEscrow.toFixed(2)}</h3>
            <p className="metric-label">Complete {pendingOrders} order(s) to release</p>
          </div>

          {/* Completed Orders Card */}
          <div className="metric-card metric-card-orders">
            <div className="metric-card-header">
              <div className="metric-icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="metric-badge">COMPLETED</span>
            </div>
            <h3 className="metric-value">{completedOrders}</h3>
            <p className="metric-label">Total deliveries</p>
          </div>

          {/* Rating Card */}
          <div className="metric-card metric-card-rating">
            <div className="metric-card-header">
              <div className="metric-icon-wrapper">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="metric-badge">RATING</span>
            </div>
            <h3 className="metric-value">{ratings.toFixed(1)}</h3>
            <p className="metric-label">Out of 5.0</p>
          </div>
        </div>

        {/* Escrow Info Banner */}
        {pendingOrders > 0 && (
          <div className="escrow-banner">
            <div className="escrow-banner-content">
              <div className="escrow-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="escrow-details">
                <h3 className="escrow-title">You have funds in escrow</h3>
                <p className="escrow-description">
                  <strong>KES {pendingEscrow.toFixed(2)}</strong> from {pendingOrders} pending {pendingOrders === 1 ? 'order' : 'orders'} will be released to your available balance once you complete {pendingOrders === 1 ? 'the delivery' : 'the deliveries'}.
                </p>
                <div className="escrow-info-box">
                  <p>
                    <span>How it works:</span> When customers book your services, payments are held securely in escrow. 
                    After you complete the delivery, funds are automatically released to your available balance and you can withdraw them to M-Pesa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions and Withdraw Section */}
        <div className="wallet-actions-grid">
          {/* Quick Withdraw Actions */}
          <div className="quick-withdraw-card">
            <h2 className="quick-withdraw-title">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Withdraw
            </h2>
            <p className="quick-withdraw-subtitle">Select an amount to withdraw instantly</p>
            <div className="quick-withdraw-buttons">
              {[500, 1000, 2000, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickWithdraw(amount)}
                  disabled={earnings < amount}
                  className={`btn quick-withdraw-btn ${earnings >= amount ? 'btn-success' : ''}`}
                >
                  Withdraw KES {amount.toLocaleString()}
                </button>
              ))}
              <button
                onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                className="custom-amount-toggle"
              >
                {showWithdrawForm ? 'Hide' : 'Custom'} Amount
              </button>
            </div>
          </div>

          {/* Withdraw Form */}
          <div className={`withdraw-form-card ${!showWithdrawForm ? 'hidden' : ''}`}>
            <div className="withdraw-form-header">
              <div>
                <h2 className="withdraw-form-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Withdraw to M-Pesa
                </h2>
                <p className="withdraw-form-subtitle">
                  Funds will be sent directly to your M-Pesa account
                </p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="withdraw-form">
              <div className="form-group">
                <label className="form-label">
                  M-Pesa Phone Number
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="form-input form-input-with-icon"
                    placeholder="0712345678"
                    required
                  />
                </div>
                <p className="form-hint">Format: 0712345678 or 254712345678</p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Withdrawal Amount (KES)
                </label>
                <div className="input-wrapper">
                  <div className="input-icon-text">
                    KES
                  </div>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="form-input form-input-with-currency"
                    placeholder="Enter amount"
                    min="100"
                    max="50000"
                    step="50"
                    required
                  />
                </div>
                <div className="form-hint-row">
                  <p className="form-hint">Min: KES 100 | Max: KES 50,000</p>
                  <p className="form-hint-available">
                    Available: KES {earnings.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isWithdrawing || earnings < 100}
                className="submit-btn"
              >
                {isWithdrawing ? (
                  <>
                    <svg className="submit-spinner" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Withdrawal...
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Withdraw to M-Pesa
                  </>
                )}
              </button>

              {earnings < 100 && (
                <div className="insufficient-balance-alert">
                  <div className="alert-icon">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <p className="alert-text">
                      Complete more deliveries to reach the minimum withdrawal amount of KES 100.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="withdrawal-history-card">
          <div className="withdrawal-history-header">
            <div className="history-header-left">
              <h2>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Withdrawal History
              </h2>
              <p>Track all your withdrawal transactions</p>
            </div>
            {withdrawals.length > 0 && (
              <div className="history-header-right">
                <p className="history-total-label">Total Withdrawn</p>
                <p className="history-total-amount">
                  KES {totalWithdrawn.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {withdrawals.length === 0 ? (
            <div className="withdrawal-empty-state">
              <div className="empty-state-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="empty-state-title">No Withdrawals Yet</h3>
              <p className="empty-state-description">
                You haven't made any withdrawals. Start by completing deliveries to earn money.
              </p>
              <button
                onClick={() => setShowWithdrawForm(true)}
                disabled={earnings < 100}
                className="empty-state-action"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Make Your First Withdrawal
              </button>
            </div>
          ) : (
            <div className="withdrawal-table-wrapper">
              <table className="withdrawal-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>M-Pesa Receipt</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.transaction_id}>
                      <td>
                        <div className="table-cell-id">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          <span>{withdrawal.transaction_id}</span>
                        </div>
                      </td>
                      <td className="table-cell-amount">KES {withdrawal.amount.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge-table status-${withdrawal.status}`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td>
                        {withdrawal.mpesa_receipt_number ? (
                          <span className="table-cell-receipt">
                            {withdrawal.mpesa_receipt_number}
                          </span>
                        ) : (
                          <span className="table-cell-receipt-pending">Pending</span>
                        )}
                      </td>
                      <td className="table-cell-date">
                        {formatDate(withdrawal.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="info-cards-grid">
          <div className="info-card info-card-escrow">
            <div className="info-card-content">
              <div className="info-card-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="info-card-text">
                <h3>Escrow Protection</h3>
                <p>Payments are held in escrow until you complete deliveries. This protects both you and customers.</p>
              </div>
            </div>
          </div>

          <div className="info-card info-card-instant">
            <div className="info-card-content">
              <div className="info-card-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="info-card-text">
                <h3>Instant Withdrawals</h3>
                <p>Once funds are released, withdraw instantly to your M-Pesa account. Available earnings only.</p>
              </div>
            </div>
          </div>

          <div className="info-card info-card-secure">
            <div className="info-card-content">
              <div className="info-card-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="info-card-text">
                <h3>Secure Transactions</h3>
                <p>All transactions are encrypted and secured with M-Pesa integration.</p>
              </div>
            </div>
          </div>

          <div className="info-card info-card-support">
            <div className="info-card-content">
              <div className="info-card-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="info-card-text">
                <h3>24/7 Support</h3>
                <p>Need help with withdrawals or escrow? Our support team is always available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverWallet;
