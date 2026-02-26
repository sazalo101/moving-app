import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './DriverVerification.css';

const DriverVerification = () => {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
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

  const getStatusClass = (status) => {
    const statusMap = {
      'pending': 'pending',
      'under_review': 'under-review',
      'approved': 'approved',
      'rejected': 'rejected'
    };
    return statusMap[status] || 'pending';
  };

  return (
    <div className="verification-container">
      <div className="verification-wrapper">
        <h1 className="verification-title">Driver Verification Management</h1>

        {/* Tab Navigation */}
        <div className="verification-tabs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          >
            Pending Verifications
            {pendingDrivers.length > 0 && (
              <span style={{marginLeft: '0.5rem', backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', borderRadius: '9999px', padding: '0.125rem 0.5rem'}}>
                {pendingDrivers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          >
            All Drivers
          </button>
        </div>

        {/* Pending Verifications Tab */}
        {activeTab === 'pending' && (
          <div className="driver-grid">
            {pendingDrivers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3 className="empty-title">No Pending Verifications</h3>
                <p className="empty-description">All driver verifications have been processed</p>
              </div>
            ) : (
              pendingDrivers.map((driver) => (
                <div key={driver.driver_id} className="driver-verification-card">
                  <div className="driver-header">
                    <div className="driver-info">
                      <h3 className="driver-name">{driver.name}</h3>
                      <p className="driver-email">{driver.email} • {driver.phone}</p>
                      <p className="driver-phone">Submitted: {formatDate(driver.submitted_at)}</p>
                    </div>
                    <span className={`status-badge ${getStatusClass(driver.verification_status || 'pending')}`}>
                      Under Review
                    </span>
                  </div>

                  <div className="driver-details">
                    <div className="detail-row">
                      <span className="detail-label">Vehicle Type:</span>
                      <span className="detail-value">{driver.vehicle_type}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">License Plate:</span>
                      <span className="detail-value">{driver.license_plate}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">License Number:</span>
                      <span className="detail-value">{driver.license_number || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">License Expiry:</span>
                      <span className="detail-value">{formatDate(driver.license_expiry)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Insurance Expiry:</span>
                      <span className="detail-value">{formatDate(driver.insurance_expiry)}</span>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="documents-section">
                    <h4 className="documents-title">Submitted Documents:</h4>
                    <div className="document-list">
                      <button onClick={() => openDocument(driver.documents?.drivers_license)} className="document-button">
                        <span className="doc-icon">📄</span> Driver License
                      </button>
                      <button onClick={() => openDocument(driver.documents?.vehicle_registration)} className="document-button">
                        <span className="doc-icon">📄</span> Registration
                      </button>
                      <button onClick={() => openDocument(driver.documents?.insurance_certificate)} className="document-button">
                        <span className="doc-icon">📄</span> Insurance
                      </button>
                      <button onClick={() => openDocument(driver.documents?.vehicle_photo)} className="document-button">
                        <span className="doc-icon">📷</span> Vehicle Photo
                      </button>
                      <button onClick={() => openDocument(driver.documents?.profile_photo)} className="document-button">
                        <span className="doc-icon">📷</span> Profile Photo
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button
                      onClick={() => handleApprove(driver.driver_id)}
                      disabled={loading}
                      className="approve-button"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(driver)}
                      disabled={loading}
                      className="reject-button"
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
          <div style={{backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
            <div style={{overflowX: 'auto'}}>
              <table style={{minWidth: '100%', borderCollapse: 'collapse'}}>
                <thead style={{backgroundColor: '#f9fafb'}}>
                  <tr>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                      Driver
                    </th>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                      Vehicle
                    </th>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                      Status
                    </th>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                      Ratings
                    </th>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                      Orders
                    </th>
                    <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                      Verified By
                    </th>
                  </tr>
                </thead>
                <tbody style={{backgroundColor: 'white'}}>
                  {allDrivers.map((driver) => (
                    <tr key={driver.driver_id} style={{borderTop: '1px solid #e5e7eb'}}>
                      <td style={{padding: '1rem 1.5rem'}}>
                        <div style={{fontSize: '0.875rem', fontWeight: '600', color: '#1f2937'}}>{driver.name}</div>
                        <div style={{fontSize: '0.875rem', color: '#6b7280'}}>{driver.email}</div>
                      </td>
                      <td style={{padding: '1rem 1.5rem'}}>
                        <div style={{fontSize: '0.875rem', color: '#1f2937'}}>{driver.vehicle_type}</div>
                        <div style={{fontSize: '0.875rem', color: '#6b7280'}}>{driver.license_plate}</div>
                      </td>
                      <td style={{padding: '1rem 1.5rem'}}>
                        <span className={`status-badge ${getStatusClass(driver.verification_status || 'pending')}`}>
                          {driver.verification_status || 'pending'}
                        </span>
                        {driver.rejection_reason && (
                          <p style={{fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem'}}>{driver.rejection_reason}</p>
                        )}
                      </td>
                      <td style={{padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280'}}>
                        ⭐ {driver.ratings || 0}
                      </td>
                      <td style={{padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280'}}>
                        {driver.completed_orders || 0}
                      </td>
                      <td style={{padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280'}}>
                        {driver.verified_by || 'N/A'}
                        {driver.verified_at && (
                          <div style={{fontSize: '0.75rem', color: '#9ca3af'}}>{formatDate(driver.verified_at)}</div>
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Reject Driver Verification</h3>
            <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem'}}>
              Please provide a reason for rejecting {selectedDriver?.name}'s verification:
            </p>
            <label className="modal-label">Rejection Reason</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="modal-textarea"
              rows="4"
              placeholder="e.g., License is expired, Vehicle registration is unclear, etc."
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedDriver(null);
                }}
                className="modal-cancel"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="modal-submit"
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
