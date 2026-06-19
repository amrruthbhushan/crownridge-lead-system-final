import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ClipboardCheck, Search, ShieldAlert, Award, ArrowRight, User } from 'lucide-react';

export default function LeadQualificationCenter() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Get all leads (scoped by RBAC inside API)
      const response = await api.get('/leads?limit=100');
      setLeads(response.data.leads || []);
    } catch (err) {
      console.error('Error fetching leads for qualification center:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (l.score?.temperature || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-32 text-center text-slate-400 text-sm">
        <div className="animate-spin inline-block h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3" />
        <div>Retrieving inbound qualification pipelines...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3 select-none">
          <Award className="h-8 w-8 text-brand-500" />
          <span>Lead Qualification Center</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Select an active inbound lead from your assigned queue to access its checklist milestones, scoring weights, and AI pitch guides.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md select-none">
        <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-405 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Filter by lead name, company, or temperature..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="premium-input pl-11"
        />
      </div>

      {/* Grid of Leads */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-4">
          <ShieldAlert className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No leads available</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">No leads match your search criteria or are assigned to you for qualification.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeads.map((lead) => {
            const temp = lead.score?.temperature || 'COLD';
            const score = lead.score?.score || 0;
            const progress = lead.checklist?.progress || 0;
            const rep = lead.assignment?.assignedTo?.name || 'Unassigned';

            return (
              <div
                key={lead.id}
                onClick={() => navigate(`/leads/${lead.id}?tab=qualification`)}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-750 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  {/* Lead Identity */}
                  <div className="flex justify-between items-start gap-2 border-b border-slate-50 dark:border-slate-850 pb-3 mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-805 dark:text-slate-200 group-hover:text-brand-655 dark:group-hover:text-brand-400 transition-colors text-sm">
                        {lead.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{lead.companyName}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      temp === 'HOT' 
                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40' 
                        : temp === 'WARM' 
                          ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/60'
                    }`}>
                      {temp} ({score})
                    </span>
                  </div>

                  {/* Representative Info */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-405 mb-4">
                    <User className="h-4 w-4 opacity-70" />
                    <span>Representative: {rep}</span>
                  </div>
                </div>

                {/* Checklist Progress Bar */}
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5 text-brand-500" />
                      Checklist Progress
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                      <div 
                        className="bg-brand-600 dark:bg-brand-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-505 dark:text-slate-400 shrink-0 flex items-center gap-0.5 select-none">
                      <span>Qualify</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
