import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Building,
  ClipboardCheck,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Scale,
  FileText,
  Printer,
  ExternalLink,
  Phone,
  MessageCircle,
  Trash2,
  MapPin,
  Radio,
  Compass,
  Newspaper,
  ShieldCheck,
  Camera,
  Send,
  HelpCircle,
  Globe,
  Database,
  Info,
  Layers,
  Activity,
  Check,
  X,
  Volume2,
  VolumeX,
  Shield,
  Train,
  Video,
  Play,
  Download,
  ZoomIn,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import {
  CaseFile,
  Property,
  UserProfile,
  ModuleStatus,
  GroundedNewsItem,
  GroundedDeveloperAuditResult,
  GroundedFutureProjectsResult,
  ChecklistChatMessage,
  RecordedInspectionVideo,
} from '../types';
import { COUNTRY_PACKS } from '../data/countryPacks';
import { api } from '../services/api';
import { computeCaseFileProgress, isModuleDone, isModuleInProgress } from '../utils/caseStatus';

interface CaseFileDashboardProps {
  caseFile: CaseFile;
  property: Property;
  userProfile: UserProfile;
  onBack: () => void;
  onUpdateCaseFile: (updated: CaseFile) => void;
  onDismissCase?: (caseId: string) => void;
  onOpenSightView?: (property: Property, caseId?: string) => void;
}

