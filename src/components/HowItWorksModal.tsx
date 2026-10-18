import React from 'react';
import { X, DollarSign, Activity, Building2, ClipboardCheck, Scale, ArrowRight, ShieldCheck } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExploring: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartExploring,
}) => {
  if (!isOpen) return null;

  const modules = [
    {
      num: '01',
      title: 'Fair-Value Price Analysis',
      icon: DollarSign,
      summary: 'Data-driven valuation corridor derived from verified transaction comps, sqft pricing, and land tenure.',
      detail: 'Avoid overpaying. Homestory analyzes recent caveat records, historical transaction trends, and compares current asking rates against the fair corridor with clear reasoning.',
      badge: 'Valuation Corridor',
    },
    {
      num: '02',
      title: 'Mortgage Stress Test',
      icon: Activity,
      summary: 'Interactive what-if simulator testing debt service ratio (DSR) under +2% interest rate shocks.',
      detail: 'Model your true monthly installment, calculate total interest liability over 30 years, and stress-test your household budget against unforeseen central bank rate increases.',
      badge: 'Rate Shock Underwriting',
    },
    {
      num: '03',
      title: 'Developer Risk Signal Check',
      icon: Building2,
      summary: 'Aggregated public records, construction delay signals, and defect history from public registries.',
      detail: 'Transparent risk signals rather than accusations. Verify whether the master developer has outstanding tribunal claims, litigation filings, or joint venture financial exposures.',
      badge: 'Public Risk Signals',
    },
    {
      num: '04',
      title: 'Guided Site Visit Inspection',
      icon: ClipboardCheck,
      summary: 'On-site checklist covering structural cracks, water ponding, DB electrical boxes, and acoustic levels.',
      detail: 'Take Homestory with you to physical viewings. Record field notes, inspect common area facilities, test water pressure, and capture red flags before putting down an earnest deposit.',
      badge: '5-Point Physical Audit',
    },
    {
      num: '05',
      title: 'Statutory & Contract Checklist',
      icon: Scale,
      summary: 'Jurisdiction-specific legal fee estimation, stamp duty (MOT), foreign ownership restrictions, and strata rules.',
      detail: 'Accurate country pack models for Malaysia (MOT stamp duty tiers, foreigner price thresholds) and Singapore (ABSD brackets, legal disbursements, CPF housing usage).',
      badge: 'Cross-Border Rules',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E2A44]/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-[#FBF9F5] border border-[#E8E2D6] rounded-[28px] shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-[#E8E2D6] flex items-start justify-between">
          <div className="space-y-1">
            <span className="font-label text-[11px] text-[#C98A3E]">
              METHODOLOGY & WORKFLOW
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#1E2A44]">
              How Homestory Protects Property Buyers
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6478] max-w-xl">
              Buying property is the largest financial commitment of your life. We run every candidate through 5 rigorous due-diligence pillars before you make an offer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-[#E8E2D6] flex items-center justify-center text-[#1E2A44] hover:bg-[#FAF7F0] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.num}
                className="p-5 rounded-2xl bg-white border border-[#E8E2D6] hover:border-[#C98A3E]/60 transition-all flex flex-col sm:flex-row gap-4 items-start"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F3E3C3]/40 border border-[#E8E2D6] flex items-center justify-center text-[#C98A3E] shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif font-bold text-base text-[#1E2A44]">
                      <span className="font-mono text-xs text-[#C98A3E] mr-2">{m.num}</span>
                      {m.title}
                    </h3>
                    <span className="font-label text-[9px] px-2 py-0.5 rounded bg-[#FAF7F0] text-[#1E2A44] border border-[#E8E2D6]">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#1E2A44] font-medium leading-relaxed">
                    {m.summary}
                  </p>
                  <p className="text-xs text-[#5B6478] leading-relaxed">
                    {m.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-[#E8E2D6] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#5B6478]">
            <ShieldCheck className="w-4 h-4 text-[#C98A3E]" />
            <span>Decision support platform • Not financial or legal advice</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#E8E2D6] text-xs font-semibold text-[#1E2A44] hover:bg-[#FAF7F0] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartExploring();
              }}
              className="px-6 py-2.5 rounded-full bg-[#1E2A44] text-white hover:bg-[#2A3B5E] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all flex-1 sm:flex-initial"
            >
              <span>Explore Listings</span>
              <ArrowRight className="w-4 h-4 text-[#C98A3E]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
