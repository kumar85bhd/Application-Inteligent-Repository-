import React, { useState } from "react";
import {
  ListTodo,
  TrendingUp,
  Activity,
  Coins,
  Clock,
  Layers,
  ArrowRight,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle,
  HelpCircle,
  X,
  FileCode,
  Shield,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Info,
  Award
} from "lucide-react";
import { Application, BusinessObject, MetricBlueprint, ImportantColumn, ApplicationPackage, AIMetricSuggestion } from "../types";
import { getBlueprintQuality, validateBlueprintForm } from "../utils/blueprintValidation";
import { MetricSuggestion, getSuggestionsForObject } from "../utils/metricSuggestionEngine";
import { fetchMockAISuggestions } from "../services/mockMetricDiscoveryProvider";
import { buildMetricDiscoveryPrompt } from "../services/metricDiscoveryPromptBuilder";

interface MetricDiscoveryWorkspaceProps {
  application: Application;
  activePackage: ApplicationPackage | null | undefined;
  onUpdateBlueprints: (blueprints: MetricBlueprint[]) => Promise<void>;
  onGoToKnowledge: () => void;
}


export default function MetricDiscoveryWorkspace({
  application,
  activePackage,
  onUpdateBlueprints,
  onGoToKnowledge,
}: MetricDiscoveryWorkspaceProps) {
  const businessObjects: BusinessObject[] = activePackage?.business_objects || [];
  const blueprints: MetricBlueprint[] = application.metric_blueprints || [];

  // Active package approval enforcement checking
  const allPackages = application.packages || [];
  const isSelectedActivePkgActive = activePackage ? !!activePackage.active : false;
  const isSelectedActivePkgApproved = activePackage ? activePackage.status === "Approved" : false;
  
  // A package is valid for discovery if and only if it is BOTH active and approved
  const hasApprovedPackage = !!activePackage && isSelectedActivePkgApproved && isSelectedActivePkgActive;
  
  // Check if multiple approved packages exist
  const approvedPackagesCount = allPackages.filter(p => p.status === "Approved").length;
  const hasMultipleApproved = approvedPackagesCount > 1;

  // Active view states
  const [currentSubTab, setCurrentSubTab] = useState<"analyze" | "library" | "ai">("analyze");
  const [selectedBOIndex, setSelectedBOIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  // AI Assisted Discovery State
  const [aiSuggestions, setAiSuggestions] = useState<AIMetricSuggestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);
  
  // Builder form states
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingBlueprintId, setEditingBlueprintId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPurpose, setFormPurpose] = useState("");
  const [formBOName, setFormBOName] = useState("");
  const [formRequiredFields, setFormRequiredFields] = useState<string[]>([]);
  const [formFormula, setFormFormula] = useState("");
  const [formVis, setFormVis] = useState("Line Chart");
  const [formNotes, setFormNotes] = useState("");

  // Validation feedback lists
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  const [viewingBlueprint, setViewingBlueprint] = useState<MetricBlueprint | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeBO = businessObjects[selectedBOIndex];

  // Helper code to map datatype to style
  const getFieldIcon = (colName: string, datatype: string) => {
    const colLower = colName.toLowerCase();
    const typeLower = datatype.toLowerCase();
    if (typeLower.includes("date") || typeLower.includes("timestamp") || typeLower.includes("time") || colLower.endsWith("_at")) {
      return <Clock size={14} className="text-emerald-500" />;
    }
    if (typeLower.includes("varchar") || typeLower.includes("char") || typeLower.includes("string") || colLower.includes("status") || colLower.includes("state")) {
      return <Activity size={14} className="text-blue-500" />;
    }
    if (typeLower.includes("decimal") || typeLower.includes("double") || typeLower.includes("float") || typeLower.includes("numeric") || colLower.includes("amount") || colLower.includes("spend") || colLower.includes("price")) {
      return <Coins size={14} className="text-amber-500" />;
    }
    return <Layers size={14} className="text-slate-500" />;
  };

  // Live quality score for form
  const currentFormQuality = getBlueprintQuality({
    name: formName,
    business_purpose: formPurpose,
    business_object_name: formBOName,
    required_fields: formRequiredFields,
    formula_description: formFormula
  });

  // AI Suggestion Functions
  const handleRunAiAnalysis = async () => {
    if (!hasApprovedPackage) {
      alert("Metric Discovery requires an Approved Active Package Version.");
      return;
    }
    setIsAiLoading(true);
    setAiAnalysisComplete(false);
    
    // Demonstrate we could build a prompt here:
    // const prompt = buildMetricDiscoveryPrompt({
    //   businessObjects,
    //   blueprints
    // });
    
    try {
      const suggestions = await fetchMockAISuggestions();
      setAiSuggestions(suggestions);
      setAiAnalysisComplete(true);
    } catch (e) {
      console.error(e);
      alert("AI Analysis failed. See console for details.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = (sug: AIMetricSuggestion) => {
    setFormName(sug.metric_name);
    setFormPurpose(sug.business_purpose);
    setFormBOName(sug.source_business_objects[0] || (businessObjects[0]?.name || ""));
    setFormRequiredFields(sug.required_fields);
    setFormFormula(sug.suggested_formula);
    setFormVis(sug.recommended_visualization);
    setFormNotes(`AI suggested metric based on schema analysis. Reasoning: ${sug.reasoning}\nBusiness Value: ${sug.business_value}`);
    setEditingBlueprintId(null);
    setIsBuilderOpen(true);
    setCurrentSubTab("library");
  };

  const handleRejectAiSuggestion = (sugId: string) => {
    setAiSuggestions(aiSuggestions.filter(s => s.id !== sugId));
  };

  // Convert candidate metric suggestion to blueprint
  const handleApplySuggestion = (sug: MetricSuggestion, bo: BusinessObject) => {
    if (!hasApprovedPackage) {
      alert("Metric Discovery requires an Approved Active Package Version.");
      return;
    }
    setFormName(sug.name);
    setFormPurpose(sug.description);
    setFormBOName(bo.name);
    setFormRequiredFields(sug.fields);
    setFormFormula(sug.formula);
    setFormVis(sug.visualization);
    setFormNotes(`Suggested automatically from ${bo.name} schema evaluation. Completes criteria parameters.`);
    setEditingBlueprintId(null);
    setIsBuilderOpen(true);
    setCurrentSubTab("library");
  };

  // Open blank builder
  const handleOpenEmptyBuilder = () => {
    if (!hasApprovedPackage) {
      alert("Metric Discovery requires an Approved Active Package Version.");
      return;
    }
    setFormName("");
    setFormPurpose("");
    setFormBOName(activeBO?.name || (businessObjects[0]?.name || ""));
    setFormRequiredFields([]);
    setFormFormula("");
    setFormVis("Line Chart");
    setFormNotes("");
    setEditingBlueprintId(null);
    setValidationErrors([]);
    setShowValidationAlert(false);
    setIsBuilderOpen(true);
    setCurrentSubTab("library");
  };

  // Edit blueprint
  const handleEditBlueprint = (bp: MetricBlueprint) => {
    if (!hasApprovedPackage) {
      alert("Metric Discovery requires an Approved Active Package Version.");
      return;
    }
    setEditingBlueprintId(bp.id);
    setFormName(bp.name);
    setFormPurpose(bp.business_purpose);
    setFormBOName(bp.business_object_name);
    setFormRequiredFields(bp.required_fields || []);
    setFormFormula(bp.formula_description);
    setFormVis(bp.visualization_recommendation);
    setFormNotes(bp.implementation_notes || "");
    setValidationErrors([]);
    setShowValidationAlert(false);
    setIsBuilderOpen(true);
    setViewingBlueprint(null);
  };

  const handleToggleRequiredField = (f: string) => {
    if (formRequiredFields.includes(f)) {
      setFormRequiredFields(formRequiredFields.filter(item => item !== f));
    } else {
      setFormRequiredFields([...formRequiredFields, f]);
    }
  };

  // 5. Strict constraint validation before saving
  const handleSaveBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasApprovedPackage) {
      alert("Enforcement Error: Metric library modification is disabled without an Approved Active Package Version.");
      return;
    }

    const errors = validateBlueprintForm({
      name: formName,
      purpose: formPurpose,
      boName: formBOName,
      requiredFields: formRequiredFields,
      formula: formFormula
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationAlert(true);
      return;
    }

    setValidationErrors([]);
    setShowValidationAlert(false);

    const nextBlueprints = [...blueprints];
    
    if (editingBlueprintId) {
      const idx = nextBlueprints.findIndex(b => b.id === editingBlueprintId);
      if (idx !== -1) {
        nextBlueprints[idx] = {
          ...nextBlueprints[idx],
          name: formName.trim(),
          business_purpose: formPurpose.trim(),
          business_object_name: formBOName,
          required_fields: formRequiredFields,
          formula_description: formFormula.trim(),
          visualization_recommendation: formVis,
          implementation_notes: formNotes.trim(),
          last_updated: new Date().toISOString()
        };
      }
    } else {
      const newBp: MetricBlueprint = {
        id: "bp-" + Math.random().toString(36).substr(2, 9),
        name: formName.trim(),
        business_purpose: formPurpose.trim(),
        business_object_name: formBOName,
        required_fields: formRequiredFields,
        formula_description: formFormula.trim(),
        visualization_recommendation: formVis,
        implementation_notes: formNotes.trim(),
        last_updated: new Date().toISOString()
      };
      nextBlueprints.unshift(newBp);
    }

    try {
      await onUpdateBlueprints(nextBlueprints);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setIsBuilderOpen(false);
      setEditingBlueprintId(null);
    } catch (err: any) {
      alert("Error saving your blueprint: " + err.message);
    }
  };

  const handleDeleteBlueprint = async (bpId: string) => {
    if (!hasApprovedPackage) {
      alert("Enforcement Error: Metric library modification is disabled without an Approved Active Package Version.");
      return;
    }
    if (!confirm("Are you sure you want to delete this Metric Blueprint from your library?")) {
      return;
    }
    const nextBlueprints = blueprints.filter(b => b.id !== bpId);
    try {
      await onUpdateBlueprints(nextBlueprints);
      if (viewingBlueprint?.id === bpId) {
        setViewingBlueprint(null);
      }
    } catch (err: any) {
      alert("Error deleting blueprint: " + err.message);
    }
  };

  const filteredBOs = businessObjects.filter(bo => 
    bo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (bo.table && bo.table.toLowerCase().includes(searchTerm.toLowerCase())) ||
    bo.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const targetBOColumns = activeBO?.columns || [];
  const currentFormBO = businessObjects.find(bo => bo.name === formBOName);
  const currentFormBOColumns = currentFormBO?.columns || [];

  // 8. Candidate Metric Categorization helpers
  const allSuggestions = activeBO ? getSuggestionsForObject(activeBO) : [];
  const volumeSuggestions = allSuggestions.filter(s => s.category === "Volume Metrics");
  const durationSuggestions = allSuggestions.filter(s => s.category === "Duration Metrics");
  const statusSuggestions = allSuggestions.filter(s => s.category === "Status Metrics");
  const financialSuggestions = allSuggestions.filter(s => s.category === "Financial Metrics");
  const qualitySuggestions = allSuggestions.filter(s => s.category === "Quality Metrics");

  // Detailed feedback message depending on package status
  let lockoutMessage = "Metric Discovery requires an Approved Active Package Version.";
  let lockoutSubMessage = "Metric discovery and blueprint modeling rely on registered, reviewed, and finalized business data objects. The Candidate Metric Discovery, Metric Blueprint Creation, and Metric Library Actions are currently locked. Please select an active package inside the Knowledge Repository and secure an Approved status definition.";

  if (!hasApprovedPackage) {
    lockoutMessage = "Metric Discovery requires an Approved Active Package Version.";
    lockoutSubMessage = "Metric discovery and blueprint modeling rely on registered, reviewed, and finalized business data objects. The Candidate Metric Discovery, Metric Blueprint Creation, and Metric Library Actions are currently locked. Please select an active package inside the Knowledge Repository and secure an Approved status definition.";
  }

  return (
    <div className="space-y-6" id="metrics-discovery-workspace">
      
      {/* 1. Approved Active Package status banner or CTA lock */}
      {!hasApprovedPackage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in duration-300 shadow-xs" id="approved-package-lockout-banner">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 animate-pulse">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1.5 max-w-xl mx-auto">
            <h3 className="font-extrabold text-sm text-amber-950 uppercase tracking-wider">
              {lockoutMessage}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {lockoutSubMessage}
            </p>
          </div>
          <div className="pt-2">
            <button
               onClick={onGoToKnowledge}
              className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 inline-flex items-center space-x-2"
            >
              <span>Return to Knowledge Repository</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Multiple Approved Package enforcement indicator */}
      {hasApprovedPackage && hasMultipleApproved && (
        <div className="bg-indigo-50/60 border border-indigo-150 rounded-xl p-3.5 mb-4 text-xs text-indigo-950 flex items-start gap-2.5" id="multiple-approved-packages-notifier">
          <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wide text-[10px] text-indigo-805 block">Drafting from Active Version only</span>
            <p className="text-slate-650 leading-normal font-normal">
              Multiple approved package versions exist (Total: {approvedPackagesCount}). Only the Active package version 
              (<strong>Version {activePackage.package_version}</strong>) is currently driving Candidate Metric Discovery.
            </p>
          </div>
        </div>
      )}

      {/* Workspace Sub Header Tabs and Main Action Buttons Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-4" id="workspace-view-tabs">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setCurrentSubTab("analyze")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
              currentSubTab === "analyze"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen size={13} />
            <span>1. Explore Schema & Suggestions</span>
          </button>
          <button
            onClick={() => setCurrentSubTab("library")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer relative ${
              currentSubTab === "library"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListTodo size={13} />
            <span>2. Saved Blueprints Library</span>
            {blueprints.length > 0 && (
              <span className="bg-indigo-650 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                {blueprints.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentSubTab("ai")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
              currentSubTab === "ai"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles size={13} />
            <span>3. AI Assisted Discovery</span>
          </button>
        </div>

        <button
          onClick={handleOpenEmptyBuilder}
          disabled={!hasApprovedPackage}
          className={`font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center space-x-1.5 transition-all self-start sm:self-auto ${
            hasApprovedPackage
              ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md active:scale-95"
              : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
          }`}
          title={!hasApprovedPackage ? "Unlock by obtaining an Approved active package version" : "Define brand new metric spec"}
        >
          <Plus size={14} />
          <span>Define Metric Blueprint</span>
        </button>
      </div>

      {/* Discovery Insights banner explaining Phase 1 goal */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-transparent border border-indigo-150 rounded-2xl p-4 flex items-start gap-4">
        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wide">Metric Design Assistant</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            This module designs <strong>Metric Blueprints</strong> which contain visualization parameters, dependent database fields, formulas, and business purposes. Think of this as your design workspace where you convert raw schema tables into business KPIs.
          </p>
        </div>
      </div>

      {/* RENDER ACTIVE TAB CORES */}
      {currentSubTab === "analyze" ? (
        /* ======================== TAB 1: MASTER DETAIL SCHEMA ANALYSIS ======================== */
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${!hasApprovedPackage ? "opacity-60 pointer-events-none select-none filter grayscale-[30%]" : ""}`} id="analysis-master-detail">
          {/* Left Panel: Business Objects List */}
          <div className="lg:col-span-4 bg-white border border-slate-200/85 rounded-2xl p-4 space-y-4 shadow-sm" id="bo-master-list-card">
            <div className="space-y-2">
              <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-400">Business Objects Inventory</h4>
              <p className="text-xs text-slate-500 leading-normal font-normal">Select a structural object to map field schemas and see suggestions.</p>
            </div>

            {/* In-List Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Filter entity classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!hasApprovedPackage}
                className="w-full text-xs p-2 pl-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800"
              />
            </div>

            {filteredBOs.length === 0 ? (
              <p className="text-slate-400 italic text-center py-6 text-xs font-normal">No metadata entries matched your filter term.</p>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredBOs.map((bo, index) => {
                  const originalIndex = businessObjects.findIndex(original => original.name === bo.name);
                  const isSelected = originalIndex === selectedBOIndex;
                  return (
                    <button
                      key={bo.name || index}
                      onClick={() => {
                        if (hasApprovedPackage) {
                          setSelectedBOIndex(originalIndex);
                        }
                      }}
                      disabled={!hasApprovedPackage}
                      className={`w-full text-left p-3 rounded-xl transition-all border flex items-start gap-3 ${
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-xs"
                          : "bg-slate-50/50 border-slate-100 hover:bg-slate-100/40 text-slate-800"
                      } ${hasApprovedPackage ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? "bg-white text-indigo-600 border border-indigo-100" : "bg-white border border-slate-100 text-slate-400"
                      }`}>
                        <FileCode size={14} />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs truncate font-sans">{bo.name}</span>
                          <span className="font-mono text-[9px] text-slate-400 px-1 py-0.2 bg-slate-100 rounded">
                            {bo.columns?.length || 0} fields
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 line-clamp-1 leading-normal font-normal">{bo.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Quick overview of metric distribution */}
            <div className="border-t border-slate-100 pt-3.5 space-y-2">
              <span className="text-[10px] font-mono text-indigo-500 font-extrabold uppercase">Discovery Diagnostics</span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 block font-sans">Tables Registered</span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{businessObjects.length}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 block font-sans">Calculable Projections</span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">
                    {businessObjects.reduce((acc, current) => acc + getSuggestionsForObject(current).length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Selected Business Object Analysis */}
          {activeBO ? (
            <div className="lg:col-span-8 space-y-6" id="bo-detail-analysis-column">
              
              {/* 7. Business Object Context Improvements Panel */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div className="space-y-1 text-left">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Business Object Dossier
                    </span>
                    <h3 className="font-black text-lg text-slate-900 tracking-tight">{activeBO.name}</h3>
                    <p className="text-xs text-slate-505 leading-relaxed font-normal">{activeBO.description}</p>
                  </div>
                  {activeBO.table && (
                    <div className="bg-slate-90/50 border border-slate-200 p-3 rounded-xl text-left font-mono shrink-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">RELATIONAL TARGET TABLE</span>
                      <span className="text-xs font-semibold text-indigo-900 block mt-0.5">{activeBO.table}</span>
                    </div>
                  )}
                </div>

                {/* What exists and why this metric is possible segment */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-xs">
                    <Info size={14} className="text-indigo-600" />
                    <span>How supports Metric Discovery</span>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed font-normal">
                    This business object acts as an analytical anchor. Based on the presence of registered attributes, 
                    the system validates table keys, status tags, timestamps, and numeric metrics. This answers the core design question: 
                    <strong>"What data exists and why this metric is possible."</strong> Check the schema checklist below to map individual field values.
                  </p>
                </div>

                {/* Important Fields Table Grid */}
                <div className="space-y-3">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">Fields Schema & Context Directory</h4>
                  
                  {targetBOColumns.length === 0 ? (
                    <div className="p-6 bg-slate-50/60 text-center rounded-xl font-normal text-xs italic text-slate-400">
                      No columns or attribute fields have been cataloged inside this business object.
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-100 font-mono text-[10px] font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="px-4 py-3">Attribute Name</th>
                            <th className="px-4 py-3">Business Meaning & Application Usage</th>
                            <th className="px-5 py-3">Metric Relevant Fields & Relevance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {targetBOColumns.map((col: ImportantColumn, colIdx: number) => (
                            <tr key={col.name || colIdx} className="hover:bg-slate-50/35 transition-colors">
                              <td className="px-4 py-3.5 space-y-1.5 align-top min-w-[150px]">
                                <div className="flex items-center space-x-1.5">
                                  {getFieldIcon(col.name, col.datatype)}
                                  <span className="font-bold text-xs text-slate-800 break-all font-mono">{col.name}</span>
                                </div>
                                <span className="inline-block text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded uppercase">
                                  {col.datatype || "DB_TYPE"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 space-y-1 max-w-[280px] align-top">
                                <p className="font-medium text-slate-700 leading-relaxed font-normal">
                                  {col.business_meaning || "No business details cataloged for this attribute field."}
                                </p>
                                {col.application_usage && (
                                  <div className="text-[10px] text-indigo-700/80 flex items-start space-x-1.5 bg-indigo-50/20 max-w-fit px-2 py-0.5 rounded-lg border border-indigo-100/30 font-medium">
                                    <span className="shrink-0 text-indigo-900 font-bold">App Usage:</span>
                                    <span className="font-normal">{col.application_usage}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-slate-600 align-top font-normal leading-relaxed text-[11px] min-w-[200px]">
                                {col.metric_relevance ? (
                                  <div className="space-y-1">
                                    <span className="text-[8.5px] font-bold text-emerald-700 uppercase font-mono block">METRIC RELEVANT FIELD</span>
                                    <p className="text-slate-600 leading-normal text-xs">{col.metric_relevance}</p>
                                  </div>
                                ) : (
                                  <span className="italic text-slate-400">Unspecified KPI relevance.</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 8. Candidate Metric Organization card */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-5 shadow-sm" id="bo-metric-suggestions">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-400">Analytic Recommendations</h4>
                  <h3 className="font-black text-sm text-slate-900 font-sans">Business KPI Candidates Gallery</h3>
                  <p className="text-xs text-slate-500 leading-normal font-normal">
                    The Metric Assistant analyzed schema attributes and dynamically proposed these structured candidate metrics grouped by analytical categories:
                  </p>
                </div>

                {allSuggestions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                    No metric suggestions could be extracted from this Business Object's current column layout.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Render grouped sections */}
                    
                    {/* A. Volume Metrics */}
                    {volumeSuggestions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 border-b border-indigo-100 pb-1.5">
                          <TrendingUp size={16} className="text-indigo-600" />
                          <h4 className="font-black text-xs uppercase tracking-wider text-indigo-950">Volume Metrics</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {volumeSuggestions.map((sug, idx) => (
                            <SuggestionCard key={idx} sug={sug} onConvert={() => handleApplySuggestion(sug, activeBO)} hasApproved={hasApprovedPackage} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* B. Duration Metrics */}
                    {durationSuggestions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 border-b border-emerald-100 pb-1.5">
                          <Clock size={16} className="text-emerald-600" />
                          <h4 className="font-black text-xs uppercase tracking-wider text-emerald-950">Duration Metrics</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {durationSuggestions.map((sug, idx) => (
                            <SuggestionCard key={idx} sug={sug} onConvert={() => handleApplySuggestion(sug, activeBO)} hasApproved={hasApprovedPackage} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* C. Status Metrics */}
                    {statusSuggestions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 border-b border-blue-100 pb-1.5">
                          <Activity size={16} className="text-blue-600" />
                          <h4 className="font-black text-xs uppercase tracking-wider text-blue-950">Status Metrics</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {statusSuggestions.map((sug, idx) => (
                            <SuggestionCard key={idx} sug={sug} onConvert={() => handleApplySuggestion(sug, activeBO)} hasApproved={hasApprovedPackage} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* D. Financial Metrics */}
                    {financialSuggestions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 border-b border-amber-100 pb-1.5">
                          <Coins size={16} className="text-amber-600" />
                          <h4 className="font-black text-xs uppercase tracking-wider text-amber-950">Financial Metrics</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {financialSuggestions.map((sug, idx) => (
                            <SuggestionCard key={idx} sug={sug} onConvert={() => handleApplySuggestion(sug, activeBO)} hasApproved={hasApprovedPackage} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E. Quality Metrics */}
                    {qualitySuggestions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 border-b border-purple-100 pb-1.5">
                          <Award size={16} className="text-purple-600" />
                          <h4 className="font-black text-xs uppercase tracking-wider text-purple-950">Quality Metrics</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {qualitySuggestions.map((sug, idx) => (
                            <SuggestionCard key={idx} sug={sug} onConvert={() => handleApplySuggestion(sug, activeBO)} hasApproved={hasApprovedPackage} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 p-16 bg-white border border-slate-100 rounded-3xl text-center space-y-2">
              <span className="bg-amber-50 text-amber-650 px-3 py-1 rounded-full text-xs font-semibold">Discovery Index Empty</span>
              <p className="text-slate-500 font-semibold text-xs">No active business object has been detected.</p>
            </div>
          )}
        </div>
      ) : currentSubTab === "library" ? (
        /* ======================== TAB 2: METRIC BLUEPRINT LIBRARY ======================== */
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${!hasApprovedPackage ? "opacity-60 pointer-events-none select-none filter grayscale-[30%]" : ""}`} id="blueprints-library-view">
          
          {/* Left panel shows Form if open, Blueprint details, or Design Assistant Checklist */}
          <div className="lg:col-span-4 space-y-6">
            
            {isBuilderOpen ? (
              /* ACTIVE BUILDER FORM CONTAINER CARD */
              <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 space-y-4 shadow-xl text-left animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-mono font-bold bg-indigo-100 text-indigo-805 px-2 py-0.5 rounded uppercase tracking-wider block w-max">
                      Interactive Designer
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {editingBlueprintId ? "Modify Metric Blueprint" : "Define Metric Blueprint"}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsBuilderOpen(false);
                      setEditingBlueprintId(null);
                      setValidationErrors([]);
                      setShowValidationAlert(false);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Real-time completeness score indicator */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 font-sans">Blueprint Completeness</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${currentFormQuality.isComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {currentFormQuality.percentage}% ({currentFormQuality.statusLabel})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${currentFormQuality.isComplete ? "bg-emerald-500" : "bg-indigo-600"}`} 
                      style={{ width: `${currentFormQuality.percentage}%` }}
                    ></div>
                  </div>
                  {!currentFormQuality.isComplete && (
                    <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                      <span className="font-bold block text-slate-600">Remaining items required to reach 100% Quality:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[9.5px]">
                        {currentFormQuality.missing.map((it, idx) => (
                          <li key={idx} className="text-slate-500 truncate">{it}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Validation alert if saved with missing keys */}
                {showValidationAlert && validationErrors.length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs space-y-1.5 animate-in shake duration-200">
                    <div className="flex items-center space-x-1.5 font-bold text-rose-900">
                      <AlertCircle size={14} className="text-rose-600 shrink-0" />
                      <span>Validation Errors found:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] font-medium pl-1">
                      {validationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleSaveBlueprint} className="space-y-4 text-xs font-normal">
                  {/* Metric Name */}
                  <div className="space-y-1 flex flex-col">
                    <label className="font-bold text-slate-700 font-sans uppercase text-[10px] flex items-center justify-between">
                      <span>Metric Name *</span>
                      {formName.trim() && <span className="text-emerald-600 text-[10px] font-bold">✓ Valid</span>}
                    </label>
                    <input
                      type="text"
                      className="p-2.5 border border-slate-300 rounded-xl text-slate-800 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g. Average Resolution Time"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 leading-normal">Use clear customer-oriented labels (avoid tech phrasing like record ages or counts).</p>
                  </div>

                  {/* Business Purpose */}
                  <div className="space-y-1 flex flex-col">
                    <label className="font-bold text-slate-700 font-sans uppercase text-[10px] flex items-center justify-between">
                      <span>Business Purpose *</span>
                      {formPurpose.trim().length >= 10 && <span className="text-emerald-600 text-[10px] font-bold">✓ Valid</span>}
                    </label>
                    <textarea
                      className="p-2.5 border border-slate-300 rounded-xl text-slate-800 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none h-20 text-xs font-sans"
                      placeholder="Explain what organizational benefit this metrics scorecard delivers..."
                      value={formPurpose}
                      onChange={(e) => setFormPurpose(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 leading-normal">What does this track and why does it exist in the business?</p>
                  </div>

                  {/* Business Object Selector */}
                  <div className="space-y-1 flex flex-col">
                    <label className="font-bold text-slate-700 font-sans uppercase text-[10px] flex items-center justify-between">
                      <span>Related Business Object *</span>
                      {formBOName && <span className="text-emerald-600 text-[10px] font-bold">✓ Selection complete</span>}
                    </label>
                    <select
                      className="p-2.5 border border-slate-300 rounded-xl text-slate-800 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                      value={formBOName}
                      onChange={(e) => {
                        setFormBOName(e.target.value);
                        setFormRequiredFields([]); // Reset checkboxes
                      }}
                    >
                      <option value="">-- Choose Data Object --</option>
                      {businessObjects.map(bo => (
                        <option key={bo.name} value={bo.name}>{bo.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Required Fields checkboxes BASED ON CURRENT FORM BO */}
                  {formBOName && currentFormBOColumns.length > 0 && (
                    <div className="space-y-2 border border-slate-150 p-3 bg-slate-50/45 rounded-xl">
                      <span className="font-bold text-slate-700 font-sans uppercase text-[10px] block pb-1 border-b border-slate-200/60 flex items-center justify-between">
                        <span>Check Required Fields *</span>
                        {formRequiredFields.length > 0 ? (
                          <span className="text-emerald-650 font-bold text-[10px]">{formRequiredFields.length} selected</span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[10px]">Select at least one</span>
                        )}
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {currentFormBOColumns.map((col: ImportantColumn) => {
                          const isSelected = formRequiredFields.includes(col.name);
                          return (
                            <label
                              key={col.name}
                              className={`flex items-start p-2 rounded-lg border transition-all cursor-pointer ${
                                isSelected ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleRequiredField(col.name)}
                                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="ml-2.5 text-left min-w-0">
                                <span className="font-mono font-bold text-[11px] text-slate-800 break-all">{col.name}</span>
                                <span className="text-[9px] text-slate-400 ml-1.5 font-mono">({col.datatype})</span>
                                <p className="text-[10px] text-slate-500 line-clamp-1 truncate font-normal leading-normal">{col.business_meaning}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Formula Description */}
                  <div className="space-y-1 flex flex-col">
                    <label className="font-bold text-slate-700 font-sans uppercase text-[10px] flex items-center justify-between">
                      <span>Formula Description *</span>
                      {formFormula.trim().length >= 10 && <span className="text-emerald-600 text-[10px] font-bold">✓ Valid</span>}
                    </label>
                    <input
                      type="text"
                      className="p-2.5 border border-slate-300 rounded-xl text-slate-800 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g. Calculate the total value of approved purchase orders."
                      value={formFormula}
                      onChange={(e) => setFormFormula(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 leading-normal">Explain the calculation methodology clearly for business analysts (no raw SQL formulas).</p>
                  </div>

                  {/* Visualization Recommendation dropdown */}
                  <div className="space-y-1 flex flex-col">
                    <label className="font-bold text-slate-700 font-sans uppercase text-[10px]">Visualization Recommendation</label>
                    <select
                      className="p-2.5 border border-slate-300 rounded-xl text-slate-800 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                      value={formVis}
                      onChange={(e) => setFormVis(e.target.value)}
                    >
                      <option value="Line Chart">Line Chart</option>
                      <option value="Bar Chart">Bar Chart</option>
                      <option value="Donut Chart">Donut Chart</option>
                      <option value="Big Number Card">Big Number Card</option>
                      <option value="Area Chart">Area Chart</option>
                      <option value="Scatter Plot">Scatter Plot</option>
                    </select>
                  </div>

                  {/* Implementation Notes */}
                  <div className="space-y-1 flex flex-col">
                    <label className="font-bold text-slate-700 font-sans uppercase text-[10px]">Implementation Notes (Optional)</label>
                    <textarea
                      className="p-2.5 border border-slate-300 rounded-xl text-slate-800 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none h-18 font-sans"
                      placeholder="Include notes on triggers, indexing recommendations or developer guidelines..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBuilderOpen(false);
                        setEditingBlueprintId(null);
                        setValidationErrors([]);
                        setShowValidationAlert(false);
                      }}
                      className="w-1/2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 p-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer shadow-md text-center"
                    >
                      {editingBlueprintId ? "Save Changes" : "Create Blueprint"}
                    </button>
                  </div>
                </form>
              </div>
            ) : viewingBlueprint ? (
              /* DETAILED VIEW CARD OF A BLUEPRINT */
              <div className="bg-white border border-slate-205 rounded-2xl p-5 space-y-4 shadow-md text-left animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-mono font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase block">
                      Blueprint Spec Details
                    </span>
                    <h3 className="font-sans font-black text-sm text-slate-900 leading-tight">
                      {viewingBlueprint.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setViewingBlueprint(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Completeness Badge on Details View */}
                {(() => {
                  const qual = getBlueprintQuality(viewingBlueprint);
                  return (
                    <div className="flex items-center justify-between text-xs p-2 bg-slate-50 border border-slate-150 rounded-lg">
                      <span className="font-bold text-slate-500 font-mono text-[9px] uppercase">SPEC COMPLIANCE</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${qual.isComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {qual.percentage}% ({qual.statusLabel})
                      </span>
                    </div>
                  );
                })()}

                <div className="space-y-3.5 text-xs">
                  {/* Purpose */}
                  {viewingBlueprint.business_purpose && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider font-mono text-[9px] block">Business Purpose</span>
                      <p className="text-slate-700 leading-relaxed font-normal">{viewingBlueprint.business_purpose}</p>
                    </div>
                  )}

                  {/* Business Object */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-400 uppercase tracking-wider font-mono text-[9px] block">Business Object</span>
                      <p className="font-semibold text-slate-800">{viewingBlueprint.business_object_name}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-400 uppercase tracking-wider font-mono text-[9px] block">UI Visualization</span>
                      <p className="font-semibold text-indigo-650">{viewingBlueprint.visualization_recommendation}</p>
                    </div>
                  </div>

                  {/* Required Fields list */}
                  {viewingBlueprint.required_fields && viewingBlueprint.required_fields.length > 0 && (
                    <div className="space-y-1 bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-left">
                      <span className="font-bold text-slate-400 uppercase tracking-wider font-mono text-[9px] block">Target Fields</span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {viewingBlueprint.required_fields.map(f => (
                          <span key={f} className="font-mono text-[9px] bg-white border border-slate-200 text-slate-705 px-1.5 py-0.2 rounded font-semibold shadow-2xs">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formula Description */}
                  {viewingBlueprint.formula_description && (
                    <div className="space-y-1 bg-slate-900 text-sky-300 font-mono p-3 rounded-xl border border-sky-950 shadow-inner">
                      <span className="text-slate-400 font-bold uppercase tracking-wider font-mono text-[8px] block">Calculation methodology</span>
                      <code className="text-xs text-sky-200 whitespace-pre-wrap leading-relaxed">{viewingBlueprint.formula_description}</code>
                    </div>
                  )}

                  {/* Implementation Notes */}
                  {viewingBlueprint.implementation_notes && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider font-mono text-[9px] block">Implementation Notes</span>
                      <p className="text-slate-650 leading-normal font-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100">{viewingBlueprint.implementation_notes}</p>
                    </div>
                  )}

                  {/* Last updated */}
                  <div className="text-[10px] text-slate-400 font-mono text-right pt-2 border-t border-slate-100">
                    Last changes: {new Date(viewingBlueprint.last_updated).toLocaleString()}
                  </div>

                  <div className="flex space-x-2 pt-1.5">
                    <button
                      onClick={() => handleEditBlueprint(viewingBlueprint)}
                      disabled={!hasApprovedPackage}
                      className="w-1/2 bg-slate-100 hover:bg-slate-200 text-indigo-705 font-bold py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center space-x-1"
                    >
                      <Edit2 size={12} />
                      <span>Edit Spec</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBlueprint(viewingBlueprint.id)}
                      disabled={!hasApprovedPackage}
                      className="w-1/2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center space-x-1"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* QUICK TUTORIALS TIPS SIDE PANEL BY DEFAULT (Design Assistant guidance) */
              <div className="bg-white border border-slate-200/85 rounded-2xl p-5 space-y-4 shadow-sm text-left">
                <div className="space-y-1 pb-2 border-b border-slate-100">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                    <Award size={13} className="text-indigo-600" />
                    <span>Design Assistant Guide</span>
                  </h4>
                  <h3 className="font-black text-sm text-slate-900 font-sans">Business Metric Delivery</h3>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  The goal of Metric discovery is mapping persistent enterprise field schemas to actionable indicators.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-2.5 text-xs font-normal">
                    <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-650 shrink-0">
                      <HelpCircle size={13} />
                    </div>
                    <div className="space-y-0.5 animate-in">
                      <h5 className="font-bold text-slate-800">What is a high quality KPI?</h5>
                      <p className="text-slate-500 text-[11px] leading-relaxed">A high quality KPI uses human-friendly business naming, charts target trends, and specifies necessary database field dependencies.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs font-normal">
                    <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-650 shrink-0">
                      <CheckCircle size={13} />
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-slate-800">How should formulas look?</h5>
                      <p className="text-slate-505 text-[11px] leading-relaxed">Formulas must avoid SQL syntax details and instead use plain language business calculable expressions understandable to non-tech managers.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-100/50 p-3 rounded-xl text-left">
                  <span className="text-[9px] font-mono text-indigo-750 font-extrabold uppercase tracking-wide block">PRO TIP</span>
                  <p className="text-slate-650 text-[10px] mt-0.5 leading-normal">
                    You can convert suggested candidate metrics into fully complete blueprints with one single click inside the schema analysis tab.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Blueprint List */}
          <div className="lg:col-span-8 bg-white border border-slate-200/85 rounded-2xl p-6 space-y-5 shadow-sm text-left" id="library-main-listing">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <div className="space-y-0.5">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-400">Blueprint Registry Inventory</h4>
                <h3 className="font-black text-sm text-slate-900 font-sans">Active Metric Blueprints Library</h3>
              </div>
              <span className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-0.8 rounded-full font-bold">
                {blueprints.length} Items Defined
              </span>
            </div>

            {saveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-850 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Success: Metric Blueprint spec saved successfully to application configuration repository!</span>
              </div>
            )}

            {blueprints.length === 0 ? (
              /* EMPTY STATE FOR BLUEPRINT LIBRARY */
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="p-4 bg-indigo-50 border border-indigo-100 inline-block rounded-full text-indigo-505">
                  <ListTodo size={28} />
                </div>
                <div>
                  <h4 className="font-sans font-black text-slate-900 text-base">No metric blueprints defined yet.</h4>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-normal">
                    Metric Blueprints map database schemas to actionable indicators. Explore suggested candidates under the <strong className="text-indigo-650">Explore Schema</strong> sub-tab to map schema patterns.
                  </p>
                </div>
                {hasApprovedPackage && (
                  <button
                    onClick={handleOpenEmptyBuilder}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    Define First Metric Spec
                  </button>
                )}
              </div>
            ) : (
              /* INVENTORY LIST WITH REAL-TIME QUALITY INDICATOR */
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {blueprints.map((bp) => {
                  const isViewingThis = viewingBlueprint?.id === bp.id;
                  const completeness = getBlueprintQuality(bp);
                  return (
                    <div
                      key={bp.id}
                      className={`p-4 border rounded-xl transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                        isViewingThis
                          ? "border-indigo-300 bg-indigo-50/20 shadow-xs"
                          : "border-slate-150 hover:bg-slate-50/40 bg-white"
                      }`}
                    >
                      <div className="space-y-1.5 text-left min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-905 font-sans truncate">{bp.name}</h4>
                          <span className="bg-slate-100 text-slate-650 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                            {bp.business_object_name}
                          </span>
                          <span className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/50 text-indigo-705 text-[8.5px] font-semibold px-2 py-0.2 rounded-full font-mono">
                            {bp.visualization_recommendation}
                          </span>
                          {/* 6. Quality Indicator Badge inside List item */}
                          <span className={`text-[9.5px] font-bold px-2 py-0.2 rounded-full ${completeness.isComplete ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                            {completeness.percentage}% Quality ({completeness.statusLabel})
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-normal line-clamp-1 font-normal">
                          {bp.business_purpose || "No stated metric business purpose cataloged."}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-[8.5px] font-mono text-slate-400">
                            UPDATED: {new Date(bp.last_updated).toLocaleDateString()}
                          </span>
                          {bp.required_fields && bp.required_fields.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <span className="text-[8.5px] text-slate-450 font-mono font-bold uppercase">Key Dependencies:</span>
                              <div className="flex space-x-1 bg-slate-50 px-1 py-0.2 rounded-md border border-slate-100">
                                {bp.required_fields.map(f => (
                                  <span key={f} className="text-[8.5px] font-mono text-slate-600 font-semibold px-1">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => setViewingBlueprint(bp)}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:text-slate-850 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                          title="View Full Spec Detail"
                        >
                          <Eye size={11} />
                          <span>View Spec</span>
                        </button>
                        <button
                          onClick={() => handleEditBlueprint(bp)}
                          disabled={!hasApprovedPackage}
                          className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center space-x-1 ${
                            hasApprovedPackage
                              ? "text-indigo-700 bg-white hover:bg-indigo-50 border-indigo-150 hover:border-indigo-250 cursor-pointer"
                              : "text-slate-400 bg-slate-50 border-slate-100 cursor-not-allowed opacity-50"
                          }`}
                          title="Edit Blueprint Spec"
                        >
                          <Edit2 size={11} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBlueprint(bp.id)}
                          disabled={!hasApprovedPackage}
                          className={`p-1.5 rounded-lg transition-colors ${
                            hasApprovedPackage 
                              ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer" 
                              : "text-slate-300 cursor-not-allowed opacity-50"
                          }`}
                          title="Delete Blueprint Spec"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================== TAB 3: AI ASSISTED DISCOVERY ======================== */
        <div className={`space-y-6 ${!hasApprovedPackage ? "opacity-60 pointer-events-none select-none filter grayscale-[30%]" : ""}`} id="ai-discovery-view">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-800 rounded-2xl p-6 text-indigo-50 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2">
                <Sparkles size={20} className="text-indigo-400" />
                <h3 className="font-extrabold text-lg text-white">AI Metric Analyst</h3>
              </div>
              <p className="text-indigo-200/90 text-sm leading-relaxed">
                Automatically generate high-value candidate metric blueprints by asking the AI Assistant to review your current business package definitions, application fields, and business rules. The AI evaluates relationship structures to propose calculations with the highest analytical yield.
              </p>
            </div>
            <button
              onClick={handleRunAiAnalysis}
              disabled={!hasApprovedPackage || isAiLoading}
              className={`whitespace-nowrap font-extrabold text-sm px-6 py-3 rounded-xl shadow-xl transition-all flex items-center space-x-2 ${
                isAiLoading ? "bg-indigo-800 text-indigo-300 cursor-wait outline-none" : "bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer hover:shadow-indigo-500/20 active:scale-95"
              }`}
            >
              {isAiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing Schema...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Execute AI Analysis</span>
                </>
              )}
            </button>
          </div>

          {aiAnalysisComplete && aiSuggestions.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">No Suggestions Output</span>
              <p className="text-slate-600 font-medium text-sm">
                The AI Analyst could not identify any suitable metric calculations from the provided schema definitions. Try adding numeric values or status definitions to your Business Objects.
              </p>
            </div>
          )}

          {aiSuggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="font-black text-sm text-slate-800">Generated Metric Proposals</h4>
                <span className="text-xs font-bold text-slate-500">{aiSuggestions.length} candidates pending review</span>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {aiSuggestions.map((sug) => (
                  <div key={sug.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all focus-within:ring-2 ring-indigo-500/20 group">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      
                      <div className="space-y-4 flex-1">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-black text-base text-slate-900">{sug.metric_name}</h5>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                              sug.confidence_level === "High" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              sug.confidence_level === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {sug.confidence_score}% Confidence
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{sug.business_purpose}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Business Value Context</span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">{sug.business_value}</p>
                          </div>
                          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-1.5">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Formula Description</span>
                            <p className="text-xs text-indigo-900 font-bold font-mono">{sug.suggested_formula}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Analytical Reasoning</span>
                            <p className="text-xs text-slate-600">{sug.reasoning}</p>
                        </div>
                      </div>

                      <div className="md:w-64 shrink-0 space-y-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Visualization</span>
                          <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                            <Eye size={12} className="text-slate-400" />
                            <span>{sug.recommended_visualization}</span>
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Required Components</span>
                          <div className="flex flex-wrap gap-1">
                            {sug.required_fields.map(f => (
                               <span key={f} className="text-[9px] font-mono border border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded">
                                 {f}
                               </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-2 flex flex-col space-y-2">
                           <button 
                             onClick={() => handleApplyAiSuggestion(sug)}
                             className="w-full bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-2"
                           >
                              <CheckCircle size={14} />
                              <span>Convert to Blueprint</span>
                           </button>
                           <button 
                             onClick={() => handleRejectAiSuggestion(sug.id)}
                             className="w-full bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-2"
                           >
                              <Trash2 size={13} />
                              <span>Dismiss</span>
                           </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponent: Render beautifully styled Candidate Metric Suggestion Cards
interface SuggestionCardProps {
  key?: React.Key;
  sug: MetricSuggestion;
  onConvert: () => void;
  hasApproved: boolean;
}

function SuggestionCard({ sug, onConvert, hasApproved }: SuggestionCardProps) {
  return (
    <div
      className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/40 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[8.5px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-705 px-2 py-0.5 rounded uppercase tracking-wider">
            {sug.category}
          </span>
          <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 font-semibold">
            <span>Viz:</span>
            <span className="text-slate-650">{sug.visualization}</span>
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="font-sans font-black text-xs text-slate-900 leading-tight">{sug.name}</h4>
          <p className="text-[10.5px] text-slate-550 leading-relaxed font-normal">{sug.description}</p>
        </div>

        {/* Dynamic Sug rationale reasoning description */}
        <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-lg text-[10.5px] text-sky-950 font-normal leading-relaxed whitespace-pre-line">
          <span className="text-[8.5px] font-mono font-black text-sky-800 uppercase block tracking-wider mb-0.5">SUGGESTION RATIONALE</span>
          {sug.reasoning}
        </div>

        {/* Structured plane business formula description */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-950 shadow-inner space-y-1 text-sky-305">
          <span className="text-[8px] font-mono font-black text-slate-400 block uppercase tracking-wide">HOW IT IS CALCULATED</span>
          <p className="font-mono text-[9.5px] leading-relaxed text-sky-105">{sug.formula}</p>
        </div>

        {sug.fields.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[8.5px] font-black text-slate-400 uppercase font-mono mr-1">Supporting fields:</span>
            {sug.fields.map(f => (
              <span key={f} className="text-[9px] font-mono bg-white text-slate-600 border border-slate-200/80 px-1.5 py-0.2 rounded font-semibold shadow-2xs">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 mt-4 px-0.5 flex justify-end">
        <button
          onClick={onConvert}
          disabled={!hasApproved}
          className={`text-xs font-bold inline-flex items-center space-x-1 transition-all ${
            hasApproved 
              ? "text-indigo-650 hover:text-indigo-800 cursor-pointer active:scale-95 hover:underline" 
              : "text-slate-350 cursor-not-allowed opacity-50"
          }`}
        >
          <span>Convert to Blueprint</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
