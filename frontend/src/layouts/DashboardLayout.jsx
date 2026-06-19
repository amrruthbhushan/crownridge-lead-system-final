import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { 
  LayoutDashboard, Users, BarChart3, LogOut, Bell, User, 
  Menu, X, Check, CheckCircle2, AlertCircle, RefreshCw, Sun, Moon, Database, Award
} from 'lucide-react';

export default function DashboardLayout() {
  const [user, setUser] = useState({ name: 'User', role: 'SALES_REP' });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  
  const navigate = useNavigate();
  const location = useLocation();
  const bellRef = useRef(null);

  useEffect(() => {
    // 1. Auth check
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      navigate('/login');
    }

    // 2. Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // 3. Load notifications
    fetchNotifications();

    // 4. Click outside dropdown handler
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyTheme = (targetTheme) => {
    if (targetTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const list = response.data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif.id}`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setBellOpen(false);

      if (notif.message.includes('lead') || notif.title.includes('Lead')) {
        navigate('/leads');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leads Pipeline', path: '/leads', icon: Users },
    { name: 'Reports Centre', path: '/reports', icon: BarChart3 },
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60';
      case 'PROJECT_MANAGER': return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900/60';
      case 'TECH_LEAD': return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/60';
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/60';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_LEAD': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'LEAD_ASSIGNED': return <User className="h-4 w-4 text-indigo-500" />;
      case 'STATUS_UPDATED': return <RefreshCw className="h-4 w-4 text-amber-500" />;
      case 'CHECKLIST_COMPLETED': return <Check className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex font-sans">
      
      {/* SIDEBAR - DESKTOP */}
      <aside className={`bg-slate-900 dark:bg-slate-950 text-white transition-all duration-300 hidden md:flex flex-col border-r border-slate-800 dark:border-slate-900 shrink-0 z-30 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 dark:border-slate-900 gap-3 overflow-hidden select-none">
          <div className="p-1.5 bg-brand-600 rounded-xl shrink-0 shadow-lg shadow-brand-500/10">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Crownridge Leads
            </span>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-6 px-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/10' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-200 hover:bg-slate-800/50 dark:hover:bg-slate-900/60'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 dark:border-slate-900">
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 dark:text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl cursor-pointer transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold">Log Out</span>}
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between px-4 z-40 border-b border-slate-800 dark:border-slate-900 shadow-md">
        <div className="flex items-center gap-2">
          <Menu className="h-6 w-6 cursor-pointer text-slate-300" onClick={() => setMobileMenuOpen(true)} />
          <span className="font-bold text-base tracking-tight text-white">Crownridge</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mobile Theme toggle */}
          <button 
            onClick={toggleTheme}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 cursor-pointer"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          
          <button 
            onClick={() => setBellOpen(!bellOpen)} 
            className="relative p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full" />
            )}
          </button>
          <LogOut className="h-5 w-5 text-slate-400 cursor-pointer" onClick={handleLogout} />
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-slate-900 dark:bg-slate-950 h-full flex flex-col p-6 text-white space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-lg">Crownridge CRM</span>
              <X className="h-5 w-5 cursor-pointer text-slate-400" onClick={() => setMobileMenuOpen(false)} />
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.name}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${
                      isActive ? 'bg-brand-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{item.name}</span>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN VIEW CANVAS */}
      <div className="flex-1 flex flex-col min-h-screen pt-16 md:pt-0 overflow-hidden">
        
        {/* DESKTOP TOP HEADER */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 hidden md:flex items-center justify-between px-8 select-none z-30 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {location.pathname === '/' 
                ? 'Dashboard Stats' 
                : location.pathname.includes('/leads/qualification-center') 
                  ? 'Lead Qualification Center' 
                  : location.pathname.includes('/leads') 
                    ? 'Leads Pipeline Management' 
                    : location.pathname === '/docs'
                      ? 'Developer System Schema Docs'
                      : 'Reports & Analytics Audit'}
            </span>
          </div>

          <div className="flex items-center gap-5">
            
            {/* Theme switcher toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={bellRef}>
              <button 
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-3 animate-fade-in">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-50 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs text-brand-650 dark:text-brand-400 hover:text-brand-700 font-semibold hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`px-4 py-3 border-b border-slate-50/50 dark:border-slate-800/40 flex gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors ${!notif.isRead ? 'bg-brand-50/20 dark:bg-brand-950/10' : ''}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{notif.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">{notif.message}</p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!notif.isRead && (
                            <span className="h-1.5 w-1.5 bg-brand-600 rounded-full mt-1.5 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile widget */}
            <div className="flex items-center gap-3 border-l border-slate-100 dark:border-slate-800/80 pl-5">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.name}</span>
                <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 mt-0.5 uppercase tracking-wider ${getRoleColor(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <div className="h-9 w-9 bg-brand-600 dark:bg-brand-700 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shadow-brand-500/10 select-none">
                {user.name.charAt(0)}
              </div>
            </div>

          </div>
        </header>

        {/* SUB ROUTE CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
