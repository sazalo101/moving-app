import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './UserNotifications.css';

const UserNotifications = () => {
  const initialNotifications = [
    {
      id: 1,
      message: "Your deposit of $100.00 was successful",
      created_at: "2025-03-19T14:30:22Z",
      is_read: false
    },
    {
      id: 2,
      message: "Welcome to our platform! Complete your profile to get started.",
      created_at: "2025-03-18T09:15:43Z",
      is_read: false
    },
    {
      id: 3,
      message: "New feature alert: You can now withdraw funds directly to your M-Pesa account.",
      created_at: "2025-03-15T17:45:10Z",
      is_read: true
    },
    {
      id: 4,
      message: "Your account has been successfully created.",
      created_at: "2025-03-10T11:22:33Z",
      is_read: true
    }
  ];

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(initialNotifications);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, is_read: true }
        : notification
    ));
    toast.success('Notification marked as read');
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => (
      { ...notification, is_read: true }
    )));
    toast.success('All notifications marked as read');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  return (
    <div className="notifications-wrapper">
      <div className="notifications-container">
        <div className="notifications-header">
          <h1 className="notifications-title">Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="mark-all-button">
              Mark All as Read
            </button>
          )}
        </div>

        <div className="notifications-card">
          {loading ? (
            <div className="loading-state">
              <p className="loading-text">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">No notifications yet</p>
            </div>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <p className="notification-id">Notification ID: {notification.id}</p>
                    <p className="notification-message">{notification.message}</p>
                    <p className="notification-date">{formatDate(notification.created_at)}</p>

                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="mark-read-button"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserNotifications;
