import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, Filter, Plus, ChevronLeft, ChevronRight, 
  ExternalLink, Trash2, SlidersHorizontal, CheckCircle2, ShieldAlert, X
} from 'lucide-react';

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [temperature, setTemperature] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // New Lead Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    industry: '',
    budget: 'LOW',
    projectSize: 'SMALL',
    urgency: 'LOW',
    source: 'WEBSITE',
    industryFit: 'GOOD',
    notes: '',
    estimatedBudget: 500000,
    conversionProbability: 75,
    expectedRevenue: 375000
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchLeads();
  }, [page, status, source, temperature]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leads', {
        params: {
          search,
          status,
          source,
          temperature,
          page,
          limit: 10
        }
      });
      setLeads(response.data.leads || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalLeads(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await api.post('/leads', newLead);
      setModalOpen(false);
      setNewLead({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        industry: '',
        budget: 'LOW',
        projectSize: 'SMALL',
        urgency: 'LOW',
        source: 'WEBSITE',
        industryFit: 'GOOD',
        notes: ''
      });
      setPage(1);
      fetchLeads();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create lead.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLead = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete lead: ${name}?`)) return;
    try {
      await api.delete(`/leads/${id}`);
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete lead.');
    }
  };

  const getTemperatureStyle = (temp) => {
    switch (temp) {
      case 'HOT': return 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border-rose-100 dark:border-rose-900/50';
      case 'WARM': return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-455 border-amber-100 dark:border-amber-900/50';
      default: return 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-100 dark:border-slate-800';
    }
  };

  const getStatusStyle = (stat) => {
    switch (stat) {
      case 'NEW': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50';
      case 'QUALIFIED': return 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50';
      case 'WON': return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50';
      case 'LOST': return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50';
      default: return 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Leads Pipeline</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {currentUser?.role === 'SALES_REP' 
              ? 'Manage and qualify leads assigned to you.' 
              : 'Monitor, assign, and qualify inbound consultancy leads.'}
          </p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="premium-btn-primary self-stretch sm:self-auto py-2.5 px-4.5 font-semibold"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4">
          
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Lead Name, Company, Email or Industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="premium-input pl-10.5"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-auto">
            
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="premium-input text-xs font-semibold text-slate-655 dark:text-slate-400 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%252015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONTACTED">Contacted</option>
              <option value="PROPOSAL_SENT">Proposal Sent</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>

            {/* Source Filter */}
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              className="premium-input text-xs font-semibold text-slate-655 dark:text-slate-400 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%252015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
            >
              <option value="">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="REFERRAL">Referral</option>
            </select>

            {/* Temperature Filter */}
            <select
              value={temperature}
              onChange={(e) => { setTemperature(e.target.value); setPage(1); }}
              className="premium-input text-xs font-semibold text-slate-655 dark:text-slate-400 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%252015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
            >
              <option value="">All Scores</option>
              <option value="HOT">Hot Leads</option>
              <option value="WARM">Warm Leads</option>
              <option value="COLD">Cold Leads</option>
            </select>

            <button 
              type="submit"
              className="premium-btn-primary py-2 px-3 text-xs w-full cursor-pointer"
            >
              Filter
            </button>

          </div>

        </form>
      </div>

      {/* LEADS DATA GRID */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden transition-all duration-200">
        {loading ? (
          /* Premium Shimmer Skeleton Table Loader */
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 grid grid-cols-5 gap-4 select-none">
              {[1, 2, 3, 4, 5].map(n => <div key={n} className="skeleton h-4 w-24" />)}
            </div>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="p-5 grid grid-cols-5 gap-4 items-center">
                <div className="space-y-2"><div className="skeleton h-4 w-32" /><div className="skeleton h-3 w-20" /></div>
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-6 w-16" />
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-8 w-24 justify-self-end" />
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <ShieldAlert className="h-10 w-10 text-slate-300 dark:text-slate-650 mx-auto animate-pulse" />
            <h3 className="font-extrabold text-slate-700 dark:text-slate-300">No Leads Found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-normal">
              No inbound leads match your criteria. Add a new lead or adjust your filter query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55/50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase select-none">
                  <th className="py-4 px-6">Lead / Company</th>
                  <th className="py-4 px-6">Industry & Source</th>
                  <th className="py-4 px-6">Budget Tier</th>
                  <th className="py-4 px-6 text-center">Score</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Assigned To</th>
                  <th className="py-4 px-6">Checklist Progress</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-sm text-slate-700 dark:text-slate-300">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{lead.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{lead.companyName}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-655 dark:text-slate-350">{lead.industry}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bold uppercase">{lead.source}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700/60">
                        {lead.budget}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className={`inline-block border px-2.5 py-0.5 rounded-full text-xs font-bold ${getTemperatureStyle(lead.score?.temperature)}`}>
                        {lead.score?.score || 0} ({lead.score?.temperature || 'COLD'})
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-block border px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">
                      {lead.assignment?.assignedTo?.name || (
                        <span className="text-slate-400 dark:text-slate-500 text-xs italic font-normal">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/40">
                          <div 
                            className="bg-brand-600 dark:bg-brand-700 h-full rounded-full transition-all duration-305"
                            style={{ width: `${lead.checklist?.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-450">{lead.checklist?.progress || 0}%</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        
                        {currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION PANEL */}
        {!loading && leads.length > 0 && (
          <div className="bg-slate-50/50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 py-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-3 select-none">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Showing {leads.length} of {totalLeads} leads database entries
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <span className="text-xs font-bold text-slate-655 dark:text-slate-405 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE LEAD DIALOG (MODAL) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col animate-fade-in transition-all duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between select-none">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add Inbound Lead</h2>
              <X className="h-5 w-5 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-350 transition-colors" onClick={() => setModalOpen(false)} />
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateLead} className="p-6 space-y-4 flex-1">
              
              {formError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-400 rounded-2xl flex items-center gap-2 text-xs">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="premium-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newLead.companyName}
                    onChange={(e) => setNewLead(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="premium-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="name@company.com"
                    className="premium-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newLead.phone}
                    onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 012-3456"
                    className="premium-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Industry *</label>
                  <input
                    type="text"
                    required
                    value={newLead.industry}
                    onChange={(e) => setNewLead(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g. Healthcare, Finance"
                    className="premium-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Lead Source *</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead(prev => ({ ...prev, source: e.target.value }))}
                    className="premium-input"
                  >
                    <option value="WEBSITE">Website Form Ingestion</option>
                    <option value="LINKEDIN">LinkedIn Referral/Inbound</option>
                    <option value="REFERRAL">Referral Network</option>
                  </select>
                </div>

              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <h3 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">Scoring Criteria Parameters</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-550 dark:text-slate-450 uppercase">Budget Tier</label>
                    <select
                      value={newLead.budget}
                      onChange={(e) => setNewLead(prev => ({ ...prev, budget: e.target.value }))}
                      className="premium-input text-xs"
                    >
                      <option value="LOW">Low (10)</option>
                      <option value="MEDIUM">Medium (20)</option>
                      <option value="HIGH">High (30)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-550 dark:text-slate-450 uppercase">Project Size</label>
                    <select
                      value={newLead.projectSize}
                      onChange={(e) => setNewLead(prev => ({ ...prev, projectSize: e.target.value }))}
                      className="premium-input text-xs"
                    >
                      <option value="SMALL">Small (10)</option>
                      <option value="MEDIUM">Medium (20)</option>
                      <option value="LARGE">Large (30)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-550 dark:text-slate-450 uppercase">Urgency Tier</label>
                    <select
                      value={newLead.urgency}
                      onChange={(e) => setNewLead(prev => ({ ...prev, urgency: e.target.value }))}
                      className="premium-input text-xs"
                    >
                      <option value="LOW">Low (5)</option>
                      <option value="MEDIUM">Medium (10)</option>
                      <option value="HIGH">High (20)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-550 dark:text-slate-450 uppercase">Industry Fit</label>
                    <select
                      value={newLead.industryFit}
                      onChange={(e) => setNewLead(prev => ({ ...prev, industryFit: e.target.value }))}
                      className="premium-input text-xs"
                    >
                      <option value="POOR">Poor (5)</option>
                      <option value="GOOD">Good (15)</option>
                      <option value="EXCELLENT">Excellent (20)</option>
                    </select>
                  </div>

                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Notes & Description</label>
                <textarea
                  rows={3}
                  value={newLead.notes}
                  onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Summarize customer needs, initial request data, scope details..."
                  className="premium-input"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="premium-btn-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="premium-btn-primary py-2 cursor-pointer"
                >
                  {formLoading ? 'Submitting...' : 'Ingest & Automate Routing'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
