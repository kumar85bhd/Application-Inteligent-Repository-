import React from 'react';
import { 
  FileCode, Search, BarChart3, Binary, MessageSquare, 
  Calendar, Layers, Clock, ShieldCheck, ArrowRight, CornerDownRight
} from 'lucide-react';
import { NavItem } from '../types';

interface PlaceholderViewProps {
  module: NavItem;
}

export default function PlaceholderView({ module }: PlaceholderViewProps) {
  // Information catalog of upcoming release items
  const moduleConfig = {
    packages: {
      title: 'Application Package Management',
      subtitle: 'Phase 2: Standard Onboarding Blueprint Integration',
      targetPhrase: 'Application Package Management will be available in Phase 2.',
      icon: FileCode,
      color: 'blue',
      description: 'Standardize the cataloging of your service components by directly uploading structured application definition files.',
      details: [
        'Upload YAML application packages generated from direct code scanning tools.',
        'Version control application schemas, entities, columns, workflows, and business definitions.',
        'Validate configuration keys dynamically to guarantee upstream microservice standards.'
      ]
    },
    explorer: {
      title: 'Knowledge Base Hub',
      subtitle: 'Phase 3: Relational Schema & Action Discoveries',
      targetPhrase: 'Knowledge Base will be available in Phase 3.',
      icon: Search,
      color: 'purple',
      description: 'Explore the full organizational architecture and microservice maps visually without needing access to base repositories.',
      details: [
        'Explore auto-indexed application schemas, tables, and relationships.',
        'Search structures contextually across all registered workspace teams.',
        'Identify rules and dependencies quickly with visual operational flow diagrams.'
      ]
    },
    metrics: {
      title: 'Metrics Management',
      subtitle: 'Phase 4: Manual Metric & KPI Orchestration',
      targetPhrase: 'Metric Management will be available in Phase 4.',
      icon: BarChart3,
      color: 'amber',
      description: 'Define and standardize core operational analytics metrics and mapping logic systematically in one collaborative hub.',
      details: [
        'Create, edit, and delete metrics manually (e.g., SLA compliance, Ticket counts).',
        'Map database tables and operational columns to explicit metric components.',
        'Formulate precise business formulas using standard relational syntax templates.'
      ]
    },
    blueprints: {
      title: 'Blueprints Hub',
      subtitle: 'Phase 5: Implementation-Ready Developer Specifications',
      targetPhrase: 'Blueprint Generation will be available in Phase 5.',
      icon: Binary,
      color: 'emerald',
      description: 'Compile complex metric formulas into structured developer documents digestible by developers and AI coding agents alike.',
      details: [
        'Export detailed markdown specifications for Cursor, Claude Code, or Roo.',
        'Summarize formula equations, relevant tables, filtering tags, and layout suggestions.',
        'Facilitate seamless data standardizations across multiple engineering squads.'
      ]
    },
    prompts: {
      title: 'Application Package Prompt Generator',
      subtitle: 'Phase 6: Standardized AI Prompts & Templates',
      targetPhrase: 'Application Package Prompt Generator will be available in Phase 6.',
      icon: MessageSquare,
      color: 'indigo',
      description: 'Speed up application registry processes with structured prompts that direct AI tools to scan and compile YAML schemas.',
      details: [
        'Copy and download pre-configured prompts for Roo or equivalent AI search layers.',
        'Integrate standard code analysis configurations directly into developer terminals.',
        'Download sample templates and quick-start schema guidelines.'
      ]
    },
    applications: {
      title: 'Applications Directory',
      subtitle: 'Applications Management Directory',
      targetPhrase: 'Active application database.',
      icon: Layers,
      color: 'slate',
      description: '',
      details: []
    }
  };

  const config = moduleConfig[module];
  const IconComponent = config.icon;

  const colorStyles = {
    blue: 'border-blue-200 bg-blue-50/50 text-blue-700 select-badge-blue',
    purple: 'border-purple-200 bg-purple-50/50 text-purple-700 select-badge-purple',
    amber: 'border-amber-200 bg-amber-50/50 text-amber-700 select-badge-amber',
    emerald: 'border-emerald-200 bg-emerald-50/50 text-emerald-700 select-badge-emerald',
    indigo: 'border-indigo-200 bg-indigo-50/50 text-indigo-700 select-badge-indigo',
    slate: 'border-slate-200 bg-slate-50/50 text-slate-700 select-badge-slate'
  }[config.color as 'blue'|'purple'|'amber'|'emerald'|'indigo'|'slate'];

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 text-left" id={`placeholder-view-${module}`}>
      {/* Container Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-sm space-y-8">
        
        {/* Banner with Icon and Title */}
        <div className="flex flex-col md:flex-row md:items-center gap-5 justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10`}>
              <IconComponent size={26} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Roadmap Milestone</span>
              <h3 className="font-sans font-black text-2xl text-slate-900 tracking-tight mt-0.5">{config.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{config.subtitle}</p>
            </div>
          </div>

          <span className={`border px-3.5 py-1.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-widest self-start md:self-auto ${colorStyles}`}>
            {config.subtitle.split(':')[0]}
          </span>
        </div>

        {/* Highlight Target Message Block (Required empty state literal messaging) */}
        <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start space-x-4">
          <div className="p-2 bg-white border border-slate-200 text-indigo-600 rounded-xl shadow-xs shrink-0 mt-0.5">
            <Clock size={18} className="animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-wider">Release Capability Notice</h4>
            <p className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
              {config.targetPhrase}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-normal">
              {config.description} This functionality will map standard code inputs natively into the unified Metrics Hub console interface.
            </p>
          </div>
        </div>

        {/* Future Capabilities Breakdown List */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Planned Integration Offerings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id={`placeholder-grid-${module}`}>
            {config.details.map((detail, index) => (
              <div 
                key={index}
                className="border border-slate-200/70 p-5 rounded-2xl bg-white hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-mono font-bold text-[11px] text-indigo-600">
                    0{index + 1}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {detail}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 pt-4 mt-auto">
                  <ShieldCheck size={12} className="text-indigo-400" />
                  <span>Spec Standardized</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Steps */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <Calendar size={13} />
            <span>Target Deployment Calendar: H3 2026 Release Cycle</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold cursor-default">
            <span>Status: Standard Backlog</span>
            <ArrowRight size={13} />
          </div>
        </div>

      </div>
    </div>
  );
}
