import React from 'react';
import { Menu, Bookmark, FolderCheck, User, Camera, Sparkles, LogIn } from 'lucide-react';
import { NavTab, UserProfile } from '../types';
import { HomestoryLogo } from './HomestoryLogo';

interface NavbarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  savedCount: number;
  caseCount: number;
  userProfile: UserProfile;
  currentUser?: any;
  onOpenDrawer: () => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  savedCount,
  caseCount,
  userProfile,
  currentUser,
  onOpenDrawer,
  onOpenAuthModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E8E2D6] transition-all shadow-[0_4px_20px_rgba(30,42,68,0.03)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* LEFT: Homestory Brand House Logo */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <HomestoryLogo
              onClick={() => onChangeTab('search')}
              markClassName="w-8 h-8 sm:w-9 sm:h-9"
              textClassName="text-lg sm:text-2xl"
            />
          </div>

          {/* CENTER: Desktop Nav Links (>= 1024px) */}
          <nav className="hidden lg:flex items-center space-x-7">
            <button
              type="button"
              onClick={() => onChangeTab('search')}
              className={`font-label text-xs tracking-widest transition-all relative py-1 cursor-pointer ${
                activeTab === 'search'
                  ? 'text-[#0F172A] font-bold'
                  : 'text-[#5B6478] hover:text-[#0F172A]'
              }`}
            >
              HOME
              {activeTab === 'search' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 rounded-full" />
              )}
            </button>

            {/* SIGHTVIEW AI CAMERA TAB */}
            <button
              type="button"
              onClick={() => onChangeTab('sightview')}
              className={`font-label text-xs tracking-widest transition-all relative py-1 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sightview'
                  ? 'text-amber-600 font-extrabold'
                  : 'text-[#5B6478] hover:text-amber-600'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              <span>SIGHTVIEW AI™</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-xs">
                LIVE
              </span>
              {activeTab === 'sightview' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('saved')}
              className={`font-label text-xs tracking-widest transition-all relative py-1 flex items-center gap-2 cursor-pointer ${
                activeTab === 'saved'
                  ? 'text-[#0F172A] font-bold'
                  : 'text-[#5B6478] hover:text-[#0F172A]'
              }`}
            >
              <span>SAVED</span>
              {currentUser && savedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white shadow-xs">
                  {savedCount}
                </span>
              )}
              {activeTab === 'saved' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('cases')}
              className={`font-label text-xs tracking-widest transition-all relative py-1 flex items-center gap-2 cursor-pointer ${
                activeTab === 'cases'
                  ? 'text-[#0F172A] font-bold'
                  : 'text-[#5B6478] hover:text-[#0F172A]'
              }`}
            >
              <span>CASE FILES</span>
              {currentUser && caseCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white shadow-xs">
                  {caseCount}
                </span>
              )}
              {activeTab === 'cases' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 rounded-full" />
              )}
            </button>
          </nav>

          {/* RIGHT: Mobile SightView Shortcut & Account / Sign In Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={() => onChangeTab('account')}
                className={`hidden lg:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-label tracking-widest transition-all cursor-pointer ${
                  activeTab === 'account'
                    ? 'bg-[#1E2A44] text-white border-[#1E2A44] shadow-xs'
                    : 'bg-white text-[#1E2A44] border-[#E8E2D6] hover:border-violet-500 hover:text-violet-700'
                }`}
              >
                <User className="w-3.5 h-3.5 text-violet-600" />
                <span>ACCOUNT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="hidden lg:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs tracking-wider transition-all shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </button>
            )}

            {/* Burger Drawer Trigger */}
            <button
              type="button"
              onClick={onOpenDrawer}
              aria-label="Open Navigation Drawer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#E8E2D6] bg-white flex items-center justify-center text-[#1E2A44] hover:bg-[#FAF7F0] hover:border-amber-400 hover:text-amber-700 transition-all shadow-xs cursor-pointer"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Top Navigation Strip (< 1024px) for browser-friendly top navigation */}
        <div className="flex lg:hidden items-center gap-1.5 py-2 overflow-x-auto scrollbar-none border-t border-[#E8E2D6]/70">
          <button
            type="button"
            onClick={() => onChangeTab('search')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider shrink-0 transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#1E2A44] text-white shadow-xs'
                : 'bg-white text-[#5B6478] border border-[#E8E2D6] hover:text-[#1E2A44]'
            }`}
          >
            HOME
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('sightview')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'sightview'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
            }`}
          >
            <Camera className="w-3 h-3 text-amber-500" />
            <span>SIGHTVIEW AI™</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('saved')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-[#1E2A44] text-white shadow-xs'
                : 'bg-white text-[#5B6478] border border-[#E8E2D6] hover:text-[#1E2A44]'
            }`}
          >
            <span>SAVED</span>
            {currentUser && savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white">
                {savedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('cases')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cases'
                ? 'bg-[#1E2A44] text-white shadow-xs'
                : 'bg-white text-[#5B6478] border border-[#E8E2D6] hover:text-[#1E2A44]'
            }`}
          >
            <span>CASES</span>
            {currentUser && caseCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-white">
                {caseCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={() => onChangeTab('account')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-[#1E2A44] text-white shadow-xs'
                  : 'bg-white text-[#5B6478] border border-[#E8E2D6] hover:text-[#1E2A44]'
              }`}
            >
              <User className="w-3 h-3 text-violet-600" />
              <span>ACCOUNT</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider shrink-0 flex items-center gap-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>SIGN IN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
