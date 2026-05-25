import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await apiClient.get('/tickets');
      if (response.data.success) {
        setTickets(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/tickets', formData);
      setFormData({ title: '', description: '', priority: 'medium' });
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      console.error('Error creating ticket');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tickets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancel' : 'Create Ticket'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleCreateTicket}>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                rows="4"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
              >
                <option>low</option>
                <option>medium</option>
                <option>high</option>
                <option>critical</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Create
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{ticket.title}</h3>
                <p className="text-gray-600 mt-1">{ticket.description}</p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  ticket.priority === 'critical'
                    ? 'bg-red-200 text-red-800'
                    : ticket.priority === 'high'
                    ? 'bg-orange-200 text-orange-800'
                    : 'bg-blue-200 text-blue-800'
                }`}
              >
                {ticket.priority}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Status: {ticket.status_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tickets;
