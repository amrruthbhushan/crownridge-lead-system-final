import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart3, FileText, Download, Printer, Users, 
  TrendingUp, Compass, ChevronRight, CheckCircle2, ShieldAlert 
} from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads'); // 'leads', 'sales', 'conversion'
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports');
      setData(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format) => {
    setExporting(true);
    try {
      const response = await api.get(`/reports/export?type=${type}&format=${format}`, {
        responseType: 'blob'
      });
      
      const fileType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';
      const extension = format === 'excel' ? 'xls' : 'csv';
      
      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_performance_report.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert(`Failed to generate and download ${format.toUpperCase()} report.`);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-slate-400 text-sm">
        <div className="animate-spin inline-block h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3" />
        <div>Compiling CRM analytics and performance reporting ledger...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-700 dark:text-slate-200">Reports Locked</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">Unable to retrieve compiled analytics data matrices.</p>
        <button onClick={fetchReports} className="premium-btn-primary py-2 mt-4 mx-auto">
          Retry Compilation
        </button>
      </div>
    );
  }

  const { leadPerformance, salesPerformance, conversionReport } = data;

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0 print:space-y-4">
      
      {/* Header bar (hidden during browser prints) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Export spreadsheet-ready spreadsheets or trigger print PDFs.</p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto select-none flex-wrap">
          <button 
            disabled={exporting}
            onClick={() => handleExport(activeTab, 'csv')}
            className="premium-btn-secondary py-2 px-3.5 text-xs font-semibold cursor-pointer disabled:opacity-55"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>CSV Export</span>
          </button>
          <button 
            disabled={exporting}
            onClick={() => handleExport(activeTab, 'excel')}
            className="premium-btn-secondary py-2 px-3.5 text-xs font-semibold cursor-pointer disabled:opacity-55"
          >
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span>Excel Export</span>
          </button>
          <button 
            onClick={handlePrint}
            className="premium-btn-primary py-2 px-3.5 text-xs font-semibold cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Export PDF / Print</span>
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 select-none">
        <h1 className="text-2xl font-black text-slate-800">Crownridge CRM Audit Report</h1>
        <p className="text-xs text-slate-500 mt-1">
          IT Consultancy Inbound Lead Qualifications - Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* TABS SELECTOR (hidden during browser prints) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-2.5 shadow-sm flex gap-1 print:hidden select-none transition-all duration-200">
        {[
          { id: 'leads', name: 'Lead Performance', icon: FileText },
          { id: 'sales', name: 'Sales Representative Performance', icon: Users },
          { id: 'conversion', name: 'Pipeline Funnel Conversion', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-brand-600 text-white dark:bg-brand-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-805 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT CANVAS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden p-6 print:border-none print:shadow-none print:p-0 transition-all duration-200">
        
        {/* Tab 1: Leads Performance */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="select-none flex justify-between items-center print:border-none border-b border-slate-50 dark:border-slate-850 pb-3">
              <h2 className="text-base font-bold text-slate-805 dark:text-slate-205">Lead Performance Directory</h2>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 px-2.5 py-0.5 rounded-full uppercase">
                {leadPerformance.length} Total Leads
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase select-none">
                    <th className="py-3.5 px-4">Lead Info</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4 text-center">Score</th>
                    <th className="py-3.5 px-4">Rep Assigned</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Ingested Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {leadPerformance.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-850/20">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-805 dark:text-slate-200">{l.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{l.company}</div>
                      </td>
                      <td className="py-3.5 px-4 uppercase">{l.source}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">{l.score} ({l.temperature})</td>
                      <td className="py-3.5 px-4">{l.assignedTo}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border text-[10px] font-bold text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60">
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Sales Performance */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="select-none flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-3">
              <h2 className="text-base font-bold text-slate-805 dark:text-slate-205">Sales Representative Matrix</h2>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 px-2.5 py-0.5 rounded-full uppercase">
                {salesPerformance.length} active agents
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase select-none">
                    <th className="py-3.5 px-4">Representative</th>
                    <th className="py-3.5 px-4 text-center">Assigned Leads</th>
                    <th className="py-3.5 px-4 text-center">Won Leads</th>
                    <th className="py-3.5 px-4 text-center">Lost Leads</th>
                    <th className="py-3.5 px-4 text-center">Active Pipeline</th>
                    <th className="py-3.5 px-4 text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {salesPerformance.map((rep) => (
                    <tr key={rep.repId} className="hover:bg-slate-50/20 dark:hover:bg-slate-850/20">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-808 dark:text-slate-200">{rep.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{rep.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">{rep.assignedLeadsCount}</td>
                      <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-450 font-bold">{rep.wonCount}</td>
                      <td className="py-3.5 px-4 text-center text-red-500 dark:text-red-400 font-bold">{rep.lostCount}</td>
                      <td className="py-3.5 px-4 text-center text-indigo-500 dark:text-indigo-400 font-bold">{rep.activeCount}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5">
                          {rep.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Funnel Conversion */}
        {activeTab === 'conversion' && (
          <div className="space-y-6">
            <div className="select-none flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-3">
              <h2 className="text-base font-bold text-slate-805 dark:text-slate-205">Pipeline Funnel Distribution</h2>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 bg-slate-50 dark:bg-slate-950 border border-slate-250/50 dark:border-slate-800 px-2.5 py-0.5 rounded-full uppercase">Funnel Ratios</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Funnel Table */}
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-550 uppercase select-none">
                      <th className="py-3.5 px-4">Pipeline Stage</th>
                      <th className="py-3.5 px-4 text-center">Lead Count</th>
                      <th className="py-3.5 px-4 text-right">Pipeline Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {conversionReport.map((row) => (
                      <tr key={row.status} className="hover:bg-slate-50/20 dark:hover:bg-slate-850/20">
                        <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">{row.status}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-600 dark:text-slate-400">{row.count}</td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-808 dark:text-slate-200">{row.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Stacked visually funnel chart */}
              <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider mb-2 select-none">Visual pipeline density</h3>
                {conversionReport.map((row) => (
                  <div key={row.status} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span>{row.status}</span>
                      <span>{row.percentage}%</span>
                    </div>
                    <div className="h-3 bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/30 dark:border-slate-700/30">
                      <div 
                        className="bg-brand-600 dark:bg-brand-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
