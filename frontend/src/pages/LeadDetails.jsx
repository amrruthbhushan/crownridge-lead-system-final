import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, Calendar, Mail, Phone, Building, Briefcase, 
  Sparkles, CheckSquare, Clock, User, ClipboardCheck, 
  AlertTriangle, ShieldAlert, Award, FileText, Send, Check,
  MessageSquare, Plus, File, Upload, Users, History, Activity,
  Edit3, Save, ChevronRight
} from 'lucide-react';

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [salesReps, setSalesReps] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Loading / Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview'); // overview, qualification, timeline, documents
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [selectedRep, setSelectedRep] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');
  const [reassignSuccess, setReassignSuccess] = useState(false);

  // Notes editing state
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Communication Log form state
  const [commType, setCommType] = useState('EMAIL'); // EMAIL, CALL, MEETING, CHAT
  const [commSubject, setCommSubject] = useState('');
  const [commBody, setCommBody] = useState('');
  const [loggingComm, setLoggingComm] = useState(false);

  // Document Mock upload form state
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('PDF');
  const [docSize, setDocSize] = useState('1.5 MB');
  const [addingDoc, setAddingDoc] = useState(false);

  // Status timeline stages
  const statusStages = ['NEW', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchLeadData();
    fetchSalesReps();
  }, [id]);

  const fetchLeadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/leads/${id}`);
      setLead(response.data.lead);
      setAiAdvice(response.data.aiRecommendations);
      setSelectedRep(response.data.lead?.assignment?.assignedToId || '');
      setNotesText(response.data.lead?.notes || '');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch lead details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReps = async () => {
    try {
      const response = await api.get('/auth/sales-reps');
      setSalesReps(response.data.reps || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChecklistChange = async (field, value) => {
    setSavingChecklist(true);
    try {
      const response = await api.put(`/leads/${id}`, {
        [field]: value
      });
      
      setLead(prev => ({
        ...prev,
        checklist: response.data.checklist,
        activityLogs: [
          {
            id: Math.random().toString(),
            action: 'CHECKLIST_UPDATED',
            description: `Checklist item "${field}" updated to ${value ? 'completed' : 'incomplete'}.`,
            createdAt: new Date().toISOString(),
            user: { name: currentUser?.name || 'You' }
          },
          ...prev.activityLogs
        ]
      }));

      const syncResponse = await api.get(`/leads/${id}`);
      setLead(syncResponse.data.lead);
      setAiAdvice(syncResponse.data.aiRecommendations);
    } catch (err) {
      console.error(err);
      alert('Error saving checklist modifications.');
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === lead.status) return;

    try {
      const response = await api.put(`/leads/${id}`, {
        status: newStatus
      });

      setLead(prev => ({
        ...prev,
        status: newStatus,
        activityLogs: [
          {
            id: Math.random().toString(),
            action: 'STATUS_UPDATED',
            description: `Status updated from "${prev.status}" to "${newStatus}".`,
            createdAt: new Date().toISOString(),
            user: { name: currentUser?.name || 'You' }
          },
          ...prev.activityLogs
        ]
      }));

      const syncResponse = await api.get(`/leads/${id}`);
      setLead(syncResponse.data.lead);
      setAiAdvice(syncResponse.data.aiRecommendations);
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    setReassigning(true);
    setReassignSuccess(false);

    try {
      await api.put(`/leads/${id}`, {
        assignedToId: selectedRep || null,
        assignmentNotes: reassignNotes || `Reassigned by ${currentUser?.name}.`
      });

      setReassignSuccess(true);
      setReassignNotes('');
      
      const syncResponse = await api.get(`/leads/${id}`);
      setLead(syncResponse.data.lead);
      setAiAdvice(syncResponse.data.aiRecommendations);

      setTimeout(() => setReassignSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to re-assign lead.');
    } finally {
      setReassigning(false);
    }
  };

  const handleUpdateNotes = async () => {
    setSavingNotes(true);
    try {
      await api.put(`/leads/${id}`, { notes: notesText });
      setLead(prev => ({
        ...prev,
        notes: notesText,
        activityLogs: [
          {
            id: Math.random().toString(),
            action: 'NOTES_UPDATED',
            description: 'Lead description notes updated.',
            createdAt: new Date().toISOString(),
            user: { name: currentUser?.name || 'You' }
          },
          ...prev.activityLogs
        ]
      }));
      const syncResponse = await api.get(`/leads/${id}`);
      setLead(syncResponse.data.lead);
      setAiAdvice(syncResponse.data.aiRecommendations);
      alert('Notes saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleLogCommunication = async (e) => {
    e.preventDefault();
    if (!commSubject || !commBody) {
      alert('Please fill out communication subject and body description.');
      return;
    }
    setLoggingComm(true);
    try {
      const response = await api.post(`/leads/${id}/communications`, {
        type: commType,
        subject: commSubject,
        body: commBody
      });
      setLead(prev => ({
        ...prev,
        communicationLogs: [response.data.log, ...(prev.communicationLogs || [])],
        activityLogs: [
          {
            id: Math.random().toString(),
            action: 'COMMUNICATION_LOGGED',
            description: `Logged a ${commType.toLowerCase()} communication: "${commSubject}"`,
            createdAt: new Date().toISOString(),
            user: { name: currentUser?.name || 'You' }
          },
          ...prev.activityLogs
        ]
      }));
      setCommSubject('');
      setCommBody('');
      alert('Communication details logged successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to log communication.');
    } finally {
      setLoggingComm(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!docName) {
      alert('Please enter a document filename.');
      return;
    }
    setAddingDoc(true);
    try {
      const formattedName = docName.toLowerCase().endsWith(`.${docType.toLowerCase()}`) 
        ? docName 
        : `${docName}.${docType.toLowerCase()}`;
      
      const response = await api.post(`/leads/${id}/documents`, {
        name: formattedName,
        fileSize: docSize,
        fileType: docType
      });
      setLead(prev => ({
        ...prev,
        documents: [response.data.doc, ...(prev.documents || [])],
        activityLogs: [
          {
            id: Math.random().toString(),
            action: 'DOCUMENT_UPLOADED',
            description: `Attached document: "${formattedName}"`,
            createdAt: new Date().toISOString(),
            user: { name: currentUser?.name || 'You' }
          },
          ...prev.activityLogs
        ]
      }));
      setDocName('');
      alert('Mock document attached successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to attach document.');
    } finally {
      setAddingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-6 w-36" />
        <div className="skeleton h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="skeleton h-64 w-full" />
            <div className="skeleton h-56 w-full" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="skeleton h-48 w-full" />
            <div className="skeleton h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-100 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-700 dark:text-slate-200">Detailed View Error</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal">{error || 'Lead could not be located.'}</p>
        <button onClick={() => navigate('/leads')} className="premium-btn-secondary py-2 mx-auto">
          Return to Pipeline
        </button>
      </div>
    );
  }

  const getTempColor = (temp) => {
    switch (temp) {
      case 'HOT': return 'bg-rose-550 dark:bg-rose-600 text-white shadow-rose-200 dark:shadow-none';
      case 'WARM': return 'bg-amber-500 dark:bg-amber-600 text-white shadow-amber-200 dark:shadow-none';
      default: return 'bg-slate-500 dark:bg-slate-600 text-white shadow-slate-200 dark:shadow-none';
    }
  };

  const getScoreDetailBarColor = (score, max) => {
    const ratio = score / max;
    if (ratio >= 0.75) return 'bg-emerald-500';
    if (ratio >= 0.5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'LEAD_CREATED': return <Plus className="h-4 w-4 text-emerald-500" />;
      case 'LEAD_ASSIGNED':
      case 'LEAD_REASSIGNED': return <User className="h-4 w-4 text-blue-500" />;
      case 'CHECKLIST_UPDATED': return <CheckSquare className="h-4 w-4 text-indigo-500" />;
      case 'CHECKLIST_COMPLETED': return <Award className="h-4 w-4 text-amber-500" />;
      case 'STATUS_UPDATED': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'DOCUMENT_UPLOADED': return <FileText className="h-4 w-4 text-teal-500" />;
      case 'COMMUNICATION_LOGGED': return <Mail className="h-4 w-4 text-pink-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  // SVG Circular progress configurations
  const radius = 28;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (lead.score?.score || 0)) / 100;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Back navigation & Capture date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-800 shadow-sm cursor-pointer group transition-all w-fit"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Previous Screen</span>
        </div>
        
        <div className="flex items-center gap-2 self-end text-xs text-slate-400 dark:text-slate-550 font-semibold">
          <Calendar className="h-4 w-4" />
          <span>Captured: {new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* TOP HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-850 dark:text-white tracking-tight">{lead.name}</h1>
            <span className={`text-[10px] font-bold tracking-wider px-3 py-1 rounded-full shadow-sm uppercase ${getTempColor(lead.score?.temperature)}`}>
              {lead.score?.temperature || 'COLD'} Lead
            </span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" />
            <span>{lead.companyName}</span>
          </p>
        </div>

        {/* Circular Lead Score Indicator & checklist percentage */}
        <div className="flex items-center gap-5 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-850 pt-4 md:pt-0 md:pl-6 w-full md:w-auto transition-colors">
          
          <div className="relative flex items-center justify-center h-16 w-16 shrink-0">
            <svg className="h-full w-full transform -rotate-90 select-none">
              <circle 
                cx="32" 
                cy="32" 
                r={radius} 
                className="stroke-slate-100 dark:stroke-slate-800/50" 
                strokeWidth={strokeWidth} 
                fill="transparent" 
              />
              <circle 
                cx="32" 
                cy="32" 
                r={radius} 
                className="stroke-brand-500 dark:stroke-brand-600 transition-all duration-500" 
                strokeWidth={strokeWidth} 
                fill="transparent" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-base font-black text-slate-800 dark:text-white leading-none">{lead.score?.score || 0}</span>
              <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5 tracking-widest">Score</span>
            </div>
          </div>

          <div className="space-y-1.5 w-full md:w-36">
            <div className="text-xs font-bold text-slate-650 dark:text-slate-400">Qualification Progress</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/30">
                <div 
                  className="bg-brand-600 dark:bg-brand-700 h-full rounded-full transition-all duration-300"
                  style={{ width: `${lead.checklist?.progress || 0}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-455 shrink-0">{lead.checklist?.progress || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS FLOW BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm overflow-hidden select-none transition-all duration-200">
        <h3 className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-5">Lead Pipeline Stage</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 relative">
          {statusStages.map((stage, idx) => {
            const isCurrent = lead.status === stage;
            const currentIdx = statusStages.indexOf(lead.status);
            const isCompleted = idx < currentIdx;
            
            return (
              <div
                key={stage}
                onClick={() => handleStatusChange(stage)}
                className={`py-2 px-3 border rounded-xl text-center cursor-pointer transition-all duration-200 text-xs font-semibold ${
                  isCurrent 
                    ? 'bg-brand-600 text-white border-brand-600 dark:bg-brand-700 dark:border-brand-700 shadow-md shadow-brand-500/20'
                    : isCompleted
                      ? 'bg-brand-50/50 text-brand-600 border-brand-100/50 dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/40 hover:border-brand-200'
                      : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-950/30 dark:text-slate-505 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-850/50'
                }`}
              >
                {stage.replace('_', ' ')}
              </div>
            );
          })}
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="flex border-b border-slate-205 dark:border-slate-800 select-none">
        {[
          { id: 'overview', name: 'Profile Overview' },
          { id: 'qualification', name: 'Lead Qualification Center' },
          { id: 'timeline', name: 'Timeline & Logs' },
          { id: 'documents', name: 'Documents' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
              activeTab === tab.id 
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-455 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* TWO COLUMN GRID DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT (DEPENDS ON TAB) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Lead Information Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5 transition-all duration-200">
                <h3 className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Lead Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-slate-505 dark:text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Email Address</div>
                      <a href={`mailto:${lead.email}`} className="text-sm font-semibold text-slate-705 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 break-all">{lead.email}</a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-slate-505 dark:text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Phone Number</div>
                      <a href={`tel:${lead.phone}`} className="text-sm font-semibold text-slate-705 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400">{lead.phone}</a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-slate-505 dark:text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Industry Sector</div>
                      <div className="text-sm font-semibold text-slate-705 dark:text-slate-300">{lead.industry}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                      <Send className="h-5 w-5 text-slate-505 dark:text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Inbound Source</div>
                      <div className="text-sm font-semibold text-slate-705 dark:text-slate-300 uppercase">{lead.source}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Card Section (Editable) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 transition-all duration-200">
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 select-none">
                    <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-sm font-bold text-slate-805 dark:text-slate-200">Notes & Descriptions</h3>
                  </div>
                  <button 
                    onClick={handleUpdateNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{savingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>

                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Insert additional notes, client constraints, scoping outlines, or follow-up feedback..."
                  className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-brand-500 dark:focus:ring-brand-950 font-semibold text-slate-700 dark:text-slate-350 leading-relaxed"
                />
              </div>
            </>
          )}

          {/* TAB 2: LEAD QUALIFICATION CENTER */}
          {activeTab === 'qualification' && (
            <>
              {/* Qualification Checklist Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5 relative transition-all duration-200">
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 select-none">
                    <ClipboardCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-sm font-bold text-slate-808 dark:text-slate-200">Qualification Checklist</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{lead.checklist?.progress || 0}% Complete</span>
                </div>

                {savingChecklist && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center rounded-3xl z-10 animate-fade-in">
                    <div className="text-xs font-bold text-brand-600 dark:text-brand-400">Syncing milestones...</div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { field: 'budgetConfirmed', label: 'Budget Confirmed', desc: 'Active funding allocation is confirmed.' },
                    { field: 'decisionMakerIdentified', label: 'Decision Maker Identified', desc: 'Identified signing authority stakeholders.' },
                    { field: 'requirementsCollected', label: 'Requirements Collected', desc: 'Core scoping deliverables compiled.' },
                    { field: 'timelineConfirmed', label: 'Timeline Confirmed', desc: 'Milestones and start dates established.' },
                    { field: 'proposalSent', label: 'Proposal Sent', desc: 'Commercial proposal delivered for review.' }
                  ].map((item) => {
                    const isChecked = lead.checklist ? lead.checklist[item.field] : false;
                    return (
                      <div 
                        key={item.field}
                        onClick={() => handleChecklistChange(item.field, !isChecked)}
                        className={`flex items-start gap-3.5 p-3.5 border rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                          isChecked 
                            ? 'bg-brand-50/20 dark:bg-brand-950/10 border-brand-100/70 dark:border-brand-900/40 hover:bg-brand-50/40 dark:hover:bg-brand-950/20' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500 dark:focus:ring-brand-950 border-slate-350 dark:border-slate-700 mt-0.5 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-805 dark:text-slate-200">{item.label}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lead Parameter Breakdown Grid */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5 transition-all duration-200">
                <div className="border-b border-slate-50 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 select-none">
                    <Award className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-sm font-bold text-slate-808 dark:text-slate-202">Lead Score Breakdown</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/60 dark:border-slate-800 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Budget Score ({lead.budget})</span>
                      <span>{lead.score?.budgetScore || 0} / 30</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getScoreDetailBarColor(lead.score?.budgetScore || 0, 30)}`} style={{ width: `${((lead.score?.budgetScore || 0) / 30) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/60 dark:border-slate-800 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Project Size ({lead.projectSize})</span>
                      <span>{lead.score?.projectSizeScore || 0} / 30</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getScoreDetailBarColor(lead.score?.projectSizeScore || 0, 30)}`} style={{ width: `${((lead.score?.projectSizeScore || 0) / 30) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/60 dark:border-slate-800 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Urgency ({lead.urgency})</span>
                      <span>{lead.score?.urgencyScore || 0} / 20</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getScoreDetailBarColor(lead.score?.urgencyScore || 0, 20)}`} style={{ width: `${((lead.score?.urgencyScore || 0) / 20) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/60 dark:border-slate-800 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Industry Fit ({lead.industryFit})</span>
                      <span>{lead.score?.industryFitScore || 0} / 20</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getScoreDetailBarColor(lead.score?.industryFitScore || 0, 20)}`} style={{ width: `${((lead.score?.industryFitScore || 0) / 20) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status History Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 transition-all duration-200">
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
                  <History className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-bold text-slate-808 dark:text-slate-202">Pipeline Status Transition History</h3>
                </div>

                <div className="space-y-3">
                  {(!lead.statusHistory || lead.statusHistory.length === 0) ? (
                    <div className="text-center py-6 text-xs text-slate-455 italic">No status transitions logged on record.</div>
                  ) : (
                    lead.statusHistory.map((h) => (
                      <div key={h.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex justify-between items-center text-xs hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500 uppercase">{h.oldStatus ? h.oldStatus.replace('_', ' ') : 'Ingested'}</span>
                            <ChevronRight className="h-3 w-3 text-slate-405" />
                            <span className="font-black text-brand-600 dark:text-brand-400 uppercase">{h.newStatus.replace('_', ' ')}</span>
                          </div>
                          <div className="text-[10px] text-slate-450 dark:text-slate-550 font-bold">Updated by: {h.changedBy}</div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 dark:text-slate-500 font-bold select-none">
                          {new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                          {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Assignment History Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 transition-all duration-200">
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
                  <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-bold text-slate-808 dark:text-slate-202">Ownership Transfer History</h3>
                </div>

                <div className="space-y-3">
                  {(!lead.assignmentHistory || lead.assignmentHistory.length === 0) ? (
                    <div className="text-center py-6 text-xs text-slate-455 italic">No representative assignments logged.</div>
                  ) : (
                    lead.assignmentHistory.map((h) => (
                      <div key={h.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex justify-between items-center text-xs hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                        <div className="space-y-1">
                          <div className="font-black text-slate-705 dark:text-slate-205 font-bold">Assigned Representative: {h.assignedTo || 'Unassigned'}</div>
                          <div className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold leading-relaxed">Notes: {h.notes || 'Automatic round-robin assignment.'}</div>
                        </div>
                        <div className="text-right text-[10px] text-slate-450 dark:text-slate-500 font-bold select-none space-y-0.5">
                          <div>By {h.assignedBy}</div>
                          <div>{new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: TIMELINE & LOGS */}
          {activeTab === 'timeline' && (
            <>
              {/* Communication Logs Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5 transition-all duration-200">
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-sm font-bold text-slate-808 dark:text-slate-200">Communication Logs</h3>
                  </div>
                </div>

                {/* Form to log communication */}
                <form onSubmit={handleLogCommunication} className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3.5">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Log New Communication Log</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={commType}
                      onChange={(e) => setCommType(e.target.value)}
                      className="premium-input text-xs"
                    >
                      <option value="EMAIL">Email Message</option>
                      <option value="CALL">Phone Call</option>
                      <option value="MEETING">Video / Face-to-Face Meeting</option>
                      <option value="CHAT">Live Chat / LinkedIn Msg</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Subject line (e.g. Scoping Call Follow-up)"
                      value={commSubject}
                      onChange={(e) => setCommSubject(e.target.value)}
                      className="premium-input text-xs sm:col-span-2"
                    />
                  </div>

                  <textarea
                    placeholder="Enter discussion notes, takeaways, or email copy summary..."
                    value={commBody}
                    onChange={(e) => setCommBody(e.target.value)}
                    className="w-full h-20 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                  />

                  <button
                    type="submit"
                    disabled={loggingComm}
                    className="premium-btn-primary py-2 px-4 font-semibold text-xs ml-auto"
                  >
                    <span>{loggingComm ? 'Saving record...' : 'Commit Log Entry'}</span>
                  </button>
                </form>

                {/* Communication logs list */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {(!lead.communicationLogs || lead.communicationLogs.length === 0) ? (
                    <div className="text-center py-6 text-xs text-slate-400 italic">No communication logs recorded.</div>
                  ) : (
                    lead.communicationLogs.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2 hover:border-slate-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              c.type === 'CALL' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50' :
                              c.type === 'EMAIL' ? 'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/50' :
                              c.type === 'MEETING' ? 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/50' :
                              'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                            }`}>
                              {c.type}
                            </span>
                            <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200">{c.subject}</h4>
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{c.body}</p>
                        <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">Logged by {c.loggedBy}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Real Activity Timeline Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 transition-all duration-200">
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
                  <Activity className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-202">Real Activity Timeline</h3>
                </div>

                <div className="relative pl-6 border-l border-slate-100 dark:border-slate-800 space-y-6 py-2">
                  {(!lead.activityLogs || lead.activityLogs.length === 0) ? (
                    <div className="text-center py-6 text-xs text-slate-400 italic">No activity logged yet.</div>
                  ) : (
                    lead.activityLogs.map((log) => (
                      <div key={log.id} className="relative flex flex-col sm:flex-row justify-between items-start gap-2">
                        {/* Timeline Node Icon Circle */}
                        <div className="absolute -left-[35px] top-0 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 h-7 w-7 rounded-full flex items-center justify-center shadow-sm">
                          {getActivityIcon(log.action)}
                        </div>
                        
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-350">{log.description}</p>
                          <div className="text-[9px] text-slate-400 dark:text-slate-550 font-bold select-none">by {log.user?.name || 'System'}</div>
                        </div>
                        
                        <div className="text-[9px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100/30 dark:border-brand-900/40 rounded-full px-2 py-0.5 select-none self-start shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* The history tab has been migrated to Lead Qualification Center */}

          {/* TAB 4: DOCUMENTS SECTION */}
          {activeTab === 'documents' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5 transition-all duration-200">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-bold text-slate-808 dark:text-slate-202">Lead Documents & Proposal SOWs</h3>
                </div>
              </div>

              {/* Form to upload mock document */}
              <form onSubmit={handleAddDocument} className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3.5">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Attach Document / File Link</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Document Name (e.g. Scoping_Milestones)"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="premium-input text-xs sm:col-span-2"
                  />

                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="premium-input text-xs"
                  >
                    <option value="PDF">PDF File</option>
                    <option value="DOCX">Microsoft Word</option>
                    <option value="XLSX">Excel Sheet</option>
                    <option value="PPTX">PowerPoint PPT</option>
                  </select>

                  <select
                    value={docSize}
                    onChange={(e) => setDocSize(e.target.value)}
                    className="premium-input text-xs"
                  >
                    <option value="1.2 MB">1.2 MB</option>
                    <option value="2.4 MB">2.4 MB</option>
                    <option value="4.8 MB">4.8 MB</option>
                    <option value="12.5 MB">12.5 MB</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={addingDoc}
                  className="premium-btn-primary py-2 px-4 font-semibold text-xs ml-auto"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{addingDoc ? 'Attaching file...' : 'Attach File'}</span>
                </button>
              </form>

              {/* Documents list */}
              <div className="space-y-3.5">
                {(!lead.documents || lead.documents.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-400 italic">No files attached to this lead record.</div>
                ) : (
                  lead.documents.map((d) => (
                    <div key={d.id} className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-50 dark:bg-brand-950/30 border border-brand-100/50 dark:border-brand-900/40 rounded-xl">
                          <File className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-205">{d.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{d.fileType} • {d.fileSize} • Uploaded by {d.uploadedBy}</div>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-bold select-none">
                        {new Date(d.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: AI Panel & Reassignment */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sales Representative Assignment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4 transition-all duration-200">
            <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3 select-none">
              <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Sales Workspace</h3>
            </div>

            <div className="space-y-2">
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Assigned Representative</div>
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-9 w-9 bg-brand-100 dark:bg-brand-950/50 rounded-xl flex items-center justify-center font-bold text-brand-700 dark:text-brand-300 select-none">
                  {(lead.assignment?.assignedTo?.name || 'U').charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{lead.assignment?.assignedTo?.name || 'Unassigned'}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{lead.assignment?.assignedTo?.email || 'Awaiting sales rep assign...'}</div>
                </div>
              </div>
            </div>

            {lead.assignment?.notes && (
              <div className="text-[10px] font-semibold text-slate-505 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 p-3.5 border border-slate-100 dark:border-slate-800 rounded-2xl mt-2 leading-relaxed">
                <span className="font-bold text-slate-400 dark:text-slate-550 block mb-1">Assignment Log:</span>
                {lead.assignment.notes}
              </div>
            )}

            {currentUser?.role !== 'SALES_REP' && (
              <form onSubmit={handleReassign} className="border-t border-slate-50 dark:border-slate-850 pt-4 space-y-3.5">
                <div className="text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Manually Re-assign Representative</div>
                
                {reassignSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-1.5 animate-fade-in">
                    <Check className="h-5 w-5 shrink-0" />
                    <span>Lead reassigned successfully!</span>
                  </div>
                )}

                <select
                  value={selectedRep}
                  onChange={(e) => setSelectedRep(e.target.value)}
                  className="premium-input text-xs"
                >
                  <option value="">-- Remove Assignment (Unassign) --</option>
                  {salesReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name} ({rep.email})</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Reason for reassignment..."
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  className="premium-input text-xs py-2"
                />

                <button
                  type="submit"
                  disabled={reassigning}
                  className="w-full premium-btn-primary py-2 text-xs font-semibold cursor-pointer"
                >
                  {reassigning ? 'Updating assignment...' : 'Apply Re-assignment'}
                </button>
              </form>
            )}
          </div>

          {/* AI Lead Insights Panel (Always visible on details right column) */}
          {aiAdvice && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/90 dark:from-slate-900 dark:via-slate-950 dark:to-brand-950/20 border border-slate-805 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl text-white space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 select-none">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 dark:text-brand-400 animate-pulse" />
                  <h3 className="text-sm font-extrabold tracking-tight">AI Lead Insights</h3>
                </div>
                <span className="bg-brand-500/10 text-brand-300 dark:text-brand-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-brand-500/25 uppercase">
                  Real-time
                </span>
              </div>

              {/* Lead Summary */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lead Summary</div>
                <div className="relative pl-3.5 border-l-2 border-indigo-500/40 py-0.5">
                  <p className="text-[11px] text-slate-300 leading-normal italic font-medium">
                    "{aiAdvice.summary}"
                  </p>
                </div>
              </div>

              {/* Risk Score */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Risk Score Assessment</span>
                  <span className={
                    aiAdvice.riskScore <= 30 ? 'text-emerald-450' :
                    aiAdvice.riskScore <= 60 ? 'text-amber-400' : 'text-rose-455'
                  }>
                    {aiAdvice.riskScore} / 100 ({
                      aiAdvice.riskScore <= 30 ? 'Low Risk' :
                      aiAdvice.riskScore <= 60 ? 'Medium Risk' : 'High Risk'
                    })
                  </span>
                </div>
                <div className="h-2 bg-slate-800 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-700/30">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      aiAdvice.riskScore <= 30 ? 'bg-emerald-500' :
                      aiAdvice.riskScore <= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${aiAdvice.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Conversion Probability */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Conversion Probability</span>
                  <span className="text-indigo-400 dark:text-brand-400 font-extrabold">{aiAdvice.conversionProbability}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-800 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-700/30">
                    <div 
                      className="bg-indigo-500 dark:bg-brand-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${aiAdvice.conversionProbability}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-300">{aiAdvice.conversionProbability}%</span>
                </div>
              </div>

              {/* Recommended Follow-up */}
              <div className="space-y-1.5 bg-slate-800/40 dark:bg-slate-900/40 p-3.5 border border-slate-800 rounded-2xl">
                <div className="text-[9px] font-bold text-indigo-400 dark:text-brand-400 uppercase tracking-widest">Recommended Follow-up</div>
                <p className="text-[11px] text-slate-200 dark:text-slate-305 leading-relaxed font-semibold">
                  {aiAdvice.recommendedFollowUp}
                </p>
              </div>

              {/* Next Action */}
              <div className="space-y-1.5 bg-indigo-500/10 dark:bg-brand-500/5 p-3.5 border border-indigo-500/20 dark:border-brand-500/10 rounded-2xl">
                <div className="text-[9px] font-bold text-indigo-300 dark:text-brand-400 uppercase tracking-widest">Next Action</div>
                <p className="text-xs text-indigo-200 dark:text-slate-200 leading-normal font-bold">
                  {aiAdvice.nextAction}
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
