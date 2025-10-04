import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, Shield, Users, ArrowRight, Sparkles, Brain, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Advanced AI",
      description: "Powered by cutting-edge AI models for intelligent conversations and problem-solving."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Get instant responses with our optimized streaming technology and real-time processing."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Private",
      description: "Your conversations are encrypted and private. We prioritize your data security."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Multi-language",
      description: "Communicate in multiple languages with our advanced translation capabilities."
    }
  ];

  const stats = [
    { number: "10M+", label: "Conversations" },
    { number: "500K+", label: "Active Users" },
    { number: "99.9%", label: "Uptime" },
    { number: "50+", label: "Languages" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Navigation */}
      <nav className="relative z-10 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-zinc-600 to-zinc-800 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">AI Chat</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Chat with
              <span className="bg-gradient-to-r from-zinc-600 to-zinc-800 bg-clip-text text-transparent"> AI</span>
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the future of conversation with our advanced AI assistant.
              Get instant answers, creative ideas, and intelligent solutions to your questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-semibold text-base hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                Start Chatting Free
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-6 py-3 rounded-xl font-semibold text-base hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign In
              </motion.button>
            </div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-200/20 to-zinc-300/20 dark:from-zinc-700/20 dark:to-zinc-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
                  </div>
                  <div className="flex justify-center">
                    <div className="h-32 w-32 bg-gradient-to-r from-zinc-600 to-zinc-800 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {stat.number}
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Why Choose Our AI Chat?
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Discover the features that make our AI assistant the perfect companion for your conversations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-lg border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-shadow"
              >
                <div className="text-zinc-600 dark:text-zinc-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Ready to Start Your AI Journey?
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
              Join thousands of users who are already experiencing the future of AI conversation.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-semibold text-base hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
            >
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-6 w-6 bg-gradient-to-r from-zinc-600 to-zinc-800 rounded flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">AI Chat</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            © 2025 AI Chat. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;