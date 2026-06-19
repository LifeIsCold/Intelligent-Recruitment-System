import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        const notifs = res.data.data;
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (id) => {
    await api.markNotificationAsRead(id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await api.markAllNotificationsAsRead();
    fetchNotifications();
  };

  const getMessage = (notif) => {
    const { status_change, details } = notif;
    if (status_change === 'shortlisted') {
      const date = new Date(details.interview_scheduled_at).toLocaleString();
      return `You have been shortlisted for ${details.job_title} at ${details.company_name}. Interview on ${date} at ${details.interview_location}.`;
    }
    if (status_change === 'offer_extended') {
      return `You have received a job offer for ${details.job_title} at ${details.company_name}. Start date: ${details.start_date}.`;
    }
    if (status_change === 'hired_accepted') {
      return `Candidate ${details.applicant_name} accepted your offer for ${details.job_title}.`;
    }
    if (status_change === 'hired_declined') {
      return `Candidate ${details.applicant_name} declined your offer for ${details.job_title}.`;
    }
    return '';
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour ago`;
    return `${diffDays} day ago`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button onClick={() => setShowDropdown(!showDropdown)}>
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>Mark all as read</button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notification-item ${n.is_read ? '' : 'unread'}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <p>{getMessage(n)}</p>
                  <small>{getTimeAgo(n.created_at)}</small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;