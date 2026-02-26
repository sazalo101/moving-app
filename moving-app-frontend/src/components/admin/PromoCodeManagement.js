import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PromoCodeManagement.css';

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
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="promo-container">
      <h2 className="promo-title">Promo Code Management</h2>
      
      <div className="promo-grid">
        <div className="create-section">
          <h3 className="section-title">Create New Promo Code</h3>
          <form onSubmit={handleCreatePromoCode} className="promo-form">
            <div className="form-group">
              <label className="form-label" htmlFor="code">
                Code
              </label>
              <input
                id="code"
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="form-input"
                placeholder="Enter promo code"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="discount">
                Discount (%)
              </label>
              <input
                id="discount"
                type="number"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                className="form-input"
                placeholder="Enter discount percentage"
                required
              />
            </div>

            <button type="submit" className="create-button">
              Create Promo Code
            </button>
          </form>
        </div>

        <div className="promo-list-section">
          <h3 className="section-title">Active Promo Codes</h3>
          {promoCodes.length > 0 ? (
            <table className="promo-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map((promo) => (
                  <tr key={promo.id}>
                    <td>{promo.code}</td>
                    <td>{promo.discount}%</td>
                    <td>
                      {promo.is_active ? (
                        <span className="status-active">Active</span>
                      ) : (
                        <span className="status-disabled">Disabled</span>
                      )}
                    </td>
                    <td>{formatDate(promo.created_at)}</td>
                    <td>
                      {promo.is_active && (
                        <button
                          onClick={() => handleDisablePromoCode(promo.id)}
                          className="disable-button"
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
            <p className="empty-message">No promo codes available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoCodeManagement;
