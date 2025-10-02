import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sparkles, EllipsisVertical, Bot, User, LogOut, Settings } from "lucide-react";
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {Circles} from "react-loader-spinner";


export default function Header({ width, setWidth, setOpen }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  }

  return (
    <header className="h-14 border-b border-zinc-200/60 dark:border-zinc-800/60 px-3 md:px-5 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 backdrop-blur">
      <div className="flex items-center gap-5">
        <button className="lg:hidden cursor-pointer" onClick={() => setOpen(prev => !prev)} aria-label="Open history">
          <Menu className="h-[18px] w-[18px]"/>
        </button>
        <button className="hidden lg:block cursor-pointer" onClick={() => setOpen(prev => !prev)} aria-label="Toggle sidebar">
          <Menu className="h-[18px] w-[18px]"/>
        </button>
        <div className="text-sm text-zinc-500">AI Chat</div>
      </div>
      <div className="flex items-center gap-2">
        
        
        
        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex h-9 w-9 items-center justify-center cursor-pointer rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              aria-label="User menu"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {getInitials(user.name)}
                </div>
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg z-50">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      // TODO: Implement profile navigation
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <Circles height={20} width={20} color="#4fa94d" ariaLabel="circles-loading" wrapperStyle={{}} wrapperClass="" visible={true} />
        ) : (
          <NavLink to="/login" className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <User className="h-4 w-4"/> Login
          </NavLink>
        )}
      </div>
    </header>
  );
}
