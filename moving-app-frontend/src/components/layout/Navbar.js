import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import "./Navbar.css"; // Import custom CSS for styling

const Navbar = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Name */}
        <Link to="/" className="navbar-brand">
          Moving App
        </Link>

        {/* Navigation Links */}
        <div className="navbar-links">
          {!currentUser ? (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register" className="navbar-link">
                Register
              </Link>
            </>
          ) : (
            <>
              {/* Role-specific links */}
              {currentUser.role === "user" && (
                <>
                  <Link to="/user/dashboard" className="navbar-link">
                    Dashboard
                  </Link>
                  <Link to="/user/book-driver" className="navbar-link">
                    Book Driver
                  </Link>
                  <Link to="/user/orders" className="navbar-link">
                    My Orders
                  </Link>
                  <Link to="/user/transactions" className="navbar-link">
                    Transactions
                  </Link>
                  <Link to="/user/notifications" className="navbar-link">
                    Notifications
                  </Link>
                </>
              )}
              {currentUser.role === "driver" && (
                <>
                  <Link to="/driver/dashboard" className="navbar-link">
                    Dashboard
                  </Link>
                  <Link to="/driver/available-orders" className="navbar-link">
                    Available Orders
                  </Link>
                  <Link to="/driver/orders" className="navbar-link">
                    My Orders
                  </Link>
                  <Link to="/driver/wallet" className="navbar-link">
                    Earnings
                  </Link>
                  <Link to="/driver/notifications" className="navbar-link">
                    Notifications
                  </Link>
                </>
              )}
              {currentUser.role === "admin" && (
                <>
                  <Link to="/admin/dashboard" className="navbar-link">
                    Dashboard
                  </Link>
                  <Link to="/admin/manage-users" className="navbar-link">
                    Users
                  </Link>
                  <Link to="/admin/manage-drivers" className="navbar-link">
                    Drivers
                  </Link>
                  <Link to="/admin/support-tickets" className="navbar-link">
                    Support
                  </Link>
                </>
              )}

              {/* Logout Button */}
              <button onClick={handleLogout} className="navbar-logout">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
