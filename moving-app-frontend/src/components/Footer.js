import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h3 className="footer-brand-name">Moving App</h3>
          <p className="footer-brand-tagline">
            Reliable, affordable moving services. We handle the heavy lifting so you can focus on what matters.
          </p>
        </div>
        <div className="footer-column">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Contact</h4>
          <ul className="footer-links">
            <li><a href="mailto:info@movers.com">info@movers.com</a></li>
            <li><a href="tel:+254700000000">+254 700 000 000</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copyright">&copy; {new Date().getFullYear()} Moving App. All rights reserved.</p>
        <a href="mailto:info@movers.com" className="footer-email">info@movers.com</a>
      </div>
    </footer>
  );
};

export default Footer;
