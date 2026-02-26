import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Drivers</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Vehicle</th>
              <th className="py-3 px-6 text-left">Verification</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Completed Orders</th>
              <th className="py-3 px-6 text-left">Ratings</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <tr key={driver.driver_id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">{driver.driver_id}</td>
                  <td className="py-3 px-6 text-left">{driver.name}</td>
                  <td className="py-3 px-6 text-left">{driver.email}</td>
                  <td className="py-3 px-6 text-left">
                    <span className="text-sm text-gray-600">{driver.vehicle_type}</span>
                    <br />
                    <span className="text-xs text-gray-400">{driver.license_plate}</span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      driver.is_verified && driver.verification_status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : driver.verification_status === 'under_review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : driver.verification_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {driver.is_verified && driver.verification_status === 'approved' && '✓ Verified'}
                      {driver.verification_status === 'under_review' && '🔍 Under Review'}
                      {driver.verification_status === 'rejected' && '❌ Rejected'}
                      {driver.verification_status === 'pending' && '⏳ Pending'}
                      {!driver.verification_status && '⏳ Not Submitted'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span className={`px-2 py-1 rounded-full text-xs ${driver.is_banned ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                      {driver.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">{driver.completed_orders || 0}</td>
                  <td className="py-3 px-6 text-left">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      {driver.ratings ? driver.ratings.toFixed(1) : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center flex-wrap gap-1">
                      <button 
                        onClick={() => handleBanDriver(driver.user_id)}
                        disabled={driver.is_banned}
                        className={`transform hover:scale-110 ${driver.is_banned ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-700'} text-white py-1 px-3 rounded text-xs`}
                      >
                        {driver.is_banned ? 'Banned' : 'Ban'}
                      </button>
                      <a
                        href="/admin/driver-verification"
                        className="transform hover:scale-110 bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs inline-block"
                      >
                        Verify
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-4 px-6 text-center">No drivers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageDrivers;