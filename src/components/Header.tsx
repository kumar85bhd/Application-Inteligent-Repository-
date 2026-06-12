import React from 'react';
import { Search, Plus, Layers } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewAppClick: () => void;
  isWorkspaceView?: boolean;
}

export default function Header({ searchQuery, setSearchQuery, onNewAppClick, isWorkspaceView }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm" id="main-header">
      {/* Title block */}
      <div className="space-y-1.5" id="header-title-block">
        <h2 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center space-x-2">
          <Layers size={24} className="text-indigo-600" />
          <span>Application Intelligence Repository (AIR)</span>
        </h2>
        <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
          Store, catalog, and manage core knowledge assets of your integrated enterprise application landscape to design GenAI metrics.
        </p>
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
