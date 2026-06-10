import React from 'react';
import { Layers, FileCode, Search, BarChart3, Binary, MessageSquare, Terminal } from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  activeTab: NavItem;
  setActiveTab: (tab: NavItem) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    {
      id: 'applications' as NavItem,
      label: 'Applications',
      icon: Layers,
      phase: 'Phase 1',
      enabled: true,
      desc: 'Create, monitor & manage apps'
    },
    {
      id: 'packages' as NavItem,
      label: 'Application Packages',
      icon: FileCode,
      phase: 'Phase 2',
      enabled: true,
      desc: 'Upload standard app packages'
    },
    {
      id: 'explorer' as NavItem,
      label: 'Knowledge Base',
      icon: Search,
      phase: 'Phase 1-3',
      enabled: true,
      desc: 'Browse schemas & operations'
    },
    {
      id: 'metrics' as NavItem,
      label: 'Metrics',
      icon: BarChart3,
      phase: 'Phase 4',
      enabled: true,
      desc: 'Define and orchestrate formulas'
    },
    {
      id: 'blueprints' as NavItem,
      label: 'Blueprints',
      icon: Binary,
      phase: 'Phase 5',
      enabled: true,
      desc: 'Deploy target specifications'
    },
    {
      id: 'prompts' as NavItem,
      label: 'Prompt Generator',
      icon: MessageSquare,
      phase: 'Phase 6',
      enabled: true,
      desc: 'Standardize onboarding CLI'
    }
  ];

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl" id="sidebar-container">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/40" id="sidebar-logo-container">
        <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-inner">
          <Terminal size={22} className="text-indigo-400 animate-pulse" />
        </div>
        <div>
          <h1 className="font-sans font-bold text-lg text-white leading-tight tracking-tight">AIR Console</h1>
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">Application Intel Repo</span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-4" id="sidebar-nav-list">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-start space-x-3.5 p-3.5 rounded-xl transition-all duration-200 group text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border-l-4 border-indigo-500'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border-l-4 border-transparent'
              }`}
            >
              <IconComponent
                size={20}
                className={`mt-0.5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold text-sm leading-none">{item.label}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md border ${
                    isActive ? 'bg-indigo-700 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {item.phase}
                  </span>
                </div>
                <p className={`text-xs mt-1 leading-snug font-normal ${
                  isActive ? 'text-indigo-100/80' : 'text-slate-500 group-hover:text-slate-400'
                }`}>
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer System Meta (No noisy telemetry, clean/literal status) */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 flex flex-col items-center justify-center space-y-1.5 font-mono text-[10px] text-slate-500" id="sidebar-meta-footer">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AIR Repository Core Active</span>
        </div>
        <span className="text-slate-600">Phase 1 Release v1.0.0</span>
      </div>
    </aside>
  );
}
