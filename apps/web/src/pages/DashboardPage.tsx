import type { Task } from '@myorg/types';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuth } from '../hooks';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: () => apiClient.getTasks({ limit: '100' }),
  });

  const { data: filesData } = useQuery({
    queryKey: ['files', 'stats'],
    queryFn: () => apiClient.getFiles(),
  });

  const stats = {
    totalTasks: tasksData?.total ?? 0,
    todoTasks: tasksData?.tasks?.filter((t: Task) => t.status === 'todo').length ?? 0,
    inProgress: tasksData?.tasks?.filter((t: Task) => t.status === 'in_progress').length ?? 0,
    completed: tasksData?.tasks?.filter((t: Task) => t.status === 'done').length ?? 0,
    totalFiles: filesData?.total ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your tasks</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-500">To Do</h3>
          <p className="text-3xl font-bold text-yellow-500">{stats.todoTasks}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-3xl font-bold text-blue-500">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Tasks</h2>
        </div>
        <div className="p-4">
          {tasksData?.tasks?.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No tasks yet. Create your first task!</p>
          ) : (
            <ul className="divide-y">
              {tasksData?.tasks?.slice(0, 5).map((task: Task) => (
                <li key={task.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">{task.description || 'No description'}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      task.status === 'done'
                        ? 'bg-green-100 text-green-800'
                        : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
