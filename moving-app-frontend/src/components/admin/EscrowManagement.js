import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Escrow Management</h2>
      
      <div className="mb-6">
        <div className="flex flex-wrap -mx-2">
          <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800">Total Orders in Escrow</h3>
              <p className="text-2xl font-bold text-blue-600">{escrowOrders.length}</p>
            </div>
          </div>
          <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">Total Value</h3>
              <p className="text-2xl font-bold text-green-600">
                ${escrowOrders.reduce((total, order) => total + order.price, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Booking ID</th>
              <th className="py-3 px-6 text-left">User ID</th>
              <th className="py-3 px-6 text-left">Driver ID</th>
              <th className="py-3 px-6 text-left">Price</th>
              <th className="py-3 px-6 text-left">Date</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {escrowOrders.length > 0 ? (
              escrowOrders.map((order) => (
                <tr key={order.booking_id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">{order.booking_id}</td>
                  <td className="py-3 px-6 text-left">{order.user_id}</td>
                  <td className="py-3 px-6 text-left">{order.driver_id}</td>
                  <td className="py-3 px-6 text-left">${order.price.toFixed(2)}</td>
                  <td className="py-3 px-6 text-left">{formatDate(order.created_at)}</td>
                  <td className="py-3 px-6 text-center">
                    <button 
                      onClick={() => handleReleasePayment(order.booking_id, order.driver_id, order.price)}
                      className="bg-green-500 hover:bg-green-700 text-white py-1 px-3 rounded transform hover:scale-110"
                    >
                      Release Payment
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-4 px-6 text-center">No orders in escrow</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EscrowManagement;