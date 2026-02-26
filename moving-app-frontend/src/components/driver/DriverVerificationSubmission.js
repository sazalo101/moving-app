import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const DriverVerificationSubmission = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [formData, setFormData] = useState({
    license_number: '',
    license_expiry: '',
    insurance_expiry: '',
    drivers_license_url: '',
    vehicle_registration_url: '',
    insurance_certificate_url: '',
    vehicle_photo_url: '',
    profile_photo_url: ''
  });

  useEffect(() => {
    if (user?.driver_id) {
      fetchVerificationStatus();
    }
  }, [user]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/driver/verification-status/${user.driver_id}`);
      const data = await response.json();
      setVerificationStatus(data);
      
      if (data.verification_status !== 'pending' && data.verification_status !== 'rejected') {
        // Pre-fill form with existing data
        setFormData({
          license_number: data.license_number || '',
          license_expiry: data.license_expiry ? data.license_expiry.split('T')[0] : '',
          insurance_expiry: data.insurance_expiry ? data.insurance_expiry.split('T')[0] : '',
          drivers_license_url: data.documents?.drivers_license || '',
          vehicle_registration_url: data.documents?.vehicle_registration || '',
          insurance_certificate_url: data.documents?.insurance_certificate || '',
          vehicle_photo_url: data.documents?.vehicle_photo || '',
          profile_photo_url: data.documents?.profile_photo || ''
        });
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.license_number || !formData.license_expiry || !formData.insurance_expiry) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.drivers_license_url || !formData.vehicle_registration_url || !formData.insurance_certificate_url) {
      toast.error('Please provide all required document URLs');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/driver/submit-verification/${user.driver_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: user.driver_id,
          ...formData
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Documents submitted successfully! Your verification is now under review.');
        fetchVerificationStatus();
      } else {
        toast.error(data.error || 'Failed to submit documents');
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast.error('Failed to submit documents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-700',
      'under_review': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    // Removed emoji icons for cleaner interface
    return null;
  };

  if (verificationStatus?.is_verified && verificationStatus?.verification_status === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-4"></div>
            <h2 className="text-xl font-bold text-green-600 mb-2">You're Verified!</h2>
            <p className="text-gray-600">
              Your driver account has been verified and approved. You can now accept orders from customers.
            </p>
            <div className="mt-6 bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Verified on:</strong> {new Date(verificationStatus.verified_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Driver Verification</h1>
        <p className="text-gray-600 mb-6">
          Submit your documents to get verified and start accepting orders
        </p>

        {/* Current Status */}
        {verificationStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Current Status</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verificationStatus.verification_status)}`}>
                    {getStatusIcon(verificationStatus.verification_status)} {verificationStatus.verification_status || 'pending'}
                  </span>
                </div>
              </div>
              {verificationStatus.submitted_at && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(verificationStatus.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            
            {verificationStatus.rejection_reason && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-700">{verificationStatus.rejection_reason}</p>
                <p className="text-xs text-red-600 mt-2">Please update your documents and resubmit.</p>
              </div>
            )}

            {verificationStatus.verification_status === 'under_review' && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⏳ Your documents are currently under review. This typically takes 1-2 business days.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Document Submission Form */}
        {(!verificationStatus || verificationStatus.verification_status === 'pending' || verificationStatus.verification_status === 'rejected') && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit Verification Documents</h3>

            {/* License Information */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Driver's License Information</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., DL123456789"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="license_expiry"
                    value={formData.license_expiry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Insurance Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="insurance_expiry"
                  value={formData.insurance_expiry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Document URLs */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Document URLs</h4>
              <p className="text-sm text-gray-500 mb-4">
                Upload your documents to a cloud storage (e.g., Google Drive, Dropbox) and paste the public URLs below.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver's License <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="drivers_license_url"
                    value={formData.drivers_license_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Registration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="vehicle_registration_url"
                    value={formData.vehicle_registration_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Certificate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="insurance_certificate_url"
                    value={formData.insurance_certificate_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Photo
                  </label>
                  <input
                    type="url"
                    name="vehicle_photo_url"
                    value={formData.vehicle_photo_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Photo
                  </label>
                  <input
                    type="url"
                    name="profile_photo_url"
                    value={formData.profile_photo_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Your documents will be reviewed by our admin team within 1-2 business days.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default DriverVerificationSubmission;
