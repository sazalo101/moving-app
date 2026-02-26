import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './DriverPages.css';

const DriverNotifications = () => {
  // Initial dummy notifications data
  const initialNotifications = [
    {
      id: '1',
      title: 'New Ride Request',
      message: 'You have a new ride request from Downtown to Airport.',
      created_at: '2025-03-22T10:30:00',
      is_read: false
    },
    {
      id: '2',
      title: 'Bonus Available',
      message: 'Complete 10 rides this weekend to earn a $50 bonus!',
      created_at: '2025-03-21T15:45:00',
      is_read: false
    },
    {
      id: '3',
      title: 'Fare Adjustment',
      message: 'Your fare for ride #38291 has been adjusted due to a toll fee.',
      created_at: '2025-03-20T09:15:00',
      is_read: true
    },
    {
      id: '4',
      title: 'Customer Rating',
      message: 'You received a 5-star rating from your last customer!',
      created_at: '2025-03-19T18:20:00',
      is_read: true
    },
    {
      id: '5',
      title: 'System Maintenance',
      message: 'The app will be undergoing maintenance tonight from 2AM to 4AM.',
      created_at: '2025-03-18T14:10:00',
      is_read: false
    }
  ];
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      setNotifications(initialNotifications);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchNotifications = () => {
    // Simulate refresh
    setIsLoading(true);
    setTimeout(() => {
      setNotifications(initialNotifications);
      setIsLoading(false);
      toast.success('Notifications refreshed');
    }, 800);
  };
  
  const handleMarkAsRead = (notificationId) => {
    // Update the notifications list to mark this one as read
    setNotifications(
      notifications.map((notification) => 
        notification.id === notificationId 
          ? { ...notification, is_read: true } 
          : notification
      )
    );
    
    toast.success('Notification marked as read');
  };
  
  const handleMarkAllAsRead = () => {
    // Update all notifications as read in the state
    setNotifications(
      notifications.map((notification) => ({ ...notification, is_read: true }))
    );
    
    toast.success('All notifications marked as read');
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '16px', color: '#6b7280', fontWeight: '500' }}>Loading notifications...</p>
        </div>
      </div>
    );
  }
  
  const unreadCount = notifications.filter(notification => !notification.is_read).length;
  
  return (
    <div className="driver-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Notifications</h1>
              {unreadCount > 0 && (
                <p style={{ marginTop: '4px', fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>
                  You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="btn btn-primary"
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Mark All as Read
                </button>
              )}
              
              <button
                onClick={fetchNotifications}
                className="btn"
                style={{ background: '#f3f4f6', color: '#374151' }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg style={{ width: '32px', height: '32px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>No Notifications</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              You don't have any notifications at the moment.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="card"
                style={{
                  background: notification.is_read ? 'white' : 'linear-gradient(to right, #eff6ff, #ffffff)',
                  borderLeft: !notification.is_read ? '4px solid #3b82f6' : '4px solid transparent',
                  opacity: notification.is_read ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        background: notification.is_read ? '#f3f4f6' : '#dbeafe',
                        borderRadius: '8px',
                        padding: '8px',
                        display: 'inline-flex'
                      }}>
                        <svg style={{ width: '18px', height: '18px', color: notification.is_read ? '#6b7280' : '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>{notification.title}</h3>
                    </div>
                    <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '14px', lineHeight: '1.5' }}>{notification.message}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(notification.created_at)}</p>
                  </div>
                  
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="btn btn-success"
                      style={{ flexShrink: 0 }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverNotifications;