import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to click-fill login credentials
  const fillCredentials = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  const isExpired = searchParams.get('expired') === 'true';

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-250">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-850/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-950/40 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 z-10">
        
        {/* Left Side: Product Intro */}
        <div className="md:col-span-7 flex flex-col justify-center text-white space-y-6 pr-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-600 rounded-2xl shadow-lg shadow-brand-500/20">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-brand-300 bg-clip-text text-transparent">
              Crownridge Leads
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Inbound Lead Qualification <br />
              <span className="text-brand-400 bg-gradient-to-r from-brand-300 to-indigo-400 bg-clip-text text-transparent">
                & Scoring Engine
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-md leading-relaxed font-medium">
              Accelerate your sales funnel with automatic lead scoring, instant round-robin assignments, checklist tracking, and smart AI pre-sales consulting advice.
            </p>
          </div>

          {/* Seed accounts helper list */}
          <div className="bg-slate-800/40 dark:bg-slate-900/30 border border-slate-700/40 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-md space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-brand-300 tracking-wider uppercase">
              Seeded Demo Accounts (Click to Fill)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div 
                onClick={() => fillCredentials('admin@crownridge.com', 'admin123')}
                className="p-3 bg-slate-800/80 dark:bg-slate-900/50 hover:bg-slate-750 dark:hover:bg-slate-800/80 border border-slate-750 dark:border-slate-800 rounded-2xl cursor-pointer transition-all hover:border-brand-500 hover:-translate-y-0.5 group"
              >
                <div className="font-bold text-white group-hover:text-brand-300">Admin Portal</div>
                <div className="text-slate-400 text-[10px] mt-0.5">admin@crownridge.com</div>
              </div>
              
              <div 
                onClick={() => fillCredentials('sarah.sales@crownridge.com', 'sales123')}
                className="p-3 bg-slate-800/80 dark:bg-slate-900/50 hover:bg-slate-750 dark:hover:bg-slate-800/80 border border-slate-750 dark:border-slate-800 rounded-2xl cursor-pointer transition-all hover:border-brand-500 hover:-translate-y-0.5 group"
              >
                <div className="font-bold text-white group-hover:text-brand-300">Sales Representative 1</div>
                <div className="text-slate-400 text-[10px] mt-0.5">sarah.sales@crownridge.com</div>
              </div>

              <div 
                onClick={() => fillCredentials('john.sales@crownridge.com', 'sales123')}
                className="p-3 bg-slate-800/80 dark:bg-slate-900/50 hover:bg-slate-750 dark:hover:bg-slate-800/80 border border-slate-750 dark:border-slate-800 rounded-2xl cursor-pointer transition-all hover:border-brand-500 hover:-translate-y-0.5 group"
              >
                <div className="font-bold text-white group-hover:text-brand-300">Sales Representative 2</div>
                <div className="text-slate-400 text-[10px] mt-0.5">john.sales@crownridge.com</div>
              </div>

              <div 
                onClick={() => fillCredentials('peter.pm@crownridge.com', 'pm123')}
                className="p-3 bg-slate-800/80 dark:bg-slate-900/50 hover:bg-slate-750 dark:hover:bg-slate-800/80 border border-slate-750 dark:border-slate-800 rounded-2xl cursor-pointer transition-all hover:border-brand-500 hover:-translate-y-0.5 group"
              >
                <div className="font-bold text-white group-hover:text-brand-300">Project Manager</div>
                <div className="text-slate-400 text-[10px] mt-0.5">peter.pm@crownridge.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Onboarding Card */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800/60 shadow-2xl flex flex-col justify-center transition-all duration-200">
          <div className="space-y-1.5 mb-6">
            <h2 className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Please sign in to access your sales workspace.</p>
          </div>

          {isExpired && (
            <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 rounded-2xl flex items-center gap-2 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span className="font-medium">Your session has expired. Please log in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-400 rounded-2xl flex items-center gap-2 text-xs animate-fade-in">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="premium-input pl-10.5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="premium-input pl-10.5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full premium-btn-primary py-3 flex justify-center items-center gap-2 group mt-4"
            >
              {loading ? 'Logging in...' : 'Sign In'}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Need a new demo user?{' '}
              <span 
                onClick={() => navigate('/register')}
                className="text-brand-600 dark:text-brand-400 hover:underline font-bold cursor-pointer"
              >
                Register a new role
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
