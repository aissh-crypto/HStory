import React, { useState } from 'react';
import { X, User, DollarSign, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { UserProfile, ResidencyStatus, BuyerRole } from '../types';

interface UserProfileModalProps {
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userProfile,
  isOpen,
  onClose,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F0] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#E5DEC9]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E5DEC9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E2A44] flex items-center justify-center text-[#C98A3E]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1E2A44]">
                Buyer Profile &amp; Diligence Presets
              </h3>
              <p className="text-xs text-[#1E2A44]/70">
                Customizes foreign ownership eligibility, stamp duty remissions, and stress test DSR caps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[#E5DEC9] hover:bg-gray-100 text-[#1E2A44] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E2A44]/70 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5DEC9] bg-white text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E2A44]/70 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5DEC9] bg-white text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E]"
                required
              />
            </div>
          </div>

          {/* Residency Status (Key for foreign buyer rules) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E2A44]/70 mb-1">
              Residency / Citizenship Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Citizen', 'Permanent Resident', 'Foreign Buyer'] as ResidencyStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, residencyStatus: status })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      formData.residencyStatus === status
                        ? 'bg-[#1E2A44] text-[#F3EEE4] border-[#1E2A44] shadow-sm'
                        : 'bg-white hover:bg-[#E5DEC9]/40 text-[#1E2A44] border-[#E5DEC9]'
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
            <p className="text-[11px] text-[#1E2A44]/60 mt-1">
              {formData.residencyStatus === 'Foreign Buyer'
                ? 'Applies state minimum price caps in Malaysia, 60% ABSD in Singapore, and FEMA restrictions in India.'
                : 'Eligible for domestic buyer loan quotas and standard stamp duty tax brackets.'}
            </p>
          </div>

          {/* Buyer Role (Key for First-time exemptions) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E2A44]/70 mb-1">
              Acquisition Intent &amp; Profile
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['First-time Homebuyer', 'Upgrader', 'Property Investor'] as BuyerRole[]).map(
                (role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, buyerRole: role })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      formData.buyerRole === role
                        ? 'bg-[#1E2A44] text-[#F3EEE4] border-[#1E2A44] shadow-sm'
                        : 'bg-white hover:bg-[#E5DEC9]/40 text-[#1E2A44] border-[#E5DEC9]'
                    }`}
                  >
                    {role}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Currency & Cross-Border Settings */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E2A44]/70 mb-1">
              Currency &amp; Location Setting
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'AUTO', label: '🌐 Auto-Detect' },
                { id: 'MYR', label: '🇲🇾 MYR (RM)' },
                { id: 'SGD', label: '🇸🇬 SGD (S$)' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      currencyPreference: c.id,
                      defaultCurrency: c.id === 'AUTO' ? 'MYR' : c.id,
                    })
                  }
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    (formData.currencyPreference || 'AUTO') === c.id
                      ? 'bg-[#1E2A44] text-[#F3EEE4] border-[#1E2A44] shadow-sm'
                      : 'bg-white hover:bg-[#E5DEC9]/40 text-[#1E2A44] border-[#E5DEC9]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#1E2A44]/60 mt-1">
              Cross-border listings (e.g. Singapore properties in Marina Bay) automatically display dual prices in your preferred currency.
            </p>
          </div>

          {/* Baseline Income & Commitments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E2A44]/70 mb-1">
                Default Gross Monthly Income
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.monthlyGrossIncome}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyGrossIncome: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5DEC9] bg-white text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E2A44]/70 mb-1">
                Existing Monthly Debts / Commitments
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.existingMonthlyDebts}
                  onChange={(e) =>
                    setFormData({ ...formData, existingMonthlyDebts: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5DEC9] bg-white text-[#1E2A44] focus:outline-none focus:ring-1 focus:ring-[#C98A3E]"
                />
              </div>
            </div>
          </div>

          {/* Gemini AI Backend Status Callout */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5DEC9] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C98A3E]" />
              <span className="font-semibold text-[#1E2A44]">
                Gemini 3.8 Flash AI Engine
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              Server Proxy Connected
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E5DEC9] hover:bg-white text-xs sm:text-sm font-semibold text-[#1E2A44] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-md"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Profile Presets</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
