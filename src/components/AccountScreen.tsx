import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Globe,
  DollarSign,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Building,
  Info,
  Save,
  Coins,
  MapPin,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile, ResidencyStatus, BuyerRole, CountryPreference } from '../types';
import { COUNTRY_PACKS } from '../data/countryPacks';
import { signInWithGoogle, signOutUser } from '../services/firebase';
import { detectLocationCurrency, getLiveExchangeRate, LIVE_EXCHANGE_TIMESTAMP } from '../utils/currency';

interface AccountScreenProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  currentUser: any;
  onResetAccount?: () => void;
  onBack?: () => void;
  onSignOut?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  userProfile,
  onUpdateProfile,
  currentUser,
  onResetAccount,
  onBack,
  onSignOut,
}) => {
  const [name, setName] = useState(userProfile.displayName || userProfile.name);
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>(userProfile.residencyStatus);
  const [buyerRole, setBuyerRole] = useState<BuyerRole>(userProfile.buyerRole);
  const [countryPreference, setCountryPreference] = useState<CountryPreference>(userProfile.countryPreference || 'Malaysia');
  const [currencyPreference, setCurrencyPreference] = useState<'AUTO' | 'MYR' | 'SGD'>(
    (userProfile.currencyPreference as any) || (userProfile.defaultCurrency as any) || 'AUTO'
  );
  const [monthlyIncome, setMonthlyIncome] = useState(userProfile.monthlyGrossIncome || 0);
  const [monthlyDebts, setMonthlyDebts] = useState(userProfile.existingMonthlyDebts || 0);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Sync state whenever currentUser or userProfile changes (e.g. on sign out)
  React.useEffect(() => {
    if (currentUser) {
      setName(userProfile.displayName || userProfile.name);
    } else {
      setName('Guest Buyer');
    }
    setResidencyStatus(userProfile.residencyStatus || 'Citizen');
    setBuyerRole(userProfile.buyerRole || 'First-time Homebuyer');
    setCountryPreference(userProfile.countryPreference || 'Malaysia');
    setMonthlyIncome(userProfile.monthlyGrossIncome || 0);
    setMonthlyDebts(userProfile.existingMonthlyDebts || 0);
  }, [userProfile, currentUser]);

  const detectedCurrency = detectLocationCurrency();
  const effectiveCurrency = currencyPreference === 'AUTO' ? detectedCurrency : currencyPreference;
  const selectedPack = COUNTRY_PACKS[countryPreference];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIncomeError(null);
    const updated: UserProfile = {
      ...userProfile,
      name,
      displayName: name,
      residencyStatus,
      buyerRole,
      countryPreference,
      monthlyGrossIncome: Math.max(0, Number(monthlyIncome) || 0),
      existingMonthlyDebts: Math.max(0, Number(monthlyDebts) || 0),
      currencyPreference,
      defaultCurrency: effectiveCurrency,
    };
    onUpdateProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const cred = await signInWithGoogle();
      if (cred.user) {
        const updated: UserProfile = {
          ...userProfile,
          id: cred.user.uid,
          name: cred.user.displayName || userProfile.name,
          displayName: cred.user.displayName || userProfile.name,
          email: cred.user.email || userProfile.email,
        };
        onUpdateProfile(updated);
      }
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        await signOutUser();
      }
      setName('');
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8 pb-20">
      {/* Top Back Navigation Strip */}
      {onBack && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E8E2D6] bg-white hover:border-[#C98A3E] hover:bg-[#FAF7F0] text-xs font-semibold text-[#1E2A44] transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#C98A3E]" />
            <span>Back to Explore</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#E8E2D6] pb-6 space-y-1">
        <span className="font-label text-[10px] text-[#C98A3E]">
          BUYER PROFILE &amp; UNDERWRITING PARAMETERS
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1E2A44]">
          Account &amp; Diligence Profile
        </h1>
        <p className="text-sm text-[#5B6478]">
          Configure your buyer legal status, country framework, and financial underwriting baselines for personalized stress testing.
        </p>
      </div>

      {/* Cloud Sync & Auth Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1E2A44] text-[#C98A3E] flex items-center justify-center font-serif font-bold text-xl border-2 border-[#C98A3E] shadow-sm overflow-hidden shrink-0">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="font-serif font-bold text-lg text-[#1E2A44]">
                {currentUser ? (currentUser.displayName || name) : 'Guest Buyer'}
              </div>
              <div className="text-xs text-[#5B6478]">
                {currentUser ? (currentUser.email || userProfile.email) : 'Not signed in • Local guest session'}
              </div>
            </div>
          </div>

          <div>
            {currentUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4 text-[#C98A3E]" />
                <span>{authLoading ? 'Connecting...' : 'Sync via Google'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#E8E2D6] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B6478]">
          <span className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${currentUser ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {currentUser ? 'Cloud Sync Active (Data automatically protected & synced)' : 'Saved locally (Sign in with Google to sync across devices)'}
          </span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] space-y-5">
          <h2 className="font-serif font-bold text-lg text-[#1E2A44] flex items-center gap-2">
            <User className="w-4 h-4 text-[#C98A3E]" />
            Personal &amp; Legal Persona
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block font-label text-[10px] text-[#5B6478] mb-1.5">
                FULL LEGAL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E8E2D6] bg-[#FAF7F0] text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E]"
              />
            </div>

            {/* Residency Status */}
            <div>
              <label className="block font-label text-[10px] text-[#5B6478] mb-1.5">
                RESIDENCY / CITIZEN STATUS
              </label>
              <select
                value={residencyStatus}
                onChange={(e) => setResidencyStatus(e.target.value as ResidencyStatus)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E8E2D6] bg-[#FAF7F0] text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E] cursor-pointer"
              >
                <option value="Citizen">Citizen (Primary Tax Tier)</option>
                <option value="Permanent Resident">Permanent Resident (PR)</option>
                <option value="Foreign Buyer">Foreign Buyer (Subject to Levies/ABSD)</option>
              </select>
            </div>

            {/* Buyer Intent */}
            <div>
              <label className="block font-label text-[10px] text-[#5B6478] mb-1.5">
                BUYER CATEGORY
              </label>
              <select
                value={buyerRole}
                onChange={(e) => setBuyerRole(e.target.value as BuyerRole)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E8E2D6] bg-[#FAF7F0] text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E] cursor-pointer"
              >
                <option value="First-time Homebuyer">First-time Homebuyer (Exemption eligible)</option>
                <option value="Upgrader">Upgrader (Second property)</option>
                <option value="Property Investor">Property Investor (Portfolio / Yield)</option>
              </select>
            </div>

            {/* Country Preference */}
            <div>
              <label className="block font-label text-[10px] text-[#5B6478] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#C98A3E]" />
                COUNTRY PACK PREFERENCE
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Malaysia', 'Singapore'] as CountryPreference[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCountryPreference(c)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      countryPreference === c
                        ? 'bg-[#1E2A44] text-white border-[#1E2A44] shadow-xs'
                        : 'bg-[#FAF7F0] text-[#5B6478] border-[#E8E2D6] hover:border-[#C98A3E]'
                    }`}
                  >
                    {c === 'Malaysia' ? '🇲🇾 Malaysia' : '🇸🇬 Singapore'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Currency & Cross-Border Pricing Settings */}
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1E2A44] flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#C98A3E]" />
                Currency &amp; Cross-Border Pricing Preferences
              </h2>
              <p className="text-xs text-[#5B6478] mt-0.5">
                Controls how listings from Singapore and Malaysia are priced and converted for you.
              </p>
            </div>
            <span
              className="font-mono text-[11px] px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold flex items-center gap-1.5"
              title={LIVE_EXCHANGE_TIMESTAMP}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              1 SGD ≈ {getLiveExchangeRate('SGD', 'MYR').toFixed(4)} MYR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Auto Detect Option */}
            <button
              type="button"
              onClick={() => setCurrencyPreference('AUTO')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                currencyPreference === 'AUTO'
                  ? 'border-[#C98A3E] bg-amber-50/50 shadow-sm ring-2 ring-amber-400/20'
                  : 'border-[#E8E2D6] bg-[#FAF7F0] hover:border-[#C98A3E]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#1E2A44] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Auto-Detect
                </span>
                {currencyPreference === 'AUTO' && (
                  <CheckCircle2 className="w-4 h-4 text-[#C98A3E]" />
                )}
              </div>
              <p className="text-xs text-[#5B6478]">
                Uses your current location: <strong className="text-[#1E2A44]">{detectedCurrency === 'SGD' ? '🇸🇬 Singapore (SGD)' : '🇲🇾 Malaysia (MYR)'}</strong>
              </p>
            </button>

            {/* MYR Option */}
            <button
              type="button"
              onClick={() => setCurrencyPreference('MYR')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                currencyPreference === 'MYR'
                  ? 'border-[#C98A3E] bg-amber-50/50 shadow-sm ring-2 ring-amber-400/20'
                  : 'border-[#E8E2D6] bg-[#FAF7F0] hover:border-[#C98A3E]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#1E2A44] flex items-center gap-1.5">
                  🇲🇾 Malaysian Ringgit
                </span>
                {currencyPreference === 'MYR' && (
                  <CheckCircle2 className="w-4 h-4 text-[#C98A3E]" />
                )}
              </div>
              <p className="text-xs text-[#5B6478]">
                Default: <strong>RM (MYR)</strong>. Singapore properties will show SGD with dual MYR conversion.
              </p>
            </button>

            {/* SGD Option */}
            <button
              type="button"
              onClick={() => setCurrencyPreference('SGD')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                currencyPreference === 'SGD'
                  ? 'border-[#C98A3E] bg-amber-50/50 shadow-sm ring-2 ring-amber-400/20'
                  : 'border-[#E8E2D6] bg-[#FAF7F0] hover:border-[#C98A3E]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#1E2A44] flex items-center gap-1.5">
                  🇸🇬 Singapore Dollar
                </span>
                {currencyPreference === 'SGD' && (
                  <CheckCircle2 className="w-4 h-4 text-[#C98A3E]" />
                )}
              </div>
              <p className="text-xs text-[#5B6478]">
                Default: <strong>S$ (SGD)</strong>. Malaysian properties will show RM with dual SGD conversion.
              </p>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-[#1E2A44] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#C98A3E] shrink-0 mt-0.5" />
            <p>
              <strong>Active cross-border currency:</strong> {effectiveCurrency === 'SGD' ? 'Singapore Dollar (S$)' : 'Malaysian Ringgit (RM)'}. When browsing properties across the border, Homestory displays the local property price with an automatic converted estimation based on bank interbank mid-rates.
            </p>
          </div>
        </div>

        {/* Financial Underwriting Baselines */}
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] space-y-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#1E2A44] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#C98A3E]" />
              Underwriting Financial Baselines
            </h2>
            <p className="text-xs text-[#5B6478] mt-1">
              Used automatically when calculating Debt Service Ratio (DSR) and +2% interest rate shock tests.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-label text-[10px] text-[#5B6478] font-bold">
                  GROSS MONTHLY HOUSEHOLD INCOME ({countryPreference === 'Singapore' ? 'SGD' : 'MYR'})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const benchmark = countryPreference === 'Singapore' ? 9500 : 18000;
                    setMonthlyIncome(benchmark);
                    setIncomeError(null);
                  }}
                  className="text-[10px] text-[#C98A3E] hover:underline font-semibold cursor-pointer"
                >
                  Fill {countryPreference === 'Singapore' ? 'SGD 9,500' : 'RM 18,000'} benchmark
                </button>
              </div>
              <input
                type="number"
                min={0}
                step={500}
                value={monthlyIncome > 0 ? monthlyIncome : ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMonthlyIncome(val >= 0 ? val : 0);
                  setIncomeError(null);
                }}
                placeholder={countryPreference === 'Singapore' ? 'e.g. 9500 (or 0)' : 'e.g. 18000 (or 0)'}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E8E2D6] bg-[#FAF7F0] text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E] transition-colors"
              />
              <p className="mt-1 text-[11px] text-[#5B6478]">
                Used to calculate real-time Debt Service Ratio (DSR) &amp; stress tests. Leave 0 if you prefer not to disclose.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-label text-[10px] text-[#5B6478] font-bold">
                  EXISTING MONTHLY DEBT COMMITMENTS ({countryPreference === 'Singapore' ? 'SGD' : 'MYR'})
                </label>
                <button
                  type="button"
                  onClick={() => setMonthlyDebts(countryPreference === 'Singapore' ? 1200 : 2200)}
                  className="text-[10px] text-[#C98A3E] hover:underline font-semibold cursor-pointer"
                >
                  Fill {countryPreference === 'Singapore' ? 'SGD 1,200' : 'RM 2,200'} benchmark
                </button>
              </div>
              <input
                type="number"
                min={0}
                step={100}
                value={monthlyDebts > 0 ? monthlyDebts : ''}
                onChange={(e) => setMonthlyDebts(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 2200 (car loans, credit cards, or 0)"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E8E2D6] bg-[#FAF7F0] text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E]"
              />
              <p className="mt-1 text-[11px] text-[#5B6478]">
                Existing hire purchase, credit facility, and personal loan commitments.
              </p>
            </div>
          </div>
        </div>

        {/* Country Pack Rules & Stamp Duty Overview (Clearly marked as Example Data) */}
        <div className="bg-[#FAF7F0] rounded-[24px] p-6 sm:p-8 border border-[#E8E2D6] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#1E2A44] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C98A3E]" />
              {selectedPack.name} Statutory Framework
            </h3>
            <span className="font-label text-[9px] px-2.5 py-1 rounded-full bg-[#C98A3E]/20 text-[#C98A3E] border border-[#C98A3E]/30 font-semibold">
              Example Data
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D6] space-y-1.5">
              <div className="font-sans font-semibold text-[#1E2A44] text-xs">
                Statutory Stamp Duty &amp; Legal Fee Structure
              </div>
              <p className="text-xs leading-relaxed text-[#5B6478]">
                {selectedPack.stampDutySummary}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D6] space-y-1.5">
              <div className="font-sans font-semibold text-[#1E2A44] text-xs">
                Foreign-Buyer Rules &amp; Minimum Thresholds
              </div>
              <p className="text-xs leading-relaxed text-[#5B6478]">
                {selectedPack.foreignBuyerRules}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <span>
              <strong>Notice:</strong> Rates shown are prototype example data provided for diligence calibration. Consult your licensed legal conveyancer before executing contracts.
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#C98A3E]" />
            <span>Save Diligence Profile</span>
          </button>

          {saveSuccess && (
            <div className="mt-3 text-center text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile preferences successfully updated!</span>
            </div>
          )}
        </div>
      </form>

      {/* Account Deletion & First-Time User Restart Section */}
      <div className="bg-rose-50/60 rounded-3xl p-6 border border-rose-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <h3 className="font-serif font-bold text-base">
            Reset Account &amp; Test First-Time Onboarding
          </h3>
        </div>
        <p className="text-xs text-[#5B6478] leading-relaxed">
          Wipes your stored cloud account records, saved property bookmarks, and case file dossiers. Restarts the platform with a clean slate so you can experience the exact first-time buyer journey and onboarding flow after login or login via Google.
        </p>

        <div className="pt-2">
          {isConfirmingReset ? (
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-rose-300 animate-fadeIn">
              <span className="text-xs font-bold text-rose-800">
                Are you sure? All profile data and case files will be wiped:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingReset(false);
                  if (onResetAccount) onResetAccount();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Yes, Delete &amp; Restart
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingReset(false)}
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingReset(true)}
              className="px-4 py-2.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-100/70 text-rose-700 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Delete My Account Details &amp; Restart Process</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
