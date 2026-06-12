import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Info } from 'lucide-react';
import { Application, CreateApplicationDTO } from '../types';

interface ApplicationFormProps {
  application?: Application | null; // If preset, we are EDITING
  onClose: () => void;
  onSubmit: (data: CreateApplicationDTO) => Promise<void>;
}

export default function ApplicationForm({ application, onClose, onSubmit }: ApplicationFormProps) {
  const isEdit = !!application;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Application['status']>('Draft');
  const [notes, setNotes] = useState('');
  
  // Validation and loading states
  const [errors, setErrors] = useState<{ name?: string; url?: string; description?: string }>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Populate data on mount or app change
  useEffect(() => {
    if (application) {
      setName(application.name);
      setDescription(application.description);
      setUrl(application.url || '');
      setStatus(application.status);
      setNotes(application.notes || '');
    } else {
      setName('');
      setDescription('');
      setUrl('');
      setStatus('Draft');
      setNotes('');
    }
    setErrors({});
    setApiError(null);
  }, [application]);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) {
      nextErrors.name = 'Application Name is required.';
    }
    if (url.trim()) {
      try {
        new URL(url.trim());
      } catch (e) {
        nextErrors.url = 'Provide a valid URL (e.g. https://servicedesk.company.com).';
      }
    }
    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        url: url.trim() || undefined,
        status,
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'An error occurred while saving the application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all" id="app-form-modal">
      <div 
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden flex flex-col"
        id="app-form-container"
      >
        {/* Header bar */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between" id="app-form-header">
          <div>
            <h3 className="font-sans font-bold text-lg text-slate-900">
              {isEdit ? 'Update Application Registry' : 'Register Existing Application'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'Modify master metadata fields' : 'Register a structured knowledge segment of an existing application'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
            title="Cancel and close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5" id="app-form-body-wrapper">
          {/* General API Failures */}
          {apiError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start space-x-2.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Application Name Field */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="input-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Application Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-name"
              type="text"
              placeholder="e.g. Procurement Portal, Billing Engine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-slate-50 border ${
                errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
              } focus:bg-white focus:outline-none px-4 py-2.5 text-sm text-slate-800 rounded-xl transition-all shadow-inner`}
            />
            {errors.name && (
              <p className="text-rose-600 text-xs font-semibold flex items-center space-x-1 pl-1">
                <AlertCircle size={12} />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Application URL Field */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="input-url" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Application URL
            </label>
            <input
              id="input-url"
              type="text"
              placeholder="e.g. https://servicedesk.company.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`w-full bg-slate-50 border ${
                errors.url ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
              } focus:bg-white focus:outline-none px-4 py-2.5 text-sm text-slate-800 rounded-xl transition-all shadow-inner`}
            />
            {errors.url && (
              <p className="text-rose-600 text-xs font-semibold flex items-center space-x-1 pl-1">
                <AlertCircle size={12} />
                <span>{errors.url}</span>
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="input-description" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Application Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="input-description"
              rows={4}
              placeholder="Briefly describe the purpose of this application."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full bg-slate-50 border ${
                errors.description ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
              } focus:bg-white focus:outline-none px-4 py-2.5 text-sm text-slate-800 rounded-xl transition-all shadow-inner`}
            />
            {errors.description && (
              <p className="text-rose-600 text-xs font-semibold flex items-center space-x-1 pl-1">
                <AlertCircle size={12} />
                <span>{errors.description}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-400 flex items-center space-x-1.5 select-none pt-0.5">
              <Info size={12} className="text-indigo-400" />
              <span>Briefly describe the purpose of this application.</span>
            </p>
          </div>

          {/* Notes Field */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="input-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              id="input-notes"
              rows={3}
              placeholder="Record any general observations or constraints."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-2.5 text-sm text-slate-800 rounded-xl transition-all shadow-inner`}
            />
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100" id="app-form-footer-actions">
            <button
              id="btn-form-cancel"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
            <button
              id="btn-form-submit"
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 px-6 py-2.5 text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Save size={16} />
              <span>{loading ? 'Saving...' : isEdit ? 'Update Details' : 'Register Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
