import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Direct API call to get support tickets for the current user
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

      // Add the new ticket to the local state
      const newTicket = {
        id: Date.now(), // Temporary ID until refresh
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
      
      // Refresh tickets after submission to get the server-generated ID
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
      <div className="text-center py-12">
        <p>Please log in to view your support tickets.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Support Tickets</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Ticket</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your issue in detail"
                  rows="5"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold p-6 border-b">Your Tickets</h2>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tickets found</p>
                <p className="text-sm text-gray-400 mt-1">Create a new ticket if you need assistance</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <li 
                    key={ticket.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition duration-150"
                    onClick={() => viewTicket(ticket)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(ticket.created_at).toLocaleDateString()} • 
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        {ticket.admin_reply && (
                          <span className="text-xs text-blue-600">Admin replied</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold">{selectedTicket.subject}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ticket #{selectedTicket.id} • Created on {new Date(selectedTicket.created_at).toLocaleString()} • 
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedTicket.status}
                </span>
              </p>
              
              <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Your Message:</h4>
                <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
              
              {selectedTicket.admin_reply && (
                <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                  <h4 className="font-medium text-gray-700 mb-2">Admin Reply:</h4>
                  <p className="whitespace-pre-wrap">{selectedTicket.admin_reply}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
              >
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