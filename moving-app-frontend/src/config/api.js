// API Configuration
// This file centralizes all API endpoints for easier management and deployment

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // In production, use environment variable or default to current host
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  // Default fallback
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/login`,
  REGISTER: `${API_BASE_URL}/api/register`,
  
  // User
  GET_USER: (userId) => `${API_BASE_URL}/api/user/${userId}`,
  SEARCH_DRIVERS: `${API_BASE_URL}/api/user/search-drivers`,
  BOOK_DRIVER: `${API_BASE_URL}/api/user/book-driver`,
  USER_ORDER_HISTORY: (userId) => `${API_BASE_URL}/api/user/order-history/${userId}`,
  USER_NOTIFICATIONS: (userId) => `${API_BASE_URL}/api/user/notifications/${userId}`,
  USER_SUPPORT_TICKETS: `${API_BASE_URL}/api/user/support-tickets`,
  SUBMIT_SUPPORT_TICKET: `${API_BASE_URL}/api/user/submit-support-ticket`,
  PAYMENT_HISTORY: (userId) => `${API_BASE_URL}/api/user/payment-history/${userId}`,
  
  // Driver
  GET_DRIVER_BY_USER: (userId) => `${API_BASE_URL}/api/driver/by-user/${userId}`,
  DRIVER_EARNINGS: (driverId) => `${API_BASE_URL}/api/driver/${driverId}/earnings`,
  DRIVER_WITHDRAW: `${API_BASE_URL}/api/driver/withdraw`,
  AVAILABLE_ORDERS: `${API_BASE_URL}/api/driver/available-orders`,
  ACCEPT_ORDER: (bookingId) => `${API_BASE_URL}/api/driver/accept-order/${bookingId}`,
  COMPLETE_ORDER: (bookingId) => `${API_BASE_URL}/api/driver/complete-order/${bookingId}`,
  DRIVER_ORDER_HISTORY: (driverId) => `${API_BASE_URL}/api/driver/order-history/${driverId}`,
  DRIVER_NOTIFICATIONS: (driverId) => `${API_BASE_URL}/api/driver/notifications/${driverId}`,
  TOGGLE_AVAILABILITY: `${API_BASE_URL}/api/driver/toggle-availability`,
  SUBMIT_VERIFICATION: (driverId) => `${API_BASE_URL}/api/driver/submit-verification/${driverId}`,
  VERIFICATION_STATUS: (driverId) => `${API_BASE_URL}/api/driver/verification-status/${driverId}`,
  
  // Admin
  MANAGE_USERS: `${API_BASE_URL}/api/admin/manage-users`,
  BAN_USER: (userId) => `${API_BASE_URL}/api/admin/ban-user/${userId}`,
  SUPPORT_TICKETS: `${API_BASE_URL}/api/admin/support-tickets`,
  REPLY_SUPPORT_TICKET: (ticketId) => `${API_BASE_URL}/api/admin/reply-support-ticket/${ticketId}`,
  PENDING_VERIFICATIONS: `${API_BASE_URL}/api/admin/pending-verifications`,
  VERIFY_DRIVER: (driverId) => `${API_BASE_URL}/api/admin/verify-driver/${driverId}`,
  ALL_DRIVERS_VERIFICATION: `${API_BASE_URL}/api/admin/all-drivers-verification`,
  CREATE_PROMO_CODE: `${API_BASE_URL}/api/admin/create-promo-code`,
  DISABLE_PROMO_CODE: (promoId) => `${API_BASE_URL}/api/admin/disable-promo-code/${promoId}`,
  ESCROW: `${API_BASE_URL}/api/admin/escrow`,
  
  // M-Pesa
  MPESA_STK_PUSH: `${API_BASE_URL}/api/mpesa/stk-push`,
  MPESA_CHECK_STATUS: (transactionId) => `${API_BASE_URL}/api/mpesa/check-status/${transactionId}`,
  
  // Notifications
  MARK_NOTIFICATION_READ: (notificationId) => `${API_BASE_URL}/api/notifications/mark-read/${notificationId}`,
  
  // Tracking
  UPDATE_DRIVER_LOCATION: `${API_BASE_URL}/api/driver/update-location`,
  TRACK_DRIVER: (bookingId) => `${API_BASE_URL}/api/user/track-driver/${bookingId}`,
};

export default API_ENDPOINTS;
