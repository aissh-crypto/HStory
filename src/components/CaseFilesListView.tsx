import React, { useState } from 'react';
import {
  FolderCheck,
  ArrowRight,
  ShieldCheck,
  Search,
  Clock,
  Sparkles,
  Trash2,
  X,
  ArrowLeft,
  RotateCcw,
  Archive,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { CaseFile, Property } from '../types';
import { computeCaseFileProgress } from '../utils/caseStatus';

interface CaseFilesListViewProps {
  caseFiles: CaseFile[];
  properties: Property[];
  onOpenCaseFile: (caseFile: CaseFile) => void;
  onNavigateToSearch: () => void;
  onDismissCase?: (caseId: string) => void; // Moves case to History
  onRestoreCase?: (caseId: string) => void; // Restores from History to Active
  onPermanentDeleteCase?: (caseId: string) => void; // Permanently purges from database
}

export const CaseFilesListView: React.FC<CaseFilesListViewProps> = ({
  caseFiles = [],
  properties = [],
  onOpenCaseFile,
  onNavigateToSearch,
  onDismissCase,
  onRestoreCase,
  onPermanentDeleteCase,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'history'>('active');
  const [confirmingArchiveId, setConfirmingArchiveId] = useState<string | null>(null);
  const [confirmingPermanentDeleteId, setConfirmingPermanentDeleteId] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const defaultProp = properties[0];

  // Partition active and archived cases
  const activeCases = caseFiles.filter(
    (c) => c.status !== 'Archived' && c.isArchived !== true
  );
  const historyCases = caseFiles.filter(
    (c) => c.status === 'Archived' || c.isArchived === true
  );

  const displayedCases = activeSubTab === 'active' ? activeCases : historyCases;

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  const handleArchive = (caseId: string) => {
    if (onDismissCase) {
      onDismissCase(caseId);
      setConfirmingArchiveId(null);
      showToast('Case file moved to History tab. You can refer to it anytime.');
    }
  };

  const handleRestore = (caseId: string) => {
    if (onRestoreCase) {
      onRestoreCase(caseId);
      showToast('Case restored to Active Dossiers.');
    }
  };

  const handlePermanentDelete = (caseId: string) => {
    if (onPermanentDeleteCase) {
      onPermanentDeleteCase(caseId);
      setConfirmingPermanentDeleteId(null);
      showToast('Case dossier permanently removed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8 pb-20">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#1E2A44] text-white text-xs font-semibold shadow-xl border border-amber-400/40 flex items-center gap-2 animate-bounce">
          <Archive className="w-4 h-4 text-amber-400" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Top Back Navigation Strip */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onNavigateToSearch}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E8E2D6] bg-white hover:border-[#C98A3E] hover:bg-[#FAF7F0] text-xs font-semibold text-[#1E2A44] transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C98A3E]" />
          <span>Back to Explore</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div className="space-y-1">
          <span className="font-label text-[10px] text-[#C98A3E] font-bold tracking-widest uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#C98A3E]" />
            UNDERWRITING DOSSIERS &amp; AUDITS
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1E2A44]">
            Due Diligence Case Files
          </h1>
          <p className="text-sm text-[#5B6478]">
            {activeCases.length} active investigation dossiers • {historyCases.length} parked under history
          </p>
        </div>

        <button
          onClick={onNavigateToSearch}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E2D6] bg-white hover:border-[#C98A3E] text-xs font-semibold text-[#1E2A44] transition-all self-start sm:self-auto shadow-xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#C98A3E]" />
          <span>New Property Audit</span>
        </button>
      </div>

      {/* Case Files Subtabs: Active Dossiers vs. History */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E8E2D6] pb-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setActiveSubTab('active')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'active'
                ? 'bg-[#1E2A44] text-white shadow-sm ring-2 ring-slate-800/10'
                : 'bg-white text-[#5B6478] hover:text-[#1E2A44] border border-[#E8E2D6] hover:bg-[#FAF7F0]'
            }`}
          >
            <FolderCheck className="w-4 h-4 text-amber-400" />
            <span>Active Cases</span>
            {activeCases.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeSubTab === 'active'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {activeCases.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-[#1E2A44] text-white shadow-sm ring-2 ring-slate-800/10'
                : 'bg-white text-[#5B6478] hover:text-[#1E2A44] border border-[#E8E2D6] hover:bg-[#FAF7F0]'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>History</span>
            {historyCases.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeSubTab === 'history'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {historyCases.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs text-[#5B6478] hidden md:inline">
          {activeSubTab === 'active'
            ? 'Active underwriting in progress'
            : 'Deleted or closed cases parked for your reference'}
        </span>
      </div>

      {/* Main Grid View */}
      {displayedCases.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#E8E2D6] shadow-[0_20px_60px_rgba(30,42,68,0.06)] space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F0] border border-[#E8E2D6] flex items-center justify-center text-[#C98A3E] mx-auto">
            {activeSubTab === 'active' ? (
              <FolderCheck className="w-7 h-7" />
            ) : (
              <Clock className="w-7 h-7" />
            )}
          </div>
          <h3 className="font-serif font-bold text-xl text-[#1E2A44]">
            {activeSubTab === 'active'
              ? 'No Active Case Files'
              : 'No Case Files in History'}
          </h3>
          <p className="text-xs sm:text-sm text-[#5B6478] leading-relaxed">
            {activeSubTab === 'active'
              ? 'Find any property you are evaluating and start an audit dossier to underwrite mortgage stress, valuation, and physical DLP defect risks.'
              : 'When you delete or close an active case file, it will be safely parked here so you can refer to past findings, videos, and inspection photos anytime.'}
          </p>
          {activeSubTab === 'active' ? (
            <button
              onClick={onNavigateToSearch}
              className="px-6 py-3 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#C98A3E]" />
              <span>Search Properties</span>
            </button>
          ) : (
            activeCases.length > 0 && (
              <button
                onClick={() => setActiveSubTab('active')}
                className="px-5 py-2.5 rounded-xl border border-[#E8E2D6] hover:border-[#C98A3E] text-xs font-semibold text-[#1E2A44] inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-[#C98A3E]" />
                <span>View {activeCases.length} Active Dossiers</span>
              </button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayedCases.map((c, index) => {
            const prop = properties.find((p) => p.id === c.propertyId) || defaultProp;
            if (!prop) return null;

            const marketPosition =
              c.decisionProfile?.marketPosition || prop.valuation?.marketPosition || 'Fairly Valued';
            const stressedDsr = c.modules?.stressTest?.stressedDsrPercent || 38.5;
            const price = prop.price || 1850000;
            const currency = prop.currency || 'MYR';
            const psqft =
              prop.valuation?.pricePerSqFt || Math.round(price / (prop.builtUpArea || 1000));
            const image =
              prop.images?.[0] ||
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';

            const calculated = computeCaseFileProgress(c);
            const isArchived = c.status === 'Archived' || c.isArchived === true;
            const effectiveProgress = isArchived
              ? c.progressPercent ?? calculated.progressPercent
              : c.progressPercent && c.progressPercent >= calculated.progressPercent
              ? c.progressPercent
              : calculated.progressPercent;
            const effectiveStatus = isArchived ? 'Parked in History' : c.status || calculated.status;
            const completedModules = calculated.completedCount;

            return (
              <div
                key={c.caseId || `case-${index}`}
                onClick={() => onOpenCaseFile(c)}
                className={`bg-white rounded-[24px] overflow-hidden border transition-all cursor-pointer group flex flex-col justify-between apple-reveal ${
                  isArchived
                    ? 'border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] opacity-95 hover:border-amber-400'
                    : 'border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] hover:shadow-[0_20px_50px_rgba(30,42,68,0.1)]'
                }`}
              >
                <div>
                  {/* Photo & Status Banner */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#FAF7F0]">
                    <img
                      src={image}
                      alt={prop.title || 'Property'}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                        isArchived ? 'filter saturate-75' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                      <span className="font-label text-[9px] px-2.5 py-1 rounded-full bg-[#1E2A44]/90 backdrop-blur-sm text-white font-medium">
                        {prop.country || 'Malaysia'} • #{c.caseId ? c.caseId.slice(-6) : `00${index + 1}`}
                      </span>

                      <span
                        className={`font-label text-[9px] px-2.5 py-1 rounded-full font-bold shadow-xs ${
                          isArchived
                            ? 'bg-slate-700 text-slate-100 border border-white/20'
                            : effectiveStatus === 'Decision Ready'
                            ? 'bg-emerald-600 text-white'
                            : effectiveStatus === 'In Progress'
                            ? 'bg-[#C98A3E] text-white'
                            : 'bg-slate-700/90 text-slate-100 border border-white/20'
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <div className="font-sans font-bold text-xl drop-shadow-xs">
                        {currency} {price.toLocaleString()}
                      </div>
                      <div className="font-mono text-[10px] text-white/90">
                        {currency} {psqft.toLocaleString()} / sqft
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-base text-[#1E2A44] group-hover:text-[#C98A3E] transition-colors line-clamp-1">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-[#5B6478] line-clamp-1">
                        {prop.address}, {prop.city}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E8E2D6] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-label text-[9px] text-[#5B6478] font-bold">
                          DILIGENCE RECORD
                        </span>
                        <span className="font-mono font-bold text-[#1E2A44]">
                          {effectiveProgress}% {isArchived ? '(Archived)' : effectiveProgress === 0 ? '(Not Started)' : ''}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isArchived
                              ? 'bg-slate-400'
                              : 'bg-gradient-to-r from-amber-500 to-emerald-600'
                          }`}
                          style={{ width: `${Math.max(effectiveProgress, 3)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-[#5B6478] flex items-center justify-between">
                        <span>Modules Completed:</span>
                        <span className="font-semibold text-slate-700">
                          {completedModules} of 5 Completed
                        </span>
                      </div>
                    </div>

                    {/* Decision Profile Snippet */}
                    <div className="p-3 rounded-xl bg-white border border-[#E8E2D6] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-label text-[9px] text-[#5B6478] font-bold">VALUATION</span>
                        <span className="font-medium text-[#1E2A44]">{marketPosition}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-label text-[9px] text-[#5B6478] font-bold">STRESSED DSR</span>
                        <span className="font-mono font-bold text-[#C98A3E]">
                          {stressedDsr}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Strip with Action Buttons */}
                <div className="p-4 bg-[#FAF7F0] border-t border-[#E8E2D6] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#5B6478] font-mono text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C98A3E]" />
                    <span>{isArchived ? 'Preserved for Reference' : '5 Modules Active'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Active Tab Actions: Move to History */}
                    {!isArchived && onDismissCase && (
                      confirmingArchiveId === c.caseId ? (
                        <div
                          className="flex items-center gap-1.5 bg-amber-50 p-1 px-2 rounded-xl border border-amber-300 animate-fadeIn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-amber-900">
                            Park in History?
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleArchive(c.caseId);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold cursor-pointer transition-all shadow-2xs"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmingArchiveId(null);
                            }}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmingArchiveId(c.caseId);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Move to History Tab (You can still refer to this case anytime)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}

                    {/* History Tab Actions: Restore to Active or Permanently Delete */}
                    {isArchived && (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {onRestoreCase && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRestore(c.caseId);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] transition-colors cursor-pointer"
                            title="Restore back to Active Cases"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-600" />
                            <span>Restore</span>
                          </button>
                        )}

                        {onPermanentDeleteCase && (
                          confirmingPermanentDeleteId === c.caseId ? (
                            <div className="flex items-center gap-1 bg-rose-50 p-1 px-1.5 rounded-lg border border-rose-300">
                              <span className="text-[9px] font-bold text-rose-800">Delete forever?</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePermanentDelete(c.caseId);
                                }}
                                className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px]"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConfirmingPermanentDeleteId(null);
                                }}
                                className="p-0.5 text-slate-500 hover:text-slate-800"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmingPermanentDeleteId(c.caseId);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Permanently Delete Case File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    )}

                    <span className="font-label text-xs font-semibold text-[#1E2A44] group-hover:text-[#C98A3E] flex items-center gap-1 transition-colors">
                      <span>{isArchived ? 'Refer Dossier' : 'Open Dossier'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C98A3E] group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
