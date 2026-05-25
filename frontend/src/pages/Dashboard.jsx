import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { FiAlertCircle, FiCheckCircle, FiClock, FiBell } from 'react-icons/fi';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get('/dashboard/summary');
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiAlertCircle className="text-3xl text-red-500 mr-4" />
            <div>
              <p className="text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold">{summary?.openTickets || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiClock className="text-3xl text-yellow-500 mr-4" />
            <div>
              <p className="text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold">{summary?.pendingTasks || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiBell className="text-3xl text-blue-500 mr-4" />
            <div>
              <p className="text-gray-600">Unread Alerts</p>
              <p className="text-2xl font-bold">{summary?.unreadAlerts || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiCheckCircle className="text-3xl text-green-500 mr-4" />
            <div>
              <p className="text-gray-600">Attendance Status</p>
              <p className="text-lg font-bold">
                {summary?.todayAttendance?.checkedIn ? 'Checked In' : 'Not Checked In'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
