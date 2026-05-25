import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get('/tasks/assigned');
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await apiClient.post(`/tasks/${taskId}/complete`);
      fetchTasks();
    } catch (err) {
      console.error('Error completing task');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">My Tasks</h1>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <p className="text-gray-600">No tasks assigned yet.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="text-gray-600 mt-1">{task.description}</p>
                  <div className="mt-4 flex gap-4 text-sm">
                    <p><span className="font-semibold">Due Date:</span> {task.due_date}</p>
                    <p><span className="font-semibold">Status:</span> {task.status_name}</p>
                    <p><span className="font-semibold">Completion:</span> {task.completion_percentage}%</p>
                  </div>
                </div>
                {task.status_name !== 'completed' && (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded ml-4"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Tasks;
