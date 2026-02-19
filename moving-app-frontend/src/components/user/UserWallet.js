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

  useEffect(() => {
    setLoading(true);
    // Load user phone number if available
    if (currentUser && currentUser.phone) {
      setPhoneNumber(currentUser.phone);
    }
    setTimeout(() => setLoading(false), 1000);
  }, [currentUser]);

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
        toast.success('Payment completed successfully!');
        setAmount('');
        setIsDepositing(false);
        return;
      } else if (status === 'failed') {
        setTransactions(prev => prev.map(t =>
          t.transaction_id === transactionId ? { ...t, status: 'failed' } : t
        ));
        toast.error('Payment failed. Please try again.');
        setIsDepositing(false);
        return;
      } else if (attempts < maxAttempts) {
        // Still pending, check again in 3 seconds
        setTimeout(poll, 3000);
      } else {
        // Max attempts reached, stop polling
        toast.warning('Payment is taking longer than expected. Check back later.');
        setIsDepositing(false);
      }
    };
    
    // Start polling after 5 seconds (give time for user to enter PIN)
    setTimeout(poll, 5000);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!phoneNumber) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!currentUser || !currentUser.id) {
      toast.error('User session not found. Please login again.');
      return;
    }

    try {
      setIsDepositing(true);

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
        toast.success('STK Push sent! Please check your phone and enter your M-Pesa PIN.');

        // Start polling for transaction status
        pollTransactionStatus(data.transaction_id);

      } else {
        toast.error(data.error || 'Failed to initiate M-Pesa payment');
        setIsDepositing(false);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to connect to payment server. Please try again.');
      setIsDepositing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Balance</h2>
          <span className="text-2xl font-bold text-green-600">KES {balance.toFixed(2)}</span>
        </div>

        <form onSubmit={handleDeposit} className="mt-4 text-center">
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-gray-700 mb-2">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="e.g., 0712345678 or 254712345678"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter your Safaricom M-Pesa number</p>
          </div>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 mb-2">
              Deposit Amount (KES)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Enter amount"
              min="1"
              step="1"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isDepositing || loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
          >
            {isDepositing ? 'Processing...' : 'Pay via M-Pesa'}
          </button>
          {isDepositing && (
            <p className="text-sm text-gray-600 mt-2">
              Please check your phone and enter your M-Pesa PIN to complete the payment...
            </p>
          )}
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

        {loading ? (
          <p className="text-center py-4">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 mx-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-center">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.transaction_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{transaction.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'deposit' ? '+' : '-'}KES {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.status}
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
