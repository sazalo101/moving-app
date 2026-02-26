import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ManageDrivers.css';

const ManageDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        // Get all drivers with verification status
        const res = await axios.get('http://localhost:5000/api/admin/all-drivers-verification');
        setDrivers(res.data.drivers || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching drivers:', error);
        toast.error('Failed to load drivers');
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const handleBanDriver = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/ban-user/${userId}`);
      
      // Update state
      setDrivers(drivers.map(driver => 
        driver.user_id === userId 
          ? { ...driver, is_banned: true } 
          : driver
      ));
      
      toast.success('Driver banned successfully!');
    } catch (error) {
      console.error('Error banning driver:', error);
      toast.error('Failed to ban driver');
    }
  };

  const handleToggleDriverAvailability = async (driverId, currentStatus) => {
    try {
      await axios.post('http://localhost:5000/api/driver/toggle-availability', {
        driver_id: driverId,
        is_available: !currentStatus
      });
      
      // Update state
      setDrivers(drivers.map(driver => 
        driver.id === driverId 
          ? { ...driver, is_available: !currentStatus } 
          : driver
      ));
      
      toast.success(`Driver availability ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling driver availability:', error);
      toast.error('Failed to update driver availability');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="manage-drivers-container">
      <h2 className="manage-drivers-title">Manage Drivers</h2>
      
      <div className="table-container">
        <table className="drivers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Vehicle</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Completed Orders</th>
              <th>Ratings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <tr key={driver.driver_id}>
                  <td>{driver.driver_id}</td>
                  <td>{driver.name}</td>
                  <td>{driver.email}</td>
                  <td>
                    <div className="vehicle-info">
                      <span className="vehicle-type">{driver.vehicle_type}</span>
                      <br />
                      <span className="license-plate">{driver.license_plate}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`verification-badge ${
                      driver.is_verified && driver.verification_status === 'approved' 
                        ? 'approved' 
                        : driver.verification_status === 'under_review'
                        ? 'under-review'
                        : driver.verification_status === 'rejected'
                        ? 'rejected'
                        : 'pending'
                    }`}>
                      {driver.is_verified && driver.verification_status === 'approved' && '✓ Verified'}
                      {driver.verification_status === 'under_review' && '🔍 Under Review'}
                      {driver.verification_status === 'rejected' && '❌ Rejected'}
                      {driver.verification_status === 'pending' && '⏳ Pending'}
                      {!driver.verification_status && '⏳ Not Submitted'}
                    </span>
                  </td>
                  <td>
                    <span className={`driver-status-badge ${driver.is_banned ? 'banned' : 'active'}`}>
                      {driver.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td>{driver.completed_orders || 0}</td>
                  <td>
                    <span className="rating-display">
                      <span className="rating-star">★</span>
                      {driver.ratings ? driver.ratings.toFixed(1) : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleBanDriver(driver.user_id)}
                        disabled={driver.is_banned}
                        className={`ban-driver-button ${driver.is_banned ? 'banned' : 'active'}`}
                      >
                        {driver.is_banned ? 'Banned' : 'Ban'}
                      </button>
                      <a
                        href="/admin/driver-verification"
                        className="verify-driver-link"
                      >
                        Verify
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colspan="9" className="empty-state">No drivers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageDrivers;