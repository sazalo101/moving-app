import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const DriverVerification = () => {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingDrivers();
    fetchAllDrivers();
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/admin/pending-verifications');
      const data = await response.json();
      setPendingDrivers(data.pending_verifications || []);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      toast.error('Failed to fetch pending verifications');
    }
  };

  const fetchAllDrivers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/admin/all-drivers-verification');
      const data = await response.json();
      setAllDrivers(data.drivers || []);
    } catch (error) {
      console.error('Error fetching all drivers:', error);
      toast.error('Failed to fetch drivers');
    }
  };

  const handleApprove = async (driverId) => {
    if (!window.confirm('Are you sure you want to approve this driver?')) {
      return;
    }

    setLoading(true);
    try {
      const adminUser = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://127.0.0.1:5000/api/admin/verify-driver/${driverId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: driverId,
          admin_id: adminUser.id,
          action: 'approve'
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('✅ Driver approved successfully!');
        fetchPendingDrivers();
        fetchAllDrivers();
        setSelectedDriver(null);
      } else {
        toast.error(data.error || 'Failed to approve driver');
      }
    } catch (error) {
      console.error('Error approving driver:', error);
      toast.error('Failed to approve driver');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (driver) => {
    setSelectedDriver(driver);
    setShowRejectionModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const adminUser = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://127.0.0.1:5000/api/admin/verify-driver/${selectedDriver.driver_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: selectedDriver.driver_id,
          admin_id: adminUser.id,
          action: 'reject',
          rejection_reason: rejectionReason
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Driver verification rejected');
        fetchPendingDrivers();
        fetchAllDrivers();
        setShowRejectionModal(false);
        setSelectedDriver(null);
        setRejectionReason('');
      } else {
        toast.error(data.error || 'Failed to reject driver');
      }
    } catch (error) {
      console.error('Error rejecting driver:', error);
      toast.error('Failed to reject driver');
    } finally {
      setLoading(false);
    }
  };

  const openDocument = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.info('Document not available');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-gray-100 text-gray-700',
      'under_review': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Driver Verification Management</h1>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Verifications
              {pendingDrivers.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingDrivers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Drivers
            </button>
          </div>
        </div>

        {/* Pending Verifications Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingDrivers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No pending verifications at this time</p>
              </div>
            ) : (
              pendingDrivers.map((driver) => (
                <div key={driver.driver_id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{driver.name}</h3>
                      <p className="text-sm text-gray-600">{driver.email} • {driver.phone}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted: {formatDate(driver.submitted_at)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(driver.verification_status || 'pending')}`}>
                      Under Review
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600"><strong>Vehicle Type:</strong> {driver.vehicle_type}</p>
                      <p className="text-sm text-gray-600"><strong>License Plate:</strong> {driver.license_plate}</p>
                      <p className="text-sm text-gray-600"><strong>License Number:</strong> {driver.license_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600"><strong>License Expiry:</strong> {formatDate(driver.license_expiry)}</p>
                      <p className="text-sm text-gray-600"><strong>Insurance Expiry:</strong> {formatDate(driver.insurance_expiry)}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Submitted Documents:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <button
                        onClick={() => openDocument(driver.documents?.drivers_license)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
                      >
                        📄 Driver License
                      </button>
                      <button
                        onClick={() => openDocument(driver.documents?.vehicle_registration)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
                      >
                        📄 Registration
                      </button>
                      <button
                        onClick={() => openDocument(driver.documents?.insurance_certificate)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
                      >
                        📄 Insurance
                      </button>
                      <button
                        onClick={() => openDocument(driver.documents?.vehicle_photo)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
                      >
                        📷 Vehicle
                      </button>
                      <button
                        onClick={() => openDocument(driver.documents?.profile_photo)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
                      >
                        📷 Profile
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(driver.driver_id)}
                      disabled={loading}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(driver)}
                      disabled={loading}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All Drivers Tab */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ratings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verified By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allDrivers.map((driver) => (
                    <tr key={driver.driver_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        <div className="text-sm text-gray-500">{driver.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{driver.vehicle_type}</div>
                        <div className="text-sm text-gray-500">{driver.license_plate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(driver.verification_status || 'pending')}`}>
                          {driver.verification_status || 'pending'}
                        </span>
                        {driver.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">{driver.rejection_reason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ⭐ {driver.ratings || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {driver.completed_orders || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {driver.verified_by || 'N/A'}
                        {driver.verified_at && (
                          <div className="text-xs text-gray-400">{formatDate(driver.verified_at)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Driver Verification</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedDriver?.name}'s verification:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="4"
              placeholder="e.g., License is expired, Vehicle registration is unclear, etc."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedDriver(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverVerification;
