import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, User, Calendar, CheckCircle2, 
  HelpCircle, Archive, AlertCircle, FileCode, 
  ListTodo, Cpu, Terminal, Copy, Check, Download, Landmark
} from 'lucide-react';
import { Application } from '../types';

interface DetailsViewProps {
  applicationId: string;
  onBack: () => void;
  onEdit: (app: Application) => void;
}

type TabType = 'overview' | 'yaml' | 'metrics' | 'blueprints';

export default function DetailsView({ applicationId, onBack, onEdit }: DetailsViewProps) {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copiedCode, setCopiedCode] = useState(false);

  // States for Enhancement 2: Editable Markdown Notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Synchronize draft when record loads
  useEffect(() => {
    if (app) {
      setNotesDraft(app.notes || '');
    }
  }, [app]);

  // Handler to persist observations
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notesDraft,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save notes (HTTP ${res.status})`);
      }

      const updatedApp = await res.json();
      setApp(updatedApp);
      setIsEditingNotes(false);
    } catch (e: any) {
      setNotesError(e.message || 'Unable to save notes updates.');
    } finally {
      setSavingNotes(false);
    }
  };

  // Safe standard internal bold/italic Markdown parser
  const parseBoldText = (str: string) => {
    const parts = str.split(/\*\*(.*?)\*\*/g);
    if (parts.length === 1) return str;
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-slate-900">{part}</strong>;
      }
      return part;
    });
  };

  // Safe internal structured Markdown lines block generator
  const renderMarkdown = (text: string) => {
    if (!text || text.trim() === '') {
      return (
        <p className="text-slate-400 italic text-xs leading-relaxed">
          No discovery or analysis notes have been captured yet. Click "Edit Notes" to record system owners questions, workflow rules, or metric assumptions.
        </p>
      );
    }
    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 text-sm text-slate-600 leading-relaxed font-normal" id="rendered-markdown-content">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h5 key={idx} className="font-sans font-extrabold text-xs text-slate-800 uppercase tracking-wider pt-2 border-b border-slate-100 pb-1" id={`md-h3-${idx}`}>
                {line.replace('### ', '')}
              </h5>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h4 key={idx} className="font-sans font-black text-sm text-slate-900 pt-3" id={`md-h2-${idx}`}>
                {line.replace('## ', '')}
              </h4>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h3 key={idx} className="font-sans font-black text-base text-slate-950 pt-4" id={`md-h1-${idx}`}>
                {line.replace('# ', '')}
              </h3>
            );
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            const content = line.substring(2);
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2" id={`md-bullet-${idx}`}>
                <span className="text-indigo-500 font-bold shrink-0">•</span>
                <span className="text-slate-600">{parseBoldText(content)}</span>
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1.5" id={`md-empty-${idx}`}></div>;
          }
          return (
            <p key={idx} className="text-slate-600 font-normal leading-relaxed" id={`md-p-${idx}`}>
              {parseBoldText(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Fetch individual record
  useEffect(() => {
    async function loadApp() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/applications/${applicationId}`);
        if (!res.ok) {
          throw new Error(`Failed to load application (HTTP ${res.status})`);
        }
        const data = await res.json();
        setApp(data);
      } catch (e: any) {
        setErr(e.message || 'Unable to retrieve application metadata.');
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [applicationId]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3" id="details-loader">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Querying application intelligence index...</p>
      </div>
    );
  }

  if (err || !app) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl max-w-2xl mx-auto my-12 text-center space-y-4" id="details-error">
        <div className="p-3 bg-rose-100 rounded-full inline-block text-rose-600">
          <AlertCircle size={28} />
        </div>
        <div>
          <h4 className="font-bold text-lg text-slate-900">Retrieval Failure</h4>
          <p className="text-slate-600 text-sm mt-1">{err || 'Application record was not found.'}</p>
        </div>
        <button
          onClick={onBack}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
        >
          Return to Applications List
        </button>
      </div>
    );
  }

  // Sample static YAML schema representing how Phase 2 standard YAML package will look like.
  // This helps guide the user and visualizes Phase 2 value while showing the requested text correctly.
  const sampleYaml = `---
application:
  id: "${app.id}"
  name: "${app.name}"
  owner: "${app.owner}"
  status: "${app.status}"
  created_at: "${app.created_at}"

entities:
  - name: "Customer"
    description: "Represents a business customer record in CRM"
    table: "crm_customers"
    columns:
      - name: "id"
        datatype: "SERIAL"
        description: "Primary key identifier"
      - name: "email"
        datatype: "VARCHAR(255)"
        description: "Unique email address"

workflows:
  - name: "Onboarding flow"
    description: "Triggers validation tasks upon new registration"

business_rules:
  - id: "RULE-01"
    description: "Active status accounts must possess a minimum of one valid CRM email address."`;

  const sampleBlueprintMarkdown = `# Metric Blueprint: Ticket Resolution Average

## 1. Specification Meta
- **Metric Name**: Ticket Resolution Average
- **Business Purpose**: Monitor mean operational speed to evaluate client service department key performance indicators.
- **Source Application**: ${app.name}

## 2. Infrastructure Schemas
- **Source Tables**: \`service_desk_tickets\`
- **Source Columns**: \`created_at\`, \`resolved_at\`, \`ticket_status\`, \`priority\`

## 3. Formulas & Parameters
- **Formula**: \`SUM(resolved_at - created_at) / COUNT(tickets)\`
- **Filters**: \`ticket_status = 'Resolved' AND created_at >= CURRENT_DATE - INTERVAL '30 days'\`

## 4. Visual Layout Recommendation
- **Visualization**: Bar chart with daily timeline granularity and color alerts for critical standard priority buckets.

---
*Generated via AIR Blueprint Engine (Future Phase 5 Release)*`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-8 py-6 text-left" id="details-view-layout">
      {/* Top Breadcrumb Nav Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 gap-4" id="details-breadcrumb-row">
        <button
          id="btn-details-back"
          onClick={onBack}
          className="group text-slate-500 hover:text-slate-800 flex items-center space-x-2 text-sm font-semibold transition-all cursor-pointer self-start"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Registry</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <button
            id="btn-details-edit"
            onClick={() => onEdit(app)}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Edit3 size={14} />
            <span>Edit Information</span>
          </button>
        </div>
      </div>

      {/* Main Metadata Overview Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden text-left" id="details-banner">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
          <Landmark size={240} className="translate-y-8 translate-x-8" />
        </div>
        <div className="space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-sans font-black text-2xl md:text-3xl tracking-tight text-white leading-tight">
              {app.name}
            </h2>
            {app.status === 'Active' && (
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold font-sans text-xs px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Active</span>
              </span>
            )}
            {app.status === 'Draft' && (
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold font-sans text-xs px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Draft</span>
              </span>
            )}
            {app.status === 'Archived' && (
              <span className="bg-slate-500/20 border border-slate-500/30 text-slate-400 font-semibold font-sans text-xs px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>Archived</span>
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
            {app.description}
          </p>
        </div>

        {/* Dynamic ID and Audit Box */}
        <div className="bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl space-y-2.5 text-xs font-mono shrink-0 w-full md:w-auto text-left" id="details-audit-card">
          <div className="flex items-center space-x-2 text-slate-400">
            <Cpu size={12} className="text-indigo-400" />
            <span className="text-slate-400">INDEXED ID:</span>
            <span className="text-white hover:text-indigo-400 transition-colors select-all leading-none mt-0.5 font-bold">{app.id}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <User size={12} className="text-indigo-400" />
            <span className="text-slate-400">OWNER:</span>
            <span className="text-indigo-200 mt-0.5 font-normal">{app.owner || 'Unspecified'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Row for Phases */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2" id="details-tabs-row">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview Core (Phase 1)
        </button>
        <button
          onClick={() => setActiveTab('yaml')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'yaml'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode size={15} />
          <span>Application Package (Phase 2)</span>
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'metrics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListTodo size={15} />
          <span>Metrics Specifications (Phase 4)</span>
        </button>
        <button
          onClick={() => setActiveTab('blueprints')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'blueprints'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal size={15} />
          <span>Metric Blueprints (Phase 5)</span>
        </button>
      </div>

      {/* Grid containing Tab Contents */}
      <div className="pt-2 text-left" id="details-tab-contents-container">
        
        {/* Tab 1: Overview and Audit Log */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="overview-tab-grid">
            
            {/* Main Primary Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card A: Structure Objective (existing app.description) */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-500">Structure Objective</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {app.description}
                </p>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3 text-slate-600 text-sm mt-3">
                  <AlertCircle size={18} className="text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-indigo-900 block mb-0.5">Application Repository Foundation</span>
                    <span>This structured record maps your enterprise services cleanly. Select the appropriate tabs above to simulate schema package uploads, metrics definitions, and developer blueprints.</span>
                  </div>
                </div>
              </div>

              {/* Card B: Enhancement 2 - Discovery & Analysis Notes */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4" id="notes-section-container">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <ListTodo className="text-indigo-600 animate-pulse" size={18} />
                    <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900">Discovery &amp; Analysis Notes</h4>
                  </div>
                  {!isEditingNotes && (
                    <button
                      onClick={() => {
                        setNotesDraft(app.notes || '');
                        setIsEditingNotes(true);
                        setNotesError(null);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1.5 cursor-pointer"
                      id="btn-edit-notes"
                    >
                      <Edit3 size={12} />
                      <span>Edit Discovery Notes</span>
                    </button>
                  )}
                </div>

                {notesError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {notesError}
                  </div>
                )}

                {isEditingNotes ? (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">
                      Supports markdown formatting (# Headers, - Bullet lists, **Boldtext**)
                    </span>
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      className="w-full h-48 text-sm font-sans p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-slate-50/50"
                      placeholder="Add observations, owner feedback, or metrics assumptions..."
                      id="textarea-notes"
                    />
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                        id="btn-cancel-notes"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        id="btn-save-notes"
                      >
                        {savingNotes ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Discovery Notes</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl">
                    {renderMarkdown(app.notes || '')}
                  </div>
                )}
              </div>

              {/* Card C: Enhancement 5 - Application Detail Alignment Pipeline */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4" id="alignment-pipeline-container">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <Cpu className="text-indigo-600" size={18} />
                  <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900">Application Integration Alignment</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Our application registry acts as the core baseline for the downstream metrics hierarchy. Validate the progression path from simple indexing to complete developer specifications below:
                </p>
                
                <div className="relative pl-6 space-y-7 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200/80">
                  
                  {/* Step 1: Overview */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100 flex items-center justify-center"></span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-900">Application Overview</span>
                        <span className="text-[9px] font-mono font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded uppercase">Active Phase 1</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-normal">Registers primary ownership, discovery observations, and details index metadata.</p>
                    </div>
                  </div>

                  {/* Step 2: Package */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-slate-100 flex items-center justify-center"></span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-600">Application Package (YAML)</span>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">Phase 2 Target</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-normal">Standardizes schema definitions, business entities, and database tables structure.</p>
                    </div>
                  </div>

                  {/* Step 3: Knowledge Base */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-slate-100 flex items-center justify-center"></span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-600">Knowledge Base Map</span>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">Phase 3 Target</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-normal">Details the complete linked attributes relationship and organizational metadata catalog.</p>
                    </div>
                  </div>

                  {/* Step 4: Metrics */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-slate-100 flex items-center justify-center"></span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-600">Metrics Specifications</span>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">Phase 4 Target</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-normal">Maps calculations, formula syntax equations, SLA tracking, and business filters.</p>
                    </div>
                  </div>

                  {/* Step 5: Blueprints */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-slate-100 flex items-center justify-center"></span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-600">Metric Blueprints</span>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">Phase 5 Target</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-normal">Compiles implementation-ready markdown specs optimized for developers and code-agents.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card D: Enhancement 1 - Application Package Version Awareness */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4" id="package-awareness-container">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <FileCode className="text-indigo-600" size={18} />
                  <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900">Application Packages Registry</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Current Package</span>
                    <p className="text-sm font-black text-rose-600 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                      <span>Not Uploaded</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Version History</span>
                    <p className="text-xs text-slate-500 font-medium italic">No package versions available</p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  In future releases, this panel will catalog and index multiple scanned versions of your structural YAML declarations to support delta change detection.
                </p>
              </div>

            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              
              {/* Card E: Enhancement 6 - Application Lifecycle Informational Guide */}
              <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-2xl p-6 shadow-md space-y-4.5" id="lifecycle-guide-widget">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-200/80 font-bold">AIR Standard Stepper</span>
                  <h3 className="font-sans font-black text-lg tracking-tight select-none">Application Lifecycle</h3>
                </div>
                <p className="text-xs text-indigo-100/80 leading-relaxed font-normal">
                  This workflow outlines how applications transition through key alignment phases to onboard metrics onto the GenAI platform:
                </p>
                
                <div className="space-y-3 pt-1">
                  <div className="flex items-start space-x-3 text-xs bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="font-mono font-black bg-white/25 px-2 py-0.5 rounded text-[10px] shrink-0">1</span>
                    <div>
                      <span className="font-extrabold block">Create Application</span>
                      <span className="text-indigo-200 text-[11px] font-normal">Index core system owners, status, and objective descriptions.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-[10px] shrink-0 text-indigo-200">2</span>
                    <div>
                      <span className="font-extrabold block text-indigo-100">Upload Application Package</span>
                      <span className="text-indigo-200/80 text-[11px] font-normal">Upload YAML code structure for database schema entities.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-[10px] shrink-0 text-indigo-200">3</span>
                    <div>
                      <span className="font-extrabold block text-indigo-100">Review Knowledge Base</span>
                      <span className="text-indigo-200/80 text-[11px] font-normal">Audit indexed schemas, microservice connections, and rules.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-[10px] shrink-0 text-indigo-200">4</span>
                    <div>
                      <span className="font-extrabold block text-indigo-100">Define Metrics</span>
                      <span className="text-indigo-200/80 text-[11px] font-normal">Orchestrate analytical calculations and field mapping equations.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-[10px] shrink-0 text-indigo-200">5</span>
                    <div>
                      <span className="font-extrabold block text-indigo-100">Generate Blueprints</span>
                      <span className="text-indigo-200/80 text-[11px] font-normal">Compile implementation-ready documents for developers.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card F: System Logs & Timestamps */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-500">System Logs & Timestamps</h4>
                <div className="space-y-3.5 text-xs text-slate-600" id="overview-audit-timeline">
                  <div className="flex items-start space-x-2.5 border-l-2 border-slate-100 pl-4 py-0.5 relative">
                    <span className="w-2 h-2 rounded-full bg-slate-300 absolute -left-[5px] top-1"></span>
                    <div>
                      <p className="font-semibold text-slate-800">Application Record Created</p>
                      <p className="text-slate-400 font-mono text-[10px] mt-0.5">{formatDate(app.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2.5 border-l-2 border-slate-100 pl-4 py-0.5 relative">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 absolute -left-[5px] top-1"></span>
                    <div>
                      <p className="font-semibold text-slate-800">Last Database Update</p>
                      <p className="text-slate-400 font-mono text-[10px] mt-0.5">{formatDate(app.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: YAML Application Package (Phase 2) */}
        {activeTab === 'yaml' && (
          <div className="space-y-6" id="yaml-tab-container">
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 space-y-6">
              {/* Mandatory phase statement */}
              <div className="bg-blue-50/50 border border-blue-100/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-base text-blue-900">Application Package Specification</h4>
                    <p className="text-sm text-blue-700/90 font-bold italic">
                      No application package has been uploaded yet.
                    </p>
                  </div>
                  <span className="bg-blue-100 border border-blue-200 text-blue-700 font-mono text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider shrink-0 hidden sm:block">
                    Phase 2 Roadmap
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-blue-800 font-bold">Future application packages will provide:</p>
                  <ul className="space-y-1.5 text-xs text-blue-700/95 list-none pl-1">
                    <li className="flex items-center space-x-2">
                      <span className="text-blue-500 font-black">•</span>
                      <span className="font-medium">Business entities</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-blue-500 font-black">•</span>
                      <span className="font-medium">Database tables</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-blue-500 font-black">•</span>
                      <span className="font-medium">Columns</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-blue-500 font-black">•</span>
                      <span className="font-medium">Workflows</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-blue-500 font-black">•</span>
                      <span className="font-medium">Business rules</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Informative Preview Section */}
              <div className="space-y-3">
                <h4 className="font-sans font-bold text-sm text-slate-800">YAML Schema Format Preview</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  In Phase 2, developers will upload an automated source-generated configuration package. This captures database schemas, structures, primary-key/foreign-key columns relationships, and custom business rules directly:
                </p>

                {/* Simulated Yaml Block */}
                <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs text-indigo-300 shadow-inner">
                  <div className="bg-slate-900 border-b border-white/5 px-4 py-2.5 flex items-center justify-between text-slate-400 text-[11px] font-bold select-none">
                    <span>{app.name.toLowerCase().replace(/\s+/g, '-')}-package.yaml</span>
                    <button
                      onClick={() => copyToClipboard(sampleYaml)}
                      className="hover:text-indigo-400 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedCode ? 'Copied' : 'Copy Spec'}</span>
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-indigo-200/90 leading-relaxed max-h-[360px]">
                    {sampleYaml}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Metrics (Phase 4) */}
        {activeTab === 'metrics' && (
          <div className="space-y-6" id="metrics-tab-container">
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 space-y-6">
              {/* Mandatory phase statement */}
              <div className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-base text-amber-900">Metrics Management</h4>
                    <p className="text-sm text-amber-800 font-bold italic">
                      No metrics have been defined yet.
                    </p>
                  </div>
                  <span className="bg-amber-100 border border-amber-200 text-amber-700 font-mono text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider shrink-0 hidden sm:block">
                    Phase 4 Roadmap
                  </span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed font-normal">
                  In Phase 4, users will be empowered to define custom operational metrics manually and map them to standard backend relational columns.
                </p>
              </div>

              {/* Informative Preview Section */}
              <div className="space-y-3.5">
                <h4 className="font-sans font-bold text-sm text-slate-800">Standard Metric Definition Schema</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  In Phase 4, users will be empowered to define custom operational metrics manually, link them to the application columns registered in Phase 2, write custom SQL formulas, and schedule notifications/alerts:
                </p>

                {/* Blueprint specification mock cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5" id="metrics-future-preview-grid">
                  <div className="border border-dashed border-slate-200 rounded-xl p-5 space-y-2.5 bg-slate-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">PROTOTYPE METRIC A</span>
                    </div>
                    <h5 className="font-bold text-sm text-slate-800">Monthly Retention Factor</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tracks standard customer subscription recurrence levels over a trailing 30-day window.
                    </p>
                    <div className="font-mono text-[10px] text-slate-400 bg-slate-100 p-2 rounded">
                      Formula: COUNT(active_users) / Total(subscribed_users_start)
                    </div>
                  </div>

                  <div className="border border-dashed border-slate-200 rounded-xl p-5 space-y-2.5 bg-slate-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">PROTOTYPE METRIC B</span>
                    </div>
                    <h5 className="font-bold text-sm text-slate-800">Payment Process SLA</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Computes percentage level of financial transactions executed inside a 2000ms SLA cap.
                    </p>
                    <div className="font-mono text-[10px] text-slate-400 bg-slate-100 p-2 rounded">
                      Formula: COUNT(tx WHERE process_ms &lt; 2000) / COUNT(tx_total)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Blueprints (Phase 5) */}
        {activeTab === 'blueprints' && (
          <div className="space-y-6" id="blueprints-tab-container">
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 space-y-6">
              {/* Mandatory phase statement */}
              <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-base text-emerald-950">Metric Blueprints Specification</h4>
                    <p className="text-sm text-emerald-800 font-bold italic">
                      No blueprints have been generated yet.
                    </p>
                  </div>
                  <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider shrink-0 hidden sm:block">
                    Phase 5 Roadmap
                  </span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed font-normal">
                  In Phase 5, the core formula maps and entity references will be compiled into implementation-ready specifications.
                </p>
              </div>

              {/* Structured Blueprint Blueprint Markdown View */}
              <div className="space-y-3">
                <h4 className="font-sans font-bold text-sm text-slate-800">Implementation-Ready Markdown Specification</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  In Phase 5, the application will compile metrics into highly specific markdown templates that can be easily copy-pasted or downloaded as documentation for development teams or AI coding assistants:
                </p>

                {/* Rendered blueprint markdown box */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 font-mono text-xs text-slate-700 shadow-inner">
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-slate-500 text-[11px] font-bold select-none">
                    <span>metric_resolution_blueprint.md</span>
                    <button
                      onClick={() => copyToClipboard(sampleBlueprintMarkdown)}
                      className="hover:text-indigo-600 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedCode ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      <span>{copiedCode ? 'Copied' : 'Copy Spec'}</span>
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-slate-700 leading-relaxed max-h-[300px] whitespace-pre-wrap select-all font-sans text-xs">
                    {sampleBlueprintMarkdown}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
