import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertTriangle, RefreshCw, Key, ShieldCheck, Copy, Check } from 'lucide-react';
import { isFirebaseConfigured, testConnection, firebaseConfig } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({ isOpen, onClose }) => {
  const { isDemoMode, setDemoMode } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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
        message: err instanceof Error ? err.message : 'Unknown connection error.',
      });
    } finally {
      setTesting(false);
    }
  };

  const envSampleSnippet = `VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSampleSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Firebase & Database Status</h3>
              <p className="text-xs text-slate-500">Live Cloud Firestore and Authentication integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isConfigured
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {isConfigured ? (
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {isConfigured ? 'Firebase Client Configured' : 'Running in Interactive Demo Mode'}
              </h4>
              <p className="text-xs mt-1 leading-relaxed">
                {isConfigured
                  ? 'Application is connected to your Firebase configuration. Writes and reads sync directly with Cloud Firestore with hardened security rules.'
                  : 'Firebase environment variables are not yet configured in .env. The app is running in local Demo Sandbox mode with realistic GDGoC tasks, members, and projects.'}
              </p>
            </div>
          </div>

          {/* Configuration Parameters Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Client Environment Variables
            </h4>
            <div className="space-y-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="font-mono text-slate-600">VITE_FIREBASE_API_KEY</span>
                <span className={firebaseConfig.apiKey ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {firebaseConfig.apiKey ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="font-mono text-slate-600">VITE_FIREBASE_PROJECT_ID</span>
                <span className={firebaseConfig.projectId ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {firebaseConfig.projectId || 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="font-mono text-slate-600">VITE_FIREBASE_AUTH_DOMAIN</span>
                <span className={firebaseConfig.authDomain ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {firebaseConfig.authDomain ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-mono text-slate-600">VITE_FIREBASE_APP_ID</span>
                <span className={firebaseConfig.appId ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {firebaseConfig.appId ? 'Configured' : 'Missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Connection Test Action */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Connection Diagnostics
              </h4>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
              >
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                <span>Test Server Connection</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Quick Setup Instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                How to Connect Live Firebase
              </h4>
              <button
                onClick={handleCopyEnv}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy Template'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              1. Create a Firebase project at <code className="bg-slate-100 px-1 py-0.5 rounded">console.firebase.google.com</code>.
              <br />
              2. Enable <strong>Email/Password Authentication</strong> and <strong>Cloud Firestore</strong>.
              <br />
              3. Copy your Web App config keys into <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Rules: <span className="font-semibold text-slate-700">firestore.rules</span> included in project
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
