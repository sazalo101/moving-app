import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ManageDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        // First get all users
        const res = await axios.get('http://localhost:5000/api/admin/manage-users');
        // Filter only driver role users
        const driverUsers = res.data.users.filter(user => user.role === 'driver');
        
        // For each driver user, get additional driver info
        const driversWithDetails = await Promise.all(
          driverUsers.map(async (driverUser) => {
            try {
              // Assuming there's a driver record for each user with driver role
              const driverRes = await axios.get(`http://localhost:5000/api/driver/order-history/${driverUser.user_id}`);
              return {
                ...driverUser,
                orders: driverRes.data.orders || [],
                orderCount: driverRes.data.orders ? driverRes.data.orders.length : 0
              };
            } catch (error) {
              console.error(`Error fetching driver details for ${driverUser.user_id}:`, error);
              return driverUser;
            }
          })
        );
        
        setDrivers(driversWithDetails);
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
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Completed Orders</th>
              <th className="py-3 px-6 text-left">Ratings</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <tr key={driver.user_id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">{driver.user_id}</td>
                  <td className="py-3 px-6 text-left">{driver.name}</td>
                  <td className="py-3 px-6 text-left">{driver.email}</td>
                  <td className="py-3 px-6 text-left">
                    <span className={`px-2 py-1 rounded-full text-xs ${driver.is_banned ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                      {driver.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">{driver.orderCount || 0}</td>
                  <td className="py-3 px-6 text-left">
                    {driver.ratings || 'N/A'}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center">
                      <button 
                        onClick={() => handleBanDriver(driver.user_id)}
                        disabled={driver.is_banned}
                        className={`mx-1 transform hover:scale-110 ${driver.is_banned ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-700'} text-white py-1 px-3 rounded`}
                      >
                        {driver.is_banned ? 'Banned' : 'Ban Driver'}
                      </button>
                      <button 
                        onClick={() => handleToggleDriverAvailability(driver.id, driver.is_available)}
                        className={`mx-1 transform hover:scale-110 ${driver.is_available ? 'bg-orange-500 hover:bg-orange-700' : 'bg-green-500 hover:bg-green-700'} text-white py-1 px-3 rounded`}
                      >
                        {driver.is_available ? 'Set Unavailable' : 'Set Available'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-4 px-6 text-center">No drivers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageDrivers;