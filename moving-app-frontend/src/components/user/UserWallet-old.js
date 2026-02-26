import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const UserWallet = () => {
  const { currentUser } = useAuth();
  
  const initialDummyTransactions = [
    {
      id: "txn_001",
      transaction_id: "txn_001",
      type: "deposit",
      amount: 100.00,
      created_at: "2025-03-15T14:30:22Z",
      status: "completed"
    },
    {
      id: "txn_002",
      transaction_id: "txn_002",
      type: "withdrawal",
      amount: 25.50,
      created_at: "2025-03-12T09:15:43Z",
      status: "completed"
    },
    {
      id: "txn_003",
      transaction_id: "txn_003",
      type: "deposit",
      amount: 50.00,
      created_at: "2025-03-10T17:45:10Z",
      status: "failed"
    }
  ];

  const [balance, setBalance] = useState(150.50);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactions, setTransactions] = useState(initialDummyTransactions);
  const [loading, setLoading] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Load user phone number if available
    if (currentUser && currentUser.phone) {
      setPhoneNumber(currentUser.phone);
    }
    setTimeout(() => setLoading(false), 1000);
  }, [currentUser]);

  // Cleanup timeout on unmount
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
        setBalance(prev => prev + parseFloat(amount));
        toast.success('✅ Payment completed successfully!', {
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
        toast.error('❌ Payment failed. Please try again.', {
          position: "top-center",
          autoClose: 4000,
        });
        setIsDepositing(false);
        return;
      } else if (attempts < maxAttempts) {
        // Still pending, check again in 3 seconds
        setTimeout(poll, 3000);
      } else {
        // Max attempts reached, stop polling
        toast.warning('⏱️ Payment is taking longer than expected. Check back later.', {
          position: "top-center",
          autoClose: 5000,
        });
        setIsDepositing(false);
      }
    };
    
    // Start polling after 5 seconds (give time for user to enter PIN)
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

    // Validate phone number format
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

      // Set a 10-second timeout to cancel payment if no response
      const timeout = setTimeout(() => {
        setIsDepositing(false);
        toast.dismiss(loadingToast);
        toast.error('⏱️ Payment timeout. Please try again and enter your PIN promptly.', {
          position: "top-center",
          autoClose: 5000,
        });
      }, 10000);

      setPaymentTimeout(timeout);

      // Call the backend M-Pesa STK Push endpoint
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
      
      // Clear timeout on response
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
        toast.success('📱 Check your phone to complete payment', {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
        });

        // Start polling for transaction status
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
      // Clear timeout on error
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Wallet</h1>

      <div className="bg-gradient-to-r from-green-50 to-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2 md:mb-0">Current Balance</h2>
          <span className="text-3xl font-bold text-green-600">KES {balance.toFixed(2)}</span>
        </div>

        <form onSubmit={handleDeposit} className="mt-4 max-w-lg mx-auto">
          <div className="space-y-3.5 mb-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1.5 text-center">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full max-w-xs mx-auto block px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="e.g., 0712345678"
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-center">Enter your Safaricom number</p>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1.5 text-center">
                Deposit Amount (KES)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full max-w-xs mx-auto block px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="Enter amount"
                min="1"
                step="1"
                required
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isDepositing || loading}
              className="bg-green-600 text-white py-1.5 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 min-w-[120px]"
            >
              {isDepositing ? (
                <span className="flex items-center justify-center gap-1">
                  <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <span>💳</span>
                  <span>Pay via M-Pesa</span>
                </span>
              )}
            </button>
          </div>
          {isDepositing && (
            <div className="mt-3 max-w-sm mx-auto p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800 text-center font-medium flex items-center justify-center gap-1">
                <span>📱</span>
                <span>Check your phone - You have 10 seconds to enter PIN</span>
              </p>
            </div>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-5 pb-2 border-b border-gray-200">
          Transaction History
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-green-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(transaction.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{transaction.transaction_id.substring(0, 15)}...</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${transaction.type === 'deposit' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {transaction.type === 'deposit' ? '↓ Deposit' : '↑ Withdrawal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-right">
                      <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'deposit' ? '+' : '-'}KES {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.status === 'completed' ? '✓ Completed' : transaction.status === 'pending' ? '⏳ Pending' : '✗ Failed'}
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
