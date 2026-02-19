import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const unreadCount = notifications.filter(notification => !notification.is_read).length;
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Mark All as Read
            </button>
          )}
          
          <button
            onClick={fetchNotifications}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {unreadCount > 0 && (
        <p className="mb-4 text-blue-600 font-medium">
          You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}.
        </p>
      )}
      
      {notifications.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Notifications</h2>
          <p className="text-gray-500">
            You don't have any notifications at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white p-4 rounded-lg shadow-md flex justify-between items-center ${notification.is_read ? 'opacity-70' : 'bg-blue-50'}`}
            >
              <div>
                <h3 className="text-lg font-semibold">{notification.title}</h3>
                <p className="text-gray-600">{notification.message}</p>
                <p className="text-sm text-gray-400">{formatDate(notification.created_at)}</p>
              </div>
              
              {!notification.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverNotifications;