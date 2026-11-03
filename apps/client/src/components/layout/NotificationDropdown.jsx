import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  ShieldAlert,
  Bus,
  DollarSign,
  MessageSquare,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const NotificationDropdown = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const params = {};
      if (activeFilter === 'unread') params.read = false;

      const res = await api.getNotifications(params);
      if (res && res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeFilter]);

  // Initial load and periodic polling every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notif, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Error handled gracefully
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast('Failed to mark all as read', 'error');
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getCategoryIcon = (category, priority) => {
    if (priority === 'urgent' || category === 'Safety' || category === 'Emergency') {
      return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    }
    switch (category) {
      case 'Transport':
        return <Bus className="w-4 h-4 text-indigo-600" />;
      case 'Fee':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'Grievance':
        return <MessageSquare className="w-4 h-4 text-amber-600" />;
      case 'Event':
      case 'Academic':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors relative focus:outline-none cursor-pointer"
        title={unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'Notifications'}
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-slate-100 bg-white px-3 py-1.5 gap-2 text-[11px]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeFilter === 'unread'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Unread Only ({unreadCount})
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <p className="text-xs">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No {activeFilter === 'unread' ? 'unread ' : ''}notifications at this moment.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 transition-colors cursor-pointer flex gap-3 relative ${
                    notif.read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                  }`}
                >
                  {/* Category Icon */}
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category, notif.priority)}
                  </div>

                  {/* Notification Body */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${notif.read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {notif.category}
                      </span>
                      {notif.priority === 'urgent' && (
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Read status indicator and action */}
                  {!notif.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif, e)}
                      title="Mark as read"
                      className="absolute right-2.5 top-3 w-2 h-2 rounded-full bg-indigo-600 hover:scale-150 transition-transform"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notices');
              }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
            >
              View Campus Notices & Circulars
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
