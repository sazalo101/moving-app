import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

const Navbar = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <nav className="navbar" ref={menuRef}>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Moving App
        </Link>

        <div className="navbar-right">
          <ThemeToggle />
          <button
            className={`hamburger ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {!currentUser ? (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link">Register</Link>
            </>
          ) : (
            <>
              {currentUser.role === "user" && (
                <>
                  <Link to="/user/dashboard" className="navbar-link">Dashboard</Link>
                  <Link to="/user/book-driver" className="navbar-link">Book Driver</Link>
                  <Link to="/user/orders" className="navbar-link">My Orders</Link>
                  <Link to="/user/transactions" className="navbar-link">Transactions</Link>
                  <Link to="/user/notifications" className="navbar-link">Notifications</Link>
                </>
              )}
              {currentUser.role === "driver" && (
                <>
                  <Link to="/driver/dashboard" className="navbar-link">Dashboard</Link>
                  <Link to="/driver/available-orders" className="navbar-link">Orders</Link>
                  <Link to="/driver/orders" className="navbar-link">History</Link>
                  <Link to="/driver/wallet" className="navbar-link">Earnings</Link>
                  <Link to="/driver/notifications" className="navbar-link">Notifications</Link>
                </>
              )}
              {currentUser.role === "admin" && (
                <>
                  <Link to="/admin/dashboard" className="navbar-link">Dashboard</Link>
                  <Link to="/admin/manage-users" className="navbar-link">Users</Link>
                  <Link to="/admin/manage-drivers" className="navbar-link">Drivers</Link>
                  <Link to="/admin/support-tickets" className="navbar-link">Support</Link>
                </>
              )}
              <button onClick={handleLogout} className="navbar-logout">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
