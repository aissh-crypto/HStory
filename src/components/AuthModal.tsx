import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, registerWithEmail, signInDemoUser } from '../services/firebase';
import { HomestoryLogo } from './HomestoryLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  actionReason?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionReason = 'Sign in or register to access verified property listings, financial stress testing, and due diligence dossiers.',
}) => {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestRegister, setSuggestRegister] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);
    setSuggestRegister(false);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (tab === 'register') {
      if (fullName.trim().length < 2) {
        setErrorMessage('Please enter your full legal or preferred buyer name (at least 2 characters).');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please ensure both password fields are identical.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (tab === 'signin') {
        const cred = await signInWithEmail(cleanEmail, password);
        onSuccess(cred.user);
        onClose();
      } else {
        const cred = await registerWithEmail(cleanEmail, password, fullName.trim());
        onSuccess(cred.user);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (
        msg.includes('user-not-found') ||
        msg.includes('invalid-credential') ||
        err.code === 'auth/user-not-found'
      ) {
        msg = 'No registered account found with this email. Please register to create your buyer profile.';
        setSuggestRegister(true);
      } else if (msg.includes('wrong-password') || err.code === 'auth/wrong-password') {
        msg = 'Incorrect password. Please verify your credentials or register a new account.';
      } else if (msg.includes('email-already-in-use') || err.code === 'auth/email-already-in-use') {
        msg = 'An account already exists with this email address. Please switch to Sign In.';
      } else if (msg.includes('weak-password') || err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuggestRegister(false);
    try {
      const cred = await signInWithGoogle();
      onSuccess(cred.user);
      onClose();
    } catch (err: any) {
      console.error('Google auth error:', err);
      setErrorMessage(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuggestRegister(false);
    try {
      const demoUser = await signInDemoUser('Investor Buyer', 'buyer@homestory.ai');
      onSuccess(demoUser);
      onClose();
    } catch (err: any) {
      console.error('Demo auth error:', err);
      setErrorMessage('Could not initialize demo user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2A44]/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E8E2D6] shadow-2xl overflow-hidden z-10 animate-scaleUp">
        {/* Header Bar */}
        <div className="px-6 pt-6 pb-4 bg-[#FAF7F0] border-b border-[#E8E2D6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HomestoryLogo markOnly markClassName="w-7 h-7" />
            <span className="font-serif font-bold text-base text-[#1E2A44]">
              Homestory Access
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full border border-[#E8E2D6] bg-white flex items-center justify-center text-[#5B6478] hover:text-[#1E2A44] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Value Proposition */}
        <div className="p-6 pb-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="space-y-1">
            <h2 className="font-serif font-bold text-xl text-[#1E2A44]">
              {tab === 'signin' ? 'Sign In to Your Dossier' : 'Create Verified Buyer Account'}
            </h2>
            <p className="text-xs text-[#5B6478] leading-relaxed">
              {actionReason}
            </p>
          </div>

          {/* Tabs: Sign In vs Register */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#FAF7F0] border border-[#E8E2D6] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setErrorMessage(null);
                setSuggestRegister(false);
              }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === 'signin'
                  ? 'bg-white text-[#1E2A44] shadow-xs'
                  : 'text-[#5B6478] hover:text-[#1E2A44]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMessage(null);
                setSuggestRegister(false);
              }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-[#1E2A44] shadow-xs'
                  : 'text-[#5B6478] hover:text-[#1E2A44]'
              }`}
            >
              Register (New Users)
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
              {suggestRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage(null);
                    setSuggestRegister(false);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Switch to Registration</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-[#1E2A44] uppercase tracking-wider mb-1">
                  Full Buyer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rachel Lim"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8E2D6] focus:outline-hidden focus:border-[#C98A3E] focus:ring-1 focus:ring-[#C98A3E]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#1E2A44] uppercase tracking-wider mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8E2D6] focus:outline-hidden focus:border-[#C98A3E] focus:ring-1 focus:ring-[#C98A3E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1E2A44] uppercase tracking-wider mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8E2D6] focus:outline-hidden focus:border-[#C98A3E] focus:ring-1 focus:ring-[#C98A3E]"
                />
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-[#1E2A44] uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5B6478] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-300 focus:border-rose-500'
                        : 'border-[#E8E2D6] focus:border-[#C98A3E]'
                    } focus:outline-hidden focus:ring-1 focus:ring-[#C98A3E]`}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[10px] text-rose-600 mt-1">Passwords do not match</p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Passwords match</span>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (tab === 'register' && confirmPassword !== '' && confirmPassword !== password)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#C98A3E] hover:bg-[#b07834] text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In to Homestory' : 'Complete Buyer Registration'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign In Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-xl border border-[#E8E2D6] bg-white hover:bg-[#FAF7F0] text-[#1E2A44] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Security & Regulatory footer */}
        <div className="p-4 bg-[#FAF7F0] border-t border-[#E8E2D6] text-[10px] text-[#5B6478] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Firestore Authentication</span>
          </span>
          <span className="text-[#C98A3E] font-medium">
            Cross-Border Diligence
          </span>
        </div>
      </div>
    </div>
  );
};
