import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Database, ShieldCheck, RefreshCw, Key, Link2, Info, CheckCircle2, ChevronRight, Server } from 'lucide-react';

export default function DatabaseSchema() {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState('Lead');

  useEffect(() => {
    fetchDbStats();
  }, []);

  const fetchDbStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/db-schema-stats');
      setCounts(response.data.counts);
    } catch (err) {
      console.error('Error fetching database stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const schemaInfo = {
    User: {
      name: 'User',
      color: 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/10 text-rose-500',
      description: 'System accounts authorized to access the CRM (Administrators, Sales Reps, PMs, and Tech Leads).',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', description: 'Primary unique identifier for each user.' },
        { name: 'name', type: 'String', key: '', description: 'Full name of the system user.' },
        { name: 'email', type: 'String (Unique)', key: 'UK', description: 'Corporate email address (used for credentials).' },
        { name: 'password', type: 'String (Hash)', key: '', description: 'Bcrypt-hashed credential payload.' },
        { name: 'role', type: 'Enum', key: '', description: 'ADMIN, SALES_REP, PROJECT_MANAGER, or TECH_LEAD.' },
        { name: 'createdAt', type: 'DateTime', key: '', description: 'Timestamp when the user account was registered.' },
        { name: 'updatedAt', type: 'DateTime', key: '', description: 'Auto-updated change timestamp.' }
      ],
      relations: [
        { type: 'One-to-Many', target: 'Assignment', description: 'User manages multiple active lead assignments.' },
        { type: 'One-to-Many', target: 'Notification', description: 'User receives multiple notification alerts.' },
        { type: 'One-to-Many', target: 'ActivityLog', description: 'User performs multiple activity events.' }
      ]
    },
    Lead: {
      name: 'Lead',
      color: 'border-brand-500 bg-brand-50/10 dark:bg-brand-950/10 text-brand-500',
      description: 'The core commercial entity. Tracks prospects, contact information, metadata parameters, and sales stages.',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', description: 'Primary unique identifier for each lead record.' },
        { name: 'name', type: 'String', key: '', description: 'Lead contact name.' },
        { name: 'companyName', type: 'String', key: '', description: 'Name of prospect corporate organization.' },
        { name: 'email', type: 'String', key: '', description: 'Direct contact email address.' },
        { name: 'phone', type: 'String', key: '', description: 'Contact phone line.' },
        { name: 'industry', type: 'String', key: '', description: 'Corporate industry vertical (e.g. Healthcare).' },
        { name: 'budget', type: 'Enum (LOW/MED/HIGH)', key: '', description: 'Qualifying budget tier.' },
        { name: 'projectSize', type: 'Enum (SM/MED/LG)', key: '', description: 'Estimated project scale.' },
        { name: 'urgency', type: 'Enum (LOW/MED/HIGH)', key: '', description: 'Implementation timeframe urgency level.' },
        { name: 'source', type: 'Enum (WEB/LNK/REF)', key: '', description: 'Lead generation inbound channel.' },
        { name: 'status', type: 'Enum (NEW...LOST)', key: '', description: 'NEW, QUALIFIED, CONTACTED, PROPOSAL_SENT, NEGOTIATION, WON, LOST.' },
        { name: 'industryFit', type: 'Enum', key: '', description: 'POOR, GOOD, or EXCELLENT.' },
        { name: 'notes', type: 'Text (Optional)', key: '', description: 'Free-form text documentation.' },
        { name: 'createdAt', type: 'DateTime', key: '', description: 'Database creation timestamp.' }
      ],
      relations: [
        { type: 'One-to-One', target: 'LeadScore', description: 'Lead contains exactly one parsed qualification score.' },
        { type: 'One-to-One', target: 'Assignment', description: 'Lead maps to one owner routing record.' },
        { type: 'One-to-One', target: 'Checklist', description: 'Lead maps to one qualification status checklist.' },
        { type: 'One-to-Many', target: 'ActivityLog', description: 'Lead generates multiple timeline logs.' },
        { type: 'One-to-Many', target: 'StatusHistory', description: 'Lead records multiple stage transitions.' },
        { type: 'One-to-Many', target: 'AssignmentHistory', description: 'Lead logs owner transfer histories.' },
        { type: 'One-to-Many', target: 'Document', description: 'Lead links to multiple uploaded files.' },
        { type: 'One-to-Many', target: 'CommunicationLog', description: 'Lead tracks multiple communications.' }
      ]
    },
    LeadScore: {
      name: 'LeadScore',
      color: 'border-amber-500 bg-amber-50/10 dark:bg-amber-950/10 text-amber-500',
      description: 'Compiled scoring indices generated by the mathematical engine.',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', description: 'Primary unique key.' },
        { name: 'leadId', type: 'UUID', key: 'FK', description: 'Foreign key referencing Lead.id (Unique).' },
        { name: 'score', type: 'Integer', key: '', description: 'Aggregated numeric score (0 to 100).' },
        { name: 'temperature', type: 'Enum', key: '', description: 'COLD, WARM, or HOT.' },
        { name: 'budgetScore', type: 'Integer', key: '', description: 'Scored budget weight.' },
        { name: 'projectSizeScore', type: 'Integer', key: '', description: 'Scored scope weight.' },
        { name: 'urgencyScore', type: 'Integer', key: '', description: 'Scored urgency weight.' },
        { name: 'industryFitScore', type: 'Integer', key: '', description: 'Scored alignment weight.' }
      ],
      relations: [
        { type: 'One-to-One (Inverse)', target: 'Lead', description: 'Refers back to owning Lead.' }
      ]
    },
    Assignment: {
      name: 'Assignment',
      color: 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 text-indigo-500',
      description: 'Routes leads to sales representatives, enabling row-level access control permissions.',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', description: 'Primary unique key.' },
        { name: 'leadId', type: 'UUID', key: 'FK', description: 'Foreign key referencing Lead.id (Unique).' },
        { name: 'assignedToId', type: 'UUID', key: 'FK', description: 'Foreign key referencing User.id (Nullable).' },
        { name: 'assignedDate', type: 'DateTime', key: '', description: 'Timestamp when owner was assigned.' },
        { name: 'notes', type: 'Text (Optional)', key: '', description: 'Context description regarding routing.' }
      ],
      relations: [
        { type: 'Many-to-One', target: 'User', description: 'Resolves to assigned User representative.' },
        { type: 'One-to-One (Inverse)', target: 'Lead', description: 'Refers back to owning Lead.' }
      ]
    },
    Checklist: {
      name: 'Checklist',
      color: 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10 text-emerald-500',
      description: 'Tracks verification checklist criteria and maps progress values.',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', description: 'Primary unique key.' },
        { name: 'leadId', type: 'UUID', key: 'FK', description: 'Foreign key referencing Lead.id (Unique).' },
        { name: 'budgetConfirmed', type: 'Boolean', key: '', description: 'Checklist task: Budget Confirmed.' },
        { name: 'decisionMakerIdentified', type: 'Boolean', key: '', description: 'Checklist task: Decision Maker Identified.' },
        { name: 'timelineConfirmed', type: 'Boolean', key: '', description: 'Checklist task: Timeline Confirmed.' },
        { name: 'requirementsCollected', type: 'Boolean', key: '', description: 'Checklist task: Requirements Collected.' },
        { name: 'proposalSent', type: 'Boolean', key: '', description: 'Checklist task: Proposal Sent.' },
        { name: 'progress', type: 'Integer', key: '', description: 'Aggregated progress index (0, 20, 40, 60, 80, 100).' }
      ],
      relations: [
        { type: 'One-to-One (Inverse)', target: 'Lead', description: 'Refers back to owning Lead.' }
      ]
    },
    Notification: {
      name: 'Notification',
      color: 'border-violet-500 bg-violet-50/10 dark:bg-violet-950/10 text-violet-500',
      description: 'Context alerts generated for specific users regarding assignments, stages, and checklist updates.',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', description: 'Primary unique key.' },
        { name: 'userId', type: 'UUID', key: 'FK', description: 'Foreign key referencing User.id.' },
        { name: 'title', type: 'String', key: '', description: 'Alert title message.' },
        { name: 'message', type: 'String', key: '', description: 'Alert description content.' },
        { name: 'isRead', type: 'Boolean', key: '', description: 'Tracks read/unread status.' },
        { name: 'type', type: 'String', key: '', description: 'Category (NEW_LEAD, LEAD_ASSIGNED, etc.).' }
      ],
      relations: [
        { type: 'Many-to-One', target: 'User', description: 'Refers to target recipient User.' }
      ]
    },
    ActivityLog: {
      name: 'ActivityLog',
      color: 'border-cyan-500 bg-cyan-50/10 dark:bg-cyan-950/10 text-cyan-500',
      description: 'Audit logs tracking actions triggered on a lead for qualification trails.',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', description: 'Primary unique key.' },
        { name: 'leadId', type: 'UUID', key: 'FK', description: 'Foreign key referencing Lead.id.' },
        { name: 'userId', type: 'UUID', key: 'FK', description: 'Foreign key referencing User.id (Nullable).' },
        { name: 'action', type: 'String', key: '', description: 'Action type identifier (e.g. LEAD_CREATED).' },
        { name: 'description', type: 'String', key: '', description: 'Text details describing the audit event.' },
        { name: 'createdAt', type: 'DateTime', key: '', description: 'Action timestamp.' }
      ],
      relations: [
        { type: 'Many-to-One', target: 'Lead', description: 'Refers to parent Lead.' },
        { type: 'Many-to-One', target: 'User', description: 'Resolves to actor User (if triggered by a logged-in user).' }
      ]
    },
    Report: {
      name: 'Report',
      color: 'border-teal-500 bg-teal-50/10 dark:bg-teal-950/10 text-teal-500',
      description: 'Tracks exported report templates and metrics logs created by system users.',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', description: 'Primary unique key.' },
        { name: 'name', type: 'String', key: '', description: 'Report name.' },
        { name: 'type', type: 'String', key: '', description: 'Category (LEAD_PERFORMANCE, etc.).' },
        { name: 'createdById', type: 'UUID', key: 'FK', description: 'Foreign key referencing User.id.' },
        { name: 'filePath', type: 'String', key: '', description: 'Path to export cache.' }
      ],
      relations: [
        { type: 'Many-to-One', target: 'User', description: 'Resolves to creator User.' }
      ]
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Database className="h-8 w-8 text-brand-500" />
            <span>Database Architecture & ER Schema</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Explore active tables, constraints, entity relations, and live row counts synced directly from the database.
          </p>
        </div>
        <button
          onClick={fetchDbStats}
          disabled={loading}
          className="premium-btn-secondary py-2 px-3.5 text-xs font-semibold cursor-pointer disabled:opacity-55"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Row Counts</span>
        </button>
      </div>

      {/* LIVE ROW COUNTS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5 select-none">
        {[
          { key: 'users', name: 'Users', color: 'border-rose-500 text-rose-500', dbTable: 'User' },
          { key: 'leads', name: 'Leads', color: 'border-brand-500 text-brand-500', dbTable: 'Lead' },
          { key: 'leadScores', name: 'LeadScores', color: 'border-amber-500 text-amber-500', dbTable: 'LeadScore' },
          { key: 'assignments', name: 'Assignments', color: 'border-indigo-500 text-indigo-500', dbTable: 'Assignment' },
          { key: 'checklists', name: 'Checklists', color: 'border-emerald-500 text-emerald-500', dbTable: 'Checklist' },
          { key: 'notifications', name: 'Notifications', color: 'border-violet-500 text-violet-500', dbTable: 'Notification' },
          { key: 'activities', name: 'ActivityLogs', color: 'border-cyan-500 text-cyan-500', dbTable: 'ActivityLog' },
          { key: 'reports', name: 'Reports', color: 'border-teal-500 text-teal-500', dbTable: 'Report' }
        ].map((item) => {
          const isActive = activeTable === item.dbTable;
          return (
            <div
              key={item.key}
              onClick={() => setActiveTable(item.dbTable)}
              className={`p-3 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer transition-all hover:scale-[1.03] flex flex-col justify-between shadow-sm min-h-[92px] ${
                isActive 
                  ? 'border-slate-800 dark:border-white ring-2 ring-slate-100 dark:ring-slate-800' 
                  : 'border-slate-100 dark:border-slate-800/80'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.name}</div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {loading ? (
                    <span className="inline-block w-4 h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  ) : (
                    counts?.[item.key] ?? 0
                  )}
                </span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border ${item.color}`}>
                  Table
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ER DIAGRAM VISUAL CANVAS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm overflow-hidden space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Visual Entity-Relationship Model</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Crow's foot relationship mapping. Click on any table node to explore its schema variables.</p>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250 dark:border-emerald-900/60 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5">
            <Server className="h-3 w-3" />
            <span>SQLite Active Engine</span>
          </span>
        </div>

        {/* SVG INTERACTIVE WORKSPACE */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <svg 
            width="1020" 
            height="500" 
            viewBox="0 0 1020 500" 
            className="mx-auto select-none overflow-visible"
          >
            {/* DEF MARKERS FOR RELATIONSHIP CONNECTORS */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
              <marker id="crowsfoot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 M 8 2 L 8 8" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              </marker>
              <marker id="one" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 4 2 L 4 8 M 6 2 L 6 8" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              </marker>
            </defs>

            {/* RELATIONSHIP CONNECTOR PATHS */}
            {/* User -> Assignment */}
            <path d="M 180 180 L 180 270" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-805" markerStart="url(#one)" markerEnd="url(#crowsfoot)" />
            {/* User -> Notification */}
            <path d="M 110 130 H 40 V 420 H 110" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-805" markerStart="url(#one)" markerEnd="url(#crowsfoot)" />
            {/* User -> Report */}
            <path d="M 180 80 V 30 H 830 V 80" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-805" markerStart="url(#one)" markerEnd="url(#crowsfoot)" />
            
            {/* Lead -> LeadScore */}
            <path d="M 510 185 H 660" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-805" markerStart="url(#one)" markerEnd="url(#one)" />
            {/* Lead -> Assignment */}
            <path d="M 410 130 H 250" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-805" markerStart="url(#one)" markerEnd="url(#one)" />
            {/* Lead -> Checklist */}
            <path d="M 510 100 H 660" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-805" markerStart="url(#one)" markerEnd="url(#one)" />
            
            {/* Lead -> ActivityLog */}
            <path d="M 460 185 V 360" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-805" markerStart="url(#one)" markerEnd="url(#crowsfoot)" />

            {/* User -> ActivityLog (actor link) */}
            <path d="M 180 370 H 390" fill="none" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" className="dark:stroke-slate-800" markerEnd="url(#crowsfoot)" />


            {/* TABLE BLOCKS */}
            {/* 1. USER TABLE */}
            <g 
              onClick={() => setActiveTable('User')} 
              className={`cursor-pointer transition-all duration-200 group ${activeTable === 'User' ? 'filter drop-shadow-md' : ''}`}
            >
              <rect x="110" y="80" width="140" height="100" rx="10" fill="var(--svg-card-bg, #ffffff)" stroke={activeTable === 'User' ? '#f43f5e' : '#e2e8f0'} strokeWidth={activeTable === 'User' ? '2.5' : '1.5'} className="dark:fill-slate-900 dark:stroke-slate-800" />
              <rect x="110" y="80" width="140" height="28" rx="10" fill="#f43f5e" fillOpacity="0.1" />
              <text x="120" y="99" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="Outfit">User (Users)</text>
              <text x="120" y="125" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔑 id: UUID [PK]</text>
              <text x="120" y="140" fill="#64748b" fontSize="9" fontFamily="sans-serif">👤 name: String</text>
              <text x="120" y="155" fill="#64748b" fontSize="9" fontFamily="sans-serif">📧 email: String [UK]</text>
              <text x="120" y="170" fill="#64748b" fontSize="9" fontFamily="sans-serif">🛡️ role: Enum</text>
            </g>

            {/* 2. LEAD TABLE */}
            <g 
              onClick={() => setActiveTable('Lead')} 
              className={`cursor-pointer transition-all duration-200 group ${activeTable === 'Lead' ? 'filter drop-shadow-md' : ''}`}
            >
              <rect x="410" y="70" width="150" height="115" rx="10" fill="var(--svg-card-bg, #ffffff)" stroke={activeTable === 'Lead' ? '#3b82f6' : '#e2e8f0'} strokeWidth={activeTable === 'Lead' ? '2.5' : '1.5'} className="dark:fill-slate-900 dark:stroke-slate-800" />
              <rect x="410" y="70" width="150" height="28" rx="10" fill="#3b82f6" fillOpacity="0.1" />
              <text x="420" y="88" fill="#3b82f6" fontSize="11" fontWeight="bold" fontFamily="Outfit">Lead (Leads)</text>
              <text x="420" y="113" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔑 id: UUID [PK]</text>
              <text x="420" y="126" fill="#64748b" fontSize="9" fontFamily="sans-serif">🏢 companyName: String</text>
              <text x="420" y="139" fill="#64748b" fontSize="9" fontFamily="sans-serif">📈 budget: Enum</text>
              <text x="420" y="152" fill="#64748b" fontSize="9" fontFamily="sans-serif">🏷️ status: Enum</text>
              <text x="420" y="165" fill="#64748b" fontSize="9" fontFamily="sans-serif">📅 createdAt: DateTime</text>
            </g>

            {/* 3. LEAD SCORE TABLE */}
            <g 
              onClick={() => setActiveTable('LeadScore')} 
              className={`cursor-pointer transition-all duration-200 group ${activeTable === 'LeadScore' ? 'filter drop-shadow-md' : ''}`}
            >
              <rect x="660" y="155" width="150" height="100" rx="10" fill="var(--svg-card-bg, #ffffff)" stroke={activeTable === 'LeadScore' ? '#f59e0b' : '#e2e8f0'} strokeWidth={activeTable === 'LeadScore' ? '2.5' : '1.5'} className="dark:fill-slate-900 dark:stroke-slate-800" />
              <rect x="660" y="155" width="150" height="28" rx="10" fill="#f59e0b" fillOpacity="0.1" />
              <text x="670" y="174" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="Outfit">LeadScore (LeadScores)</text>
              <text x="670" y="200" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔑 id: UUID [PK]</text>
              <text x="670" y="215" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔗 leadId: UUID [FK, UK]</text>
              <text x="670" y="230" fill="#64748b" fontSize="9" fontFamily="sans-serif">🎯 score: Integer</text>
              <text x="670" y="245" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔥 temperature: String</text>
            </g>

            {/* 4. ASSIGNMENT TABLE */}
            <g 
              onClick={() => setActiveTable('Assignment')} 
              className={`cursor-pointer transition-all duration-200 group ${activeTable === 'Assignment' ? 'filter drop-shadow-md' : ''}`}
            >
              <rect x="110" y="270" width="140" height="100" rx="10" fill="var(--svg-card-bg, #ffffff)" stroke={activeTable === 'Assignment' ? '#6366f1' : '#e2e8f0'} strokeWidth={activeTable === 'Assignment' ? '2.5' : '1.5'} className="dark:fill-slate-900 dark:stroke-slate-800" />
              <rect x="110" y="270" width="140" height="28" rx="10" fill="#6366f1" fillOpacity="0.1" />
              <text x="120" y="289" fill="#6366f1" fontSize="11" fontWeight="bold" fontFamily="Outfit">Assignment (Assignments)</text>
              <text x="120" y="315" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔑 id: UUID [PK]</text>
              <text x="120" y="330" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔗 leadId: UUID [FK, UK]</text>
              <text x="120" y="345" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔗 assignedToId: UUID [FK]</text>
              <text x="120" y="360" fill="#64748b" fontSize="9" fontFamily="sans-serif">📅 assignedDate: DateTime</text>
            </g>

            {/* 5. CHECKLIST TABLE */}
            <g 
              onClick={() => setActiveTable('Checklist')} 
              className={`cursor-pointer transition-all duration-200 group ${activeTable === 'Checklist' ? 'filter drop-shadow-md' : ''}`}
            >
              <rect x="660" y="40" width="150" height="100" rx="10" fill="var(--svg-card-bg, #ffffff)" stroke={activeTable === 'Checklist' ? '#10b981' : '#e2e8f0'} strokeWidth={activeTable === 'Checklist' ? '2.5' : '1.5'} className="dark:fill-slate-900 dark:stroke-slate-800" />
              <rect x="660" y="40" width="150" height="28" rx="10" fill="#10b981" fillOpacity="0.1" />
              <text x="670" y="59" fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="Outfit">Checklist (Checklists)</text>
              <text x="670" y="85" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔑 id: UUID [PK]</text>
              <text x="670" y="100" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔗 leadId: UUID [FK, UK]</text>
              <text x="670" y="115" fill="#64748b" fontSize="9" fontFamily="sans-serif">☑️ progress: Integer (0-100)</text>
              <text x="670" y="130" fill="#64748b" fontSize="9" fontFamily="sans-serif">⚙️ timelineConfirmed: Bool</text>
            </g>

            {/* 6. NOTIFICATION TABLE */}
            <g 
              onClick={() => setActiveTable('Notification')} 
              className={`cursor-pointer transition-all duration-200 group ${activeTable === 'Notification' ? 'filter drop-shadow-md' : ''}`}
            >
              <rect x="110" y="400" width="140" height="85" rx="10" fill="var(--svg-card-bg, #ffffff)" stroke={activeTable === 'Notification' ? '#8b5cf6' : '#e2e8f0'} strokeWidth={activeTable === 'Notification' ? '2.5' : '1.5'} className="dark:fill-slate-900 dark:stroke-slate-800" />
              <rect x="110" y="400" width="140" height="28" rx="10" fill="#8b5cf6" fillOpacity="0.1" />
              <text x="120" y="419" fill="#8b5cf6" fontSize="11" fontWeight="bold" fontFamily="Outfit">Notification (Notif)</text>
              <text x="120" y="445" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔑 id: UUID [PK]</text>
              <text x="120" y="460" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔗 userId: UUID [FK]</text>
              <text x="120" y="475" fill="#64748b" fontSize="9" fontFamily="sans-serif">📖 isRead: Boolean</text>
            </g>

            {/* 7. ACTIVITY LOG TABLE */}
            <g 
              onClick={() => setActiveTable('ActivityLog')} 
              className={`cursor-pointer transition-all duration-200 group ${activeTable === 'ActivityLog' ? 'filter drop-shadow-md' : ''}`}
            >
              <rect x="390" y="360" width="150" height="100" rx="10" fill="var(--svg-card-bg, #ffffff)" stroke={activeTable === 'ActivityLog' ? '#06b6d4' : '#e2e8f0'} strokeWidth={activeTable === 'ActivityLog' ? '2.5' : '1.5'} className="dark:fill-slate-900 dark:stroke-slate-800" />
              <rect x="390" y="360" width="150" height="28" rx="10" fill="#06b6d4" fillOpacity="0.1" />
              <text x="400" y="379" fill="#06b6d4" fontSize="11" fontWeight="bold" fontFamily="Outfit">ActivityLog (Activities)</text>
              <text x="400" y="405" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔑 id: UUID [PK]</text>
              <text x="400" y="420" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔗 leadId: UUID [FK]</text>
              <text x="400" y="435" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔗 userId: UUID [FK, Null]</text>
              <text x="400" y="450" fill="#64748b" fontSize="9" fontFamily="sans-serif">📝 action: String</text>
            </g>

            {/* 8. REPORT TABLE */}
            <g 
              onClick={() => setActiveTable('Report')} 
              className={`cursor-pointer transition-all duration-200 group ${activeTable === 'Report' ? 'filter drop-shadow-md' : ''}`}
            >
              <rect x="830" y="80" width="140" height="100" rx="10" fill="var(--svg-card-bg, #ffffff)" stroke={activeTable === 'Report' ? '#14b8a6' : '#e2e8f0'} strokeWidth={activeTable === 'Report' ? '2.5' : '1.5'} className="dark:fill-slate-900 dark:stroke-slate-800" />
              <rect x="830" y="80" width="140" height="28" rx="10" fill="#14b8a6" fillOpacity="0.1" />
              <text x="840" y="99" fill="#14b8a6" fontSize="11" fontWeight="bold" fontFamily="Outfit">Report (Reports)</text>
              <text x="840" y="125" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔑 id: UUID [PK]</text>
              <text x="840" y="140" fill="#64748b" fontSize="9" fontFamily="sans-serif">📁 name: String</text>
              <text x="840" y="155" fill="#64748b" fontSize="9" fontFamily="sans-serif">🔗 createdById: UUID [FK]</text>
              <text x="840" y="170" fill="#64748b" fontSize="9" fontFamily="sans-serif">💾 filePath: String</text>
            </g>
          </svg>
        </div>
      </div>

      {/* DETAIL EXPLORER SHEET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Selector Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3 select-none">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Active Entity Registry</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Select a model to view field descriptions and relational constraints.</p>
          <div className="space-y-1.5">
            {Object.keys(schemaInfo).map((key) => {
              const info = schemaInfo[key];
              const isSelected = activeTable === key;
              return (
                <div
                  key={key}
                  onClick={() => setActiveTable(key)}
                  className={`px-4 py-3 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                    isSelected 
                      ? 'bg-slate-900 text-white dark:bg-slate-850' 
                      : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full border-2 ${info.color.split(' ')[0]}`} />
                    <span className="text-xs font-bold">{info.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-55" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Schema Attributes Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
          {/* Header */}
          <div className="border-b border-slate-50 dark:border-slate-850 pb-3 flex justify-between items-start gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                Prisma Schema: <span className="text-brand-500">{schemaInfo[activeTable].name}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                {schemaInfo[activeTable].description}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 border border-slate-200 dark:border-slate-700/60 rounded px-2 py-0.5 select-none shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Entity Verified</span>
            </div>
          </div>

          {/* Fields list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">Table Columns</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase select-none">
                    <th className="py-2 px-1">Column Name</th>
                    <th className="py-2 px-1">Type</th>
                    <th className="py-2 px-1 text-center">Constraint</th>
                    <th className="py-2 px-1">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {schemaInfo[activeTable].fields.map((f) => (
                    <tr key={f.name} className="hover:bg-slate-50/20 dark:hover:bg-slate-850/20">
                      <td className="py-3 px-1 font-bold text-slate-800 dark:text-slate-205">{f.name}</td>
                      <td className="py-3 px-1 font-mono text-[10px] text-slate-400">{f.type}</td>
                      <td className="py-3 px-1 text-center">
                        {f.key && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${
                            f.key === 'PK' 
                              ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40' 
                              : 'bg-indigo-50 text-indigo-650 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40'
                          }`}>
                            {f.key}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-1 text-slate-500 leading-normal">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relations list */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">Schema Relationships</h4>
            <div className="space-y-2">
              {schemaInfo[activeTable].relations.map((r) => (
                <div key={r.target} className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-350">{schemaInfo[activeTable].name}</span>
                    <span className="text-slate-300 dark:text-slate-700">➔</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{r.target}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="font-extrabold text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded mr-2 select-none">
                      {r.type}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">{r.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
