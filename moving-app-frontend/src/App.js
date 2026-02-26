import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth Components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

// Layout Components
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";


// User Components
import UserDashboard from "./components/user/UserDashboard";
import BookDriver from "./components/user/BookDriver";
import UserOrderHistory from "./components/user/UserOrderHistory";
import TrackDriver from "./components/user/TrackDriver";
import UserNotifications from "./components/user/UserNotifications";
import UserTransactions from "./components/user/UserTransactions";
import UserSupportTickets from "./components/user/UserSupportTickets";


// Driver Components
import DriverDashboard from "./components/driver/DriverDashboard";
import AvailableOrders from "./components/driver/AvailableOrders";
import DriverOrderHistory from "./components/driver/DriverOrderHistory";
import DriverNotifications from "./components/driver/DriverNotifications";
import DriverWallet from "./components/driver/DriverWallet";
import DriverVerificationSubmission from "./components/driver/DriverVerificationSubmission";

// Admin Components
import AdminDashboard from "./components/admin/AdminDashboard";
import ManageUsers from "./components/admin/ManageUsers";
import ManageDrivers from "./components/admin/ManageDrivers";
import EscrowManagement from "./components/admin/EscrowManagement";
import SupportTicketManagement from "./components/admin/SupportTicketManagement";
import PromoCodeManagement from "./components/admin/PromoCodeManagement";
import DriverVerification from "./components/admin/DriverVerification";

// Home Page Component
import Home from "./components/Home"; // Import the Home component
import Footer from "./components/Footer";

// Context Provider
import { AuthProvider } from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            {/* Home Page Route */}
            <Route path="/" element={<Home />} />

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Routes */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/book-driver"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <BookDriver />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/orders"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <UserOrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/track/:bookingId"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <TrackDriver />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/notifications"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <UserNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/transactions"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <UserTransactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/support"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <UserSupportTickets />
                </ProtectedRoute>
              }
            />

            {/* Driver Routes */}
            <Route
              path="/driver/dashboard"
              element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/available-orders"
              element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <AvailableOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/orders"
              element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <DriverOrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/notifications"
              element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <DriverNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/wallet"
              element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <DriverWallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/verification"
              element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <DriverVerificationSubmission />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-drivers"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ManageDrivers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/escrow"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <EscrowManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/support-tickets"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <SupportTicketManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/promo-codes"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PromoCodeManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/driver-verification"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DriverVerification />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <ToastContainer 
          position="top-center" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ fontSize: '14px' }}
        />
      </Router>
      <Footer /> {/* Footer is displayed on all pages */}
    </AuthProvider>
  );
}

export default App;
