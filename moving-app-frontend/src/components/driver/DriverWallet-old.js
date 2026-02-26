import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API_ENDPOINTS from '../../config/api';
import './DriverPages.css';

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

      // Fallback: If driver_id is not in localStorage, fetch it from backend
      if (!driverId && user.id && user.role === 'driver') {
        try {
          const driverResponse = await fetch(API_ENDPOINTS.GET_DRIVER_BY_USER(user.id));
          const driverData = await driverResponse.json();
          if (driverResponse.ok && driverData.driver_id) {
            driverId = driverData.driver_id;
            // Update localStorage with driver_id
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
        toast.success(`✅ ${data.message}`);
        setWithdrawAmount('');
        setShowWithdrawForm(false);
        fetchDriverEarnings(); // Refresh earnings
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

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'text-green-600 bg-green-100',
      'pending': 'text-yellow-600 bg-yellow-100',
      'failed': 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '16px', color: '#6b7280', fontWeight: '500' }}>Loading your wallet...</p>
        </div>
      </div>
    );
  }

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const averagePerOrder = completedOrders > 0 ? earnings / completedOrders : 0;

  return (
    <div className="driver-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Driver Wallet</h1>
              <p style={{ marginTop: '4px', fontSize: '13px', color: '#6b7280' }}>
                Manage your earnings and withdraw to M-Pesa
              </p>
            </div>
            <button onClick={() => fetchDriverEarnings()} className="btn btn-primary">
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Key Metrics Cards */}
        <div className="stats-grid">
          {/* Available Earnings Card */}
          <div style={{
            background: 'linear-gradient(to bottom right, #10b981, #059669)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
            padding: '24px',
            color: 'white',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '8px' }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '600' }}>AVAILABLE</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>KES {earnings.toFixed(2)}</h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Ready to withdraw now</p>
          </div>

          {/* Pending Escrow Card */}
          <div style={{
            background: 'linear-gradient(to bottom right, #f59e0b, #d97706)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
            padding: '24px',
            color: 'white',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '8px' }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '600' }}>IN ESCROW</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>KES {pendingEscrow.toFixed(2)}</h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Complete {pendingOrders} order(s) to release</p>
          </div>

          {/* Completed Orders Card */}
          <div style={{
            background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
            padding: '24px',
            color: 'white',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '8px' }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '600' }}>COMPLETED</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>{completedOrders}</h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Total deliveries</p>
          </div>

          {/* Rating Card */}
          <div style={{
            background: 'linear-gradient(to bottom right, #9333ea, #7e22ce)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
            padding: '24px',
            color: 'white',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '8px' }}>
                <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '600' }}>RATING</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>{ratings.toFixed(1)}</h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Out of 5.0</p>
          </div>
        </div>

        {/* Escrow Info Banner */}
        {pendingOrders > 0 && (
          <div className="card" style={{
            background: 'linear-gradient(to right, #fef3c7, #fde68a, #fed7aa)',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ background: '#f59e0b', borderRadius: '50%', padding: '8px' }}>
                  <svg style={{ width: '18px', height: '18px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#78350f', marginBottom: '8px' }}>You have funds in escrow</h3>
                <p style={{ color: '#92400e', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600' }}>KES {pendingEscrow.toFixed(2)}</span> from {pendingOrders} pending {pendingOrders === 1 ? 'order' : 'orders'} will be released to your available balance once you complete {pendingOrders === 1 ? 'the delivery' : 'the deliveries'}.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '12px', border: '1px solid #fcd34d' }}>
                  <p style={{ fontSize: '14px', color: '#78350f' }}>
                    <span style={{ fontWeight: '600' }}>How it works:</span> When customers book your services, payments are held securely in escrow. 
                    After you complete the delivery, funds are automatically released to your available balance and you can withdraw them to M-Pesa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions and Withdraw Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Quick Withdraw Actions */}
          <div className="card">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '18px', height: '18px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Withdraw
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Select an amount to withdraw instantly</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[500, 1000, 2000, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickWithdraw(amount)}
                  disabled={earnings < amount}
                  className={`btn ${earnings >= amount ? 'btn-success' : ''}`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: earnings < amount ? '#f3f4f6' : undefined,
                    color: earnings < amount ? '#9ca3af' : undefined,
                    cursor: earnings < amount ? 'not-allowed' : undefined
                  }}
                >
                  Withdraw KES {amount.toLocaleString()}
                </button>
              ))}
              <button
                onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
              >
                {showWithdrawForm ? 'Hide' : 'Custom'} Amount
              </button>
            </div>
          </div>

          {/* Withdraw Form */}
          <div className={`lg:col-span-2 bg-white rounded-xl shadow-md p-6 transition-all ${showWithdrawForm ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Withdraw to M-Pesa
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Funds will be sent directly to your M-Pesa account
                </p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="0712345678"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Format: 0712345678 or 254712345678</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Withdrawal Amount (KES)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-semibold">KES</span>
                  </div>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Enter amount"
                    min="100"
                    max="50000"
                    step="50"
                    required
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">Min: KES 100 | Max: KES 50,000</p>
                  <p className="text-xs font-semibold text-emerald-600">
                    Available: KES {earnings.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isWithdrawing || earnings < 100}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isWithdrawing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Withdrawal...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Withdraw to M-Pesa
                  </span>
                )}
              </button>

              {earnings < 100 && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-700">
                        Complete more deliveries to reach the minimum withdrawal amount of KES 100.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Withdrawal History
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Track all your withdrawal transactions
                </p>
              </div>
              {withdrawals.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    KES {totalWithdrawn.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Withdrawals Yet</h3>
              <p className="text-gray-500 mb-6">
                You haven't made any withdrawals. Start by completing deliveries to earn money.
              </p>
              <button
                onClick={() => setShowWithdrawForm(true)}
                disabled={earnings < 100}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Make Your First Withdrawal
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      M-Pesa Receipt
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((withdrawal, index) => (
                    <tr key={withdrawal.transaction_id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          <span className="text-sm font-mono text-gray-900">{withdrawal.transaction_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">KES {withdrawal.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {withdrawal.mpesa_receipt_number ? (
                          <span className="text-sm font-mono text-emerald-600 font-semibold">
                            {withdrawal.mpesa_receipt_number}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="bg-amber-500 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Escrow Protection</h3>
                <p className="text-sm text-amber-700">Payments are held in escrow until you complete deliveries. This protects both you and customers.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Instant Withdrawals</h3>
                <p className="text-sm text-blue-700">Once funds are released, withdraw instantly to your M-Pesa account. Available earnings only.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-500 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 mb-1">Secure Transactions</h3>
                <p className="text-sm text-emerald-700">All transactions are encrypted and secured with M-Pesa integration.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">24/7 Support</h3>
                <p className="text-sm text-purple-700">Need help with withdrawals or escrow? Our support team is always available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverWallet;
