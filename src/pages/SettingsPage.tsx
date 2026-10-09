import React, { useState } from 'react';
import {
  User,
  Shield,
  Building,
  Database,
  RefreshCw,
  Key,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { isFirebaseConfigured, testConnection } from '../lib/firebase';
import { RoleBadge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { currentUser, currentRole, isDemoMode } = useAuth();
  const { workspace, resetToDemoData } = useWorkspace();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const isConfigured = isFirebaseConfigured();

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection();
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo tasks, projects, and activities back to initial fixtures?')) {
      resetToDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Workspace Settings</h1>
        <p className="text-xs md:text-sm text-slate-500">
          Manage your GDGoC chapter identity, user permissions, and Firebase infrastructure.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <User size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Your Profile & Account
          </h2>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
            {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{currentUser?.displayName}</h3>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <RoleBadge role={currentRole} />
              <span className="text-[11px] text-slate-400">UID: {currentUser?.uid}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Workspace Information */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <Building size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            GDGoC Chapter Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Chapter Name</label>
            <div className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {workspace.chapterName}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Campus / Institution</label>
            <div className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {workspace.institution}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Chapter Description</label>
            <div className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed text-xs">
              {workspace.description}
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Database & Environment Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <Database size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Firebase & Cloud Firestore
            </h2>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
              isConfigured
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isConfigured ? 'Connected' : 'Demo Sandbox'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {isConfigured
            ? 'Your application is connected to live Cloud Firestore. Real-time onSnapshot listeners synchronize updates across active browser sessions.'
            : 'Firebase environment variables are not configured in .env. You can safely explore all features with full CRUD capability in this local interactive sandbox.'}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
            <span>Test Firestore Connection</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs border ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Role-Permission Matrix Reference */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <Shield size={18} className="text-purple-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Role-Based Access Control (RBAC)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-2.5">Capability / Operation</th>
                <th className="p-2.5">Member</th>
                <th className="p-2.5">Lead</th>
                <th className="p-2.5">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-2.5 font-medium">View Workspace Tasks & Calendar</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Update Task Status & Comment</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Create Projects & Assign Tasks</td>
                <td className="p-2.5 text-slate-300">✗</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Invite Members & Assign Roles</td>
                <td className="p-2.5 text-slate-300">✗</td>
                <td className="p-2.5 text-slate-300">✗</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Workspace Configuration</td>
                <td className="p-2.5 text-slate-300">✗</td>
                <td className="p-2.5 text-slate-300">✗</td>
                <td className="p-2.5 text-emerald-600 font-bold">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo Sandbox Reset Control */}
      {isDemoMode && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Reset Demo Sandbox</h3>
            <p className="text-xs text-slate-500">
              Restore default GDGoC sample tasks, hackathon projects, and team members.
            </p>
            {resetSuccess && (
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                ✓ Demo data restored successfully!
              </span>
            )}
          </div>
          <button
            onClick={handleResetDemo}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <RotateCcw size={14} />
            <span>Reset Fixtures</span>
          </button>
        </div>
      )}
    </div>
  );
};
