import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './ManageUsers.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/manage-users');
      const data = await response.json();
      
      if (data.users) {
        // Only get users with role 'user', not 'driver' or 'admin'
        const usersList = data.users.filter(user => user.role === 'user');
        setUsers(usersList);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/ban-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'User banned successfully');
        // Update the local state to reflect the change
        setUsers(users.map(user => 
          user.user_id === userId ? { ...user, is_banned: true } : user
        ));
      } else {
        toast.error(data.error || 'Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    // In a real app, you would have an unban endpoint
    // For now, we'll simulate it by updating the local state
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, is_banned: false } : user
      ));
      
      toast.success('User unbanned successfully');
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterRole === 'all') return matchesSearch;
    if (filterRole === 'banned') return matchesSearch && user.is_banned;
    if (filterRole === 'active') return matchesSearch && !user.is_banned;
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="manage-users-container">
      <h1 className="manage-users-title">Manage Users</h1>
      
      {/* Filters */}
      <div className="search-filter-section">
        <div className="search-filter-grid">
          <div className="search-input-wrapper">
            <input
              type="text"
              id="search"
              placeholder="Search by name or email"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            id="filter"
            className="filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="banned">Banned Users</option>
          </select>
        </div>
      </div>
      
      {/* Users Grid */}
      <div className="users-grid">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.user_id} className="user-card">
              <div className="user-header">
                <div className="user-info">
                  <h3 className="user-name">{user.name}</h3>
                  <p className="user-email">{user.email}</p>
                  <p className="user-phone">ID: {user.user_id}</p>
                </div>
                <span className={`user-status-badge ${user.is_banned ? 'banned' : 'active'}`}>
                  {user.is_banned ? 'Banned' : 'Active'}
                </span>
              </div>
              
              <div className="user-actions">
                <button
                  onClick={() => handleViewDetails(user)}
                  className="view-details-button"
                >
                  View Details
                </button>
                {user.is_banned ? (
                  <button
                    onClick={() => handleUnbanUser(user.user_id)}
                    className="unban-button"
                  >
                    Unban User
                  </button>
                ) : (
                  <button
                    onClick={() => handleBanUser(user.user_id)}
                    className="ban-button"
                  >
                    Ban User
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3 className="empty-title">No Users Found</h3>
            <p className="empty-description">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      
      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">User Details</h3>
              <button onClick={handleCloseModal} className="modal-close-button">&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="modal-detail-label">User ID</span>
                <span className="modal-detail-value">{selectedUser.user_id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Name</span>
                <span className="modal-detail-value">{selectedUser.name}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Email</span>
                <span className="modal-detail-value">{selectedUser.email}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Status</span>
                <span className={`modal-detail-value ${selectedUser.is_banned ? 'banned' : 'active'}`} style={{color: selectedUser.is_banned ? '#ef4444' : '#10b981', fontWeight: '600'}}>
                  {selectedUser.is_banned ? 'Banned' : 'Active'}
                </span>
              </div>
            </div>
            <div style={{padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
              {selectedUser.is_banned ? (
                <button
                  onClick={() => {
                    handleUnbanUser(selectedUser.user_id);
                    handleCloseModal();
                  }}
                  className="unban-button"
                >
                  Unban User
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleBanUser(selectedUser.user_id);
                    handleCloseModal();
                  }}
                  className="ban-button"
                >
                  Ban User
                </button>
              )}
              <button
                onClick={handleCloseModal}
                style={{backgroundColor: '#d1d5db', color: '#374151', padding: '0.625rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600', border: 'none', cursor: 'pointer'}}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;