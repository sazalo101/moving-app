import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './SupportTicketManagement.css';

const SupportTicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReply, setAdminReply] = useState('');

  useEffect(() => {
    fetchSupportTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSupportTickets = async () => {
    try {
      // Direct call to get all support tickets
      const response = await axios.get('http://localhost:5000/api/admin/support-tickets');
      
      if (response.data && response.data.tickets) {
        setTickets(response.data.tickets);
      } else {
        // Fallback approach: get all tickets through users
        await fetchTicketsFromUsers();
      }
    } catch (error) {
      console.error('Failed to load support tickets directly. Trying fallback method.', error);
      await fetchTicketsFromUsers();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method to fetch tickets through users
  const fetchTicketsFromUsers = async () => {
    try {
      // Get all users first
      const response = await axios.get('http://localhost:5000/api/admin/manage-users');
      const usersData = response.data.users;
      
      // Fetch all support tickets using direct database access
      const allTicketsResponse = await axios.get('http://localhost:5000/api/admin/all-support-tickets');
      
      if (allTicketsResponse.data && allTicketsResponse.data.tickets) {
        // Map user data to tickets
        const ticketsWithUserInfo = allTicketsResponse.data.tickets.map(ticket => {
          const user = usersData.find(u => u.user_id === ticket.user_id) || {};
          return {
            ...ticket,
            user_name: user.name || `User ${ticket.user_id}`,
            user_email: user.email || 'Unknown Email'
          };
        });
        
        setTickets(ticketsWithUserInfo);
      } else {
        console.error('No tickets found in the response');
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to load support tickets through users:', error);
      toast.error('Failed to load support tickets');
      setTickets([]);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!adminReply.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    
    try {
      await axios.post(`http://localhost:5000/api/admin/reply-support-ticket/${selectedTicket.id}`, {
        admin_reply: adminReply
      });

      setTickets(tickets.map(ticket =>
        ticket.id === selectedTicket.id
          ? { ...ticket, status: 'resolved', admin_reply: adminReply }
          : ticket
      ));

      setSelectedTicket(null);
      setAdminReply('');
      toast.success('Reply sent successfully!');
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="support-container">
      <h2 className="support-title">Support Ticket Management</h2>
      
      {loading ? (
        <div className="loading-container">
          <p className="loading-message">Loading support tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <p className="empty-message">No support tickets found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="support-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">User</th>
                <th scope="col">Subject</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td className="ticket-id">{ticket.id}</td>
                  <td className="ticket-user">{ticket.user_name || `User ${ticket.user_id}`}</td>
                  <td className="ticket-subject">{ticket.subject}</td>
                  <td>
                    <span className={`ticket-status ${
                      ticket.status === 'resolved' ? 'resolved' : 'open'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="ticket-date">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button 
                      onClick={() => setSelectedTicket(ticket)}
                      className="view-button"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2 className="modal-subject">{selectedTicket.subject}</h2>
                <p className="modal-meta">
                  From: {selectedTicket.user_name || `User #${selectedTicket.user_id}`} • 
                  {selectedTicket.user_email && ` ${selectedTicket.user_email} • `}
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="modal-body">
              <div className="message-container">
                <p className="message-text">{selectedTicket.message}</p>
              </div>
              
              {selectedTicket.admin_reply && (
                <div className="reply-section">
                  <h4 className="reply-title">Your Reply:</h4>
                  <div className="reply-container">
                    <p className="reply-text">{selectedTicket.admin_reply}</p>
                  </div>
                </div>
              )}
              
              {selectedTicket.status !== 'resolved' && (
                <form onSubmit={handleSubmitReply} className="reply-form">
                  <h4 className="reply-form-title">Reply to this ticket:</h4>
                  <textarea
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    className="reply-textarea"
                    placeholder="Type your reply here..."
                    rows="4"
                    required
                  />
                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={() => setSelectedTicket(null)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="submit-button"
                    >
                      Send Reply & Resolve
                    </button>
                  </div>
                </form>
              )}
              
              {selectedTicket.status === 'resolved' && (
                <div className="form-actions">
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="close-button"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketManagement;