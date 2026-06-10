/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Plus, Settings, Database, ServerCrash, 
  RefreshCw, CheckCircle, HelpCircle, Layers, X
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ApplicationCard from './components/ApplicationCard';
import ApplicationForm from './components/ApplicationForm';
import DetailsView from './components/DetailsView';
import PlaceholderView from './components/PlaceholderView';
import { Application, CreateApplicationDTO, NavItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavItem>('applications');
  
  // App Listing State
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Details routing
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  
  // Form modal controller
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Reset selected detail when navigating to other tabs
  useEffect(() => {
    if (activeTab !== 'applications') {
      setSelectedDetailId(null);
    }
  }, [activeTab]);

  // Load applications from the backend
  const fetchApplications = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/applications?search=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error(`Failed to load applications from service. Status Code: ${response.status}`);
      }
      const data = await response.json();
      setApplications(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'The backend service could not be reached.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on query change
  useEffect(() => {
    fetchApplications();
  }, [searchQuery]);

  // Form submit handler (POST & PUT)
  const handleFormSubmit = async (dto: CreateApplicationDTO) => {
    const isEdit = !!selectedApp;
    const url = isEdit ? `/api/applications/${selectedApp.id}` : '/api/applications';
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Server rejected application payload verification.');
    }

    // Refresh state
    await fetchApplications();
  };

  // Delete handler
  const handleDeleteApp = async (id: string, name: string) => {
    const confirm = window.confirm(`Are you absolutely sure you want to delete the application named "${name}" from the repository? This operation is permanent.`);
    if (!confirm) return;

    try {
      const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to soft-delete application record.');
      }
      
      // If currently viewing deleted application, clear detail selector
      if (selectedDetailId === id) {
        setSelectedDetailId(null);
      }

      await fetchApplications();
    } catch (err: any) {
      alert(`Deletion Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex" id="app-viewport-root">
      {/* 1. Sidebar Container */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Page Layout Wrapper */}
      <div className="flex-1 flex flex-col pl-80" id="main-content-layout">
        
        {/* Dynamic header */}
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onNewAppClick={() => {
            setSelectedApp(null);
            setIsFormOpen(true);
          }} 
          applications={applications}
        />

        {/* 3. Main content area */}
        <main className="flex-1 overflow-y-auto">
          {errorMessage && (
            <div className="max-w-6xl mx-auto px-8 pt-6" id="server-connection-error">
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-start gap-4 shadow-sm text-left">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                  <ServerCrash size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">Database Connectivity Alert</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {errorMessage} Please verify the local service daemon is currently responsive and on Port 3000.
                  </p>
                  <button
                    onClick={fetchApplications}
                    className="mt-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-md"
                  >
                    <RefreshCw size={12} />
                    <span>Try Reconnecting</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'applications' ? (
            /* Roadmap Module Placeholder Screens */
            <PlaceholderView module={activeTab} />
          ) : selectedDetailId ? (
            /* Selected Detail Page Layout router */
            <DetailsView 
              applicationId={selectedDetailId} 
              onBack={() => setSelectedDetailId(null)}
              onEdit={(app) => {
                setSelectedApp(app);
                setIsFormOpen(true);
              }}
            />
          ) : (
            /* Applications Directory Listing Grid */
            <div className="max-w-6xl mx-auto px-8 py-6 space-y-6" id="applications-grid-container">
              {loading && applications.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center space-y-3" id="main-grid-loader">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-semibold text-sm">Synchronizing live repository catalogs...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="py-20 border border-slate-200/60 border-dashed rounded-3xl text-center space-y-5 bg-white shadow-xs max-w-xl mx-auto my-12" id="grid-empty-state">
                  <div className="p-4 bg-indigo-50 border border-indigo-100/50 rounded-2xl text-indigo-500 inline-block">
                    <Database size={32} />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-lg text-slate-900">Repository is Empty</h3>
                    <p className="text-slate-500 text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
                      No applications currently fit your queries. Spin up your very first integrated application package segment now!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedApp(null);
                      setIsFormOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-95 transition-all inline-flex items-center space-x-1.5"
                  >
                    <Plus size={14} />
                    <span>Register First App</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4" id="applications-grid-list">
                  <div className="flex items-center justify-between" id="grid-meta-row">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                      Applications Index ({applications.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applications.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onEdit={(targetApp) => {
                          setSelectedApp(targetApp);
                          setIsFormOpen(true);
                        }}
                        onDelete={handleDeleteApp}
                        onView={(id) => {
                          setSelectedDetailId(id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 4. Form Drawer Overlay */}
      {isFormOpen && (
        <ApplicationForm 
          application={selectedApp} 
          onClose={() => {
            setIsFormOpen(false);
            setSelectedApp(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

