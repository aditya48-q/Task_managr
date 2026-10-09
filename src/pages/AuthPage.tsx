import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/common/GoogleSignInButton';
import { connectGoogleCalendar } from '../lib/google-calendar';

export const AuthPage: React.FC = () => {
  const { loginWithEmail, registerWithEmail, resetPassword, setDemoMode, isFirebaseConnected } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await connectGoogleCalendar();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        navigate('/');
      } else if (mode === 'register') {
        if (!name.trim()) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }
        await registerWithEmail(name.trim(), email, password);
        navigate('/');
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage('Password reset email sent. Check your inbox.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDemo = () => {
    setDemoMode(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo className="scale-110 mb-1" />
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'login'
              ? 'Sign in to Chapter Workspace'
              : mode === 'register'
              ? 'Join GDGoC Campus'
              : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs">
            {mode === 'login'
              ? 'Manage hackathons, workshops, tasks, and team milestones.'
              : mode === 'register'
              ? 'New members are enrolled as Members. Chapter Leads provision roles.'
              : 'Enter your account email to receive a secure recovery link.'}
          </p>
        </div>

        {/* Demo Mode Instant Access Banner */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900">
            <Sparkles size={16} className="text-blue-600 shrink-0" />
            <div>
              <span className="font-semibold block">Want to test the app right away?</span>
              <span className="text-[11px] text-blue-700">Explore full workspace with sample tasks</span>
            </div>
          </div>
          <button
            onClick={handleEnterDemo}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-colors"
          >
            Launch Demo
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google One-Click Sign In with Calendar Scopes */}
        <div className="space-y-3">
          <GoogleSignInButton
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
            text="Continue with Google"
          />
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2 text-[11px] text-slate-400 uppercase font-medium">
              or continue with email
            </span>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit jha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Create Account'
                : 'Send Reset Link'}
            </span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              New chapter member?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-semibold text-blue-600 hover:text-blue-800"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-blue-600 hover:text-blue-800"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
