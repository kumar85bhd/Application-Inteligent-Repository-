import React from 'react';
import { Edit3, Trash2, Shield, Calendar, ChevronRight, User } from 'lucide-react';
import { Application } from '../types';

interface ApplicationCardProps {
  key?: string | number;
  application: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string, name: string) => void | Promise<void>;
  onView: (id: string) => void;
}

export default function ApplicationCard({ application, onEdit, onDelete, onView }: ApplicationCardProps) {
  const { id, name, description, owner, status, created_at } = application;

  // Render correct color tag per standard enterprise statuses
  const getStatusBadge = (appStatus: Application['status']) => {
    switch (appStatus) {
      case 'Active':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Active</span>
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Draft</span>
          </span>
        );
      case 'Archived':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Archived</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id={`app-card-${id}`}
      className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
    >
      {/* Top Banner Context */}
      <div className="space-y-3.5" id={`app-card-top-${id}`}>
        <div className="flex items-start justify-between">
          {getStatusBadge(status)}
          {/* Action Triggers */}
          <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              id={`btn-edit-card-${id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(application);
              }}
              title="Edit application metadata"
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Edit3 size={15} />
            </button>
            <button
              id={`btn-delete-card-${id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id, name);
              }}
              title="Delete application"
              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Name and Description */}
        <div className="space-y-1.5 cursor-pointer" onClick={() => onView(id)}>
          <h3 className="font-sans font-bold text-lg text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors tracking-tight flex items-center space-x-1.5">
            <span>{name}</span>
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </div>

      {/* Footer Info details */}
      <div className="border-t border-slate-100 mt-5 pt-4 flex flex-col gap-2.5 text-xs text-slate-500" id={`app-card-footer-${id}`}>
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center space-x-1.5">
            <User size={13} className="text-slate-400" />
            <span className="truncate max-w-[140px] text-slate-500 font-medium" title={`Owner: ${owner}`}>
              {owner || 'Unspecified'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Calendar size={13} className="text-slate-400" />
            <span className="text-slate-500 font-mono">{formatDate(created_at)}</span>
          </div>
        </div>

        {/* View Specification CTA Button */}
        <button
          id={`btn-view-spec-${id}`}
          onClick={() => onView(id)}
          className="w-full mt-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-700 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl font-semibold transition-all group-hover:translate-y-0 text-xs"
        >
          <span>Explore Knowledge Core</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
