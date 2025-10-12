import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Flag,
  Calendar,
  X,
  Save,
  Filter,
  ChevronDown
} from 'lucide-react';
import { taskAPI } from '../utils/api';
import toast from 'react-hot-toast';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    tags: ''
  });

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTasks(filters);
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
      tags: ''
    });
  };

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      await taskAPI.createTask(taskData);
      toast.success('Task created successfully');
      resetForm();
      setShowCreateForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  // Update task
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      await taskAPI.updateTask(editingTask._id, taskData);
      toast.success('Task updated successfully');
      resetForm();
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskAPI.deleteTask(taskId);
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Start editing task
  const startEditing = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tags: task.tags ? task.tags.join(', ') : ''
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTask(null);
    resetForm();
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'cancelled':
        return { icon: X, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' };
      default:
        return { icon: AlertCircle, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
    }
  };

  // Get priority icon and color
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'urgent':
        return { icon: Flag, color: 'text-red-500' };
      case 'high':
        return { icon: Flag, color: 'text-orange-500' };
      case 'low':
        return { icon: Flag, color: 'text-gray-500' };
      default:
        return { icon: Flag, color: 'text-blue-500' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Task Management
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Organize and track your tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreateForm || editingTask) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h4>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  cancelEditing();
                }}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent resize-none"
                  placeholder="Enter task description (optional)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400"
                    placeholder="work, personal, urgent (comma separated)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    cancelEditing();
                  }}
                  className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-zinc-400 dark:text-zinc-500 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              No tasks found
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              {filters.status === 'all' && filters.priority === 'all'
                ? "You haven't created any tasks yet."
                : "No tasks match your current filters."
              }
            </p>
            {(filters.status !== 'all' || filters.priority !== 'all') && (
              <button
                onClick={() => setFilters({ status: 'all', priority: 'all' })}
                className="text-sm text-zinc-600 dark:text-zinc-400 underline hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const statusInfo = getStatusInfo(task.status);
              const priorityInfo = getPriorityInfo(task.priority);
              const StatusIcon = statusInfo.icon;
              const PriorityIcon = priorityInfo.icon;

              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-1.5 rounded-lg ${statusInfo.bgColor}`}>
                          <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {task.title}
                        </h4>
                        <PriorityIcon className={`h-4 w-4 ${priorityInfo.color}`} />
                      </div>

                      {task.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="capitalize px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className="capitalize px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1">
                            {task.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => startEditing(task)}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
