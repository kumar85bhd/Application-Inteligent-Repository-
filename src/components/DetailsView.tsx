import React, { useState, useEffect, useRef } from "react";
import yaml from "js-yaml";
import {
  ArrowLeft,
  Edit3,
  Globe,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Archive,
  AlertCircle,
  FileCode,
  ListTodo,
  Cpu,
  Terminal,
  Copy,
  Check,
  Download,
  Landmark,
} from "lucide-react";
import { Application, MetricBlueprint, ApplicationPackage, BusinessObject, BusinessColumn } from "../types";
import MetricDiscoveryWorkspace from "./MetricDiscoveryWorkspace";

interface DetailsViewProps {
  applicationId: string;
  onBack: () => void;
  onEdit: (app: Application) => void;
}

type TabType = "overview" | "knowledge" | "metrics" | "blueprints";

export default function DetailsView({
  applicationId,
  onBack,
  onEdit,
}: DetailsViewProps) {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const getOnboardingPrompt = () => {
    if (!app) return "";
    return `Generate Application Package for ${app.name}

You are an expert software modeling agent. Your goal is to scan the codebases and files of the existing enterprise application "${app.name}" to identify business data useful for reporting and metrics.

Please perform an in-depth code inspection of the following layers of this application:
1. ORM Models & Entity definitions (e.g., schemas, schema classes, model files)
2. Entity Classes, structures, and DTOs
3. Repository Layers & Data Access Layers
4. Database Migrations, SQL definitions, or table layouts
5. Reporting Logic, Query builders, metrics processing, and Business Intelligence dashboard codes

Primary Focus:
- Business Objects
- Important Columns for Reporting and Metrics
- Business Meaning (What does each component/field mean?)
- Application Usage (How is it used across application tasks?)
- Metric Relevance (What KPI or analytic metrics are possible?)

Secondary Focus:
- Relationships (essential context connections and tables)
- Business Rules (rules governing data integrity, triggers, constraints)
- Workflows (logical process steps)

Avoid excessive technical documentation, focus purely on Business Data Discovery.

Output ONLY a valid, raw, unquoted YAML code block matching this schema:
---
application:
  id: "${app.id}"
  name: "${app.name}"
  version: "1.0.0"
  application_url: "${app.url || ''}"
  description: "${app.description}"

business_objects:
  - name: "BusinessObjectName"
    description: "Definition of the business object in plain human terms"
    table: "database_table_name"
    useful_fields: ["Date Fields", "Status Fields", "Amount Fields"]
    columns:
      - name: "column_name"
        datatype: "DB_TYPE"
        business_meaning: "Clear description of what this data means to the business"
        application_usage: "How the application uses or mutates this data"
        metric_relevance: "How this data can be utilized for reports, KPIs, or metrics"

relationships:
  - source: "BusinessObjectName"
    target: "RelatedBusinessObjectName"
    type: "1:N"
    description: "Business context of how they relate"

business_rules:
  - id: "RULE-01"
    description: "Governing constraint or logic impacting this data"

workflows:
  - name: "Key Workflow"
    description: "High level description"

Ensure all business_objects and their columns are populated exhaustively! Do not output any markdown formatting except the YAML codeblock.`;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getOnboardingPrompt());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownloadPrompt = () => {
    const element = document.createElement("a");
    const file = new Blob([getOnboardingPrompt()], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `generate-package-prompt-${app?.id || "app"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // States for Enhancement 2: Editable Markdown Notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editablePackage, setEditablePackage] = useState<ApplicationPackage | null>(null);
  const [savingPackage, setSavingPackage] = useState(false);

  const startEditingPackage = () => {
    if (!app || !displayPackage) return;
    setIsEditingPackage(true);
    setEditablePackage(JSON.parse(JSON.stringify(displayPackage)));
  };

  const cancelEditingPackage = () => {
    setIsEditingPackage(false);
    setEditablePackage(null);
  };

  const handleSavePackage = async () => {
    if (!app || !editablePackage) return;
    setSavingPackage(true);
    try {
      const updatedPackages = [...(app.packages || [])];
      const pkgIndex = updatedPackages.findIndex(p => p.id === editablePackage.id);
      
      if (pkgIndex >= 0) {
        updatedPackages[pkgIndex] = editablePackage;
      } else {
        throw new Error("Target package not found in application data.");
      }
      
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages: updatedPackages }),
      });
      if (!res.ok) throw new Error("Failed to save changes");
      const updatedApp = await res.json();
      setApp(updatedApp);
      setIsEditingPackage(false);
    } catch (err: any) {
      alert("Error saving package: " + err.message);
    } finally {
      setSavingPackage(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = yaml.load(text);
      } catch (err) {
        throw new Error("Invalid YAML file format.");
      }

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid YAML structure.");
      }

      // 1. Root-level checks
      if (!parsed.application) {
        throw new Error("Missing 'application' section in YAML.");
      }

      if (!parsed.business_objects || !Array.isArray(parsed.business_objects)) {
        throw new Error("Missing or invalid 'business_objects' section in YAML.");
      }

      // 2. Business objects level checks
      parsed.business_objects.forEach((bo: any, boIdx: number) => {
        const boLabel = bo.name || `at index ${boIdx}`;
        if (!bo.name || !bo.name.trim()) {
          throw new Error(`Business Object at index ${boIdx} is missing 'name'.`);
        }
        if (!bo.description || !bo.description.trim()) {
          bo.description = "Pending definition";
        }

        // Must have columns / fields
        const cols = bo.columns || bo.important_columns;
        if (!cols || !Array.isArray(cols)) {
          throw new Error(`Business Object '${boLabel}' is missing 'columns' list.`);
        }

        // Core columns list check
        bo.columns = cols; // map important_columns back to columns if that's what was provided
        
        cols.forEach((col: any, colIdx: number) => {
          const colLabel = col.name || `at index ${colIdx}`;
          if (!col.name || !col.name.trim()) {
            throw new Error(`Column at index ${colIdx} inside Business Object '${boLabel}' is missing 'name'.`);
          }
          
          if (!col.datatype || !col.datatype.trim()) {
            col.datatype = col.type || "unknown";
          }
          if (!col.business_meaning || !col.business_meaning.trim()) {
            col.business_meaning = col.description || col.meaning || "Pending definition";
          }
          if (!col.application_usage || !col.application_usage.trim()) {
            col.application_usage = col.usage || "Pending definition";
          }
          if (!col.metric_relevance || !col.metric_relevance.trim()) {
            col.metric_relevance = col.relevance || "Pending definition";
          }
        });
      });

      const existingPackages = app?.packages || [];
      // Set all other versions' active field to false
      const inactiveExistings = existingPackages.map(p => ({ ...p, active: false }));

      const newPackage = {
        id: "pkg-" + Math.random().toString(36).substr(2, 9),
        package_version: parsed.application.version || "v1.0.0",
        upload_date: new Date().toISOString(),
        status: "Draft",
        active: true, // Mark newly uploaded package as the current active version
        business_objects: parsed.business_objects,
        relationships: parsed.relationships || [],
        business_rules: parsed.business_rules || [],
        workflows: parsed.workflows || [],
      };

      const updatedPackages = [newPackage, ...inactiveExistings];

      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages: updatedPackages }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const updatedApp = await res.json();
      setApp(updatedApp);
    } catch (err: any) {
      setUploadError(err.message || "Failed to parse and upload package.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Synchronize draft when record loads
  useEffect(() => {
    if (app) {
      setNotesDraft(app.notes || "");
    }
  }, [app]);

  const handleSetActiveVersion = async (pkgId: string) => {
    if (!app || !app.packages) return;
    try {
      const updatedPackages = app.packages.map(p => ({
        ...p,
        active: p.id === pkgId
      }));
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages: updatedPackages }),
      });
      if (!res.ok) throw new Error("Failed to set active version.");
      const updatedApp = await res.json();
      setApp(updatedApp);
    } catch (err: any) {
      alert("Error setting active version: " + err.message);
    }
  };

  const handleSetPackageStatus = async (pkgId: string, nextStatus: 'Draft' | 'Reviewed' | 'Approved') => {
    if (!app || !app.packages) return;
    try {
      const updatedPackages = app.packages.map(p => {
        if (p.id === pkgId) {
          return { ...p, status: nextStatus };
        }
        return p;
      });
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages: updatedPackages }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      const updatedApp = await res.json();
      setApp(updatedApp);
    } catch (err: any) {
      alert("Error updating package status: " + err.message);
    }
  };

  const handleUpdateBlueprints = async (updatedBlueprints: MetricBlueprint[]) => {
    if (!app) return;
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric_blueprints: updatedBlueprints }),
      });
      if (!res.ok) throw new Error("Failed to update metric blueprints.");
      const updatedApp = await res.json();
      setApp(updatedApp);
    } catch (err: any) {
      alert("Error saving blueprints: " + err.message);
      throw err;
    }
  };

  // Handler to persist observations
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
      setNotesError(e.message || "Unable to save notes updates.");
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
        return (
          <strong key={index} className="font-bold text-slate-900">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  // Safe internal structured Markdown lines block generator
  const renderMarkdown = (text: string) => {
    if (!text || text.trim() === "") {
      return (
        <p className="text-slate-400 italic text-xs leading-relaxed">
          No discovery or analysis notes have been captured yet. Click "Edit
          Notes" to record system design questions, workflow rules, or metric
          assumptions.
        </p>
      );
    }
    const lines = text.split("\n");
    return (
      <div
        className="space-y-2.5 text-sm text-slate-600 leading-relaxed font-normal"
        id="rendered-markdown-content"
      >
        {lines.map((line, idx) => {
          if (line.startsWith("### ")) {
            return (
              <h5
                key={idx}
                className="font-sans font-extrabold text-xs text-slate-800 uppercase tracking-wider pt-2 border-b border-slate-100 pb-1"
                id={`md-h3-${idx}`}
              >
                {line.replace("### ", "")}
              </h5>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h4
                key={idx}
                className="font-sans font-black text-sm text-slate-900 pt-3"
                id={`md-h2-${idx}`}
              >
                {line.replace("## ", "")}
              </h4>
            );
          }
          if (line.startsWith("# ")) {
            return (
              <h3
                key={idx}
                className="font-sans font-black text-base text-slate-950 pt-4"
                id={`md-h1-${idx}`}
              >
                {line.replace("# ", "")}
              </h3>
            );
          }
          if (line.startsWith("* ") || line.startsWith("- ")) {
            const content = line.substring(2);
            return (
              <div
                key={idx}
                className="flex items-start space-x-2 pl-2"
                id={`md-bullet-${idx}`}
              >
                <span className="text-indigo-500 font-bold shrink-0">•</span>
                <span className="text-slate-600">{parseBoldText(content)}</span>
              </div>
            );
          }
          if (line.trim() === "") {
            return (
              <div key={idx} className="h-1.5" id={`md-empty-${idx}`}></div>
            );
          }
          return (
            <p
              key={idx}
              className="text-slate-600 font-normal leading-relaxed"
              id={`md-p-${idx}`}
            >
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
        setErr(e.message || "Unable to retrieve application metadata.");
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [applicationId]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const activePackage = app?.packages?.find(p => p.active);
  const displayPackage = activePackage || app?.packages?.[0];
  const pkgToRender = isEditingPackage ? editablePackage : displayPackage;

  if (loading) {
    return (
      <div
        className="p-12 text-center flex flex-col items-center justify-center space-y-3"
        id="details-loader"
      >
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">
          Querying application intelligence index...
        </p>
      </div>
    );
  }

  if (err || !app) {
    return (
      <div
        className="p-8 bg-rose-50 border border-rose-200 rounded-2xl max-w-2xl mx-auto my-12 text-center space-y-4"
        id="details-error"
      >
        <div className="p-3 bg-rose-100 rounded-full inline-block text-rose-600">
          <AlertCircle size={28} />
        </div>
        <div>
          <h4 className="font-bold text-lg text-slate-900">
            Retrieval Failure
          </h4>
          <p className="text-slate-600 text-sm mt-1">
            {err || "Application record was not found."}
          </p>
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

  return (
    <div
      className="space-y-6 max-w-6xl mx-auto px-8 py-6 text-left"
      id="details-view-layout"
    >
      {/* Top Breadcrumb Nav Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 gap-4"
        id="details-breadcrumb-row"
      >
        <button
          id="btn-details-back"
          onClick={onBack}
          className="group text-slate-500 hover:text-slate-800 flex items-center space-x-2 text-sm font-semibold transition-all cursor-pointer self-start"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
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
      <div
        className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden text-left"
        id="details-banner"
      >
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
          <Landmark size={240} className="translate-y-8 translate-x-8" />
        </div>
        <div className="space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-sans font-black text-2xl md:text-3xl tracking-tight text-white leading-tight">
              {app.name}
            </h2>
            {app.status === "Active" && (
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold font-sans text-xs px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Active</span>
              </span>
            )}
            {app.status === "Draft" && (
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold font-sans text-xs px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Draft</span>
              </span>
            )}
            {app.status === "Archived" && (
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
        <div
          className="bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl space-y-2.5 text-xs font-mono shrink-0 w-full md:w-auto text-left"
          id="details-audit-card"
        >
          <div className="flex items-center space-x-2 text-slate-400">
            <Cpu size={12} className="text-indigo-400" />
            <span className="text-slate-400">INDEXED ID:</span>
            <span className="text-white hover:text-indigo-400 transition-colors select-all leading-none mt-0.5 font-bold">
              {app.id}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Globe size={12} className="text-indigo-400" />
            <span className="text-slate-400">APPLICATION URL:</span>
            <span className="text-indigo-200 mt-0.5 font-normal">
              {app.url ? (
                <a
                  href={app.url.includes("://") ? app.url : `https://${app.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {app.url}
                </a>
              ) : (
                "Unspecified"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Row for Phases */}
      <div
        className="border-b border-slate-200 flex flex-wrap gap-2"
        id="details-tabs-row"
      >
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("knowledge")}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "knowledge"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCode size={15} />
          <span>Knowledge</span>
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "metrics"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListTodo size={15} />
          <span>Metric Discovery</span>
        </button>
        <button
          onClick={() => setActiveTab("blueprints")}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "blueprints"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Terminal size={15} />
          <span>Implementation Package (Coming Soon)</span>
        </button>
      </div>

      {/* Grid containing Tab Contents */}
      <div className="pt-2 text-left" id="details-tab-contents-container">
        {/* Tab 1: Overview and Audit Log */}
        {activeTab === "overview" && (
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            id="overview-tab-grid"
          >
            {/* Main Primary Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Next Recommended Action */}
              {!activePackage && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-800">
                    <AlertCircle size={20} className="text-indigo-600 animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md">
                      Next Recommended Action
                    </span>
                  </div>
                  <div className="space-y-1.5 text-left animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Generate Application Package Prompt
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      To onboard this existing application, copy the scanner prompt below, run it against your application codebase using Roo, then upload the generated YAML file in the <strong className="text-indigo-800">Knowledge</strong> tab.
                    </p>
                  </div>
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs text-indigo-300 shadow-inner">
                    <div className="bg-slate-900 border-b border-white/5 px-4 py-2 flex items-center justify-between text-slate-450 text-[11px] font-bold select-none">
                      <span>Scanner Prompt</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-indigo-200/90 leading-relaxed max-h-[140px] whitespace-pre">
                      {getOnboardingPrompt()}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={handleCopyPrompt}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 px-4.5 py-2.5 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      {copiedPrompt ? (
                        <Check size={14} className="text-emerald-300" />
                      ) : (
                        <Copy size={14} />
                      )}
                      <span>
                        {copiedPrompt ? "Copied Prompt!" : "Copy Prompt"}
                      </span>
                    </button>
                    <button
                      onClick={handleDownloadPrompt}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center space-x-1.5 px-4.5 py-2.5 text-xs font-semibold rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs"
                    >
                      <Download size={14} className="text-slate-500" />
                      <span>Download Prompt</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Card A: Scope Objective */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-500">
                  Application Description
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {app.description}
                </p>
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-start space-x-3 text-slate-600 text-xs mt-3">
                  <AlertCircle
                    size={16}
                    className="text-indigo-500 mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">
                      Business Discovery Baseline
                    </span>
                    <span>
                      This discovery record represents the foundational business
                      objects of your application. Use the progress checklist
                      below to discover available metrics or click "Edit Notes"
                      to add custom design parameters.
                    </span>
                  </div>
                </div>
              </div>

              {/* Card B: Application Onboarding Progress Checklist */}
              <div
                className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4"
                id="onboarding-progress-container"
              >
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <CheckCircle2 className="text-indigo-600" size={18} />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                    Application Onboarding Progress
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Track the progress of registered software through the onboarding workflow:
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-center space-x-3 text-sm p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-emerald-500 font-extrabold text-base shrink-0">
                      ✓
                    </span>
                    <span className="text-slate-700 font-medium">
                      Application Registered
                    </span>
                  </div>

                  <div className={`flex items-center space-x-3 text-sm p-3 ${displayPackage ? 'bg-slate-50 border-emerald-100' : 'bg-slate-50/40 border-dashed border-slate-200'} rounded-xl border`}>
                    <span className={`${displayPackage ? 'text-emerald-500 font-extrabold text-base' : 'text-slate-400 font-normal text-base'} shrink-0`}>
                      {displayPackage ? '✓' : '□'}
                    </span>
                    <span className={`${displayPackage ? 'text-slate-700 font-medium' : 'text-slate-500 font-medium'}`}>
                      Generate Application Package Prompt
                    </span>
                  </div>

                  <div className={`flex items-center space-x-3 text-sm p-3 ${displayPackage ? 'bg-slate-50 border-emerald-100' : 'bg-slate-50/40 border-dashed border-slate-200'} rounded-xl border`}>
                    <span className={`${displayPackage ? 'text-emerald-500 font-extrabold text-base' : 'text-slate-400 font-normal text-base'} shrink-0`}>
                      {displayPackage ? '✓' : '□'}
                    </span>
                    <span className={`${displayPackage ? 'text-slate-700 font-medium' : 'text-slate-500 font-medium'}`}>
                      Generate Application Package
                    </span>
                  </div>

                  <div className={`flex items-center space-x-3 text-sm p-3 ${displayPackage ? 'bg-slate-50 border-emerald-100' : 'bg-slate-50/40 border-dashed border-slate-200'} rounded-xl border`}>
                    <span className={`${displayPackage ? 'text-emerald-500 font-extrabold text-base' : 'text-slate-400 font-normal text-base'} shrink-0`}>
                      {displayPackage ? '✓' : '□'}
                    </span>
                    <span className={`${displayPackage ? 'text-slate-700 font-medium' : 'text-slate-500 font-medium'}`}>
                      Upload Application Package
                    </span>
                  </div>

                  <div className={`flex items-center space-x-3 text-sm p-3 ${displayPackage && displayPackage.status === 'Approved' ? 'bg-slate-50 border-emerald-100' : 'bg-slate-50/40 border-dashed border-slate-200'} rounded-xl border`}>
                    <span className={`${displayPackage && displayPackage.status === 'Approved' ? 'text-emerald-500 font-extrabold text-base' : 'text-slate-400 font-normal text-base'} shrink-0`}>
                      {displayPackage && displayPackage.status === 'Approved' ? '✓' : '□'}
                    </span>
                    <span className={`${displayPackage && displayPackage.status === 'Approved' ? 'text-slate-700 font-medium' : 'text-slate-500 font-medium'}`}>
                      Review Knowledge
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm p-3 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                    <span className="text-slate-400 font-medium text-base shrink-0">
                      □
                    </span>
                    <span className="text-slate-500 font-medium">
                      Define Metrics
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm p-3 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                    <span className="text-slate-400 font-medium text-base shrink-0">
                      □
                    </span>
                    <span className="text-slate-500 font-medium">
                      Generate Implementation Package
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Card D: Knowledge Completeness Indicator */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-500">
                  Knowledge Coverage
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Business Objects</span>
                    {activePackage &&
                    activePackage.business_objects.length > 0 ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-400 font-medium">
                        Missing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Important Columns</span>
                    {activePackage &&
                    activePackage.business_objects.some(
                      (bo) => bo.columns.length > 0,
                    ) ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-400 font-medium">
                        Missing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Notes</span>
                    {app.notes && app.notes.trim() !== "" ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-400 font-medium">
                        Missing
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card C: Application Lifecycle */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-500">
                  Application Lifecycle
                </h4>
                <div className="space-y-3 font-medium text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-100 text-emerald-800 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">✓</span>
                    <span className="text-slate-800">Registered</span>
                  </div>
                  <div className="text-slate-300 pl-2.5 leading-none">↓</div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${displayPackage ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-505'}`}>{displayPackage ? '✓' : '2'}</span>
                    <span className={displayPackage ? 'text-slate-800' : 'text-slate-500'}>Package Generated</span>
                  </div>
                  <div className="text-slate-300 pl-2.5 leading-none">↓</div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${displayPackage ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-505'}`}>{displayPackage ? '✓' : '3'}</span>
                    <span className={displayPackage ? 'text-slate-800' : 'text-slate-500'}>Package Uploaded</span>
                  </div>
                  <div className="text-slate-300 pl-2.5 leading-none">↓</div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${displayPackage && displayPackage.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-505'}`}>{displayPackage && displayPackage.status === 'Approved' ? '✓' : '4'}</span>
                    <span className={displayPackage && displayPackage.status === 'Approved' ? 'text-slate-800' : 'text-slate-500'}>Knowledge Reviewed</span>
                  </div>
                  <div className="text-slate-300 pl-2.5 leading-none">↓</div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-100 text-slate-500 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">5</span>
                    <span className="text-slate-500">Metrics Defined</span>
                  </div>
                  <div className="text-slate-300 pl-2.5 leading-none">↓</div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-100 text-slate-500 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">6</span>
                    <span className="text-slate-500">Implementation Ready</span>
                  </div>
                </div>
              </div>

              {/* Card E: System Logs & Timestamps */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-500">
                  System Logs & Timestamps
                </h4>
                <div
                  className="space-y-3.5 text-xs text-slate-600"
                  id="overview-audit-timeline"
                >
                  <div className="flex items-start space-x-2.5 border-l-2 border-slate-100 pl-4 py-0.5 relative">
                    <span className="w-2 h-2 rounded-full bg-slate-300 absolute -left-[5px] top-1"></span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Application Record Created
                      </p>
                      <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                        {formatDate(app.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2.5 border-l-2 border-slate-100 pl-4 py-0.5 relative">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 absolute -left-[5px] top-1"></span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Last Database Update
                      </p>
                      <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                        {formatDate(app.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Knowledge (Phase 2) */}
        {activeTab === "knowledge" && (
          <div className="space-y-6" id="yaml-tab-container">
            {displayPackage ? (
              <div className="space-y-6">
                {/* Package Version Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Package */}
                  <div className="bg-white border border-slate-200/85 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 mb-4">
                        Current Package Details
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                              Version Number
                            </span>
                            <p className="font-bold text-slate-800 text-sm">
                              {displayPackage.package_version}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                              Workflow Status
                            </span>
                            <p className={`font-bold text-sm ${
                              displayPackage.status === 'Approved' ? 'text-emerald-600' :
                              displayPackage.status === 'Reviewed' ? 'text-blue-600' :
                              'text-amber-600'
                            }`}>
                              {displayPackage.status}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pb-1">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                              Active Version
                            </span>
                            <p className="flex items-center space-x-1.5 mt-0.5">
                              {activePackage?.id === displayPackage.id ? (
                                <>
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span className="font-semibold text-slate-700 text-xs">Yes</span>
                                </>
                              ) : (
                                <>
                                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                                  <span className="font-semibold text-slate-500 text-xs">No</span>
                                </>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                              Uploaded Date
                            </span>
                            <p className="font-mono text-xs text-slate-600 mt-0.5">
                              {formatDate(displayPackage.upload_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col space-y-1.5 mt-4">
                      {isEditingPackage ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={cancelEditingPackage}
                            className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl transition-all flex justify-center items-center cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSavePackage}
                            disabled={savingPackage}
                            className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm flex justify-center items-center cursor-pointer disabled:opacity-50"
                          >
                            {savingPackage ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={startEditingPackage}
                            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl transition-all flex justify-center items-center space-x-1.5 cursor-pointer"
                          >
                            <Edit3 size={14} className="text-slate-500" />
                            <span>Edit Schema Fields</span>
                          </button>

                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <button
                              onClick={() => handleSetPackageStatus(displayPackage.id, 'Draft')}
                              disabled={displayPackage.status === 'Draft'}
                              className={`text-[10px] font-bold py-1.5 rounded-lg transition-all border cursor-pointer ${
                                displayPackage.status === 'Draft'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Draft
                            </button>
                            <button
                              onClick={() => handleSetPackageStatus(displayPackage.id, 'Reviewed')}
                              disabled={displayPackage.status === 'Reviewed'}
                              className={`text-[10px] font-bold py-1.5 rounded-lg transition-all border cursor-pointer ${
                                displayPackage.status === 'Reviewed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleSetPackageStatus(displayPackage.id, 'Approved')}
                              disabled={displayPackage.status === 'Approved'}
                              className={`text-[10px] font-bold py-1.5 rounded-lg transition-all border cursor-pointer ${
                                displayPackage.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Version History */}
                  <div className="bg-white border border-slate-200/85 rounded-2xl p-6">
                    <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 mb-4">
                      Version Registry
                    </h4>
                    <div className="max-h-[220px] overflow-y-auto space-y-3 pr-2">
                      {app.packages?.map((pkg, idx) => {
                        const isPkgActive = pkg.id === activePackage?.id;
                        return (
                          <div key={pkg.id || idx} className={`flex flex-col p-3 rounded-xl border transition-all ${
                            isPkgActive ? 'bg-indigo-50/50 border-indigo-200/80 shadow-xs' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <div className="flex justify-between items-start mb-1.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-slate-800">{pkg.package_version}</span>
                                {isPkgActive ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    ★ Active
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSetActiveVersion(pkg.id)}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
                                  >
                                    Activate
                                  </button>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                pkg.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                pkg.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {pkg.status}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-slate-400">
                              Uploaded: {formatDate(pkg.upload_date)}
                            </span>

                            {/* Status controls in history */}
                            <div className="flex items-center space-x-1 mt-2.5 pt-2 border-t border-slate-100/50">
                              <span className="text-[9px] font-bold text-slate-400 mr-1.5 uppercase font-mono">Stage:</span>
                              <button
                                onClick={() => handleSetPackageStatus(pkg.id, 'Draft')}
                                className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all border cursor-pointer ${
                                  pkg.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold' : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-100'
                                }`}
                              >
                                Draft
                              </button>
                              <button
                                onClick={() => handleSetPackageStatus(pkg.id, 'Reviewed')}
                                className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all border cursor-pointer ${
                                  pkg.status === 'Reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-100'
                                }`}
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleSetPackageStatus(pkg.id, 'Approved')}
                                className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all border cursor-pointer ${
                                  pkg.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-100'
                                }`}
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Business Objects Section */}
                    <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                      <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        Business Objects
                      </h4>
                      {pkgToRender.business_objects.length === 0 ? (
                        <p className="text-slate-500 text-sm">
                          No business objects available.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {pkgToRender.business_objects.map(
                            (bo, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                              >
                                <h5 className="font-bold text-slate-900 text-base">
                                  {bo.name}
                                </h5>
                                {isEditingPackage ? (
                                  <textarea
                                    className="w-full text-sm font-sans text-slate-800 p-2 border border-slate-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={bo.description}
                                    onChange={(e) => {
                                      const newPkg = { ...editablePackage };
                                      newPkg.business_objects[idx].description = e.target.value;
                                      setEditablePackage(newPkg);
                                    }}
                                  />
                                ) : (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {bo.description}
                                  </p>
                                )}
                                {bo.useful_fields &&
                                  bo.useful_fields.length > 0 && (
                                    <div className="mt-3">
                                      <span className="text-xs font-bold text-slate-500 uppercase">
                                        Potentially Useful Fields:
                                      </span>
                                      <div className="flex flex-wrap gap-2 mt-1.5">
                                        {bo.useful_fields.map((field, fIdx) => (
                                          <span
                                            key={fIdx}
                                            className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                                          >
                                            {field}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1.5 flex items-center space-x-1">
                                    <ListTodo size={12} className="text-indigo-500" />
                                    <span>Discovery Notes</span>
                                  </span>
                                  {isEditingPackage ? (
                                    <textarea
                                      className="w-full text-xs font-sans text-slate-800 p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                      placeholder="Add business object specific notes..."
                                      value={bo.notes || ""}
                                      onChange={(e) => {
                                        const newPkg = { ...editablePackage };
                                        newPkg.business_objects[idx].notes = e.target.value;
                                        setEditablePackage(newPkg);
                                      }}
                                    />
                                  ) : (
                                    <div className="text-xs text-slate-600 bg-slate-100/50 p-2.5 rounded border border-slate-200">
                                      {bo.notes ? bo.notes : <span className="text-slate-400 italic">No notes added.</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    {/* Columns Structure */}
                    <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                      <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        Important Columns & Metric Relevance
                      </h4>
                      {pkgToRender.business_objects.length === 0 ? (
                        <p className="text-slate-500 text-sm">
                          No column information available.
                        </p>
                      ) : (
                        <div className="space-y-6">
                          {pkgToRender.business_objects.map(
                            (bo, idx) => (
                              <div
                                key={idx}
                                className="border border-slate-200 rounded-xl overflow-hidden"
                              >
                                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-slate-800 block text-sm">
                                      {bo.name} Data Context
                                    </span>
                                    <span className="text-xs text-slate-500 block">
                                      Table source: {bo.table}
                                    </span>
                                  </div>
                                </div>
                                {bo.columns && bo.columns.length > 0 && (
                                  <div className="border-t border-slate-200">
                                    <table className="w-full text-left text-xs align-top">
                                      <thead className="bg-slate-100/50 text-slate-500 font-bold uppercase">
                                        <tr>
                                          <th className="px-4 py-3 font-mono">
                                            Column Details
                                          </th>
                                          <th className="px-4 py-3 font-mono">
                                            Business Meaning & Usage
                                          </th>
                                          <th className="px-4 py-3 font-mono">
                                            Metric Relevance
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {bo.columns.map((col, cIdx) => (
                                          <tr
                                            key={cIdx}
                                            className="hover:bg-slate-50/50"
                                          >
                                            <td className="px-4 py-3 min-w-[140px]">
                                              <div className="font-mono text-indigo-700 font-bold mb-1">
                                                {col.name}
                                              </div>
                                              <div className="font-mono text-[10px] text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                                {col.datatype}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 min-w-[200px]">
                                              <p className="mb-1.5">
                                                <strong className="text-slate-800 font-semibold text-[11px] uppercase tracking-wider block mb-0.5">
                                                  Meaning:
                                                </strong>{" "}
                                                {isEditingPackage ? (
                                                  <textarea 
                                                    className="w-full text-xs font-sans p-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                    value={col.business_meaning}
                                                    onChange={(e) => {
                                                      const newPkg = {...editablePackage};
                                                      newPkg.business_objects[idx].columns[cIdx].business_meaning = e.target.value;
                                                      setEditablePackage(newPkg);
                                                    }}
                                                  />
                                                ) : col.business_meaning}
                                              </p>
                                              <p>
                                                <strong className="text-slate-800 font-semibold text-[11px] uppercase tracking-wider block mb-0.5">
                                                  Usage:
                                                </strong>{" "}
                                                {isEditingPackage ? (
                                                  <textarea 
                                                    className="w-full text-xs font-sans p-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                    value={col.application_usage}
                                                    onChange={(e) => {
                                                      const newPkg = {...editablePackage};
                                                      newPkg.business_objects[idx].columns[cIdx].application_usage = e.target.value;
                                                      setEditablePackage(newPkg);
                                                    }}
                                                  />
                                                ) : col.application_usage}
                                              </p>
                                            </td>
                                            <td className="px-4 py-3 text-emerald-700 font-medium">
                                              {isEditingPackage ? (
                                                <textarea 
                                                  className="w-full text-xs font-sans p-1.5 border border-emerald-300 rounded bg-emerald-50 text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[60px]"
                                                  value={col.metric_relevance}
                                                  onChange={(e) => {
                                                    const newPkg = {...editablePackage};
                                                    newPkg.business_objects[idx].columns[cIdx].metric_relevance = e.target.value;
                                                    setEditablePackage(newPkg);
                                                  }}
                                                />
                                              ) : col.metric_relevance}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    {/* Relationships */}
                    <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                      <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        Relationships
                      </h4>
                      {!pkgToRender.relationships ||
                      pkgToRender.relationships.length === 0 ? (
                        <p className="text-slate-500 text-sm">
                          No relationships available.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {pkgToRender.relationships.map(
                            (rel, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col space-y-1.5"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-800 text-sm">
                                    {rel.source}
                                  </span>
                                  <span className="text-slate-400 font-mono text-xs">
                                    →
                                  </span>
                                  <span className="font-bold text-slate-800 text-sm">
                                    {rel.target}
                                  </span>
                                  <span className="bg-slate-200 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded">
                                    {rel.type}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600">
                                  {rel.description}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    {/* Workflows */}
                    <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                      <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        Workflows
                      </h4>
                      {!pkgToRender.workflows ||
                      pkgToRender.workflows.length === 0 ? (
                        <p className="text-slate-500 text-sm">
                          No workflows available.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {pkgToRender.workflows.map((wf, idx) => (
                            <div
                              key={idx}
                              className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4"
                            >
                              <h5 className="font-bold text-indigo-900 text-sm mb-1">
                                {wf.name}
                              </h5>
                              <p className="text-xs text-indigo-800/80 leading-relaxed">
                                {wf.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Business Rules */}
                    <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4">
                      <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        Business Rules
                      </h4>
                      {!pkgToRender.business_rules ||
                      pkgToRender.business_rules.length === 0 ? (
                        <p className="text-slate-500 text-sm">
                          No business rules available.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {pkgToRender.business_rules.map(
                            (rule, idx) => (
                              <div
                                key={idx}
                                className="flex items-start space-x-3 bg-slate-50 border border-slate-200 rounded-lg p-3"
                              >
                                <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 mt-0.5">
                                  {rule.id}
                                </span>
                                <span className="text-sm text-slate-700 leading-snug">
                                  {rule.description}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar with Notes */}
                  <div className="space-y-6">
                    <div
                      className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4"
                      id="notes-section-container"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <ListTodo className="text-indigo-600" size={18} />
                          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                            Notes
                          </h4>
                        </div>
                        {!isEditingNotes && (
                          <button
                            onClick={() => {
                              setNotesDraft(app.notes || "");
                              setIsEditingNotes(true);
                              setNotesError(null);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1.5 cursor-pointer"
                            id="btn-edit-notes"
                          >
                            <Edit3 size={12} />
                            <span>Edit Notes</span>
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
                            Supports markdown formatting
                          </span>
                          <textarea
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            className="w-full h-48 text-sm font-sans p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-slate-50/50"
                            placeholder="Add observations, business workflow rules, or metrics assumptions..."
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
                                <span>Save Notes</span>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl">
                          {renderMarkdown(app.notes || "")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/85 rounded-2xl p-6">
                  <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 mb-4">
                    Upload New Version
                  </h4>
                  <div
                    className="border border-dashed border-indigo-300 bg-indigo-50/30 rounded-2xl p-6 text-center space-y-3 hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".yml,.yaml"
                      onChange={handleFileUpload}
                    />
                    <div className="w-10 h-10 bg-white border border-indigo-200 shadow-sm rounded-full flex items-center justify-center mx-auto text-indigo-600 group-hover:scale-110 transition-transform">
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FileCode size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-indigo-900">
                        {isUploading ? "Uploading..." : "Upload New Package Version"}
                      </h4>
                      <p className="text-xs text-indigo-700/70 mt-0.5">
                        {isUploading ? "Processing YAML..." : "Upload an updated YAML file"}
                      </p>
                    </div>
                  </div>
                  {uploadError && (
                    <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium text-center">
                      {uploadError}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 space-y-6">
                {/* Empty State Banner */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-1">
                    <FileCode size={24} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-lg text-amber-900">
                      No Application Package has been uploaded.
                    </h4>
                    <p className="text-xs text-amber-705/90 mt-1 max-w-xl mx-auto leading-relaxed font-normal">
                      Onboard your existing application codebase to AIR by following these 3 simple steps:
                    </p>
                  </div>
                </div>

                {/* Core Workflow Tutorial Step-by-Step */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Step 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-left">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                      Step 1
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Copy Package Prompt
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Copy the custom-crafted Prompt designed specifically for <strong>{app.name}</strong> shown below.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-left">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                      Step 2
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Run Prompt using Roo
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Run this prompt inside your editor environment against your application's actual source code.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-left">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                      Step 3
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Upload YAML Package
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Upload the generated YAML file below to extract and register structured knowledge in AIR.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h4 className="font-sans font-bold text-base text-slate-900">
                    Generate Application Package Prompt
                  </h4>

                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs text-indigo-300 shadow-inner">
                    <div className="bg-slate-900 border-b border-white/5 px-4 py-2 flex items-center justify-between text-slate-400 text-[11px] font-bold select-none">
                      <span>Scanner Prompt</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-indigo-200/90 leading-relaxed max-h-[250px]">
                      {getOnboardingPrompt()}
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={handleCopyPrompt}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 px-4.5 py-2.5 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      {copiedPrompt ? (
                        <Check size={14} className="text-emerald-300" />
                      ) : (
                        <Copy size={14} />
                      )}
                      <span>
                        {copiedPrompt ? "Copied Prompt!" : "Copy Prompt"}
                      </span>
                    </button>
                    <button
                      onClick={handleDownloadPrompt}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center space-x-1.5 px-4.5 py-2.5 text-xs font-semibold rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs"
                    >
                      <Download size={14} className="text-slate-500" />
                      <span>Download Prompt</span>
                    </button>
                  </div>
                </div>

                <div
                  className="border border-dashed border-indigo-300 bg-indigo-50/30 rounded-2xl p-8 text-center space-y-4 hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".yml,.yaml"
                    onChange={handleFileUpload}
                  />
                  <div className="w-12 h-12 bg-white border border-indigo-200 shadow-sm rounded-full flex items-center justify-center mx-auto text-indigo-600 group-hover:scale-110 transition-transform">
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileCode size={20} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-indigo-900">
                      {isUploading
                        ? "Extracting Knowledge..."
                        : "Upload Application Package"}
                    </h4>
                    <p className="text-xs text-indigo-700/70 mt-1">
                      {isUploading
                        ? "Parsing entities and workflows..."
                        : "Click to select the YAML generated by Roo here to extract knowledge"}
                    </p>
                  </div>
                </div>
                {uploadError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium text-center">
                    {uploadError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Metrics Placeholder */}
        {activeTab === "metrics" && (
          <div className="space-y-6" id="metrics-tab-container">
            <MetricDiscoveryWorkspace
              application={app}
              activePackage={activePackage}
              onUpdateBlueprints={handleUpdateBlueprints}
              onGoToKnowledge={() => setActiveTab("knowledge")}
            />
          </div>
        )}

        {/* Tab 4: Implementation Package Placeholder */}
        {activeTab === "blueprints" && (
          <div className="space-y-6" id="blueprints-tab-container">
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-6 space-y-3 text-center py-16 animate-in fade-in duration-300">
                <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                  <Terminal size={24} />
                </div>
                <h4 className="font-sans font-bold text-lg text-emerald-950">
                  No implementation package has been generated.
                </h4>
                <p className="text-sm text-emerald-800 max-w-lg mx-auto leading-relaxed font-normal">
                  Implementation packages are generated from approved metric definitions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
