import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PromoCodeManagement = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');

  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        // Since there's no dedicated endpoint to fetch all promo codes in your backend,
        // let's use a sample data for demonstration
        // In a real application, you would need to create this endpoint
        
        // Sample data
        const samplePromoCodes = [
          { id: 1, code: 'WELCOME10', discount: 10, is_active: true, created_at: '2025-01-15T10:00:00Z' },
          { id: 2, code: 'SUMMER20', discount: 20, is_active: true, created_at: '2025-02-01T08:30:00Z' },
          { id: 3, code: 'FLASH30', discount: 30, is_active: false, created_at: '2025-01-20T14:45:00Z' }
        ];
        
        setPromoCodes(samplePromoCodes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching promo codes:', error);
        toast.error('Failed to load promo codes');
        setLoading(false);
      }
    };

    fetchPromoCodes();
  }, []);

  const handleCreatePromoCode = async (e) => {
    e.preventDefault();
    
    if (!newCode.trim() || !newDiscount) {
      toast.error('Please enter a code and discount value');
      return;
    }
    
    // Validate discount value
    const discountValue = parseFloat(newDiscount);
    if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
      toast.error('Discount must be between 0 and 100');
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/admin/create-promo-code', {
        code: newCode,
        discount: discountValue
      });
      
      // Add new promo code to state
      const newPromoCode = {
        id: Math.max(...promoCodes.map(code => code.id)) + 1,
        code: newCode,
        discount: discountValue,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      setPromoCodes([...promoCodes, newPromoCode]);
      
      // Clear form
      setNewCode('');
      setNewDiscount('');
      
      toast.success('Promo code created successfully!');
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast.error('Failed to create promo code');
    }
  };

  const handleDisablePromoCode = async (promoId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/disable-promo-code/${promoId}`);
      
      // Update state
      setPromoCodes(promoCodes.map(code => 
        code.id === promoId 
          ? { ...code, is_active: false } 
          : code
      ));
      
      toast.success('Promo code disabled successfully!');
    } catch (error) {
      console.error('Error disabling promo code:', error);
      toast.error('Failed to disable promo code');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
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
      <h2 className="text-2xl font-bold mb-6">Promo Code Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Create New Promo Code</h3>
          <form onSubmit={handleCreatePromoCode}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="code">
                Code
              </label>
              <input
                id="code"
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:
outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Enter promo code"
required
/>
</div>

<div className="mb-4">
<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="discount">
Discount (%)
</label>
<input
id="discount"
type="number"
value={newDiscount}
onChange={(e) => setNewDiscount(e.target.value)}
className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Enter discount percentage"
required
/>
</div>

<button
type="submit"
className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
>
Create Promo Code
</button>
</form>
</div>

<div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
<h3 className="text-lg font-semibold mb-4">Active Promo Codes</h3>
{promoCodes.length > 0 ? (
<table className="min-w-full border-collapse border border-gray-200">
<thead>
<tr className="bg-gray-200">
  <th className="border border-gray-300 px-4 py-2">Code</th>
  <th className="border border-gray-300 px-4 py-2">Discount</th>
  <th className="border border-gray-300 px-4 py-2">Status</th>
  <th className="border border-gray-300 px-4 py-2">Created At</th>
  <th className="border border-gray-300 px-4 py-2">Actions</th>
</tr>
</thead>
<tbody>
{promoCodes.map((promo) => (
  <tr key={promo.id} className="border border-gray-200">
    <td className="border border-gray-300 px-4 py-2">{promo.code}</td>
    <td className="border border-gray-300 px-4 py-2">{promo.discount}%</td>
    <td className="border border-gray-300 px-4 py-2">
      {promo.is_active ? (
        <span className="text-green-600 font-semibold">Active</span>
      ) : (
        <span className="text-red-600 font-semibold">Disabled</span>
      )}
    </td>
    <td className="border border-gray-300 px-4 py-2">{formatDate(promo.created_at)}</td>
    <td className="border border-gray-300 px-4 py-2">
      {promo.is_active && (
        <button
          onClick={() => handleDisablePromoCode(promo.id)}
          className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition"
        >
          Disable
        </button>
      )}
    </td>
  </tr>
))}
</tbody>
</table>
) : (
<p className="text-gray-500">No promo codes available.</p>
)}
</div>
</div>
</div>
);
};

export default PromoCodeManagement;
