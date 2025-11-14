import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Edit2, Save, X, ArrowLeft, CheckSquare, Check, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import TaskManager from '../components/TaskManager';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProfile(formData.name, formData.email);
      if (result.success) {
        setIsEditing(false);
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const handleCopyEmail = async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      toast.success('Email address copied to clipboard');
    } catch (err) {
      toast.error('Could not copy email');
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Chat</span>
              </button>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Profile Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-zinc-800"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-600 dark:text-zinc-300 border-4 border-white dark:border-zinc-800">
                      {getInitials(user.name)}
                    </div>
                  )}
                  {/* Small avatar edit affordance (no upload implemented) */}
                  <button
                    type="button"
                    onClick={() => toast('Avatar editing coming soon')}
                    title="Edit avatar"
                    aria-label="Edit avatar"
                    className="absolute right-0 bottom-0 -mb-1 -mr-1 bg-white dark:bg-zinc-800 p-1 rounded-full border border-zinc-200 dark:border-zinc-700 shadow hover:bg-zinc-50 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
                  </button>
                </div>

                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {user.name}
                </h2>
                <div className="flex items-center gap-3 text-sm mb-3">
                  <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                    <Shield className="h-4 w-4" />
                    <span className="capitalize">{user.role}</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs ${
                      user.googleTokens
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {user.googleTokens ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Google connected</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-zinc-400" />
                        <span>Not connected</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Join Date */}
                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                  Member since {formatDate(user.createdAt)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            {/* Tabs */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="inline-flex rounded-full bg-zinc-50 dark:bg-zinc-900 p-1 gap-1">
                  <button
                    type="button"
                    aria-pressed={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                      activeTab === 'profile'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    type="button"
                    aria-pressed={activeTab === 'tasks'}
                    onClick={() => setActiveTab('tasks')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                      activeTab === 'tasks'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Tasks
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'profile' ? (
                  <div className="space-y-6">
                    {/* Profile Details Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Personal Information
                      </h3>
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          aria-label="Edit profile"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* Name Field */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Full Name
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors"
                              placeholder="Enter your full name"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                            <User className="h-5 w-5 text-zinc-400" />
                            <span className="text-zinc-900 dark:text-zinc-100">{user.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Email Address
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent transition-colors"
                              placeholder="Enter your email address"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-zinc-400" />
                              <span className="text-zinc-900 dark:text-zinc-100">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleCopyEmail}
                                className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                aria-label="Copy email"
                              >
                                <Copy className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Account Info */}
                      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                          Account Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                            <Shield className="h-5 w-5 text-zinc-400" />
                            <div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">Role</p>
                              <p className="text-sm text-zinc-900 dark:text-zinc-100 capitalize">{user.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                            <Calendar className="h-5 w-5 text-zinc-400" />
                            <div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">Joined</p>
                              <p className="text-sm text-zinc-900 dark:text-zinc-100">{formatDate(user.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <a
                          className="block text-center w-full p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                          href={`${import.meta.env.VITE_BACKEND_URL}/google/google-auth?userId=${user.id}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {user.googleTokens ? 'Change Google account' : 'Connect Google account'}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <TaskManager />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;