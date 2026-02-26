import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './UserSupportTickets.css';

const UserSupportTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/user/support-tickets?user_id=${currentUser.id}`);
      
      if (response.data && response.data.tickets) {
        setTickets(response.data.tickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      toast.error('Failed to fetch support tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await axios.post('http://localhost:5000/api/user/submit-support-ticket', {
        user_id: currentUser.id,
        subject,
        message
      });

      const newTicket = {
        id: Date.now(),
        user_id: currentUser.id,
        subject,
        message,
        status: 'open',
        created_at: new Date().toISOString(),
        admin_reply: null
      };
      
      setTickets([newTicket, ...tickets]);
      setSubject('');
      setMessage('');
      toast.success('Support ticket submitted successfully');
      
      setTimeout(fetchTickets, 1000);
    } catch (error) {
      console.error('Failed to submit support ticket:', error);
      toast.error('Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  if (!currentUser) {
    return (
      <div className="login-required">
        <p>Please log in to view your support tickets.</p>
      </div>
    );
  }

  return (
    <div className="support-tickets-container">
      <h1 className="support-tickets-title">Support Tickets</h1>
      
      <div className="tickets-grid">
        <div>
          <div className="create-ticket-card">
            <h2 className="create-ticket-title">Create New Ticket</h2>
            <form onSubmit={handleSubmit} className="ticket-form">
              <div className="form-group">
                <label htmlFor="subject" className="form-label">Subject</label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="form-input"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message" className="form-label">Message</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-textarea"
                  placeholder="Describe your issue in detail"
                  required
                />
              </div>
              
              <button type="submit" disabled={isSubmitting} className="submit-button">
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="tickets-list-card">
            <h2 className="tickets-list-title">Your Tickets</h2>
            {loading ? (
              <div className="loading-state">
                <p className="loading-text">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">No tickets found</p>
                <p className="empty-hint">Create a new ticket if you need assistance</p>
              </div>
            ) : (
              <ul className="ticket-list">
                {tickets.map((ticket) => (
                  <li key={ticket.id} className="ticket-item" onClick={() => viewTicket(ticket)}>
                    <div className="ticket-item-content">
                      <div className="ticket-info">
                        <h3 className="ticket-subject">{ticket.subject}</h3>
                        <p className="ticket-meta">
                          {new Date(ticket.created_at).toLocaleDateString()}
                          <span className={`status-badge ${ticket.status}`}>
                            {ticket.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        {ticket.admin_reply && (
                          <span className="ticket-reply-indicator">Admin replied</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-body">
              <h2 className="modal-title">{selectedTicket.subject}</h2>
              <p className="modal-subtitle">
                Ticket #{selectedTicket.id} • Created on {new Date(selectedTicket.created_at).toLocaleString()}
                <span className={`status-badge ${selectedTicket.status}`}>
                  {selectedTicket.status}
                </span>
              </p>
              
              <div className="message-box">
                <h4 className="message-header">Your Message:</h4>
                <p className="message-text">{selectedTicket.message}</p>
              </div>
              
              {selectedTicket.admin_reply && (
                <div className="reply-box">
                  <h4 className="message-header">Admin Reply:</h4>
                  <p className="message-text">{selectedTicket.admin_reply}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedTicket(null)} className="close-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSupportTickets;
