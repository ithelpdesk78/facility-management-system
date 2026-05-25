import React, { useState } from 'react';
import apiClient from '../services/api';

function Reports() {
  const [selectedReport, setSelectedReport] = useState('tasks');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateReport = async (type) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/reports/${type}`);
      if (response.data.success) {
        setReportData(response.data.data);
        setSelectedReport(type);
      }
    } catch (err) {
      console.error('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Reports & Analytics</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => generateReport('tasks')}
          className={`px-4 py-2 rounded font-semibold ${
            selectedReport === 'tasks'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Task Reports
        </button>
        <button
          onClick={() => generateReport('tickets')}
          className={`px-4 py-2 rounded font-semibold ${
            selectedReport === 'tickets'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Ticket Stats
        </button>
        <button
          onClick={() => generateReport('staff')}
          className={`px-4 py-2 rounded font-semibold ${
            selectedReport === 'staff'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Staff Performance
        </button>
        <button
          onClick={() => generateReport('attendance')}
          className={`px-4 py-2 rounded font-semibold ${
            selectedReport === 'attendance'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Attendance Report
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading report...</p>}

      {reportData.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                {Object.keys(reportData[0]).map((key) => (
                  <th key={key} className="px-6 py-3 text-left font-semibold text-gray-700">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-6 py-3 text-gray-700">
                      {typeof val === 'number' ? val.toFixed(2) : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reports;
