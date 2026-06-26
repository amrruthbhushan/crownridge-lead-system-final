import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Users, Flame, Award, Trash, ShieldAlert, 
  TrendingUp, Radio, Calendar, History, CheckSquare, Plus,
  DollarSign, BarChart3, LineChart, PieChart, UsersRound, Percent,
  SlidersHorizontal
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) {
      return '₹0';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const drawAreaChartPath = (data) => {
    if (!data || data.length === 0) return '';
    const monthlyTrends = stats?.charts?.monthlyTrends || [];
    const maxVal = Math.max(...monthlyTrends.map(t => Math.max(t.count || 0, t.rate || 0)), 5);
    const points = data.map((d, idx) => {
      const x = idx * (500 / Math.max(data.length - 1, 1));
      const y = 150 - 15 - ((d.count || 0) / maxVal) * 120;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Skeleton Header */}
        <div className="flex justify-between items-center select-none">
          <div className="space-y-2">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="skeleton h-10 w-36" />
        </div>
        
        {/* Skeleton Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="skeleton h-28 w-full" />)}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 skeleton h-72 w-full" />
          <div className="lg:col-span-4 skeleton h-72 w-full" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-700 dark:text-slate-200">Dashboard Unavailable</h3>
        <p className="text-xs text-slate-400 dark:text-slate-550">Failed to load analytics details from the api.</p>
        <button onClick={fetchStats} className="premium-btn-primary py-2 mt-4 mx-auto">
          Reload Dashboard
        </button>
      </div>
    );
  }

  const { 
    cards = {}, 
    charts: rawCharts = {}, 
    recentActivities = [], 
    recentLeads = [] 
  } = stats || {};

  const charts = {
    salesPerformance: rawCharts.salesPerformance || [],
    leadsBySource: rawCharts.leadsBySource || [],
    leadsByStatus: rawCharts.leadsByStatus || [],
    revenueForecast: rawCharts.revenueForecast || [],
    monthlyTrends: rawCharts.monthlyTrends || []
  };

  const { 
    salesPerformance,
    leadsBySource,
    leadsByStatus,
    revenueForecast,
    monthlyTrends
  } = charts;

  const kpis = [
    { title: 'Revenue Pipeline', value: formatCurrency(cards.revenuePipeline), icon: DollarSign, textColor: 'text-indigo-500 dark:text-brand-400', bgColor: 'bg-indigo-50/50 dark:bg-brand-950/20 border-indigo-100/60 dark:border-brand-900/40', sub: 'Total deal budget pool' },
    { title: 'Expected Revenue', value: formatCurrency(cards.expectedRevenue), icon: TrendingUp, textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/60 dark:border-emerald-900/40', sub: 'Probability weighted value' },
    { title: 'Average Lead Score', value: `${cards.averageLeadScore} / 100`, icon: Flame, textColor: 'text-rose-500 dark:text-rose-450', bgColor: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100/60 dark:border-rose-900/40', sub: 'Organization score average' },
    { title: 'Conversion Rate', value: `${cards.conversionRate}%`, icon: Percent, textColor: 'text-sky-505 dark:text-sky-400', bgColor: 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-100/60 dark:border-sky-900/40', sub: 'Won vs Closed deals ratio' },
    { title: 'Monthly Growth', value: `${cards.monthlyGrowth >= 0 ? '+' : ''}${cards.monthlyGrowth}%`, icon: LineChart, textColor: 'text-amber-500 dark:text-amber-450', bgColor: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100/60 dark:border-amber-900/40', sub: 'Lead intake change MoM' },
    { title: 'Active Sales Reps', value: `${cards.activeSalesReps} Representatives`, icon: UsersRound, textColor: 'text-purple-550 dark:text-purple-400', bgColor: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100/60 dark:border-purple-900/40', sub: 'Enrolled in round-robin' }
  ];

  const getSourceColor = (name) => {
    if (name === 'WEBSITE') return 'bg-brand-500 dark:bg-brand-600';
    if (name === 'LINKEDIN') return 'bg-cyan-500 dark:bg-cyan-600';
    return 'bg-amber-500 dark:bg-amber-600';
  };

  const getTempStyle = (temp) => {
    switch (temp) {
      case 'HOT': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/50';
      case 'WARM': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50';
      default: return 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-100 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time pipeline value, agent workloads, and conversion yield rates.
          </p>
        </div>

        <button 
          onClick={() => navigate('/leads')}
          className="premium-btn-primary py-2.5 px-4 font-semibold shrink-0"
        >
          <Plus className="h-5 w-5" />
          <span>New Lead Ingest</span>
        </button>
      </div>

      {/* KPI GRID PANEL (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 select-none">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={kpi.title}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-premium dark:hover:shadow-dark-premium hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-28"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                <div className={`p-1.5 rounded-lg ${kpi.bgColor} border shrink-0`}>
                  <Icon className={`h-5 w-5 ${kpi.textColor}`} />
                </div>
              </div>
              <div>
                <span className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight block truncate">{kpi.value}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block leading-none">{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS LAYER 1: Revenue Forecast & Source share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Widget 1: Revenue Forecast (Expected Revenue by Stage) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col space-y-4 transition-all duration-200">
          <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
            <DollarSign className="h-5 w-5 text-brand-655 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Revenue Forecast by Pipeline Stage</h3>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3.5 py-2">
            {charts.revenueForecast.map((stage) => {
              const maxVal = Math.max(...charts.revenueForecast.map(f => f.value), 1);
              const percent = Math.round((stage.value / maxVal) * 100);
              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 select-none">
                    <span>{stage.name}</span>
                    <span>{formatCurrency(stage.value)}</span>
                  </div>
                  <div className="h-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/60 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-600 dark:bg-brand-700 h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Widget 2: Lead Source Donut/Pie Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col space-y-4 transition-all duration-200">
          <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
            <PieChart className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Lead Source Distribution</h3>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {(() => {
              const totalSourceLeads = leadsBySource.reduce((sum, s) => sum + s.value, 0);
              let currentOffset = 0;
              const donutCircles = leadsBySource.map((s) => {
                const percentage = totalSourceLeads > 0 ? (s.value / totalSourceLeads) : 0;
                const strokeDashval = percentage * 251.2;
                const strokeDashoffset = 251.2 - strokeDashval + currentOffset;
                currentOffset -= strokeDashval;
                
                const colors = {
                  WEBSITE: 'stroke-brand-500 dark:stroke-brand-550',
                  LINKEDIN: 'stroke-cyan-500 dark:stroke-cyan-550',
                  REFERRAL: 'stroke-amber-500 dark:stroke-amber-550'
                };

                return {
                  ...s,
                  percentage: Math.round(percentage * 100),
                  strokeDasharray: `${strokeDashval} 251.2`,
                  strokeDashoffset: strokeDashoffset,
                  colorClass: colors[s.name] || 'stroke-slate-400'
                };
              });

              return (
                <>
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {donutCircles.map((circle) => (
                        <circle
                          key={circle.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          strokeWidth="11"
                          className={`${circle.colorClass} transition-all duration-500`}
                          strokeDasharray={circle.strokeDasharray}
                          strokeDashoffset={circle.strokeDashoffset}
                          strokeLinecap={circle.percentage > 0 ? "round" : "butt"}
                        />
                      ))}
                      <circle cx="50" cy="50" r="33" className="fill-white dark:fill-slate-900 transition-colors" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
                      <span className="text-xl font-black text-slate-805 dark:text-white leading-none">{totalSourceLeads}</span>
                      <span className="text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-1">Leads</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    {donutCircles.map((s) => (
                      <div key={s.name} className="flex justify-between items-center text-xs font-bold text-slate-655 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            s.name === 'WEBSITE' ? 'bg-brand-500' : s.name === 'LINKEDIN' ? 'bg-cyan-500' : 'bg-amber-500'
                          }`} />
                          <span className="uppercase tracking-wider text-[10px]">{s.name}</span>
                        </div>
                        <span>{s.value} ({s.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

      </div>

      {/* CHARTS LAYER 2: Sales Performance & Status Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Widget 3: Sales Rep Performance comparison */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col space-y-4 transition-all duration-200">
          <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
            <BarChart3 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Sales Representative Workload</h3>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4 py-2">
            {salesPerformance.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-405 italic select-none">No active sales representative data.</div>
            ) : (
              salesPerformance.map((rep) => {
                const maxVal = Math.max(...salesPerformance.map(s => s.assigned), 1);
                const assignedPercent = Math.round((rep.assigned / maxVal) * 100);
                const wonPercent = Math.round((rep.won / maxVal) * 100);
                return (
                  <div key={rep.name} className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{rep.name}</div>
                    
                    {/* Double progress bar: Assigned (indigo) and Won (emerald) */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase w-12 shrink-0">Assigned:</span>
                        <div className="flex-1 h-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 dark:bg-brand-600 h-full rounded-full" style={{ width: `${assignedPercent}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-4 shrink-0 text-right">{rep.assigned}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase w-12 shrink-0">Closed Won:</span>
                        <div className="flex-1 h-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 dark:bg-emerald-600 h-full rounded-full" style={{ width: `${wonPercent}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-605 w-4 shrink-0 text-right">{rep.won}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Widget 4: Funnel status stages */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col space-y-4 transition-all duration-200">
          <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
            <SlidersHorizontal className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Pipeline Status Funnel</h3>
          </div>

          {/* Stacking funnel display */}
          <div className="flex-1 flex flex-col justify-center space-y-2 py-1 select-none">
            {charts.leadsByStatus.map((row, idx) => {
              const maxVal = Math.max(...charts.leadsByStatus.map(r => r.value), 1);
              // Decreasing scale to mimic a funnel shape visually, but scaling with volume!
              const baseWidth = Math.max(25, Math.round((row.value / maxVal) * 100));
              const funnelStyles = [
                'bg-blue-600/80 dark:bg-blue-700/60',
                'bg-blue-500/80 dark:bg-blue-600/60',
                'bg-brand-500/80 dark:bg-brand-600/60',
                'bg-indigo-500/80 dark:bg-indigo-600/60',
                'bg-purple-500/80 dark:bg-purple-600/60',
                'bg-emerald-500/80 dark:bg-emerald-600/60',
                'bg-rose-500/80 dark:bg-rose-600/60'
              ];
              
              return (
                <div key={row.name} className="flex flex-col items-center">
                  <div 
                    className={`h-7 ${funnelStyles[idx]} text-[10px] text-white font-extrabold flex items-center justify-between px-4 rounded-xl transition-all duration-300 shadow-sm`}
                    style={{ width: `${baseWidth}%` }}
                  >
                    <span>{row.name}</span>
                    <span>{row.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CHARTS LAYER 3: Monthly Trends (Lead Count & Conversion Rate Area/Line) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col space-y-4 transition-all duration-200">
        
        <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Monthly Trends: Leads & Conversion Rates</h3>
          </div>
          <div className="flex gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1 text-brand-500">
              <span className="h-2 w-2 bg-indigo-500 rounded-full" />
              <span>Ingested Leads</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-500">
              <span className="h-2 w-2 bg-emerald-500 rounded-full" />
              <span>Conversion Rate (%)</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pt-4 min-h-[180px]">
          <div className="relative w-full h-[150px]">
            <svg 
              viewBox="0 0 500 150" 
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <line x1="0" y1="15" x2="500" y2="15" className="stroke-slate-100 dark:stroke-slate-800/50" strokeWidth="1" />
              <line x1="0" y1="75" x2="500" y2="75" className="stroke-slate-100 dark:stroke-slate-800/50" strokeWidth="1" />
              <line x1="0" y1="135" x2="500" y2="135" className="stroke-slate-100 dark:stroke-slate-800/50" strokeWidth="1" />

              {/* Area 1: Ingested Leads Count (Indigo) */}
              <path 
                d={drawAreaChartPath(charts.monthlyTrends.map(t => ({ count: t.count })))} 
                fill="none" 
                stroke="#4f46e5" 
                strokeWidth="3" 
                strokeLinecap="round"
              />

              {/* Area 2: Conversion Rate (Emerald) */}
              <path 
                d={drawAreaChartPath(charts.monthlyTrends.map(t => ({ count: t.rate })))} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeDasharray="4 4"
              />

              {/* Dots for Ingested */}
              {charts.monthlyTrends.map((d, idx) => {
                const maxVal = Math.max(...charts.monthlyTrends.map(t => Math.max(t.count, t.rate)), 5);
                const cx = idx * (500 / (charts.monthlyTrends.length - 1));
                const cy1 = 150 - 15 - (d.count / maxVal) * 120;
                const cy2 = 150 - 15 - (d.rate / maxVal) * 120;
                return (
                  <g key={idx}>
                    <circle cx={cx} cy={cy1} r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                    <circle cx={cx} cy={cy2} r="3.5" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                  </g>
                );
              })}

            </svg>
          </div>
          
          <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-55 dark:border-slate-800/80 select-none">
            {charts.monthlyTrends.map((m, idx) => (
              <span key={idx} className="w-8 text-center">{m.month}</span>
            ))}
          </div>
        </div>

      </div>

      {/* LOWER SECTION: RECENT LEADS & RECENT ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Leads Table (7 Columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden flex flex-col transition-all duration-200">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Recent Lead Ingress</h3>
            </div>
            <button 
              onClick={() => navigate('/leads')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold cursor-pointer"
            >
              View Full Pipeline
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentLeads.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                No recent leads captured.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase select-none">
                    <th className="py-3 px-6">Name / Company</th>
                    <th className="py-3 px-6 text-center">Score</th>
                    <th className="py-3 px-6">Assigned To</th>
                    <th className="py-3 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{lead.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{lead.companyName}</div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTempStyle(lead.score?.temperature)}`}>
                          {lead.score?.score || 0}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        {lead.assignment?.assignedTo?.name || (
                          <span className="text-slate-400 dark:text-slate-500 italic font-normal text-[10px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-bold cursor-pointer"
                        >
                          Open File
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity Feed (5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col space-y-4 transition-all duration-200">
          <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
            <History className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Pipeline Activity Logs</h3>
          </div>

          <div className="flex-1 space-y-4 max-h-72 overflow-y-auto pr-1">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-405 dark:text-slate-500 italic">
                No activity logs.
              </div>
            ) : (
              recentActivities.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs leading-normal">
                  <div className="shrink-0 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 dark:bg-brand-655" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-650 dark:text-slate-350">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{log.description}</span>
                    </p>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-bold select-none pt-0.5">
                      <span>by {log.user?.name || 'System'}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
