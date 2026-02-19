import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Support Ticket Management</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading support tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>No support tickets found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.user_name || `User ${ticket.user_id}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setSelectedTicket(ticket)}
                      className="text-indigo-600 hover:text-indigo-900"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold">{selectedTicket.subject}</h2>
              <p className="text-sm text-gray-500 mt-1">
                From: {selectedTicket.user_name || `User #${selectedTicket.user_id}`} • 
                {selectedTicket.user_email && ` ${selectedTicket.user_email} • `}
                {new Date(selectedTicket.created_at).toLocaleString()}
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
              
              {selectedTicket.admin_reply && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700">Your Reply:</h4>
                  <div className="p-4 bg-blue-50 rounded border border-blue-200 mt-2">
                    <p className="whitespace-pre-wrap">{selectedTicket.admin_reply}</p>
                  </div>
                </div>
              )}
              
              {selectedTicket.status !== 'resolved' && (
                <form onSubmit={handleSubmitReply} className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-2">Reply to this ticket:</h4>
                  <textarea
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type your reply here..."
                    rows="4"
                    required
                  />
                  <div className="flex justify-end mt-4">
                    <button 
                      type="button" 
                      onClick={() => setSelectedTicket(null)}
                      className="mr-4 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Send Reply & Resolve
                    </button>
                  </div>
                </form>
              )}
              
              {selectedTicket.status === 'resolved' && (
                <div className="flex justify-end mt-6">
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
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