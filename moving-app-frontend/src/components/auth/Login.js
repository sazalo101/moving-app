import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import './Login.css'; // Importing the custom CSS for styling

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { email, password } = formData;
    const result = await login(email, password);

    setIsLoading(false);

    if (result.success) {
      toast.success('Login successful!');

      // Redirect based on user role
      if (result.data.role === 'user') {
        navigate('/user/dashboard');
      } else if (result.data.role === 'driver') {
        navigate('/driver/dashboard');
      } else if (result.data.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login to Moving App</h2>
      <form onSubmit={handleSubmit} className="login-form">
        {/* Email Input */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        {/* Password Input */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="form-button"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Register Link */}
      <div className="register-link">
        Don't have an account? <Link to="/register" className="register-link-text">Register</Link>
      </div>
    </div>
  );
};

export default Login;
