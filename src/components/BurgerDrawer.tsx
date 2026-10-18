import React from 'react';
import { X, Search, Bookmark, FolderCheck, User, Sparkles, HelpCircle, Shield, Globe, ChevronRight, Camera, LogOut, LogIn } from 'lucide-react';
import { NavTab, UserProfile } from '../types';
import { HomestoryLogo } from './HomestoryLogo';

interface BurgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  savedCount: number;
  caseCount: number;
  userProfile: UserProfile;
  currentUser?: any;
  onOpenHowItWorks: () => void;
  onSwitchCountry: (country: 'Malaysia' | 'Singapore') => void;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  onResetAccount?: () => void;
}

export const BurgerDrawer: React.FC<BurgerDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  savedCount,
  caseCount,
  userProfile,
  currentUser,
  onOpenHowItWorks,
  onSwitchCountry,
  onOpenAuthModal,
  onSignOut,
  onResetAccount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E2A44]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#FBF9F5] border-l border-[#E8E2D6] shadow-2xl h-full flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E8E2D6] flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-20">
          <HomestoryLogo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Drawer"
            className="w-10 h-10 rounded-full border border-[#E8E2D6] flex items-center justify-center text-[#1E2A44] hover:bg-[#FAF7F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card or Sign In Banner */}
        {currentUser ? (
          <div className="p-6 bg-white border-b border-[#E8E2D6]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-500 text-white font-serif font-bold text-lg flex items-center justify-center shadow-md">
                {(userProfile.displayName || userProfile.name || 'M')[0]}
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-[#1E2A44]">
                  {userProfile.displayName || userProfile.name}
                </h3>
                <p className="text-xs text-[#5B6478] flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>{userProfile.buyerRole} • {userProfile.countryPreference}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-br from-[#1E2A44] to-[#2A3B5E] text-white border-b border-[#E8E2D6]">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                Guest Mode
              </span>
              <h3 className="font-serif font-bold text-lg text-white">
                Unlock Homestory Full AI Suite
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Sign in or register to run property searches, save listings, conduct financial stress tests, and view full diligence dossiers.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthModal?.();
                }}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>SIGN IN OR REGISTER</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Navigation Items */}
        <div className="p-6 space-y-2 flex-1">
          <p className="font-label text-[10px] text-[#5B6478] mb-3 px-2">
            NAVIGATION
          </p>

          {/* Search Tab */}
          <button
            type="button"
            onClick={() => {
              onChangeTab('search');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
              activeTab === 'search'
                ? 'bg-[#1E2A44] text-white shadow-sm'
                : 'hover:bg-white text-[#1E2A44]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Search className={`w-5 h-5 ${activeTab === 'search' ? 'text-[#C98A3E]' : 'text-[#5B6478]'}`} />
              <div className="text-left">
                <span className="font-sans font-medium text-sm block">Home</span>
                <span className={`text-[11px] ${activeTab === 'search' ? 'text-white/70' : 'text-[#5B6478]'}`}>
                  Explore listings & AI search
                </span>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${activeTab === 'search' ? 'text-[#C98A3E]' : 'text-[#5B6478]'}`} />
          </button>

          {/* SightView AI Tab */}
          <button
            type="button"
            onClick={() => {
              onChangeTab('sightview');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
              activeTab === 'sightview'
                ? 'bg-[#1E2A44] text-white shadow-sm ring-1 ring-amber-400'
                : 'hover:bg-white text-[#1E2A44]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Camera className={`w-5 h-5 ${activeTab === 'sightview' ? 'text-amber-400' : 'text-amber-600'}`} />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-bold text-sm block">SightView AI™ Camera</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white">NEW</span>
                </div>
                <span className={`text-[11px] ${activeTab === 'sightview' ? 'text-white/70' : 'text-[#5B6478]'}`}>
                  Live on-site inspection assistant
                </span>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${activeTab === 'sightview' ? 'text-amber-400' : 'text-[#5B6478]'}`} />
          </button>

          {/* Saved Tab */}
          <button
            type="button"
            onClick={() => {
              onChangeTab('saved');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
              activeTab === 'saved'
                ? 'bg-[#1E2A44] text-white shadow-sm'
                : 'hover:bg-white text-[#1E2A44]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Bookmark className={`w-5 h-5 ${activeTab === 'saved' ? 'text-[#C98A3E]' : 'text-[#5B6478]'}`} />
              <div className="text-left">
                <span className="font-sans font-medium text-sm block">Saved Properties</span>
                <span className={`text-[11px] ${activeTab === 'saved' ? 'text-white/70' : 'text-[#5B6478]'}`}>
                  Bookmarked for inspection
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser && savedCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white shadow-xs">
                  {savedCount}
                </span>
              )}
              <ChevronRight className={`w-4 h-4 ${activeTab === 'saved' ? 'text-amber-500' : 'text-[#5B6478]'}`} />
            </div>
          </button>

          {/* Case Files Tab */}
          <button
            type="button"
            onClick={() => {
              onChangeTab('cases');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
              activeTab === 'cases'
                ? 'bg-[#1E2A44] text-white shadow-sm'
                : 'hover:bg-white text-[#1E2A44]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <FolderCheck className={`w-5 h-5 ${activeTab === 'cases' ? 'text-[#C98A3E]' : 'text-[#5B6478]'}`} />
              <div className="text-left">
                <span className="font-sans font-medium text-sm block">Case Files</span>
                <span className={`text-[11px] ${activeTab === 'cases' ? 'text-white/70' : 'text-[#5B6478]'}`}>
                  5-module due diligence reports
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser && caseCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white shadow-xs">
                  {caseCount} Active
                </span>
              )}
              <ChevronRight className={`w-4 h-4 ${activeTab === 'cases' ? 'text-amber-500' : 'text-[#5B6478]'}`} />
            </div>
          </button>

          {/* Account Tab */}
          <button
            type="button"
            onClick={() => {
              onChangeTab('account');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
              activeTab === 'account'
                ? 'bg-[#1E2A44] text-white shadow-sm'
                : 'hover:bg-white text-[#1E2A44]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <User className={`w-5 h-5 ${activeTab === 'account' ? 'text-[#C98A3E]' : 'text-[#5B6478]'}`} />
              <div className="text-left">
                <span className="font-sans font-medium text-sm block">Account & Settings</span>
                <span className={`text-[11px] ${activeTab === 'account' ? 'text-white/70' : 'text-[#5B6478]'}`}>
                  Residency status & mortgage limits
                </span>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${activeTab === 'account' ? 'text-[#C98A3E]' : 'text-[#5B6478]'}`} />
          </button>

          {/* How It Works Button */}
          <div className="pt-4 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHowItWorks();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E8E2D6] hover:border-[#C98A3E] text-[#1E2A44] transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#F3E3C3]/50 flex items-center justify-center text-[#C98A3E]">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-sans font-medium text-sm text-[#1E2A44] block">
                    See How It Works
                  </span>
                  <span className="text-[11px] text-[#5B6478]">
                    Explore the 5 Due Diligence Modules
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#C98A3E] group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Sign Out or Sign In in Side Navigation */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSignOut) onSignOut();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/80 border border-rose-200 text-[#1E2A44] hover:text-rose-800 transition-all group text-left cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-sans font-bold text-xs block text-rose-900">
                      Sign Out
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-rose-700">
                      {currentUser.email || currentUser.displayName || 'Active Account'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/70 group-hover:bg-rose-600 group-hover:text-white text-rose-800 transition-colors">
                  Exit
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white transition-all group text-left cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-sans font-bold text-xs block">
                      Sign In / Register
                    </span>
                    <span className="text-[10px] text-white/75">
                      Sync case files &amp; saved dossiers
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Malaysia NAPIC & JPPH Verified Data Registry */}
          <div className="pt-4 space-y-2">
            <p className="font-label text-[10px] text-[#5B6478] mb-1 px-2 font-bold uppercase tracking-wider">
              DATA REGISTRY & COMPLIANCE
            </p>
            <div className="p-3 rounded-2xl bg-white border border-[#E8E2D6] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1E2A44] flex items-center gap-1.5">
                  <span>🇲🇾</span> Malaysia (NAPIC, JPPH & KPKT)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Live Registry
                </span>
              </div>
              <p className="text-[11px] text-[#5B6478]">
                Real-time submarket transactions, strata building codes, and statutory buyer protections synchronized.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-6 border-t border-[#E8E2D6] bg-white/50 text-[11px] text-[#5B6478] leading-relaxed">
          <div className="flex items-center gap-1.5 text-[#1E2A44] font-medium mb-1">
            <Shield className="w-3.5 h-3.5 text-[#C98A3E]" />
            <span>Independent Buyer Copilot</span>
          </div>
          Homestory aggregates verified land titles, valuation corridors, and statutory rules to help you make informed decisions.
        </div>
      </div>
    </div>
  );
};