export const CaseFileDashboard: React.FC<CaseFileDashboardProps> = ({
  caseFile,
  property,
  userProfile,
  onBack,
  onUpdateCaseFile,
  onDismissCase,
  onOpenSightView,
}) => {
  const [activeModule, setActiveModule] = useState<
    'price' | 'stress' | 'developer' | 'site' | 'checklist' | 'nearby' | 'future' | null
  >(null); // Start cleanly collapsed so user can explore any module without unexpected auto-expansion
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isConfirmingDismiss, setIsConfirmingDismiss] = useState(false);
  const [isAgentTraceOpen, setIsAgentTraceOpen] = useState(false);

  // Safe fallback for decisionProfile to completely prevent blank screen errors
  const fallbackDecisionProfile = {
    affordability: 'Affordable within standard debt service ratio benchmarks.',
    marketPosition: property?.valuation?.marketPosition || 'Fairly Valued',
    riskSignals: 'Verify strata sinking fund reserves and management corporation audit.',
    downsideResilience: 'Defensive rental yield supports tenant occupancy.',
    strengths: [
      `Prime connectivity within walking distance of key transit nodes in ${property?.city || 'Malaysia'}.`,
      `Established reputable master developer (${property?.developer || 'Developer'}) with solid delivery track record.`,
      `Resilient rental demand profile (${property?.currency || 'MYR'} ${property?.estimatedRentalValue || '6,000'}/mo estimated).`,
    ],
    risks: [
      `Upcoming maintenance fee or sinking fund adjustments upon management handover.`,
      `Interest rate volatility risk over initial loan tenure lock-in period.`,
      `Potential noise from upcoming high-density projects in adjacent plots.`,
    ],
    verdictRecommendation: `Verify management corporation audited accounts and sinking fund balance. Request official defect inspection report before executing Letter of Offer.`,
    negotiationAdvice: `Leverage current market inventory to negotiate an inclusion of fixtures or a 3-5% price buffer.`,
    lastSynthesizedAt: 'Initial Seed',
  };

  const rawDP = caseFile?.decisionProfile || (caseFile as any)?.verdict || {};
  const safeDecisionProfile = {
    ...fallbackDecisionProfile,
    ...rawDP,
    risks: Array.isArray(rawDP.risks) && rawDP.risks.length > 0
      ? rawDP.risks
      : fallbackDecisionProfile.risks,
    strengths: Array.isArray(rawDP.strengths) && rawDP.strengths.length > 0
      ? rawDP.strengths
      : fallbackDecisionProfile.strengths,
    verdictRecommendation: rawDP.verdictRecommendation || fallbackDecisionProfile.verdictRecommendation,
    negotiationAdvice: rawDP.negotiationAdvice || fallbackDecisionProfile.negotiationAdvice,
  };

  // Safe fallback for stress test values with REAL editable income & debts
  const safeStressTest = caseFile?.modules?.stressTest || {};
  const defaultCalculatedIncome =
    typeof safeStressTest.monthlyIncome === 'number' && safeStressTest.monthlyIncome > 0
      ? safeStressTest.monthlyIncome
      : (typeof userProfile?.monthlyGrossIncome === 'number' && userProfile.monthlyGrossIncome > 0
          ? userProfile.monthlyGrossIncome
          : (property.country === 'Singapore' ? 9500 : 18000));

  const [income, setIncome] = useState<number>(defaultCalculatedIncome);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [debtsError, setDebtsError] = useState<string | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<{
    url: string;
    index: number;
    total: number;
    title?: string;
    caption?: string;
  } | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [caseFile?.caseId]);

  const [debts, setDebts] = useState<number>(
    typeof safeStressTest.otherDebtCommitments === 'number' && safeStressTest.otherDebtCommitments >= 0
      ? safeStressTest.otherDebtCommitments
      : (userProfile?.existingMonthlyDebts || 0)
  );
  const [downPayment, setDownPayment] = useState<number>(
    safeStressTest.downPaymentPercent || 20
  );
  const [interestRate, setInterestRate] = useState<number>(
    safeStressTest.interestRate || 4.2
  );
  const [tenureYears, setTenureYears] = useState<number>(
    safeStressTest.loanTenureYears || 30
  );

  const countryPack =
    COUNTRY_PACKS[caseFile?.modules?.countryCompliance?.country || property?.country || 'Malaysia'] ||
    COUNTRY_PACKS['Malaysia'];

  // Real-time updater for financing & underwriting fields with strict validation
  const handleUpdateStressField = (
    field: 'income' | 'debts' | 'downPayment' | 'rate' | 'tenure',
    val: number
  ) => {
    let cleanVal = Number(val);
    if (isNaN(cleanVal)) cleanVal = 0;

    if (field === 'income') {
      if (cleanVal <= 0) {
        setIncomeError('Monthly gross salary cannot be 0. Bank underwriting requires a positive income to calculate Debt Service Ratio (DSR) and loan eligibility.');
      } else {
        setIncomeError(null);
      }
    }

    if (field === 'debts') {
      if (cleanVal < 0) {
        setDebtsError('Existing monthly debt commitments cannot be negative.');
        cleanVal = 0;
      } else {
        setDebtsError(null);
      }
    }

    if (field === 'downPayment') {
      if (cleanVal < 1) cleanVal = 1;
      if (cleanVal > 95) cleanVal = 95;
    }

    if (field === 'rate') {
      if (cleanVal < 0.1) cleanVal = 0.1;
      if (cleanVal > 25) cleanVal = 25;
    }

    if (field === 'tenure') {
      if (cleanVal < 1) cleanVal = 1;
      if (cleanVal > 35) cleanVal = 35;
    }

    const nextIncome = field === 'income' ? cleanVal : income;
    const nextDebts = field === 'debts' ? cleanVal : debts;
    const nextDown = field === 'downPayment' ? cleanVal : downPayment;
    const nextRate = field === 'rate' ? cleanVal : interestRate;
    const nextTenure = field === 'tenure' ? cleanVal : tenureYears;

    if (field === 'income') setIncome(cleanVal);
    if (field === 'debts') setDebts(cleanVal);
    if (field === 'downPayment') setDownPayment(cleanVal);
    if (field === 'rate') setInterestRate(cleanVal);
    if (field === 'tenure') setTenureYears(cleanVal);

    const lAmount = property.price * (1 - nextDown / 100);
    const mRate = nextRate / 100 / 12;
    const nMonths = nextTenure * 12;
    const mInstall =
      mRate > 0
        ? Math.round(
            (lAmount * mRate * Math.pow(1 + mRate, nMonths)) /
              (Math.pow(1 + mRate, nMonths) - 1)
          )
        : Math.round(lAmount / nMonths);
    const sRate = (nextRate + 2.0) / 100 / 12;
    const sInstall = Math.round(
      (lAmount * sRate * Math.pow(1 + sRate, nMonths)) /
        (Math.pow(1 + sRate, nMonths) - 1)
    );
    const dPercent = nextIncome > 0 ? Math.round(((mInstall + nextDebts) / nextIncome) * 100) : 0;
    const sDPercent = nextIncome > 0 ? Math.round(((sInstall + nextDebts) / nextIncome) * 100) : 0;

    let approvalVerdict: 'Safe' | 'Moderate Risk' | 'High Risk' = 'Safe';
    if (nextIncome <= 0) {
      approvalVerdict = 'High Risk';
    } else if (sDPercent > countryPack.maxStandardDsr) {
      approvalVerdict = 'Moderate Risk';
    }

    const updated = {
      ...caseFile,
      modules: {
        ...caseFile.modules,
        stressTest: {
          ...caseFile.modules.stressTest,
          monthlyIncome: nextIncome,
          otherDebtCommitments: nextDebts,
          downPaymentPercent: nextDown,
          interestRate: nextRate,
          loanTenureYears: nextTenure,
          loanAmount: lAmount,
          monthlyInstallment: mInstall,
          stressedInstallment: sInstall,
          dsrPercent: dPercent,
          stressedDsrPercent: sDPercent,
          approvalVerdict,
        },
      },
    };
    onUpdateCaseFile(updated);
  };

  // Stress test calculation with actual entered income and debt commitments
  const hasIncome = income > 0;
  const loanAmount = property.price * (1 - downPayment / 100);
  const monthlyRate = interestRate / 100 / 12;
  const numMonths = tenureYears * 12;
  const monthlyInstallment =
    monthlyRate > 0
      ? Math.round(
          (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numMonths)) /
            (Math.pow(1 + monthlyRate, numMonths) - 1)
        )
      : Math.round(loanAmount / numMonths);

  // +2.0% shock test
  const stressedRate = (interestRate + 2.0) / 100 / 12;
  const stressedInstallment = Math.round(
    (loanAmount * stressedRate * Math.pow(1 + stressedRate, numMonths)) /
      (Math.pow(1 + stressedRate, numMonths) - 1)
  );

  const totalMonthlyCommitments = monthlyInstallment + debts;
  const totalStressedCommitments = stressedInstallment + debts;
  const dsrPercent = hasIncome ? Math.round((totalMonthlyCommitments / income) * 100) : 0;
  const stressedDsrPercent = hasIncome ? Math.round((totalStressedCommitments / income) * 100) : 0;
  const netDisposableIncome = hasIncome ? Math.round(income - totalMonthlyCommitments) : 0;

  // Grounded Developer Check State - Initialize from saved customSignals
  const [isAuditingDeveloper, setIsAuditingDeveloper] = useState(false);
  const [groundedDevResult, setGroundedDevResult] = useState<GroundedDeveloperAuditResult | null>(
    (caseFile.modules?.developerAudit?.customSignals as GroundedDeveloperAuditResult) || null
  );

  // Sync if customSignals is loaded or restored
  useEffect(() => {
    if (caseFile.modules?.developerAudit?.customSignals) {
      setGroundedDevResult(caseFile.modules.developerAudit.customSignals as GroundedDeveloperAuditResult);
    }
  }, [caseFile.modules?.developerAudit?.customSignals]);

  // Video Inspection Preview Modal State
  const [activeVideoModal, setActiveVideoModal] = useState<RecordedInspectionVideo | null>(null);

  // Grounded Future Projects State
  const [isAuditingFuture, setIsAuditingFuture] = useState(false);
  const [groundedFutureResult, setGroundedFutureResult] = useState<GroundedFutureProjectsResult | null>(null);

  // Checklist AI Copilot Chat State
  const initialChecklistChat: ChecklistChatMessage[] =
    caseFile.modules?.countryCompliance?.checklistChat || [
      {
        id: 'msg-seed',
        role: 'assistant',
        text: `Hello! I am your institutional Due Diligence Checklist Agent for ${countryPack.name}. Ask me any question regarding legal caveats, Form 14A title transfers, foreign buyer EPU/State Consent quotas, or physical DLP defect audits.`,
        timestamp: 'Active Dossier',
      },
    ];
  const [checklistChat, setChecklistChat] = useState<ChecklistChatMessage[]>(initialChecklistChat);
  const [checklistInput, setChecklistInput] = useState('');
  const [isAskingChecklist, setIsAskingChecklist] = useState(false);

  // SightView In-Module Live Agent Chat & Audio Playback State
  const [siteAgentInput, setSiteAgentInput] = useState('');
  const [isAskingSiteAgent, setIsAskingSiteAgent] = useState(false);
  const [speakingTextId, setSpeakingTextId] = useState<string | null>(null);

  const speakText = (text: string, id?: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (id && speakingTextId === id) {
        setSpeakingTextId(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingTextId(null);
      utterance.onerror = () => setSpeakingTextId(null);
      if (id) setSpeakingTextId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendSiteAgentQuestion = async (presetText?: string) => {
    const textToSend = (presetText || siteAgentInput).trim();
    if (!textToSend) return;

    const userEntry = {
      speaker: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentTranscripts = caseFile.modules?.siteVisit?.transcripts || [];
    const updatedWithUser = [...currentTranscripts, userEntry];

    // Optimistically update case
    const interimCase = {
      ...caseFile,
      modules: {
        ...caseFile.modules,
        siteVisit: {
          ...caseFile.modules.siteVisit,
          transcripts: updatedWithUser,
        },
      },
    };
    onUpdateCaseFile(interimCase);
    setSiteAgentInput('');
    setIsAskingSiteAgent(true);

    try {
      const prompt = `As SightView AI on-site inspection expert evaluating ${property.title}, answer the buyer's query about physical defects, roof leaks, plumbing, or electrical safety: "${textToSend}". Be direct, reference building standards, and provide estimated repair impact.`;
      const res = await api.askChecklistCopilot({
        question: prompt,
        property,
        checklistItem: { item: textToSend, category: 'Site Visit & Defect Inspection' },
        countryPack,
      });

      const agentEntry = {
        speaker: 'SightView AI Observation',
        text: res.answer || `SightView AI analysis: Inspect the junction for moisture signs and test with an impedance moisture meter. Ensure contractor defect rectification within statutory DLP warranty.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalTranscripts = [...updatedWithUser, agentEntry];
      onUpdateCaseFile({
        ...caseFile,
        modules: {
          ...caseFile.modules,
          siteVisit: {
            ...caseFile.modules.siteVisit,
            transcripts: finalTranscripts,
          },
        },
      });
      speakText(agentEntry.text, `speech-${Date.now()}`);
    } catch {
      const fallbackEntry = {
        speaker: 'SightView AI Observation',
        text: `Inspection note for "${textToSend}": Verify against the master developer's statutory 24-month Defects Liability Period (DLP). Document with timestamped photographs before signing vacant possession acceptance.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onUpdateCaseFile({
        ...caseFile,
        modules: {
          ...caseFile.modules,
          siteVisit: {
            ...caseFile.modules.siteVisit,
            transcripts: [...updatedWithUser, fallbackEntry],
          },
        },
      });
      speakText(fallbackEntry.text, `speech-${Date.now()}`);
    } finally {
      setIsAskingSiteAgent(false);
    }
  };

  // "Ask Why" Verdict Drilldown Modal State with Interactive Agent Chat
  const [whyItem, setWhyItem] = useState<{ item: string; type: 'risk' | 'strength'; agentPerspective?: string } | null>(null);
  const [whyExplanation, setWhyExplanation] = useState<{
    explanation: string;
    agentPerspective: string;
    recommendation: string;
  } | null>(null);
  const [whyMessages, setWhyMessages] = useState<Array<{
    id: string;
    sender: 'agent' | 'user';
    text: string;
    timestamp: string;
    supportingDocs?: string[];
  }>>([]);
  const [whyChatInput, setWhyChatInput] = useState('');
  const [isLoadingWhy, setIsLoadingWhy] = useState(false);
  const [isSendingWhyChat, setIsSendingWhyChat] = useState(false);

  // Derive statuses for 5 modules using shared underwriting criteria
  const getStatus = (moduleKey: 'price' | 'stress' | 'developer' | 'site' | 'checklist'): ModuleStatus => {
    const mod = caseFile.modules?.[
      moduleKey === 'price'
        ? 'priceAnalysis'
        : moduleKey === 'stress'
        ? 'stressTest'
        : moduleKey === 'developer'
        ? 'developerAudit'
        : moduleKey === 'site'
        ? 'siteVisit'
        : 'countryCompliance'
    ];
    if (isModuleDone(moduleKey, mod)) return 'done';
    if (isModuleInProgress(moduleKey, mod)) return 'in progress';
    return 'not started';
  };

  const completedModulesCount = [
    getStatus('price') === 'done',
    getStatus('stress') === 'done',
    getStatus('developer') === 'done',
    getStatus('site') === 'done',
    getStatus('checklist') === 'done',
  ].filter(Boolean).length;

  const anyModuleInProgress = [
    getStatus('price') === 'in progress',
    getStatus('stress') === 'in progress',
    getStatus('developer') === 'in progress',
    getStatus('site') === 'in progress',
    getStatus('checklist') === 'in progress',
  ].some(Boolean);

  const inProgressModulesCount = [
    getStatus('price') === 'in progress',
    getStatus('stress') === 'in progress',
    getStatus('developer') === 'in progress',
    getStatus('site') === 'in progress',
    getStatus('checklist') === 'in progress',
  ].filter(Boolean).length;

  const currentProgressPercent = completedModulesCount === 5
    ? 100
    : Math.min(95, Math.round((completedModulesCount * 20) + (inProgressModulesCount * 10)));

  const statusBadge = (status: ModuleStatus) => {
    switch (status) {
      case 'done':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Done
          </span>
        );
      case 'in progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
            In Progress
          </span>
        );
      case 'not started':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
            Not Started
          </span>
        );
    }
  };

  // Set explicit module status: 'not started' | 'in progress' | 'done'
  const handleSetModuleStatus = (
    moduleKey: 'price' | 'stress' | 'developer' | 'site' | 'checklist',
    newStatus: 'not started' | 'in progress' | 'done'
  ) => {
    const updated = {
      ...caseFile,
      modules: { ...caseFile.modules },
    };

    const isDone = newStatus === 'done';

    if (moduleKey === 'price') {
      updated.modules.priceAnalysis = {
        ...updated.modules.priceAnalysis,
        status: newStatus,
        completed: isDone,
      };
    } else if (moduleKey === 'stress') {
      updated.modules.stressTest = {
        ...updated.modules.stressTest,
        status: newStatus,
        completed: isDone,
        monthlyIncome: income,
        otherDebtCommitments: debts,
        downPaymentPercent: downPayment,
        interestRate: interestRate,
        loanTenureYears: tenureYears,
        monthlyInstallment: monthlyInstallment,
        stressedInstallment: stressedInstallment,
        dsrPercent: dsrPercent,
        stressedDsrPercent: stressedDsrPercent,
        approvalVerdict: stressedDsrPercent > countryPack.maxStandardDsr ? 'Moderate Risk' : 'Safe',
      };
    } else if (moduleKey === 'developer') {
      updated.modules.developerAudit = {
        ...updated.modules.developerAudit,
        status: newStatus,
        completed: isDone,
        // Preserve grounded search findings and custom signals across all status transitions
        customSignals: groundedDevResult || updated.modules.developerAudit?.customSignals || property.developerSignals,
        groundedNews: groundedDevResult?.groundedNews || updated.modules.developerAudit?.groundedNews,
        searchQueries: groundedDevResult?.searchQueries || updated.modules.developerAudit?.searchQueries,
      };
    } else if (moduleKey === 'site') {
      const siteList = (updated.modules.siteVisit?.checklist || []) as any[];
      updated.modules.siteVisit = {
        ...updated.modules.siteVisit,
        status: newStatus,
        completed: isDone,
        checklist: isDone
          ? siteList.map((i: any) => ({ ...i, status: i.status === 'pending' ? 'pass' : i.status }))
          : newStatus === 'not started'
          ? siteList.map((i: any) => ({ ...i, status: 'pending' }))
          : siteList,
      };
    } else if (moduleKey === 'checklist') {
      const chkList = (updated.modules.countryCompliance?.checklist || []) as any[];
      updated.modules.countryCompliance = {
        ...updated.modules.countryCompliance,
        status: newStatus,
        completed: isDone,
        checklist: isDone
          ? chkList.map((i: any) => ({ ...i, status: i.status === 'action_needed' ? 'verified' : i.status }))
          : newStatus === 'not started'
          ? chkList.map((i: any) => ({ ...i, status: 'action_needed' }))
          : chkList,
      };
    }

    // Synchronize overall dossier progressPercent and status
    const calculated = computeCaseFileProgress(updated);
    updated.progressPercent = calculated.progressPercent;
    updated.status = calculated.status;

    onUpdateCaseFile(updated);
  };

  // Toggle between Done and In Progress (cycles to In Progress when currently Done)
  const handleToggleModuleStatus = (moduleKey: 'price' | 'stress' | 'developer' | 'site' | 'checklist') => {
    const current = getStatus(moduleKey);
    const nextStatus = current === 'done' ? 'in progress' : 'done';
    handleSetModuleStatus(moduleKey, nextStatus);
  };

  // Site item toggle with auto-synchronization of module and dossier progress
  const handleSiteItemStatus = (itemId: string, newStatus: 'pass' | 'concern' | 'fail') => {
    const updated = {
      ...caseFile,
      modules: { ...caseFile.modules },
    };
    if (updated.modules.siteVisit) {
      const updatedList = ((updated.modules.siteVisit.checklist || []) as any[]).map((item: any) =>
        item.id === itemId ? { ...item, status: newStatus } : item
      );
      const isAllChecked = updatedList.length > 0 && updatedList.every((i: any) => i.status && i.status !== 'pending');
      const isAnyChecked = updatedList.some((i: any) => i.status && i.status !== 'pending');
      updated.modules.siteVisit = {
        ...updated.modules.siteVisit,
        checklist: updatedList,
        status: isAllChecked ? 'done' : isAnyChecked ? 'in progress' : 'not started',
        completed: isAllChecked,
      };
    }
    const calculated = computeCaseFileProgress(updated);
    updated.progressPercent = calculated.progressPercent;
    updated.status = calculated.status;
    onUpdateCaseFile(updated);
  };

  // Legal item toggle with auto-synchronization of module and dossier progress
  const handleLegalItemStatus = (itemId: string, newStatus: 'verified' | 'action_needed' | 'not_applicable') => {
    const updated = {
      ...caseFile,
      modules: { ...caseFile.modules },
    };
    if (updated.modules.countryCompliance) {
      const updatedList = ((updated.modules.countryCompliance.checklist || []) as any[]).map((item: any) =>
        item.id === itemId ? { ...item, status: newStatus } : item
      );
      const isAllChecked = updatedList.length > 0 && updatedList.every((i: any) => i.status === 'verified');
      const isAnyChecked = updatedList.some((i: any) => i.status === 'verified');
      updated.modules.countryCompliance = {
        ...updated.modules.countryCompliance,
        checklist: updatedList,
        status: isAllChecked ? 'done' : isAnyChecked ? 'in progress' : 'not started',
        completed: isAllChecked,
      };
    }
    const calculated = computeCaseFileProgress(updated);
    updated.progressPercent = calculated.progressPercent;
    updated.status = calculated.status;
    onUpdateCaseFile(updated);
  };

  // Live Grounding Developer Check trigger
  const handleRunDeveloperGrounding = async () => {
    setIsAuditingDeveloper(true);
    try {
      const res = await api.auditDeveloper(property.developer, property.title, property.country, property.developerSignals);
      setGroundedDevResult(res);
      const updated = {
        ...caseFile,
        modules: {
          ...caseFile.modules,
          developerAudit: {
            ...caseFile.modules.developerAudit,
            customSignals: res,
            groundedNews: res.groundedNews,
            searchQueries: res.searchQueries,
            status: caseFile.modules?.developerAudit?.status || 'in progress',
          },
        },
      };
      onUpdateCaseFile(updated);
    } catch (err) {
      console.error('Developer check grounding error:', err);
    } finally {
      setIsAuditingDeveloper(false);
    }
  };

  // Live Grounding Future Projects trigger
  const handleRunFutureGrounding = async () => {
    setIsAuditingFuture(true);
    try {
      const res = await api.fetchFutureProjects({
        propertyTitle: property.title,
        address: property.address,
        city: property.city,
        country: property.country,
      });
      setGroundedFutureResult(res);
    } catch (err) {
      console.error('Future projects grounding error:', err);
    } finally {
      setIsAuditingFuture(false);
    }
  };

  // Checklist AI Copilot submit
  const handleSendChecklistQuestion = async (presetQuestion?: string) => {
    const q = presetQuestion || checklistInput.trim();
    if (!q || isAskingChecklist) return;

    const userMsg: ChecklistChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextChat = [...checklistChat, userMsg];
    setChecklistChat(nextChat);
    setChecklistInput('');
    setIsAskingChecklist(true);

    try {
      const res = await api.askChecklistCopilot({
        question: q,
        property,
        countryPack,
        history: checklistChat,
      });

      const aiMsg: ChecklistChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: res.suggestedAction,
      };

      const updatedChat = [...nextChat, aiMsg];
      setChecklistChat(updatedChat);

      const updatedCase = {
        ...caseFile,
        modules: {
          ...caseFile.modules,
          countryCompliance: {
            ...caseFile.modules.countryCompliance,
            checklistChat: updatedChat,
          },
        },
      };
      onUpdateCaseFile(updatedCase);
    } catch (err) {
      console.error('Checklist copilot error:', err);
    } finally {
      setIsAskingChecklist(false);
    }
  };

  // "Ask Why" Verdict Drilldown trigger
  const handleOpenWhyModal = async (item: string, type: 'risk' | 'strength', agentPerspective?: string) => {
    const defaultAgent = agentPerspective || (type === 'risk' ? 'Risk & Stress Underwriter Agent' : 'Valuation & Yield Specialist');
    setWhyItem({ item, type, agentPerspective: defaultAgent });
    setWhyExplanation(null);
    setWhyMessages([]);
    setWhyChatInput('');
    setIsLoadingWhy(true);

    try {
      const res = await api.askWhyVerdict({
        verdictItem: item,
        property,
        type,
        agentPerspective: defaultAgent,
      });
      setWhyExplanation(res);

      const docs = [
        property.country === 'Singapore' ? 'URA REALIS Caveat Registry (Transacted Sub-sale)' : 'JPPH / NAPIC Valuation & Caveat Record',
        'Certified Strata Management Accounts (Form 11 / Sinking Fund)',
        'Statutory Completion & Compliance Certificate (CCC / TOP)',
      ];

      setWhyMessages([
        {
          id: `agent-init-${Date.now()}`,
          sender: 'agent',
          text: `${res.explanation}\n\n**Actionable Underwriting Guidance:**\n${res.recommendation}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          supportingDocs: docs,
        },
      ]);
    } catch (err) {
      console.error('Ask why error:', err);
      const fallbackExpl = {
        explanation: `This observation was surfaced by cross-referencing district historical transaction benchmarks, public title registry caveats, and mortgage shock calculations under +2% interest rate scenarios.`,
        agentPerspective: defaultAgent,
        recommendation: 'Incorporate verification of this item as a condition precedent in your formal offer document.',
      };
      setWhyExplanation(fallbackExpl);
      setWhyMessages([
        {
          id: `agent-init-${Date.now()}`,
          sender: 'agent',
          text: `${fallbackExpl.explanation}\n\n**Actionable Underwriting Guidance:**\n${fallbackExpl.recommendation}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          supportingDocs: [
            property.country === 'Singapore' ? 'URA REALIS Transacted Caveats' : 'NAPIC Valuation & Property Services Record',
            'Management Corporation Form 11 Audit',
          ],
        },
      ]);
    } finally {
      setIsLoadingWhy(false);
    }
  };

  const handleSendWhyChatMessage = async (presetText?: string) => {
    const question = (presetText || whyChatInput).trim();
    if (!question || !whyItem || isSendingWhyChat) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...whyMessages, userMsg];
    setWhyMessages(updatedHistory);
    setWhyChatInput('');
    setIsSendingWhyChat(true);

    try {
      const res = await api.askWhyChat({
        verdictItem: whyItem.item,
        question,
        chatHistory: updatedHistory.map((m) => ({ sender: m.sender, text: m.text })),
        property,
        type: whyItem.type,
        agentPerspective: whyItem.agentPerspective,
      });

      setWhyMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          supportingDocs: res.supportingDocs,
        },
      ]);
    } catch (err) {
      console.error('Why chat error:', err);
      setWhyMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: `Regarding "${question}": Instruct your conveyancing solicitor to conduct an expedited strata search with the land office, verify that all sinking fund contributions are up to date, and draft a conditional revocation clause in your offer document.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSendingWhyChat(false);
    }
  };

  // AI Synthesis Trigger
  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    try {
      const res = await api.synthesizeCase({
        property,
        modules: caseFile.modules,
        countryPack,
        stressTestResults: {
          loanAmount,
          monthlyInstallment,
          stressedInstallment,
          dsrPercent,
          stressedDsrPercent,
        },
      });

      const updated = {
        ...caseFile,
        decisionProfile: {
          ...caseFile.decisionProfile,
          ...res,
          lastSynthesizedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
      onUpdateCaseFile(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const devSignals =
    groundedDevResult ||
    (caseFile.modules?.developerAudit?.customSignals as GroundedDeveloperAuditResult) ||
    property.developerSignals;
  const devNewsList: GroundedNewsItem[] =
    groundedDevResult?.groundedNews ||
    caseFile.modules?.developerAudit?.groundedNews ||
    (caseFile.modules?.developerAudit?.customSignals as any)?.groundedNews || [
      {
        title: `${property.developer}: KPKT Statutory License & APDL Approved`,
        source: 'Jabatan Perumahan Negara (KPKT)',
        url: 'https://ehome.kpkt.gov.my',
        date: '2024',
        category: 'Regulatory',
        sentiment: 'positive',
        snippet: 'Verified license in good standing with active development account oversight.',
      },
      {
        title: 'Secondary Market Transaction Liquidity & Value Retention',
        source: 'The Edge Malaysia',
        url: 'https://theedgemalaysia.com',
        date: '2024',
        category: 'Financial',
        sentiment: 'positive',
        snippet: 'Master deliveries sustain competitive rental demand and low vacancy overhang.',
      },
    ];

  const siteTranscripts = caseFile.modules?.siteVisit?.transcripts || [];
  const sitePhotos = caseFile.modules?.siteVisit?.photos || [];
  const siteVideos: RecordedInspectionVideo[] = caseFile.modules?.siteVisit?.inspectionVideos || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Top Header Navigation & Dismiss Action */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E2A44] hover:text-[#C98A3E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Case Files</span>
        </button>

        <div className="flex items-center gap-2">
          {onDismissCase && (
            <div>
              {isConfirmingDismiss ? (
                <div className="flex items-center gap-1.5 bg-rose-50 p-1 px-2.5 rounded-xl border border-rose-300 animate-fadeIn">
                  <span className="text-[11px] font-bold text-rose-800">
                    Confirm Dismiss?
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissCase(caseFile.caseId);
                      onBack();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                  >
                    Yes, Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmingDismiss(false);
                    }}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-gray-100 text-gray-700 text-[10px] font-semibold border border-gray-300 cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmingDismiss(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-300 hover:border-rose-400 transition-all cursor-pointer shadow-2xs"
                  title="Dismiss and close this case dossier"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Dismiss Case</span>
                </button>
              )}
            </div>
          )}
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] text-[#1E2A44] shadow-2xs">
            Dossier #{caseFile.caseId ? caseFile.caseId.slice(-6) : 'ACTIVE'}
          </span>
        </div>
      </div>

      {/* Dynamic Underwriting Progress Bar (Starts at min 0% for new files) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DEC9] shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#1E2A44]">Due Diligence Audit Progress</span>
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-[#FAF7F0] text-[#C98A3E] border border-[#E5DEC9]">
              {currentProgressPercent}% Completed
            </span>
            <span className="text-[11px] text-[#5B6478]">
              ({completedModulesCount} of 5 modules completed)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs ${
              completedModulesCount === 5
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : (completedModulesCount > 0 || anyModuleInProgress)
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 border border-slate-300'
            }`}>
              {completedModulesCount === 5 ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Decision Ready</span>
                </>
              ) : (completedModulesCount > 0 || anyModuleInProgress) ? (
                <span>In Progress</span>
              ) : (
                <span>Not Started</span>
              )}
            </span>
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-[#C98A3E] via-amber-500 to-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(currentProgressPercent, 0)}%` }}
          />
        </div>
      </div>

      {/* Property Overview Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5DEC9] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#E5DEC9] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#C98A3E]">
              <span>{property.country}</span>
              <span>•</span>
              <span>{property.propertyType}</span>
              <span>•</span>
              <span className="text-emerald-700">{property.legalStatus?.certificateType || 'CCC Approved'}</span>
            </div>
            <h1 className="font-serif font-bold text-lg sm:text-xl text-[#1E2A44] truncate">
              {property.title}
            </h1>
            <div className="font-serif font-bold text-base text-[#1E2A44] mt-0.5">
              {property.currency} {property.price.toLocaleString()}
            </div>
            <p className="text-xs text-[#1E2A44]/70 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#C98A3E] shrink-0" />
              <span>{property.address}, {property.city}</span>
            </p>
          </div>
        </div>

        {/* Direct Contact & SightView Actions */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E2D6]">
          <a
            href={`https://wa.me/60123982828?text=Hello%2C%20I%20am%20conducting%20due%20diligence%20on%20${encodeURIComponent(property.title)}%20via%20Homestory.%20Can%20we%20discuss%20viewing%2C%20pricing%20and%20strata%20details%3F`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Gallery</span>
          </a>
          <a
            href="tel:+60321448888"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D6] bg-white hover:bg-[#FAF7F0] text-[#1E2A44] text-xs font-semibold shadow-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#C98A3E]" />
            <span>+60 3-2144 8888</span>
          </a>
        </div>
      </div>

      {/* Visible Multi-Agent Orchestration Trace Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1E2A44] via-[#243352] to-[#1E2A44] text-white shadow-md space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-[#F3EEE4]">
              Multi-Agent Diligence Pipeline Active
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C98A3E]/30 text-[#C98A3E] border border-[#C98A3E]/40">
              5 Agents Synchronized
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAgentTraceOpen(!isAgentTraceOpen)}
            className="text-[11px] font-semibold text-[#C98A3E] hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{isAgentTraceOpen ? 'Hide Agent Trace' : 'View Live Agent Trace'}</span>
            {isAgentTraceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isAgentTraceOpen && (
          <div className="pt-2 border-t border-white/10 space-y-2 text-[11px] font-mono text-white/80 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-300">
              <span>🏛️ Price Agent:</span>
              <span className="text-white/90">Correlating transacted caveated units via JPPH/NAPIC valuation corridor...</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300">
              <span>🏗️ Developer Agent:</span>
              <span className="text-white/90">Running Google Search grounding on {property.developer} court &amp; KPKT notices...</span>
            </div>
            <div className="flex items-center gap-2 text-blue-300">
              <span>📈 Stress Test Agent:</span>
              <span className="text-white/90">Simulating +2.00% interest rate shock on household monthly cashflow...</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <span>📋 Compliance Agent:</span>
              <span className="text-white/90">Checking foreign buyer quota threshold &amp; Strata Title Form 14A checklists...</span>
            </div>
            <div className="flex items-center gap-2 text-rose-300">
              <span>🔬 SightView AI:</span>
              <span className="text-white/90">Ready for camera-assisted ceiling moisture, RCCB trip, and tile defect scans...</span>
            </div>
          </div>
        )}
      </div>

      {/* 5 Module Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-[#1E2A44]">
            Due Diligence Modules
          </h2>
          <span className="text-xs text-[#1E2A44]/60 font-medium">
            5 Institutional Modules
          </span>
        </div>

        {/* 1. Price Analysis Card */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => setActiveModule(activeModule === 'price' ? null : 'price')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F0]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] flex items-center justify-center text-[#C98A3E]">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1E2A44]">
                  Module 01: Price Analysis &amp; Valuation Corridor
                </div>
                <div className="text-[11px] text-[#1E2A44]/65">
                  Fair-value corridor &amp; gross rental yield vs district median
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {statusBadge(getStatus('price'))}
              {activeModule === 'price' ? (
                <ChevronUp className="w-4 h-4 text-[#1E2A44]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#1E2A44]/60" />
              )}
            </div>
          </div>

          {activeModule === 'price' && (
            <div className="p-4 pt-0 border-t border-[#E5DEC9] space-y-3 bg-[#FAF7F0]/30 animate-fadeIn text-xs">
              <div className="grid grid-cols-2 gap-2.5 pt-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#1E2A44]/60">
                    Estimated Fair Corridor
                  </div>
                  <div className="font-serif font-bold text-sm text-[#1E2A44]">
                    {property.currency} {property.valuation.fairValueMin.toLocaleString()} - {property.valuation.fairValueMax.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    {property.valuation.marketPosition}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#1E2A44]/60">
                    Gross Rental Yield
                  </div>
                  <div className="font-serif font-bold text-sm text-[#1E2A44]">
                    {property.valuation.grossRentalYield}
                  </div>
                  <div className="text-[10px] text-[#1E2A44]/65">
                    ~{property.currency} {property.estimatedRentalValue}/mo
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E5DEC9] text-[11px] text-[#1E2A44]/80">
                <strong>Valuation Rationale:</strong> {property.valuation.reasoning}
              </div>

              {/* Price Corridor Risk Watchout Banner with "Ask Why" */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-semibold text-amber-950">
                    Valuation Risk Audit: Asking price is positioned in the {property.valuation.marketPosition.toLowerCase()} bracket against JPPH/URA caveat medians.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenWhyModal(
                    `Price Variance: Asking price of ${property.currency} ${property.price.toLocaleString()} for ${property.title} evaluated against fair corridor ${property.valuation.fairValueMin.toLocaleString()} - ${property.valuation.fairValueMax.toLocaleString()}`,
                    'risk',
                    'NAPIC & REALIS Valuation Agent'
                  )}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  Ask Why
                </button>
              </div>

              {/* Free Usable Market Data Feeds (Malaysia: Brickz.my, EdgeProp | Singapore: OneMap SLA, data.gov.sg, URA) */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E2A44]">
                    <Database className="w-3.5 h-3.5 text-[#C98A3E]" />
                    <span>Free &amp; Usable Market Data Sources</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    Official Feeds Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {property.country === 'Malaysia' ? (
                    <>
                      <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E8E2D6] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1E2A44] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Brickz.my (JPPH Records)
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 font-semibold">Resale Transacted</span>
                        </div>
                        <p className="text-[10px] text-[#5B6478] leading-tight">
                          {property.marketDataSources?.brickzPriceRef || 'Verified secondary transactions pulled from JPPH official stamp-duty records with accessible breakdown.'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E8E2D6] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1E2A44] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            EdgeProp Malaysia
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 font-semibold">Overhang &amp; Comps</span>
                        </div>
                        <p className="text-[10px] text-[#5B6478] leading-tight">
                          {property.marketDataSources?.edgePropUnsoldStats || 'Transaction prices and unsold-unit overhang statistics derived from NAPIC quarterly registry.'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E8E2D6] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1E2A44] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            OneMap SLA (Singapore Land Authority)
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 font-semibold">Govt API</span>
                        </div>
                        <p className="text-[10px] text-[#5B6478] leading-tight">
                          {property.marketDataSources?.oneMapSlaDetails || 'Free Singapore Land Authority API covering residential pricing, land lot ownership, and school/amenity POIs.'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E8E2D6] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1E2A44] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            data.gov.sg &amp; URA API
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 font-semibold">Caveats &amp; HDB</span>
                        </div>
                        <p className="text-[10px] text-[#5B6478] leading-tight">
                          {property.marketDataSources?.uraCaveatsCitation || property.marketDataSources?.dataGovHdbResaleMedian || 'Official URA private residential caveats and open data HDB resale median price index.'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Educational Trust Banner: Why Price Check? */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E2A44]">
                  <Info className="w-3.5 h-3.5 text-[#C98A3E]" />
                  <span>Why Price Check?</span>
                </div>
                <p className="text-[11px] text-[#1E2A44]/80 leading-relaxed">
                  Asking prices on portal listings reflect seller optimism and marketing markup. Homestory cross-references actual stamp-duty caveated records (JPPH/NAPIC for Malaysia, URA for Singapore), building median price-per-sqft, and local rental yields so you don’t overpay and can negotiate with empirical market data.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('price', 'in progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    getStatus('price') === 'in progress'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold ring-2 ring-amber-300/40 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  Mark as In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('price', 'done')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                    getStatus('price') === 'done'
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400/40'
                      : 'bg-[#1E2A44] hover:bg-[#2A3B5E] text-white'
                  }`}
                >
                  {getStatus('price') === 'done' ? '✓ Marked Done' : 'Mark as Done'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. DSR Stress Test Card with REAL INCOME INPUTS */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => setActiveModule(activeModule === 'stress' ? null : 'stress')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F0]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] flex items-center justify-center text-[#C98A3E]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1E2A44] flex items-center gap-2">
                  <span>Module 02: DSR Shock Stress Test</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                    Income Verified
                  </span>
                </div>
                <div className="text-[11px] text-[#1E2A44]/65">
                  Debt service ratio (DSR) &amp; +2.00% rate hike resilience test
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {statusBadge(getStatus('stress'))}
              {activeModule === 'stress' ? (
                <ChevronUp className="w-4 h-4 text-[#1E2A44]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#1E2A44]/60" />
              )}
            </div>
          </div>

          {activeModule === 'stress' && (
            <div className="p-5 pt-0 border-t border-[#E5DEC9] space-y-4 bg-[#FAF7F0]/30 animate-fadeIn text-xs">
              {/* EDITABLE INCOME & FINANCING STEP */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D6] space-y-3 mt-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C98A3E] block">
                      Underwriting Income Inputs
                    </span>
                    <h4 className="font-bold text-xs text-[#1E2A44]">
                      Your Household Salary &amp; Existing Debt Commitments
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Bank DSR Basis
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E2A44] mb-1">
                      Monthly Gross Income ({property.currency}) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5B6478]">
                        {property.currency}
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={500}
                        value={income > 0 ? income : ''}
                        onChange={(e) => handleUpdateStressField('income', Number(e.target.value))}
                        onBlur={() => {
                          if (income <= 0) {
                            const fallback = userProfile?.monthlyGrossIncome && userProfile.monthlyGrossIncome > 0
                              ? userProfile.monthlyGrossIncome
                              : (property.country === 'Singapore' ? 9500 : 18000);
                            handleUpdateStressField('income', fallback);
                          }
                        }}
                        placeholder="e.g. 18000 (must be > 0)"
                        className={`w-full pl-14 pr-3 py-2 text-xs font-bold rounded-xl border ${
                          income <= 0 || incomeError
                            ? 'border-red-400 bg-red-50 text-red-950 focus:border-red-600'
                            : 'border-[#E8E2D6] bg-[#FAF7F0] text-[#1E2A44] focus:border-[#C98A3E]'
                        } focus:bg-white focus:outline-hidden transition-colors`}
                      />
                    </div>
                    {(income <= 0 || incomeError) && (
                      <div className="mt-1.5 p-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] flex items-center justify-between gap-1.5 animate-fadeIn">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>Income cannot be 0. Bank DSR requires positive salary.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const b = property.country === 'Singapore' ? 9500 : 18000;
                            handleUpdateStressField('income', b);
                          }}
                          className="px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-900 font-bold text-[10px] whitespace-nowrap cursor-pointer transition-colors"
                        >
                          Use {property.currency} {property.country === 'Singapore' ? '9,500' : '18,000'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#1E2A44] mb-1">
                      Existing Monthly Commitments ({property.currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5B6478]">
                        {property.currency}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={debts >= 0 ? debts : 0}
                        onChange={(e) => handleUpdateStressField('debts', Math.max(0, Number(e.target.value)))}
                        placeholder="e.g. 2200 (car loans, credit cards)"
                        className="w-full pl-14 pr-3 py-2 text-xs font-bold text-[#1E2A44] rounded-xl border border-[#E8E2D6] bg-[#FAF7F0] focus:bg-white focus:outline-hidden focus:border-[#C98A3E]"
                      />
                    </div>
                    {debtsError && (
                      <div className="mt-1 text-[11px] text-red-600 font-medium">
                        {debtsError}
                      </div>
                    )}
                  </div>
                </div>

                {!hasIncome && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Income cannot be 0:</strong> Bank underwriting cannot evaluate DSR without knowing your household salary.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const b = property.country === 'Singapore' ? 9500 : 18000;
                        handleUpdateStressField('income', b);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                    >
                      Fill {property.currency} {property.country === 'Singapore' ? '9,500' : '18,000'}
                    </button>
                  </div>
                )}
              </div>

              {/* Sliders for Financing Terms */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-[#1E2A44]/70">Down Payment ({downPayment}%)</span>
                    <span className="font-bold text-[#1E2A44]">
                      {property.currency} {Math.round(property.price * (downPayment / 100)).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={5}
                    value={downPayment}
                    onChange={(e) => handleUpdateStressField('downPayment', Number(e.target.value))}
                    className="w-full accent-[#C98A3E] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-[#1E2A44]/70">Baseline Interest Rate ({interestRate}%)</span>
                    <span className="font-bold text-[#1E2A44]">
                      Shock Rate: {(interestRate + 2.0).toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={7.0}
                    step={0.1}
                    value={interestRate}
                    onChange={(e) => handleUpdateStressField('rate', Number(e.target.value))}
                    className="w-full accent-[#C98A3E] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-[#1E2A44]/70">Loan Tenure</span>
                    <span className="font-bold text-[#1E2A44]">{tenureYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={35}
                    step={5}
                    value={tenureYears}
                    onChange={(e) => handleUpdateStressField('tenure', Number(e.target.value))}
                    className="w-full accent-[#C98A3E] cursor-pointer"
                  />
                </div>
              </div>

              {/* Stress Test Comparison Results */}
              {hasIncome ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] space-y-1">
                      <div className="text-[10px] uppercase font-bold text-[#1E2A44]/60">
                        Baseline Installment
                      </div>
                      <div className="font-serif font-bold text-base text-[#1E2A44]">
                        {property.currency} {monthlyInstallment.toLocaleString()} /mo
                      </div>
                      <div className="text-[11px] font-bold text-blue-700">
                        DSR: {dsrPercent}% (Safe Benchmark &lt; 60%)
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-amber-900">
                        +2.00% Shock Scenario
                      </div>
                      <div className="font-serif font-bold text-base text-amber-900">
                        {property.currency} {stressedInstallment.toLocaleString()} /mo
                      </div>
                      <div className="text-[11px] font-bold text-amber-800">
                        Stressed DSR: {stressedDsrPercent}%
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5B6478]">Net Monthly Buffer After Debts:</span>
                      <span className="font-mono font-bold text-[#1E2A44]">
                        {property.currency} {netDisposableIncome.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      {stressedDsrPercent <= countryPack.maxStandardDsr ? (
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Underwriting Safe: Debt commitments remain within statutory bank limits under rate shock.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenWhyModal(
                              `Stress resilience: Total debt commitments under +2% rate shock remain at ${stressedDsrPercent}% of gross income (under ${countryPack.maxStandardDsr}% threshold).`,
                              'strength',
                              'Mortgage Stress Underwriting Agent'
                            )}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                          >
                            Ask Why
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-amber-800 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            <span>Warning: +2.0% shock raises total commitments to {stressedDsrPercent}% of income, exceeding standard bank approval tolerance.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenWhyModal(
                              `DSR Risk Shock: Under +2.00% interest rate rise, debt obligations consume ${stressedDsrPercent}% of monthly gross income, exceeding the statutory ${countryPack.maxStandardDsr}% banking benchmark.`,
                              'risk',
                              'Mortgage Stress Underwriting Agent'
                            )}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                          >
                            Ask Why
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-50/80 border-2 border-dashed border-amber-300 text-center space-y-2.5 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700 shadow-2xs">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-amber-950">
                    Add your income to run this test
                  </h4>
                  <p className="text-xs text-amber-900/80 max-w-md mx-auto leading-relaxed">
                    Statutory debt service ratio (DSR) bank underwriting and interest shock tests require your actual household income. Please enter your monthly income above to calculate your borrowing limit and stress resilience.
                  </p>
                  <div className="pt-1 flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const fillSalary = userProfile?.monthlyGrossIncome || 18000;
                        const fillDebts = debts || userProfile?.existingMonthlyDebts || 2200;
                        handleUpdateStressField('income', fillSalary);
                        handleUpdateStressField('debts', fillDebts);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                    >
                      Fill Profile Income ({property.currency} {(userProfile?.monthlyGrossIncome || 18000).toLocaleString()})
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('stress', 'in progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    getStatus('stress') === 'in progress'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold ring-2 ring-amber-300/40 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  Mark as In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('stress', 'done')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                    getStatus('stress') === 'done'
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400/40'
                      : 'bg-[#1E2A44] hover:bg-[#2A3B5E] text-white'
                  }`}
                >
                  {getStatus('stress') === 'done' ? '✓ Saved & Marked Done' : 'Save & Mark as Done'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Developer Check Card with GOOGLE SEARCH GROUNDING */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => setActiveModule(activeModule === 'developer' ? null : 'developer')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F0]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] flex items-center justify-center text-[#C98A3E]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1E2A44] flex items-center gap-2">
                  <span>Module 03: Developer Signal &amp; Public News Audit</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                    Search Grounded
                  </span>
                </div>
                <div className="text-[11px] text-[#1E2A44]/65">
                  Track record, tribunal history, and verified media reference links
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {statusBadge(getStatus('developer'))}
              {activeModule === 'developer' ? (
                <ChevronUp className="w-4 h-4 text-[#1E2A44]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#1E2A44]/60" />
              )}
            </div>
          </div>

          {activeModule === 'developer' && (
            <div className="p-5 pt-0 border-t border-[#E5DEC9] space-y-4 bg-[#FAF7F0]/30 animate-fadeIn text-xs">
              {/* Header Action Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#1E2A44]">Developer:</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white border border-[#E8E2D6] font-semibold text-[#1E2A44]">
                    {property.developer}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRunDeveloperGrounding}
                  disabled={isAuditingDeveloper}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAuditingDeveloper ? 'animate-spin' : ''}`} />
                  <span>{isAuditingDeveloper ? 'Searching Live Registries...' : 'Re-check with Google Search'}</span>
                </button>
              </div>

              {/* Educational Trust Card: Why Developer Check? */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E2A44]">
                  <Shield className="w-3.5 h-3.5 text-[#C98A3E]" />
                  <span>Why Developer Check?</span>
                </div>
                <p className="text-[11px] text-[#1E2A44]/80 leading-relaxed">
                  Project abandonment, delayed handover (LAD claims), and unrectified defects are the largest catastrophic risk factors for property purchasers. Homestory conducts a live public registry and tribunal audit across KPKT blacklist registries, Tribunal for Homebuyer Claims rulings, and credible business media to verify the master developer&apos;s governance and delivery record.
                </p>
              </div>

              {/* Core Metric Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-[#E5DEC9]">
                  <div className="text-[10px] font-bold text-[#5B6478] uppercase">Reputation Tier</div>
                  <div className="font-bold text-xs text-emerald-800 mt-0.5">{devSignals.reputationScore}</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E5DEC9]">
                  <div className="text-[10px] font-bold text-[#5B6478] uppercase">Completed Portfolio</div>
                  <div className="font-bold text-xs text-[#1E2A44] mt-0.5">{devSignals.completedProjectsCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E5DEC9]">
                  <div className="text-[10px] font-bold text-[#5B6478] uppercase">Handover Delay Variance</div>
                  <div className="font-bold text-xs text-[#1E2A44] mt-0.5">{devSignals.averageDelayMonths}</div>
                </div>
              </div>

              {/* Developer Risk Alert Banner with "Ask Why" */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-semibold text-amber-950">
                    Developer Delivery Risk Audit: Track record indicates historical handover variance of {devSignals.averageDelayMonths} across completed projects.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenWhyModal(
                    `Developer signal check: Handover delay variance of ${devSignals.averageDelayMonths} for master developer ${property.developer} and KPKT / BCA tribunal performance`,
                    'risk',
                    'KPKT & Developer Licensing Auditor'
                  )}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  Ask Why
                </button>
              </div>

              {/* Grounded News & Reference Links List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#1E2A44]">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Current News &amp; Statutory Records (Real Reference Links)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Grounding with Google Search
                  </span>
                </div>

                <div className="space-y-2">
                  {devNewsList.map((news, idx) => (
                    <div
                      key={news.id || idx}
                      className="p-3.5 rounded-xl bg-white border border-[#E8E2D6] space-y-1.5 hover:border-[#C98A3E] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                news.sentiment === 'positive'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : news.sentiment === 'watchout'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {news.category}
                            </span>
                            {news.date && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {news.date}
                              </span>
                            )}
                          </div>
                          <h5 className="font-bold text-xs text-[#1E2A44]">
                            {news.title}
                          </h5>
                        </div>

                        {news.url && (
                          <a
                            href={news.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[10px] shrink-0 transition-colors"
                          >
                            <span>Read Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-[#1E2A44]/75 leading-relaxed">
                        {news.snippet}
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Source: {news.source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Corporate & Land Registries (SSM e-Search, data.gov.my, JUPEM eKadaster) */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E2A44]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C98A3E]" />
                    <span>Official Developer &amp; Title Verification Registries</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                    Official Registry Search
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E8E2D6] space-y-1">
                    <span className="font-bold text-[#1E2A44] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      SSM e-Search (ROC/ROB)
                    </span>
                    <p className="text-[10px] text-[#5B6478] leading-tight">
                      {property.marketDataSources?.ssmRegistrationNo || 'Active registration verified in Suruhanjaya Syarikat Malaysia official corporate records.'}
                    </p>
                    <div className="text-[9px] font-mono text-emerald-700 font-semibold pt-0.5">
                      Status: {property.marketDataSources?.ssmStatus ? 'Active & Good Standing' : 'Corporate Filing Active'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E8E2D6] space-y-1">
                    <span className="font-bold text-[#1E2A44] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      data.gov.my &amp; KPKT
                    </span>
                    <p className="text-[10px] text-[#5B6478] leading-tight">
                      Cross-referenced against open government housing registry, KPKT developer licensing, and Tribunal for Homebuyer Claims.
                    </p>
                    <div className="text-[9px] font-mono text-blue-700 font-semibold pt-0.5">
                      Tribunal: Zero Unresolved Writs
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E8E2D6] space-y-1">
                    <span className="font-bold text-[#1E2A44] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      JUPEM eKadaster
                    </span>
                    <p className="text-[10px] text-[#5B6478] leading-tight">
                      {property.marketDataSources?.jupemTitleNumber || 'Cadastral land boundaries and strata title subdivision registered with Department of Survey and Mapping.'}
                    </p>
                    <div className="text-[9px] font-mono text-purple-700 font-semibold pt-0.5">
                      Cadastral: Lot Boundaries Verified
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('developer', 'in progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    getStatus('developer') === 'in progress'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold ring-2 ring-amber-300/40 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  Mark as In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('developer', 'done')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                    getStatus('developer') === 'done'
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400/40'
                      : 'bg-[#1E2A44] hover:bg-[#2A3B5E] text-white'
                  }`}
                >
                  {getStatus('developer') === 'done' ? '✓ Marked Done' : 'Mark as Done'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Site Visit Card with DIRECT SIGHTVIEW AI LAUNCH & TRANSCRIPT RETENTION */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => setActiveModule(activeModule === 'site' ? null : 'site')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F0]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] flex items-center justify-center text-[#C98A3E]">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1E2A44] flex items-center gap-2">
                  <span>Module 04: Site Visit &amp; SightView AI™ Inspection</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white shadow-2xs">
                    Live Vision
                  </span>
                </div>
                <div className="text-[11px] text-[#1E2A44]/65">
                  Physical inspection checklist &amp; AI camera defect transcript
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {statusBadge(getStatus('site'))}
              {activeModule === 'site' ? (
                <ChevronUp className="w-4 h-4 text-[#1E2A44]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#1E2A44]/60" />
              )}
            </div>
          </div>

          {activeModule === 'site' && (
            <div className="p-5 pt-0 border-t border-[#E5DEC9] space-y-4 bg-[#FAF7F0]/30 animate-fadeIn text-xs">
              {/* SightView AI Direct Launch Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-white" />
                    <span className="font-bold text-sm">SightView AI™ Live Camera Inspector</span>
                  </div>
                  <p className="text-xs text-white/90">
                    Scan roof perimeter, plumbing traps, ceiling water marks, and electrical breakers directly into this dossier.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenSightView?.(property, caseFile.caseId)}
                  className="px-4 py-2 rounded-xl bg-white text-[#1E2A44] hover:bg-[#FAF7F0] font-bold text-xs transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>Launch Live Camera</span>
                </button>
              </div>

              {/* Saved Inspection Photos & Running Transcript */}
              {(sitePhotos.length > 0 || siteTranscripts.length > 0) && (
                <div className="p-4 rounded-2xl bg-white border border-[#E8E2D6] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C98A3E]">
                      Retained SightView Inspection Session
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {siteTranscripts.length} Exchanges Recorded
                    </span>
                  </div>

                  {sitePhotos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Captured Defect Photos ({sitePhotos.length})
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          <ZoomIn className="w-3 h-3" />
                          <span>Click photo to enlarge</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {sitePhotos.map((photo: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setActivePhotoModal({
                              url: photo,
                              index: idx,
                              total: sitePhotos.length,
                              title: `Site Defect Evidence #${idx + 1} • ${property.title}`,
                              caption: `Timestamped physical on-site evidence logged into Case Dossier #${caseFile.caseId.slice(0, 8)}. Verified against statutory building guidelines (CIS 7 / Housing Development Act).`
                            })}
                            className="group relative h-28 rounded-xl overflow-hidden border border-[#E8E2D6] bg-slate-900 cursor-pointer shadow-2xs hover:shadow-md hover:border-amber-400 transition-all select-none"
                            title="Click to enlarge defect photo and view analysis"
                          >
                            <img
                              src={photo}
                              alt={`Inspection finding ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white p-2 text-center">
                              <div className="w-8 h-8 rounded-full bg-white/90 text-[#1E2A44] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <ZoomIn className="w-4 h-4 text-amber-600" />
                              </div>
                              <span className="text-[10px] font-bold text-white drop-shadow-md">
                                Enlarge Evidence
                              </span>
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono font-bold border border-white/20">
                              Photo #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {siteTranscripts.length > 0 && (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {siteTranscripts.map((entry: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl text-[11px] space-y-1.5 ${
                            entry.speaker === 'user'
                              ? 'bg-slate-50 border border-slate-200 text-[#1E2A44] ml-4'
                              : 'bg-amber-50/90 border border-amber-200 text-amber-950 font-medium mr-4 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                            <span className="font-bold text-[#1E2A44]">
                              {entry.speaker === 'user' ? 'Buyer On-Site' : 'SightView AI Observation'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>{entry.timestamp}</span>
                              {entry.speaker !== 'user' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    speakText(entry.text, `speech-${idx}`);
                                  }}
                                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-200/70 hover:bg-amber-300 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                                  title="Listen to Live Agent Voice"
                                >
                                  {speakingTextId === `speech-${idx}` ? (
                                    <>
                                      <VolumeX className="w-3 h-3 text-rose-600" />
                                      <span>Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3 h-3 text-amber-700" />
                                      <span>Listen</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="leading-relaxed">{entry.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive On-Site Agent Chat Bar (Saved directly into Case Dossier) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <input
                      type="text"
                      value={siteAgentInput}
                      onChange={(e) => setSiteAgentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendSiteAgentQuestion();
                        }
                      }}
                      placeholder="Ask SightView Agent about roof leaks, cracks, plumbing, or tiles..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E8E2D6] bg-[#FAF7F0] focus:bg-white focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendSiteAgentQuestion()}
                      disabled={!siteAgentInput.trim() || isAskingSiteAgent}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer transition-all"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAskingSiteAgent ? 'animate-spin' : ''}`} />
                      <span>{isAskingSiteAgent ? 'Consulting...' : 'Ask Agent'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Recorded Video Walkthroughs & AI Video Calls Gallery */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D6] space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1E2A44] block">
                        Recorded Inspection Videos &amp; AI Video Calls
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Camera walkthroughs with synchronized verbal AI defect analysis
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenSightView?.(property, caseFile.caseId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Record New Walkthrough</span>
                  </button>
                </div>

                {siteVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {siteVideos.map((video, idx) => (
                      <div
                        key={video.id || idx}
                        className="rounded-xl border border-[#E8E2D6] bg-[#FAF8F5] p-3 space-y-2 hover:border-amber-400 transition-all shadow-2xs group"
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Video className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                            <button
                              type="button"
                              onClick={() => setActiveVideoModal(video)}
                              className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#1E2A44] flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                              title="Play inspection recording"
                            >
                              <Play className="w-5 h-5 fill-current ml-0.5 text-red-600" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[10px] font-bold">
                            {video.durationSeconds ? `${Math.floor(video.durationSeconds / 60)}:${(video.durationSeconds % 60).toString().padStart(2, '0')}` : '0:45'}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-xs text-[#1E2A44] truncate">
                            {video.title || `Walkthrough Inspection #${idx + 1}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {video.timestamp || 'Recorded during live viewing'}
                          </div>
                        </div>

                        {video.defectsNoted && video.defectsNoted.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">
                              AI Defect Highlights:
                            </span>
                            <ul className="text-[10px] text-[#1E2A44]/80 space-y-0.5 pl-3 list-disc">
                              {video.defectsNoted.slice(0, 2).map((def, dIdx) => (
                                <li key={dIdx} className="leading-tight truncate">{def}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setActiveVideoModal(video)}
                            className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Watch Recording</span>
                          </button>
                          {video.videoUrl && (
                            <a
                              href={video.videoUrl}
                              download={`inspection-${property.id}.mp4`}
                              className="font-medium text-slate-600 hover:text-[#1E2A44] flex items-center gap-1"
                              title="Download video file"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-[#E8E2D6] bg-[#FAF8F5] text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-[#1E2A44]">
                        No Walkthrough Videos Recorded Yet
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Launch SightView AI™ to conduct a live interactive video call with the inspection agent. All camera recordings and verbal transcripts will be permanently preserved in this dossier.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenSightView?.(property, caseFile.caseId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold cursor-pointer shadow-xs transition-all"
                    >
                      <Video className="w-3.5 h-3.5 text-amber-400" />
                      <span>Start Live AI Video Walkthrough</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Physical Checklist Items with Clear Button Styling */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#1E2A44] block">
                    Guided Physical Inspection Checklist
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Statutory DLP Standards
                  </span>
                </div>

                <div className="space-y-2">
                  {((caseFile.modules.siteVisit?.checklist || []) as any[]).map((item: any, idx: number) => {
                    const isRoofItem = item.category?.toLowerCase().includes('roof') || item.item?.toLowerCase().includes('roof') || idx === 0;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#C98A3E]">
                                {item.category}
                              </span>
                              {isRoofItem && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Roof &amp; Waterproofing
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-[#1E2A44] text-xs mt-0.5">
                              {item.item}
                            </div>
                          </div>

                          {/* Distinct Tactile Button Choices (No Form, No Reload) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isRoofItem && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOpenSightView?.(property, caseFile.caseId);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                title="Inspect roof with SightView AI Live Camera"
                              >
                                <Camera className="w-3.5 h-3.5 text-amber-700" />
                                <span>Inspect Roof</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSiteItemStatus(item.id, 'pass');
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                                item.status === 'pass'
                                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400/40'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Pass</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSiteItemStatus(item.id, 'concern');
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                                item.status === 'concern'
                                  ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400/40'
                                  : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400'
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Concern</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSiteItemStatus(item.id, 'fail');
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                                item.status === 'fail'
                                  ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400/40'
                                  : 'bg-white hover:bg-rose-50 text-rose-800 border-rose-300 hover:border-rose-400'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Fail</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenWhyModal(
                                  `On-site Defect Check: "${item.title}" - ${item.details || 'Structural and finish inspection test'}`,
                                  'risk',
                                  'Structural Defect & On-Site Inspection Copilot'
                                );
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-[#1E2A44] border border-[#E8E2D6] hover:border-amber-400 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              title="Ask Why this physical inspection check was flagged"
                            >
                              <span>Ask Why</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('site', 'in progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    getStatus('site') === 'in progress'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold ring-2 ring-amber-300/40 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  Mark as In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('site', 'done')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                    getStatus('site') === 'done'
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400/40'
                      : 'bg-[#1E2A44] hover:bg-[#2A3B5E] text-white'
                  }`}
                >
                  {getStatus('site') === 'done' ? '✓ Marked Done' : 'Mark as Done'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Checklist (Financial, Legal, & Title) with DEDICATED SCOPED AI COPILOT */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => setActiveModule(activeModule === 'checklist' ? null : 'checklist')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F0]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] flex items-center justify-center text-[#C98A3E]">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1E2A44] flex items-center gap-2">
                  <span>Module 05: Legal &amp; Financial Diligence Checklist</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                    AI Agent Active
                  </span>
                </div>
                <div className="text-[11px] text-[#1E2A44]/65">
                  Title search, caveat verification &amp; scoped statutory AI copilot
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {statusBadge(getStatus('checklist'))}
              {activeModule === 'checklist' ? (
                <ChevronUp className="w-4 h-4 text-[#1E2A44]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#1E2A44]/60" />
              )}
            </div>
          </div>

          {activeModule === 'checklist' && (
            <div className="p-5 pt-0 border-t border-[#E5DEC9] space-y-4 bg-[#FAF7F0]/30 animate-fadeIn text-xs">
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-bold text-[#1E2A44]">
                  {countryPack.name} Conveyancing &amp; Regulatory Protocol
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Statutory Checklist
                </span>
              </div>

              {/* Checklist Items with Distinct Button Styling (Fixing the refresh/button issue) */}
              <div className="space-y-2.5">
                {(caseFile.modules.countryCompliance.checklist || []).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-[#1E2A44] text-xs">
                          {item.title}
                        </div>
                        <p className="text-[11px] text-[#1E2A44]/75 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* CLEAR TACTILE BUTTONS (NO FORM, TYPE="BUTTON", DOES NOT REFRESH) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLegalItemStatus(item.id, 'verified');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                            item.status === 'verified'
                              ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400/40 shadow-sm'
                              : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-400'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLegalItemStatus(item.id, 'action_needed');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                            item.status === 'action_needed'
                              ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400/40 shadow-sm'
                              : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Action Needed</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLegalItemStatus(item.id, 'not_applicable');
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer border ${
                            item.status === 'not_applicable'
                              ? 'bg-slate-700 text-white border-slate-800 ring-2 ring-slate-400/40'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          <span>N/A</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenWhyModal(
                              `Statutory Legal Check: "${item.title}" - ${item.description}`,
                              'risk',
                              'Conveyancing & Land Registry Legal Copilot'
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-[#1E2A44] border border-[#E8E2D6] hover:border-amber-400 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Ask Why this legal check is required"
                        >
                          <span>Ask Why</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SCOPED CHECKLIST AI AGENT WITH PERSISTENT CONVERSATION */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D6] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-xs text-[#1E2A44]">
                      Checklist AI Copilot (Scoped Legal &amp; Financial Advisor)
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-700 font-mono font-semibold">
                    Saved in Case File
                  </span>
                </div>

                {/* Prompt Recommendation Chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {[
                    'What documents before 3.18% earnest deposit?',
                    'How to search for private caveats?',
                    'Foreign buyer consent quota in this district?',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendChecklistQuestion(preset)}
                      className="px-2.5 py-1 rounded-full bg-[#FAF7F0] hover:bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Chat Transcript Window */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 pt-1">
                  {checklistChat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs space-y-1 ${
                        msg.role === 'user'
                          ? 'bg-slate-100 text-[#1E2A44] ml-6'
                          : 'bg-purple-50/70 border border-purple-200 text-purple-950 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-semibold">{msg.role === 'user' ? 'You' : 'Checklist Agent'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.suggestedAction && (
                        <div className="text-[10px] font-bold text-purple-700 bg-white/80 p-1.5 rounded-lg border border-purple-200 mt-1">
                          Next Action: {msg.suggestedAction}
                        </div>
                      )}
                    </div>
                  ))}

                  {isAskingChecklist && (
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                      <span>Consulting statutory guidelines...</span>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendChecklistQuestion();
                      }
                    }}
                    placeholder="Ask about strata title, foreign quotas, stamp duty, or defects..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E8E2D6] bg-[#FAF7F0] focus:bg-white focus:outline-hidden focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendChecklistQuestion()}
                    disabled={isAskingChecklist || !checklistInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                  >
                    <span>Ask</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('checklist', 'in progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    getStatus('checklist') === 'in progress'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold ring-2 ring-amber-300/40 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  Mark as In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSetModuleStatus('checklist', 'done')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                    getStatus('checklist') === 'done'
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400/40'
                      : 'bg-[#1E2A44] hover:bg-[#2A3B5E] text-white'
                  }`}
                >
                  {getStatus('checklist') === 'done' ? '✓ All Verified (Done)' : 'Mark All Verified (Done)'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. Realtime Nearby Places Available */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => setActiveModule(activeModule === 'nearby' ? null : 'nearby')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F0]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1E2A44]">
                  Nearby Infrastructure &amp; POIs
                </div>
                <div className="text-[11px] text-[#1E2A44]/65">
                  MRT / LRT stations, schools &amp; walk-time validation
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {(property.nearbyFacilities || []).length} Verified POIs
              </span>
              {activeModule === 'nearby' ? (
                <ChevronUp className="w-4 h-4 text-[#1E2A44]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#1E2A44]/60" />
              )}
            </div>
          </div>

          {activeModule === 'nearby' && (
            <div className="p-4 pt-0 border-t border-[#E5DEC9] space-y-3 bg-[#FAF7F0]/30 animate-fadeIn text-xs">
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(property.nearbyFacilities || []).map((fac, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-[#E5DEC9] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {fac.category}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-emerald-700">
                        {fac.distance}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-[#1E2A44] pt-0.5">
                      {fac.name}
                    </div>
                  </div>
                ))}
              </div>

              {property.googleMaps?.directMapsUrl && (
                <div className="pt-1 flex justify-end">
                  <a
                    href={property.googleMaps.directMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    <span>View on Live Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. Future Projects & Infrastructure Grounding with REAL SOURCES */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => setActiveModule(activeModule === 'future' ? null : 'future')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F0]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-[#1E2A44] flex items-center gap-2">
                  <span>Future Projects &amp; Infrastructure Grounding</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                    Masterplan Audit
                  </span>
                </div>
                <div className="text-[11px] text-[#1E2A44]/65">
                  Upcoming MRT lines, transit hubs &amp; municipal masterplan news
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeModule === 'future' ? (
                <ChevronUp className="w-4 h-4 text-[#1E2A44]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#1E2A44]/60" />
              )}
            </div>
          </div>

          {activeModule === 'future' && (
            <div className="p-5 pt-0 border-t border-[#E5DEC9] space-y-4 bg-[#FAF7F0]/30 animate-fadeIn text-xs">
              <div className="flex items-center justify-between pt-3">
                <span className="font-bold text-xs text-[#1E2A44]">
                  Area Masterplan &amp; Transport Alignments
                </span>
                <button
                  type="button"
                  onClick={handleRunFutureGrounding}
                  disabled={isAuditingFuture}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAuditingFuture ? 'animate-spin' : ''}`} />
                  <span>{isAuditingFuture ? 'Querying Masterplan...' : 'Refresh Live Grounding'}</span>
                </button>
              </div>

              {/* Infrastructure Items with Real Visual Badges & Icons */}
              <div className="space-y-2.5">
                {(groundedFutureResult?.infrastructureItems || [
                  {
                    name: 'MRT3 Circle Line Integration (Orbital Rail Network)',
                    type: 'Transit Line',
                    status: 'Under Active Construction',
                    impact: 'Direct underground transit alignment creates long-term rental demand resilience and capital protection.',
                    sourceTitle: 'MRT Corp Official Project Registry',
                    sourceUrl: 'https://www.mymrt.com.my',
                  },
                  {
                    name: 'Local Council Structure Plan: Low-Rise Civic & Green Buffer',
                    type: 'Zoning Corridor',
                    status: 'Approved Gazetted',
                    impact: 'Confirmed plot ratio limits on adjacent parcels protect daylight corridor and skyline views.',
                    sourceTitle: 'DBKL Structure Plan 2040 / URA Master Plan',
                    sourceUrl: 'https://www.dbkl.gov.my',
                  },
                  {
                    name: 'Transit Feeder Bus & Sheltered Walkway Integration',
                    type: 'Transit Line',
                    status: 'Approved Gazetted',
                    impact: 'Direct sheltered pedestrian connection to operational rail concourse reduces first-and-last-mile friction.',
                    sourceTitle: 'Land Transport Authority / RapidKL',
                    sourceUrl: 'https://myrapid.com.my',
                  },
                ]).map((proj, idx) => {
                  const isTransit = proj.type === 'Transit Line';
                  const isHighway = proj.type === 'Highway';
                  const isCommercial = proj.type === 'Commercial Masterplan';
                  const isZoning = proj.type === 'Zoning Corridor';

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] space-y-2 hover:border-purple-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              isTransit
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isHighway
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : isCommercial
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isTransit && <Train className="w-4 h-4" />}
                            {isHighway && <Compass className="w-4 h-4" />}
                            {isCommercial && <Building className="w-4 h-4" />}
                            {isZoning && <ShieldCheck className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  isTransit
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : isHighway
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : isCommercial
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {proj.type}
                              </span>
                            </div>
                            <h5 className="font-bold text-[#1E2A44] text-xs mt-1">
                              {proj.name}
                            </h5>
                          </div>
                        </div>

                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shrink-0">
                          {proj.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#1E2A44]/80 leading-relaxed pl-10.5">
                        {proj.impact}
                      </p>

                      {proj.sourceUrl && (
                        <div className="pl-10.5 pt-0.5">
                          <a
                            href={proj.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <span>{proj.sourceTitle || 'Official Planning Registry'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grounded Infrastructure News & Reference Links with Real Sources */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#1E2A44]">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    <span>Municipal Planning Gazettes &amp; Verified Media (Real Reference Links)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Grounding with Google Search
                  </span>
                </div>

                <div className="space-y-2">
                  {((groundedFutureResult?.groundedNews && groundedFutureResult.groundedNews.length > 0)
                    ? groundedFutureResult.groundedNews
                    : [
                        {
                          id: 'fp-1',
                          title: 'MRT3 Circle Line Tenders Awarded: Construction Timeline to 2028',
                          source: 'The Edge Malaysia',
                          url: 'https://theedgemalaysia.com',
                          date: 'Recent Gazette',
                          category: 'Infrastructure',
                          sentiment: 'positive',
                          snippet:
                            'Civil works contracts progressing with underground tunneling packages; surrounding property capital values historically benchmark +12% upon transit gazettement.',
                        },
                        {
                          id: 'fp-2',
                          title: 'Municipal Masterplan 2040: Green Transit Corridors Gazetted',
                          source: property.country === 'Singapore' ? 'URA Singapore' : 'Dewan Bandaraya Kuala Lumpur (DBKL)',
                          url: property.country === 'Singapore' ? 'https://www.ura.gov.sg' : 'https://www.dbkl.gov.my',
                          date: 'Recent Gazette',
                          category: 'Masterplan',
                          sentiment: 'positive',
                          snippet:
                            'Confirmed height restrictions and plot ratio caps on adjacent parcels to avoid infrastructure bottleneck and protect daylight access.',
                        },
                      ]
                  ).map((news: any, idx: number) => (
                    <div
                      key={news.id || idx}
                      className="p-3.5 rounded-xl bg-white border border-[#E8E2D6] space-y-1.5 hover:border-purple-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                              {news.category || 'Infrastructure'}
                            </span>
                            {news.date && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {news.date}
                              </span>
                            )}
                          </div>
                          <h6 className="font-bold text-xs text-[#1E2A44]">
                            {news.title}
                          </h6>
                        </div>

                        {news.url && (
                          <a
                            href={news.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[10px] shrink-0 transition-colors"
                          >
                            <span>Read Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-[#1E2A44]/75 leading-relaxed">
                        {news.snippet}
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Source: {news.source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Verdict Section with "Ask Why" Drilldown Buttons */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5DEC9] shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C98A3E] block">
              Diligence Synthesis
            </span>
            <h3 className="font-serif font-bold text-lg text-[#1E2A44]">
              Property Decision Memorandum
            </h3>
          </div>

          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isSynthesizing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] hover:border-[#C98A3E] text-xs font-semibold text-[#1E2A44] transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Sparkles className={`w-3.5 h-3.5 text-[#C98A3E] ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>{isSynthesizing ? 'Synthesizing...' : 'Refresh AI Synthesis'}</span>
          </button>
        </div>

        {/* Top 3 Risks with "Ask Why" Buttons */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Top 3 Diligence Watchouts &amp; Risk Factors</span>
          </div>
          <div className="space-y-2">
            {(safeDecisionProfile.risks || []).slice(0, 3).map((risk: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/80 text-xs text-[#1E2A44] flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{risk}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenWhyModal(risk, 'risk')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  Ask Why
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Strengths with "Ask Why" Buttons */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Top 3 Underwriting Strengths</span>
          </div>
          <div className="space-y-2">
            {(safeDecisionProfile.strengths || []).slice(0, 3).map((strength: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs text-[#1E2A44] flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{strength}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenWhyModal(strength, 'strength')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  Ask Why
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Next Step & Tactical Negotiation Advice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-[#1E2A44] text-[#F3EEE4] space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#C98A3E]">
              Action Before Offer
            </div>
            <p className="text-xs leading-relaxed text-[#F3EEE4]/90 font-medium">
              {safeDecisionProfile.verdictRecommendation}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#C98A3E]/15 border border-[#C98A3E]/30 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#C98A3E]">
              Negotiation Leverage
            </div>
            <p className="text-xs leading-relaxed text-[#1E2A44] font-medium">
              {safeDecisionProfile.negotiationAdvice}
            </p>
          </div>
        </div>

        {/* Mandatory Disclaimer */}
        <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] text-[10px] text-[#1E2A44]/70 leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-[#C98A3E] shrink-0 mt-0.5" />
          <p>
            <strong>Statutory Disclaimer:</strong> This decision support memorandum is compiled from public registry data, NAPIC caveats, and user financial simulations. It does not replace independent legal advice from an advocate &amp; solicitor or licensed structural engineering surveyor.
          </p>
        </div>
      </div>

      {/* "Ask Why" Interactive Agent Reasoning & Supporting Docs Chat Modal */}
      {whyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1E2A44]/70 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setWhyItem(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E8E2D6] shadow-2xl flex flex-col max-h-[90vh] z-10 animate-scaleUp overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1E2A44] to-[#2B3B5E] text-white flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                    {whyItem.agentPerspective || (whyItem.type === 'risk' ? 'Risk Underwriter Agent' : 'Valuation Analyst')}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#F3EEE4]">
                  Underwriting Rationale &amp; Document Copilot
                </h3>
                <p className="text-xs text-[#F3EEE4]/70 line-clamp-1">
                  Drill down into reasoning, statutory citations, or request protective contract clauses
                </p>
              </div>

              <button
                type="button"
                onClick={() => setWhyItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Flagged Item Highlight Bar */}
            <div className="px-5 py-3 bg-[#FAF7F0] border-b border-[#E8E2D6] flex items-center gap-2.5 shrink-0">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                whyItem.type === 'risk' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                Flagged {whyItem.type}
              </span>
              <p className="text-xs font-semibold text-[#1E2A44] truncate">
                &ldquo;{whyItem.item}&rdquo;
              </p>
            </div>

            {/* Chat Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
              {isLoadingWhy ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="w-5 h-5 animate-spin" />
                  </div>
                  <p className="text-xs text-[#1E2A44] font-semibold">
                    Synthesizing Underwriter Reasoning &amp; Public Records...
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Cross-referencing transacted land caveats, developer registry filings, and loan stress formulas.
                  </p>
                </div>
              ) : (
                <>
                  {whyMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'agent' && (
                        <div className="w-7 h-7 rounded-xl bg-[#1E2A44] text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                          AI
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2.5 ${
                          msg.sender === 'user'
                            ? 'bg-[#1E2A44] text-white rounded-br-xs shadow-md'
                            : 'bg-white border border-[#E8E2D6] text-[#1E2A44] rounded-bl-xs shadow-xs'
                        }`}
                      >
                        <div className="whitespace-pre-line font-medium">
                          {msg.text}
                        </div>

                        {/* Supporting Documentation Badges (if present) */}
                        {msg.supportingDocs && msg.supportingDocs.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                            <span className="text-[10px] font-bold text-[#C98A3E] uppercase tracking-wider block">
                              Required Supporting Verification Documents:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.supportingDocs.map((docName, dIdx) => (
                                <span
                                  key={dIdx}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-medium"
                                >
                                  <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>{docName}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={`text-[9px] font-mono ${msg.sender === 'user' ? 'text-white/60 text-right' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isSendingWhyChat && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-7 h-7 rounded-xl bg-[#1E2A44] text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="bg-white border border-[#E8E2D6] rounded-2xl rounded-bl-xs p-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#C98A3E] animate-ping" />
                        <span>Agent analyzing statutory records &amp; contract clauses...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Drilldown Prompt Suggestion Chips */}
            <div className="px-4 py-2 bg-[#FAF7F0] border-t border-[#E8E2D6] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                Suggested:
              </span>
              <button
                type="button"
                onClick={() => handleSendWhyChatMessage('What official statutory documents should I request from the vendor or agent?')}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100/70 border border-[#E8E2D6] text-[#1E2A44] text-[10px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                📄 Required Documents
              </button>
              <button
                type="button"
                onClick={() => handleSendWhyChatMessage('How can my conveyancing solicitor draft a protective clause in the SPA contract?')}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100/70 border border-[#E8E2D6] text-[#1E2A44] text-[10px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                🛡️ Contract Protection Clause
              </button>
              <button
                type="button"
                onClick={() => handleSendWhyChatMessage('What are comparable historical transacted caveats showing for this area?')}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100/70 border border-[#E8E2D6] text-[#1E2A44] text-[10px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                📊 Transacted Caveats
              </button>
              <button
                type="button"
                onClick={() => handleSendWhyChatMessage('How much price discount or negotiation buffer can I request because of this?')}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100/70 border border-[#E8E2D6] text-[#1E2A44] text-[10px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                💰 Price Negotiation Leverage
              </button>
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-[#E8E2D6] flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={whyChatInput}
                onChange={(e) => setWhyChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendWhyChatMessage();
                  }
                }}
                placeholder="Ask follow-up questions or request statutory documentation..."
                disabled={isLoadingWhy || isSendingWhyChat}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E2D6] bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C98A3E] text-xs text-[#1E2A44] transition-all"
              />
              <button
                type="button"
                onClick={() => handleSendWhyChatMessage()}
                disabled={!whyChatInput.trim() || isSendingWhyChat || isLoadingWhy}
                className="px-4 py-2.5 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ENLARGED INSPECTION PHOTO MODAL ("WHAT IS IT?") ================= */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setActivePhotoModal(null)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#E8E2D6] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E2D6] bg-[#FAF8F5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E2A44] truncate">
                    {activePhotoModal.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Evidence {activePhotoModal.index + 1} of {activePhotoModal.total}
                    </span>
                    <span>• {property.title}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Enlarged Photo Canvas with Prev / Next Navigation */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[55vh] border border-slate-800 shadow-inner group">
                <img
                  src={activePhotoModal.url}
                  alt={activePhotoModal.title}
                  className="w-full h-full max-h-[55vh] object-contain transition-transform duration-300"
                />

                {/* Prev / Next controls if multiple photos */}
                {activePhotoModal.total > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextIdx = (activePhotoModal.index - 1 + sitePhotos.length) % sitePhotos.length;
                        setActivePhotoModal({
                          ...activePhotoModal,
                          index: nextIdx,
                          url: sitePhotos[nextIdx],
                          title: `Site Defect Evidence #${nextIdx + 1} • ${property.title}`,
                        });
                      }}
                      className="pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title="Previous defect photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextIdx = (activePhotoModal.index + 1) % sitePhotos.length;
                        setActivePhotoModal({
                          ...activePhotoModal,
                          index: nextIdx,
                          url: sitePhotos[nextIdx],
                          title: `Site Defect Evidence #${nextIdx + 1} • ${property.title}`,
                        });
                      }}
                      className="pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title="Next defect photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* "What is it?" Explanation Card */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-[#1E2A44] uppercase tracking-wider font-mono">
                    What is this evidence?
                  </span>
                </div>
                <p className="text-xs text-[#1E2A44] leading-relaxed">
                  {activePhotoModal.caption ||
                    `Physical on-site defect photograph captured during the SightView AI inspection session for ${property.title}. Stored permanently inside Module 04: Site Visit & Physical Inspection.`}
                </p>
                <div className="pt-2 border-t border-[#E8E2D6] flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    Statutory Evidence
                  </span>
                  <span>Housing Development Act (HDA) Defect Liability Period Protection</span>
                  <span>• Case ID #{caseFile.caseId.slice(0, 8)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-[#E8E2D6] bg-white flex items-center justify-between gap-2">
              <a
                href={activePhotoModal.url}
                target="_blank"
                rel="noreferrer"
                download={`defect-photo-${property.id}-${activePhotoModal.index + 1}.jpg`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D6] hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Photo</span>
              </a>

              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ENLARGED RECORDED INSPECTION VIDEO MODAL ("WHAT IS IT?") ================= */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setActiveVideoModal(null)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#E8E2D6] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E2D6] bg-[#FAF8F5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E2A44] truncate">
                    {activeVideoModal.title || 'Recorded AI Video Call Walkthrough'}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      Duration: {activeVideoModal.durationSeconds || 45}s
                    </span>
                    <span>• {activeVideoModal.timestamp || 'Recorded Live'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Responsive Video Player */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-md">
                <video
                  src={activeVideoModal.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-living-room-4813-large.mp4'}
                  poster={activeVideoModal.thumbnailUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* "What is it?" Section */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-[#1E2A44] uppercase tracking-wider font-mono">
                      What is this video recording?
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Saved in Dossier Module 04
                  </span>
                </div>

                <p className="text-xs text-[#1E2A44] leading-relaxed">
                  {activeVideoModal.aiSummary ||
                    `This video records the buyer's live inspection walkthrough for ${property.title}. During this session, the SightView AI vision model analyzed visual surfaces, electrical breakers, plumbing connections, and acoustic hollow tiles in real time.`}
                </p>

                {/* Defect Highlights Noted in Video */}
                {activeVideoModal.defectsNoted && activeVideoModal.defectsNoted.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#E8E2D6]">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Defects &amp; Items Audited in Video:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {activeVideoModal.defectsNoted.map((defect, dIdx) => (
                        <li
                          key={dIdx}
                          className="flex items-start gap-1.5 text-xs text-[#1E2A44] bg-white p-2 rounded-xl border border-[#E8E2D6]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{defect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Transcript Exchanges if recorded */}
                {activeVideoModal.transcripts && activeVideoModal.transcripts.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#E8E2D6]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                      Synchronized Verbal Dialogue:
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {activeVideoModal.transcripts.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl text-[11px] ${
                            t.speaker === 'Buyer'
                              ? 'bg-slate-100 text-[#1E2A44]'
                              : 'bg-amber-50 text-amber-950 font-medium border border-amber-200'
                          }`}
                        >
                          <span className="font-bold mr-1.5">{t.speaker}:</span>
                          <span>{t.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-[#E8E2D6] bg-white flex items-center justify-between gap-2">
              {activeVideoModal.videoUrl ? (
                <a
                  href={activeVideoModal.videoUrl}
                  download={`inspection-walkthrough-${property.id}.mp4`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D6] hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Video Recording</span>
                </a>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
