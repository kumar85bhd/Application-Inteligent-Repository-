import React from 'react';
import { Search, Plus, Database, CheckCircle, HelpCircle, Layers } from 'lucide-react';
import { Application } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewAppClick: () => void;
  applications: Application[];
}

export default function Header({ searchQuery, setSearchQuery, onNewAppClick, applications }: HeaderProps) {
  const totalCount = applications.length;
  const activeCount = applications.filter(a => a.status === 'Active').length;
  const draftCount = applications.filter(a => a.status === 'Draft').length;
  const archivedCount = applications.filter(a => a.status === 'Archived').length;

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm" id="main-header">
      {/* Title & Stats block */}
      <div className="space-y-1.5" id="header-title-block">
        <h2 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center space-x-2">
          <span>Application Intelligence Repository</span>
          <span className="text-xs font-mono font-semibold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            AIR Console
          </span>
        </h2>
        <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
          The structural center of truth for indexing your production databases, microservices, workflows, and metrics standardizations.
        </p>

        {/* Dense Enterprise Metrics Row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2.5" id="header-stats-row">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600">
            <Layers size={14} className="text-sky-500" />
            <span>Applications:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{totalCount}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600">
            <CheckCircle size={14} className="text-emerald-500" />
            <span>Active:</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{activeCount}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600">
            <HelpCircle size={14} className="text-amber-500" />
            <span>Draft:</span>
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{draftCount}</span>
          </div>
          {archivedCount > 0 && (
            <>
              <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600">
                <Database size={14} className="text-slate-400" />
                <span>Archived:</span>
                <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{archivedCount}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action items: Search and button */}
      <div className="flex items-center gap-3.5 shrink-0" id="header-actions-block">
        {/* Search Container */}
        <div className="relative w-64 md:w-72" id="header-search-container">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="app-search-input"
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none pl-10 pr-4 py-2 text-sm text-slate-800 rounded-xl transition-all shadow-inner placeholder:text-slate-400"
          />
        </div>

        {/* Create Application Primary Button */}
        <button
          id="btn-create-application"
          onClick={onNewAppClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-2 px-5 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>Register Application</span>
        </button>
      </div>
    </header>
  );
}
