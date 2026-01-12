import React, { useState, useEffect } from 'react';
import { User, Mail, ArrowLeft, Save, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    systemPrompt: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        systemPrompt: user.systemPrompt || ''
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

    if (formData.systemPrompt && formData.systemPrompt.length > 500) {
      toast.error('System prompt cannot exceed 500 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProfile(formData.name, formData.email, formData.systemPrompt);
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
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
      email: user?.email || '',
      systemPrompt: user?.systemPrompt || ''
    });
    setIsEditing(false);
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
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Profile</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-600 dark:text-zinc-300">
            {getInitials(user.name)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {user.name}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Form Fields */}
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
                  className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
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
                  className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-colors"
                  placeholder="Enter your email address"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Mail className="h-5 w-5 text-zinc-400" />
                <span className="text-zinc-900 dark:text-zinc-100">{user.email}</span>
              </div>
            )}
          </div>

          {/* System Prompt Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Comparison System Prompt
              </div>
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              This prompt will be used to evaluate and compare multiple AI responses to select the best one for you.
            </p>
            {isEditing ? (
              <div>
                <textarea
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-colors resize-none"
                  placeholder="You are an AI assistant that evaluates multiple responses and selects the best one based on accuracy, clarity, and helpfulness."
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Used for comparing AI model responses
                  </p>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formData.systemPrompt.length}/500
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {user.systemPrompt || 'No system prompt set'}
                </p>
              </div>
            )}
          </div>

          {/* Google Connection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Google Calendar Integration
            </label>
            <a
              className="block text-center w-full p-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
              href={`${import.meta.env.VITE_BACKEND_URL}/google/google-auth?userId=${user.id}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {user.googleTokens ? 'Reconnect Google Account' : 'Connect Google Account'}
            </a>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4 inline mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
