import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  Building,
  DollarSign,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Zap,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { CaseFile, Property, UserProfile, SiteVisitItem, CountryChecklistItem } from '../types';
import { COUNTRY_PACKS } from '../data/countryPacks';
import { api } from '../services/api';

interface CaseFilesViewProps {
  caseFiles: CaseFile[];
  properties: Property[];
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;
  onUpdateCaseFile: (updatedCase: CaseFile) => void;
  userProfile: UserProfile;
  onAskAi: (property: Property) => void;
}

export const CaseFilesView: React.FC<CaseFilesViewProps> = ({
  caseFiles,
  properties,
  activeCaseId,
  setActiveCaseId,
  onUpdateCaseFile,
  userProfile,
  onAskAi,
}) => {
  const currentCase = caseFiles.find((c) => c.caseId === activeCaseId) || caseFiles[0];
  const currentProperty = properties.find((p) => p.id === currentCase?.propertyId);

  const [activeTab, setActiveTab] = useState<'all' | 'valuation' | 'stress' | 'developer' | 'inspection' | 'legal'>('all');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isAuditingDeveloper, setIsAuditingDeveloper] = useState(false);
  const [isAnalyzingPrice, setIsAnalyzingPrice] = useState(false);
  const [targetOfferInput, setTargetOfferInput] = useState<string>(
    currentCase?.modules.priceAnalysis.userTargetPrice
      ? String(currentCase.modules.priceAnalysis.userTargetPrice)
      : String(currentProperty?.price || '')
  );

  if (!currentCase || !currentProperty) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <FileText className="w-16 h-16 text-[#C98A3E] mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-serif font-bold text-[#1E2A44] mb-2">
          No Due Diligence Dossiers Open
        </h2>
        <p className="text-sm text-[#1E2A44]/70 max-w-md mx-auto mb-6">
          Browse properties in the Explore tab and click &quot;Due Diligence&quot; to initialize an institutional audit dossier.
        </p>
      </div>
    );
  }

  const countryPack = COUNTRY_PACKS[currentProperty.country] || COUNTRY_PACKS['Malaysia'];

  const rawDP = currentCase?.decisionProfile || (currentCase as any)?.verdict || {};
  const safeProfile = {
    affordability: rawDP.affordability || 'Affordable within standard benchmarks.',
    marketPosition: rawDP.marketPosition || currentProperty?.valuation?.marketPosition || 'Fairly Valued',
    riskSignals: rawDP.riskSignals || 'Verify strata sinking fund reserves and management corporation audit.',
    downsideResilience: rawDP.downsideResilience || 'Defensive rental yield supports tenant occupancy.',
    strengths: Array.isArray(rawDP.strengths) && rawDP.strengths.length > 0
      ? rawDP.strengths
      : [
          `Prime connectivity within walking distance of key transit nodes in ${currentProperty.city}.`,
          `Established reputable master developer (${currentProperty.developer}) with solid delivery track record.`,
          `Resilient rental demand profile (${currentProperty.currency} ${currentProperty.estimatedRentalValue}/mo estimated).`,
        ],
    risks: Array.isArray(rawDP.risks) && rawDP.risks.length > 0
      ? rawDP.risks
      : [
          'Upcoming maintenance fee or sinking fund adjustments upon management handover.',
          'Interest rate volatility risk over initial loan tenure lock-in period.',
          'Potential noise from upcoming high-density projects in adjacent plots.',
        ],
    verdictRecommendation: rawDP.verdictRecommendation || 'Verify management corporation audited accounts before offer.',
    negotiationAdvice: rawDP.negotiationAdvice || 'Leverage supply to negotiate 3-5% buffer.',
    lastSynthesizedAt: rawDP.lastSynthesizedAt || 'Initial Seed',
  };

  // Helper to re-calculate stress test metrics
  const updateStressTestParam = (field: string, val: number) => {
    let cleanVal = Number(val);
    if (isNaN(cleanVal)) cleanVal = 0;
    if (field === 'monthlyIncome' && cleanVal < 0) cleanVal = 0;
    if (field === 'otherDebtCommitments' && cleanVal < 0) cleanVal = 0;

    const st = { ...currentCase.modules.stressTest, [field]: cleanVal };
    const price = currentProperty.price;
    const loanAmount = Math.round(price * (1 - st.downPaymentPercent / 100));
    const monthlyRate = st.interestRate / 100 / 12;
    const totalPayments = st.loanTenureYears * 12;

    const monthlyInstallment = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1)
    );

    // Stressed rate (+2.0%)
    const stressedRate = (st.interestRate + 2.0) / 100 / 12;
    const stressedInstallment = Math.round(
      (loanAmount * stressedRate * Math.pow(1 + stressedRate, totalPayments)) /
        (Math.pow(1 + stressedRate, totalPayments) - 1)
    );

    const validIncome = typeof st.monthlyIncome === 'number' && st.monthlyIncome > 0 ? st.monthlyIncome : 0;
    const dsrPercent = validIncome > 0
      ? Number((((monthlyInstallment + st.otherDebtCommitments) / validIncome) * 100).toFixed(1))
      : 0;
    const stressedDsrPercent = validIncome > 0
      ? Number((((stressedInstallment + st.otherDebtCommitments) / validIncome) * 100).toFixed(1))
      : 0;
    const totalInterestPaid = monthlyInstallment * totalPayments - loanAmount;

    let approvalVerdict: 'Safe' | 'Moderate Risk' | 'High Risk' = 'Safe';
    if (validIncome <= 0 || stressedDsrPercent > countryPack.maxStandardDsr) {
      approvalVerdict = 'High Risk';
    } else if (dsrPercent > countryPack.maxStandardDsr - 10) {
      approvalVerdict = 'Moderate Risk';
    }

    const updatedCase: CaseFile = {
      ...currentCase,
      modules: {
        ...currentCase.modules,
        stressTest: {
          ...st,
          loanAmount,
          monthlyInstallment,
          stressedInstallment,
          dsrPercent,
          stressedDsrPercent,
          totalInterestPaid,
          approvalVerdict,
          completed: true,
        },
      },
    };

    onUpdateCaseFile(updatedCase);
  };

  // Helper: toggle site visit item status
  const updateSiteVisitItem = (itemId: string, status: 'pass' | 'concern' | 'fail' | 'pending') => {
    const siteList = currentCase.modules.siteVisit?.checklist || [];
    const updatedChecklist = siteList.map((item: any) =>
      item.id === itemId ? { ...item, status } : item
    );

    const updatedCase: CaseFile = {
      ...currentCase,
      modules: {
        ...currentCase.modules,
        siteVisit: {
          ...currentCase.modules.siteVisit,
          checklist: updatedChecklist,
          completed: updatedChecklist.filter((i: any) => i.status !== 'pending').length >= 3,
        },
      },
    };

    onUpdateCaseFile(updatedCase);
  };

  // Helper: toggle country checklist item status
  const updateCountryChecklistItem = (
    itemId: string,
    status: 'verified' | 'action_needed' | 'not_applicable'
  ) => {
    const compList = currentCase.modules.countryCompliance?.checklist || [];
    const updatedChecklist = compList.map((item: any) =>
      item.id === itemId ? { ...item, status } : item
    );

    const updatedCase: CaseFile = {
      ...currentCase,
      modules: {
        ...currentCase.modules,
        countryCompliance: {
          ...currentCase.modules.countryCompliance,
          checklist: updatedChecklist,
          completed: updatedChecklist.every((i: any) => i.status !== 'action_needed' || !i.critical),
        },
      },
    };

    onUpdateCaseFile(updatedCase);
  };

  // Trigger Gemini AI Case Synthesis
  const handleSynthesizeVerdict = async () => {
    setIsSynthesizing(true);
    try {
      const decision = await api.synthesizeCase({
        property: currentProperty,
        modules: currentCase.modules,
        countryPack,
        stressTestResults: currentCase.modules.stressTest,
      });

      const updatedCase: CaseFile = {
        ...currentCase,
        status: 'Decision Ready',
        progressPercent: Math.min(100, (currentCase.progressPercent || 80) + 20),
        decisionProfile: {
          ...decision,
          lastSynthesizedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };

      onUpdateCaseFile(updatedCase);
    } catch (err) {
      console.error('Synthesis failed', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Trigger Gemini AI Developer Re-Audit
  const handleAuditDeveloper = async () => {
    setIsAuditingDeveloper(true);
    try {
      const signals = await api.auditDeveloper(
        currentProperty.developer,
        currentProperty.title,
        currentProperty.country
      );

      const updatedCase: CaseFile = {
        ...currentCase,
        modules: {
          ...currentCase.modules,
          developerAudit: {
            ...currentCase.modules.developerAudit,
            completed: true,
            customSignals: signals,
          },
        },
      };
      onUpdateCaseFile(updatedCase);
    } catch (err) {
      console.error('Developer audit failed', err);
    } finally {
      setIsAuditingDeveloper(false);
    }
  };

  // Trigger Gemini AI Price Re-Evaluation
  const handleReanalyzePrice = async () => {
    setIsAnalyzingPrice(true);
    try {
      const valuation = await api.analyzePrice(currentProperty, countryPack);
      const updatedCase: CaseFile = {
        ...currentCase,
        modules: {
          ...currentCase.modules,
          priceAnalysis: {
            ...currentCase.modules.priceAnalysis,
            completed: true,
            customValuation: valuation,
          },
        },
      };
      onUpdateCaseFile(updatedCase);
    } catch (err) {
      console.error('Price analysis failed', err);
    } finally {
      setIsAnalyzingPrice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentValuation =
    currentCase.modules.priceAnalysis.customValuation || currentProperty.valuation;
  const currentDevSignals =
    currentCase.modules.developerAudit.customSignals || currentProperty.developerSignals;
  const stress = currentCase.modules.stressTest;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Dossier Header & Multi-Case Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DEC9] shadow-sm space-y-6">
        {/* Case Switcher Tabs */}
        {caseFiles.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5DEC9]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E2A44]/60 mr-2 shrink-0">
              Active Dossiers:
            </span>
            {caseFiles.map((c) => {
              const p = properties.find((item) => item.id === c.propertyId);
              return (
                <button
                  key={c.caseId}
                  onClick={() => setActiveCaseId(c.caseId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 border ${
                    c.caseId === activeCaseId
                      ? 'bg-[#1E2A44] text-[#F3EEE4] border-[#1E2A44]'
                      : 'bg-[#FAF7F0] hover:bg-[#E5DEC9]/40 text-[#1E2A44] border-[#E5DEC9]'
                  }`}
                >
                  <span className="truncate max-w-[150px]">{p?.title || c.caseId}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">
                    {c.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Dossier Title & Executive Progress */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#1E2A44] text-white">
                Dossier #{currentCase.caseId.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#C98A3E] text-white">
                {currentCase.status}
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#E5DEC9] text-[#1E2A44]">
                {currentProperty.country} Regulatory Code
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1E2A44]">
              {currentProperty.title}
            </h1>
            <p className="text-sm text-[#1E2A44]/75">
              {currentProperty.address}, {currentProperty.city} • Asking: <strong>{currentProperty.currency} {currentProperty.price.toLocaleString()}</strong> ({currentProperty.currency} {currentValuation.pricePerSqFt} psf)
            </p>
          </div>

          {/* Diligence Health Score & Actions */}
          <div className="flex items-center gap-4 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shrink-0">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60">
                Audit Readiness
              </div>
              <div className="text-2xl font-serif font-bold text-[#1E2A44]">
                {currentCase.progressPercent}%
              </div>
              <div className="text-[11px] text-[#1E2A44]/70">
                5 Critical Modules Tracked
              </div>
            </div>

            <div className="h-10 w-px bg-[#E5DEC9]" />

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSynthesizeVerdict}
                disabled={isSynthesizing}
                className="px-4 py-2 rounded-xl bg-[#C98A3E] hover:bg-[#b07834] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Re-Synthesize Verdict</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-1.5 rounded-xl border border-[#E5DEC9] hover:bg-white text-xs font-semibold text-[#1E2A44] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#1E2A44]/70" />
                <span>Export / Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5-Module Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 text-xs">
          {[
            { id: 'all', label: 'Complete Audit Dossier' },
            { id: 'valuation', label: '1. Price & Fair Valuation' },
            { id: 'stress', label: '2. Mortgage & DSR Stress Test' },
            { id: 'developer', label: '3. Developer Track & Signals' },
            { id: 'inspection', label: '4. Physical Site Inspection' },
            { id: 'legal', label: `5. ${currentProperty.country} Legal Checklist` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-semibold shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1E2A44] text-[#F3EEE4] shadow-sm'
                  : 'bg-[#FAF7F0] hover:bg-[#E5DEC9]/50 text-[#1E2A44] border border-[#E5DEC9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SYNTHESIZED EXECUTIVE DECISION PROFILE (HERO CARD) */}
      {(activeTab === 'all' || activeTab === 'valuation') && (
        <div className="bg-gradient-to-br from-[#1E2A44] via-[#243352] to-[#1E2A44] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C98A3E]/20 border border-[#C98A3E]/40 text-[#C98A3E] text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini 3.8 Flash Synthesized Memorandum
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#F3EEE4]">
                Property Decision Profile &amp; Verdict
              </h2>
            </div>

            {safeProfile.lastSynthesizedAt && (
              <span className="text-xs text-white/60">
                Last synthesized at {safeProfile.lastSynthesizedAt}
              </span>
            )}
          </div>

          {/* 4 Core Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C98A3E] mb-1">
                Affordability &amp; DSR
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                {safeProfile.affordability}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C98A3E] mb-1">
                Market Valuation
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                {safeProfile.marketPosition} — {currentProperty.currency} {currentValuation.pricePerSqFt} psf vs {currentProperty.currency} {currentValuation.districtMedianPsqft} median.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C98A3E] mb-1">
                Risk Signals
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                {safeProfile.riskSignals}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C98A3E] mb-1">
                Downside Resilience
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                {safeProfile.downsideResilience}
              </p>
            </div>
          </div>

          {/* Strengths & Critical Risks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Strengths */}
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Key Investment Strengths
              </h3>
              <ul className="space-y-2 text-xs text-white/90">
                {(safeProfile.strengths || []).map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Risks */}
            <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Diligence Watchouts &amp; Risks
              </h3>
              <ul className="space-y-2 text-xs text-white/90">
                {(safeProfile.risks || []).map((r: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Next Steps & Negotiation Tactical Angle */}
          <div className="p-5 rounded-2xl bg-[#C98A3E]/10 border border-[#C98A3E]/30 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#C98A3E] flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Tactical Acquisition &amp; Negotiation Advisory
            </div>
            <p className="text-xs text-[#F3EEE4] leading-relaxed">
              <strong>Action Before Offer:</strong> {safeProfile.verdictRecommendation}
            </p>
            <p className="text-xs text-[#F3EEE4] leading-relaxed">
              <strong>Negotiation Leverage:</strong> {safeProfile.negotiationAdvice}
            </p>
          </div>
        </div>
      )}

      {/* MODULE 1: VALUATION & PRICE ANALYSIS */}
      {(activeTab === 'all' || activeTab === 'valuation') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DEC9] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DEC9]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C98A3E]">
                Module 01
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E2A44]">
                Price Due Diligence &amp; Valuation Corridor
              </h3>
            </div>

            <button
              onClick={handleReanalyzePrice}
              disabled={isAnalyzingPrice}
              className="px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E5DEC9]/40 border border-[#E5DEC9] text-xs font-semibold text-[#1E2A44] flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isAnalyzingPrice ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1E2A44]/30 border-t-[#1E2A44] rounded-full animate-spin" />
                  <span>Re-modeling...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-[#C98A3E]" />
                  <span>Re-evaluate Price with Gemini</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60">
                Asking Price
              </div>
              <div className="text-2xl font-bold font-serif text-[#1E2A44]">
                {currentProperty.currency} {currentProperty.price.toLocaleString()}
              </div>
              <div className="text-xs text-[#1E2A44]/70 mt-1">
                {currentProperty.currency} {currentValuation.pricePerSqFt} / sqft
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60">
                Fair Value Corridor
              </div>
              <div className="text-2xl font-bold font-serif text-[#C98A3E]">
                {currentProperty.currency} {(currentValuation.fairValueMin / 1000).toFixed(0)}k – {(currentValuation.fairValueMax / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-[#1E2A44]/70 mt-1">
                Institutional median baseline
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60">
                Gross Rental Yield
              </div>
              <div className="text-2xl font-bold font-serif text-emerald-700">
                {currentValuation.grossRentalYield}
              </div>
              <div className="text-xs text-[#1E2A44]/70 mt-1">
                Est. {currentProperty.currency} {currentProperty.estimatedRentalValue.toLocaleString()} / mo
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] text-xs text-[#1E2A44]/80 leading-relaxed">
            <strong>Analyst Rationale:</strong> {currentValuation.reasoning}
          </div>
        </div>
      )}

      {/* MODULE 2: MORTGAGE & DSR STRESS TEST */}
      {(activeTab === 'all' || activeTab === 'stress') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DEC9] shadow-sm space-y-6">
          <div className="pb-4 border-b border-[#E5DEC9]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C98A3E]">
              Module 02
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E2A44]">
              Mortgage Cashflow &amp; Interest Rate Stress Simulator
            </h3>
            <p className="text-xs text-[#1E2A44]/70 mt-1">
              Tests whether debt payments hold up under a sudden <strong>+2.0% interest rate spike</strong> against {countryPack.name} bank underwriting caps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interactive Sliders */}
            <div className="space-y-5">
              {/* Down Payment % */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-[#1E2A44]">
                  <span>Down Payment Percentage</span>
                  <span className="text-[#C98A3E] font-bold">{stress.downPaymentPercent}% ({currentProperty.currency} {((currentProperty.price * stress.downPaymentPercent) / 100).toLocaleString()})</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={stress.downPaymentPercent}
                  onChange={(e) => updateStressTestParam('downPaymentPercent', Number(e.target.value))}
                  className="w-full accent-[#C98A3E]"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-[#1E2A44]">
                  <span>Mortgage Base Rate</span>
                  <span className="text-[#C98A3E] font-bold">{stress.interestRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="9.0"
                  step="0.1"
                  value={stress.interestRate}
                  onChange={(e) => updateStressTestParam('interestRate', Number(e.target.value))}
                  className="w-full accent-[#C98A3E]"
                />
              </div>

              {/* Loan Tenure */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-[#1E2A44]">
                  <span>Loan Tenure</span>
                  <span className="text-[#C98A3E] font-bold">{stress.loanTenureYears} Years</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="1"
                  value={stress.loanTenureYears}
                  onChange={(e) => updateStressTestParam('loanTenureYears', Number(e.target.value))}
                  className="w-full accent-[#C98A3E]"
                />
              </div>

              {/* Monthly Income */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60 mb-1">
                    Monthly Gross Income ({currentProperty.currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={stress.monthlyIncome > 0 ? stress.monthlyIncome : ''}
                    onChange={(e) => updateStressTestParam('monthlyIncome', Number(e.target.value))}
                    onBlur={() => {
                      if (!stress.monthlyIncome || stress.monthlyIncome <= 0) {
                        const fallback = currentProperty.country === 'Singapore' ? 9500 : 18000;
                        updateStressTestParam('monthlyIncome', fallback);
                      }
                    }}
                    placeholder="e.g. 18000 (must be > 0)"
                    className={`w-full px-3 py-2 text-xs rounded-lg border ${
                      !stress.monthlyIncome || stress.monthlyIncome <= 0
                        ? 'border-red-400 bg-red-50 text-red-950 font-bold'
                        : 'border-[#E5DEC9] bg-[#FAF7F0] font-semibold text-[#1E2A44]'
                    }`}
                  />
                  {(!stress.monthlyIncome || stress.monthlyIncome <= 0) && (
                    <div className="mt-1 text-[10px] text-red-600 flex items-center justify-between gap-1">
                      <span>Income cannot be 0 for DSR underwriting.</span>
                      <button
                        type="button"
                        onClick={() => {
                          const fallback = currentProperty.country === 'Singapore' ? 9500 : 18000;
                          updateStressTestParam('monthlyIncome', fallback);
                        }}
                        className="text-red-800 underline font-bold cursor-pointer"
                      >
                        Fill {currentProperty.currency} {currentProperty.country === 'Singapore' ? '9.5k' : '18k'}
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60 mb-1">
                    Other Commitments ({currentProperty.currency})
                  </label>
                  <input
                    type="number"
                    value={stress.otherDebtCommitments}
                    onChange={(e) => updateStressTestParam('otherDebtCommitments', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] font-semibold text-[#1E2A44]"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Stress Metric Cards */}
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9]">
                  <span className="text-xs font-semibold text-[#1E2A44]/70">
                    Calculated Loan Principal:
                  </span>
                  <span className="text-sm font-bold text-[#1E2A44]">
                    {currentProperty.currency} {stress.loanAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9]">
                  <div>
                    <div className="text-xs font-semibold text-[#1E2A44]">
                      Baseline Monthly Installment:
                    </div>
                    <div className="text-[10px] text-[#1E2A44]/60">At {stress.interestRate}% interest</div>
                  </div>
                  <span className="text-base font-bold text-[#1E2A44]">
                    {currentProperty.currency} {stress.monthlyInstallment.toLocaleString()} / mo
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9] bg-amber-50 p-2.5 rounded-xl border-amber-200">
                  <div>
                    <div className="text-xs font-bold text-amber-900">
                      Stressed Installment (+2.0% shock):
                    </div>
                    <div className="text-[10px] text-amber-700">Simulating rate rise to {(stress.interestRate + 2.0).toFixed(1)}%</div>
                  </div>
                  <span className="text-base font-bold text-amber-900">
                    {currentProperty.currency} {stress.stressedInstallment.toLocaleString()} / mo
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-xs font-semibold text-[#1E2A44]">
                      Debt Service Ratio (DSR):
                    </div>
                    <div className="text-[10px] text-[#1E2A44]/60">
                      Standard max benchmark: {countryPack.maxStandardDsr}%
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#1E2A44]">
                      {stress.dsrPercent}%
                    </span>
                    <span className="text-xs text-amber-700 ml-1">
                      (Stressed: {stress.stressedDsrPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval Likelihood Pill */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  stress.approvalVerdict === 'Safe'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : stress.approvalVerdict === 'Moderate Risk'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-bold">Underwriting Verdict: {stress.approvalVerdict}</span>
                </div>
                <span>
                  {stress.approvalVerdict === 'Safe'
                    ? 'Comfortably within lending limits'
                    : stress.approvalVerdict === 'Moderate Risk'
                    ? 'Buffer tight against rate shocks'
                    : 'Exceeds standard bank lending caps'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: DEVELOPER PUBLIC SIGNALS & REGULATORY CHECK */}
      {(activeTab === 'all' || activeTab === 'developer') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DEC9] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DEC9]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C98A3E]">
                Module 03
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E2A44]">
                Developer Integrity, Tribunal Claims &amp; DLP Audit
              </h3>
            </div>

            <button
              onClick={handleAuditDeveloper}
              disabled={isAuditingDeveloper}
              className="px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E5DEC9]/40 border border-[#E5DEC9] text-xs font-semibold text-[#1E2A44] flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isAuditingDeveloper ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1E2A44]/30 border-t-[#1E2A44] rounded-full animate-spin" />
                  <span>Scanning Tribunal Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#C98A3E]" />
                  <span>Audit Developer with Gemini</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60">
                Reputation Grade
              </div>
              <div className="text-xl font-bold font-serif text-emerald-700">
                {currentDevSignals.reputationScore}
              </div>
              <div className="text-xs text-[#1E2A44]/70 mt-1">
                {currentDevSignals.completedProjectsCount} completed
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60">
                Delivery Timeliness
              </div>
              <div className="text-xl font-bold font-serif text-[#1E2A44]">
                {currentDevSignals.averageDelayMonths}
              </div>
              <div className="text-xs text-[#1E2A44]/70 mt-1">
                Handover consistency
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] md:col-span-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60">
                Regulatory Notices &amp; Tribunals
              </div>
              <div className="text-xs font-semibold text-[#1E2A44] mt-1">
                {currentDevSignals.regulatoryNotices}
              </div>
              <div className="text-xs text-[#1E2A44]/70 mt-0.5">
                Warranty: {currentDevSignals.warrantyAssessment}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] text-xs text-[#1E2A44]/80 leading-relaxed">
            <strong>Corporate Background Summary:</strong> {currentDevSignals.summary}
          </div>
        </div>
      )}

      {/* MODULE 4: PHYSICAL SITE VISIT INSPECTION GUIDE */}
      {(activeTab === 'all' || activeTab === 'inspection') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DEC9] shadow-sm space-y-6">
          <div className="pb-4 border-b border-[#E5DEC9]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C98A3E]">
              Module 04
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E2A44]">
              Guided Physical Site Visit &amp; Defects Inspection
            </h3>
            <p className="text-xs text-[#1E2A44]/70 mt-1">
              Field checklist designed for on-site property walkthroughs. Mark observations to incorporate defect risk into your synthesized verdict.
            </p>
          </div>

          <div className="space-y-3">
            {((currentCase.modules.siteVisit?.checklist || []) as any[]).map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E5DEC9] text-[#1E2A44]">
                    {item.category}
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-[#1E2A44]">
                    {item.item}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateSiteVisitItem(item.id, 'pass')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === 'pass'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    Pass
                  </button>

                  <button
                    onClick={() => updateSiteVisitItem(item.id, 'concern')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === 'concern'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
                    }`}
                  >
                    Concern
                  </button>

                  <button
                    onClick={() => updateSiteVisitItem(item.id, 'fail')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === 'fail'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-white hover:bg-rose-50 text-rose-800 border border-rose-300'
                    }`}
                  >
                    Fail
                  </button>

                  <button
                    onClick={() => updateSiteVisitItem(item.id, 'pending')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      item.status === 'pending'
                        ? 'bg-gray-400 text-white'
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 5: COUNTRY-SPECIFIC REGULATORY & TITLE COMPLIANCE */}
      {(activeTab === 'all' || activeTab === 'legal') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DEC9] shadow-sm space-y-6">
          <div className="pb-4 border-b border-[#E5DEC9]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C98A3E]">
              Module 05
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E2A44]">
              {countryPack.name} Legal &amp; Regulatory Audit Checklist
            </h3>
            <p className="text-xs text-[#1E2A44]/70 mt-1">
              Verifies title issuance, foreign buyer consents, sinking funds, caveats, and regulatory approvals.
            </p>
          </div>

          <div className="space-y-3">
            {((currentCase.modules.countryCompliance?.checklist || []) as any[]).map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E2A44]">
                      {item.title}
                    </span>
                    {item.critical && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#1E2A44]/75 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-1">
                  <button
                    onClick={() => updateCountryChecklistItem(item.id, 'verified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === 'verified'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    Verified
                  </button>

                  <button
                    onClick={() => updateCountryChecklistItem(item.id, 'action_needed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === 'action_needed'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
                    }`}
                  >
                    Action Needed
                  </button>

                  <button
                    onClick={() => updateCountryChecklistItem(item.id, 'not_applicable')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      item.status === 'not_applicable'
                        ? 'bg-gray-400 text-white'
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    N/A
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Ask Diligence Button */}
      <div className="text-center pt-4">
        <button
          onClick={() => onAskAi(currentProperty)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-sm font-semibold shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#C98A3E]" />
          <span>Ask Due Diligence AI Any Legal or Financial Question About {currentProperty.title}</span>
        </button>
      </div>
    </div>
  );
};
