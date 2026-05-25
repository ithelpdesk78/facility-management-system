import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { FiCheck, FiX } from 'react-icons/fi';

function Attendance() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await apiClient.get('/attendance/today');
      if (response.data.success) {
        setAttendance(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await apiClient.post('/attendance/checkin', {
        location: 'Facility',
        method: 'manual'
      });
      if (response.data.success) {
        setMessage('Checked in successfully!');
        fetchAttendance();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Check-in failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await apiClient.post('/attendance/checkout', {
        location: 'Facility'
      });
      if (response.data.success) {
        setMessage('Checked out successfully!');
        fetchAttendance();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Check-out failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Attendance</h1>

      {message && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow max-w-md">
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-2">Today's Attendance</p>
          <div className="text-4xl font-bold text-gray-800">
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <span className="font-semibold">Check-In:</span>
            <span className="text-lg">
              {attendance?.check_in_time ? (
                <span className="text-green-600 flex items-center gap-2">
                  <FiCheck /> {new Date(attendance.check_in_time).toLocaleTimeString()}
                </span>
              ) : (
                <span className="text-gray-400">Not checked in</span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <span className="font-semibold">Check-Out:</span>
            <span className="text-lg">
              {attendance?.check_out_time ? (
                <span className="text-blue-600 flex items-center gap-2">
                  <FiCheck /> {new Date(attendance.check_out_time).toLocaleTimeString()}
                </span>
              ) : (
                <span className="text-gray-400">Not checked out</span>
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCheckIn}
            disabled={attendance?.check_in_time}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded font-semibold transition"
          >
            Check In
          </button>
          <button
            onClick={handleCheckOut}
            disabled={!attendance?.check_in_time || attendance?.check_out_time}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded font-semibold transition"
          >
            Check Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
