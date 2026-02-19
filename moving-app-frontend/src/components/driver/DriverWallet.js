import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const DriverWallet = () => {
  const [walletData, setWalletData] = useState({
    earnings: 0,
    pendingPayments: [],
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // Dummy data for completed orders
  const dummyCompletedOrders = [
    {
      booking_id: 5001,
      user_id: 123,
      pickup_location: "123 Main St, Downtown",
      dropoff_location: "456 Park Ave, Uptown",
      status: "completed",
      created_at: "2025-03-20T14:30:00Z",
      price: 24.50,
      distance: 5.8
    },
    {
      booking_id: 5005,
      user_id: 127,
      pickup_location: "444 Willow St, College Town",
      dropoff_location: "222 Aspen Ct, Business District",
      status: "completed",
      created_at: "2025-03-15T13:20:00Z",
      price: 27.80,
      distance: 6.3
    },
    {
      booking_id: 5006,
      user_id: 128,
      pickup_location: "333 Spruce Dr, Shopping Mall",
      dropoff_location: "111 Fir St, Hospital",
      status: "completed",
      created_at: "2025-03-10T08:45:00Z",
      price: 15.90,
      distance: 2.7
    }
  ];

  // Dummy data for transaction history
  const dummyTransactions = [
    { 
      id: 1, 
      type: 'withdraw', 
      amount: 120, 
      date: '2025-03-20T15:30:00Z', 
      status: 'completed' 
    },
    { 
      id: 2, 
      type: 'earning', 
      amount: 45, 
      date: '2025-03-19T12:15:00Z', 
      status: 'completed' 
    },
    { 
      id: 3, 
      type: 'withdraw', 
      amount: 75, 
      date: '2025-03-15T09:45:00Z', 
      status: 'completed' 
    },
    { 
      id: 4, 
      type: 'earning', 
      amount: 32.20, 
      date: '2025-03-10T16:30:00Z', 
      status: 'completed' 
    },
    { 
      id: 5, 
      type: 'earning', 
      amount: 18.75, 
      date: '2025-03-05T14:00:00Z', 
      status: 'completed' 
    }
  ];

  useEffect(() => {
    fetchWalletData();
    fetchTransactionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      // Simulate network delay
      setTimeout(() => {
        const completedOrders = dummyCompletedOrders;
        const totalEarnings = completedOrders.reduce((sum, order) => sum + order.price * 0.8, 0);

        setWalletData({
          earnings: totalEarnings,
          pendingPayments: completedOrders.slice(0, 2), // Use first 2 orders as "pending"
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
      setIsLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      setIsLoading(true);
      // Simulate network delay
      setTimeout(() => {
        setTransactions(dummyTransactions);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      toast.error('Failed to load transaction history');
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > walletData.earnings) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a new transaction record
      const newTransaction = {
        id: Date.now(),
        type: 'withdraw',
        amount: parseFloat(withdrawAmount),
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      // Add the new transaction to the history
      setTransactions([newTransaction, ...transactions]);
      
      // Update wallet balance
      setWalletData({
        ...walletData,
        earnings: walletData.earnings - parseFloat(withdrawAmount)
      });
      
      toast.success('Withdrawal completed successfully!');
      setWithdrawAmount('');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Withdrawal failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !transactions.length && !walletData.pendingPayments.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-4xl w-full p-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Driver Wallet</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Wallet Balance</h2>
            <p className="text-3xl font-bold text-green-600 text-center">${walletData.earnings.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2 text-center">Available for withdrawal</p>

            <form onSubmit={handleWithdraw} className="mt-6">
              <div className="mb-4">
                <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  id="withdrawAmount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
                disabled={isLoading || !withdrawAmount}
              >
                {isLoading ? 'Processing...' : 'Withdraw via M-Pesa'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Pending Payments</h2>
            {walletData.pendingPayments.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {walletData.pendingPayments.map((payment) => (
                  <li key={payment.booking_id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Order #{payment.booking_id}</p>
                        <p className="text-sm text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className="font-semibold">${(payment.price * 0.8).toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">No pending payments</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Transaction History</h2>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'withdraw' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {transaction.type === 'withdraw' ? 'Withdrawal' : 'Earning'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No transaction history</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverWallet;