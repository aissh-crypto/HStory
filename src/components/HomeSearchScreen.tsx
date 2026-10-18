import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Building,
  MapPin,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Activity,
  Layers,
  Camera,
  X,
} from 'lucide-react';
import { Property, PurchasePurpose, UserProfile } from '../types';
import { api } from '../services/api';
import { HomestoryLogo } from './HomestoryLogo';
import { PropertyCard } from './PropertyCard';
import { detectLocationCurrency } from '../utils/currency';

interface HomeSearchScreenProps {
  userProfile: UserProfile;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onPerformSearch: (filters: {
    purpose: PurchasePurpose | 'All';
    propertyType: string;
    location: string;
    maxPrice: number;
    searchQuery?: string;
  }) => void;
  savedPropertyIds: string[];
  onToggleSave: (id: string) => void;
  onOpenHowItWorks: () => void;
  onStartDueDiligence: (prop: Property) => void;
  onOpenSightView?: () => void;
  userCurrency?: string;
  currentUser?: any;
}

export const HomeSearchScreen: React.FC<HomeSearchScreenProps> = ({
  userProfile,
  properties,
  onSelectProperty,
  onPerformSearch,
  savedPropertyIds,
  onToggleSave,
  onOpenHowItWorks,
  onStartDueDiligence,
  onOpenSightView,
  userCurrency,
  currentUser,
}) => {
  // Detect active location currency with userProfile.currencyPreference priority
  const activeCurrency =
    userCurrency ||
    (userProfile.currencyPreference === 'MYR'
      ? 'MYR'
      : userProfile.currencyPreference === 'SGD'
      ? 'SGD'
      : userProfile.defaultCurrency || detectLocationCurrency());
  const isMalaysianUser = activeCurrency === 'MYR';

  // Search state
  const [typedQuery, setTypedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [purpose, setPurpose] = useState<PurchasePurpose>('Buy');
  const [propertyType, setPropertyType] = useState<string>('All');
  const [location, setLocation] = useState<string>('All');
  const [countryFilter, setCountryFilter] = useState<'All' | 'Singapore' | 'Malaysia'>('All');
  const [maxPrice, setMaxPrice] = useState<number>(isMalaysianUser ? 3500000 : 3800000);
  const [isAiMode, setIsAiMode] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [feedFilter, setFeedFilter] = useState<'all' | 'singapore' | 'malaysia' | 'rent' | 'buy' | 'below_value' | 'freehold' | 'condo'>('all');

  // Currency symbol for budget slider
  const isSingaporeTarget = location === 'Singapore' || countryFilter === 'Singapore';
  const currencySymbol = isSingaporeTarget ? 'S$' : 'RM';

  // Live suggestions when user types in the search bar - STRICTLY filtered by selected acquisition purpose
  const liveSuggestions = typedQuery.trim().length >= 2
    ? properties
        .filter((p) => {
          if (p.purpose !== purpose) return false;
          const q = typedQuery.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.country.toLowerCase().includes(q) ||
            p.developer.toLowerCase().includes(q) ||
            (p.stateDistrict && p.stateDistrict.toLowerCase().includes(q))
          );
        })
        .slice(0, 5)
    : [];

  const handleStructuredSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onPerformSearch({
      purpose,
      propertyType,
      location: countryFilter !== 'All' ? countryFilter : location,
      maxPrice,
      searchQuery: typedQuery.trim() || undefined,
    });
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      const result = await api.searchWithAI(aiPrompt);
      onPerformSearch({
        purpose: (result.purpose as PurchasePurpose) || purpose,
        propertyType: result.propertyType && result.propertyType !== 'All' ? result.propertyType : 'All',
        location: result.location && result.location !== 'All' ? result.location : 'All',
        maxPrice: result.maxPrice && result.maxPrice > 0 ? result.maxPrice : (purpose === 'Rent' ? 6500 : 2000000),
        searchQuery: aiPrompt,
      });
    } catch (err) {
      console.error(err);
      onPerformSearch({
        purpose,
        propertyType,
        location,
        maxPrice,
        searchQuery: aiPrompt,
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const quickPrompts = [
    '🇸🇬 Singapore 2-bed condo under S$ 2.2M near MRT',
    '🇲🇾 3-bed freehold condo under RM 1.2M in KLCC',
    '🇸🇬 Wallich Residence or Marina One luxury suites',
    '🇲🇾 Landed terrace or waterfront condo in Penang & Johor',
  ];

  // Filtered properties for the home feed
  const displayedProperties = properties.filter((p) => {
    if (feedFilter === 'singapore') {
      return p.country === 'Singapore';
    }
    if (feedFilter === 'malaysia') {
      return p.country === 'Malaysia';
    }
    if (feedFilter === 'rent') {
      return p.purpose === 'Rent';
    }
    if (feedFilter === 'buy') {
      return p.purpose === 'Buy';
    }
    if (feedFilter === 'below_value') {
      return (
        p.valuation.marketPosition.toLowerCase().includes('below') ||
        p.price < (p.valuation.fairValueMin + p.valuation.fairValueMax) / 2
      );
    }
    if (feedFilter === 'freehold') {
      return p.tenure.toLowerCase().includes('freehold');
    }
    if (feedFilter === 'condo') {
      return p.propertyType === 'Condo' || p.propertyType === 'Apartment';
    }
    return true;
  });

  return (
    <div className="space-y-16 pb-20">
      {/* ================= HERO SECTION WITH DAYLIGHT GLOW & VIBRANT AURORA ================= */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
        {/* Soft Multi-Tone Daylight & Aurora Glow */}
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background:
              'radial-gradient(circle at 75% 35%, rgba(254, 184, 0, 0.22) 0%, rgba(236, 72, 153, 0.12) 35%, rgba(99, 102, 241, 0.08) 60%, rgba(251, 249, 245, 0) 100%)',
          }}
        />
        <div
          className="absolute top-0 left-1/4 w-96 h-96 -z-10 pointer-events-none rounded-full blur-3xl opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(236, 72, 153, 0.15) 60%, transparent 80%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* LEFT COLUMN: Hello Greeting & Editorial Headline */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-violet-200/80 bg-white/90 shadow-[0_2px_12px_rgba(139,92,246,0.12)] backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 animate-pulse" />
                <span className="font-mono text-[10px] tracking-[0.22em] font-semibold bg-gradient-to-r from-violet-700 via-purple-700 to-amber-600 bg-clip-text text-transparent">
                  PROPERTY DUE DILIGENCE COPILOT
                </span>
              </div>

              {/* Greeting */}
              <div className="space-y-1">
                <h3 className="font-sans font-light text-2xl sm:text-3xl text-[#1E2A44] tracking-tight">
                  {currentUser && (userProfile.displayName || userProfile.name) ? (
                    <>
                      Hello, <span className="font-medium text-[#0F172A]">{userProfile.displayName || userProfile.name}</span>
                    </>
                  ) : (
                    'Hello'
                  )}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#5B6478] flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cross-border intelligence active • 🇲🇾 Malaysia &amp; 🇸🇬 Singapore</span>
                </p>
              </div>

              {/* Large Headline */}
              <h1 className="font-sans font-light text-4xl sm:text-5xl lg:text-[3.75rem] text-[#1E2A44] tracking-tight leading-[1.08]">
                Every home has a
                <br />
                <span className="font-editorial-italic italic font-normal text-5xl sm:text-6xl lg:text-[4.25rem] bg-gradient-to-r from-[#6366F1] via-[#EC4899] to-[#F59E0B] bg-clip-text text-transparent drop-shadow-xs inline-block transform -rotate-1 mt-1">
                  story.
                </span>
              </h1>

              {/* Editorial Muted Subtitle */}
              <p className="font-sans text-sm sm:text-base text-[#5B6478] leading-relaxed max-w-lg">
                Type in any property name or destination across Singapore and Malaysia. Investigate fair valuations, developer track records, and 2D architectural blueprints before you commit.
              </p>

              {/* Trust Indicators */}
              <div className="pt-1 flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={onOpenHowItWorks}
                  className="font-mono text-xs tracking-widest font-bold text-[#1E2A44] hover:text-violet-700 transition-all inline-flex items-center gap-2 group cursor-pointer bg-white/80 border border-[#E8E2D6] hover:border-violet-400 px-4 py-2 rounded-full shadow-xs hover:shadow-md"
                >
                  <span className="bg-gradient-to-r from-violet-700 to-amber-600 bg-clip-text text-transparent">
                    SEE HOW IT WORKS
                  </span>
                  <span className="text-amber-500 group-hover:translate-x-1.5 transition-transform duration-200">
                    →
                  </span>
                </button>

                <div className="flex items-center gap-2 text-xs text-[#5B6478] border-l border-[#E8E2D6] pl-5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-[#1E2A44]">Zero broker bias • Buyer-only fiduciary</span>
                </div>
              </div>

              {/* Due Diligence Badges */}
              <div className="pt-2 grid grid-cols-3 gap-3 max-w-md">
                <div className="p-3.5 rounded-2xl bg-white/85 border border-[#E8E2D6] hover:border-amber-300 shadow-xs hover:shadow-md transition-all text-left group">
                  <div className="font-mono text-xs font-bold text-amber-600 group-hover:scale-105 transition-transform origin-left">
                    5 Modules
                  </div>
                  <div className="text-[11px] text-[#5B6478] mt-0.5">
                    Full-spectrum audit
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/85 border border-[#E8E2D6] hover:border-pink-300 shadow-xs hover:shadow-md transition-all text-left group">
                  <div className="font-mono text-xs font-bold text-pink-600 group-hover:scale-105 transition-transform origin-left">
                    Dual Currency
                  </div>
                  <div className="text-[11px] text-[#5B6478] mt-0.5">
                    Auto MYR &amp; SGD
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/85 border border-[#E8E2D6] hover:border-violet-300 shadow-xs hover:shadow-md transition-all text-left group">
                  <div className="font-mono text-xs font-bold text-violet-600 group-hover:scale-105 transition-transform origin-left">
                    Architectural CAD
                  </div>
                  <div className="text-[11px] text-[#5B6478] mt-0.5">
                    Real 2D floor plans
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Type-In Search Box with Golden Border */}
            <div className="lg:col-span-6">
              <div className="bg-white border-[3px] border-[#FEB800] ring-4 ring-[#FEB800]/20 rounded-[28px] p-5 sm:p-7 shadow-[0_25px_60px_rgba(254,184,0,0.14),0_20px_50px_rgba(30,42,68,0.08)] relative">
                {/* Acquisition Purpose Tabs: Buy | Rent */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono text-[10px] tracking-wider text-[#5B6478] font-bold flex items-center gap-1.5 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FEB800]" />
                      ACQUISITION PURPOSE
                    </label>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {purpose === 'Buy' ? 'Owner-Occupier & Purchase Diligence' : 'Tenancy & Rental Lease Audit'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 p-1.5 rounded-xl bg-[#F4EFE6] border border-[#E8E2D6]">
                    {(['Buy', 'Rent'] as PurchasePurpose[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setPurpose(tab);
                          setFeedFilter(tab === 'Rent' ? 'rent' : 'buy');
                          if (tab === 'Rent') {
                            setMaxPrice(isSingaporeTarget ? 10000 : 7000);
                          } else {
                            setMaxPrice(isSingaporeTarget ? 2500000 : 2000000);
                          }
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          purpose === tab
                            ? 'bg-[#1E2A44] text-white shadow-sm ring-1 ring-[#1E2A44]'
                            : 'text-[#5B6478] hover:text-[#1E2A44] hover:bg-white/60'
                        }`}
                      >
                        {tab === 'Buy' && (
                          <HomestoryLogo markOnly markClassName="w-3.5 h-3.5" />
                        )}
                        {tab === 'Rent' && <span>🔑</span>}
                        <span>{tab}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country Quick Pills: All | Singapore | Malaysia */}
                <div className="mb-4 flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[9px] text-[#5B6478] font-bold uppercase">MARKET REGION:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'All', label: 'All Regions' },
                      { id: 'Singapore', label: '🇸🇬 Singapore' },
                      { id: 'Malaysia', label: '🇲🇾 Malaysia' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCountryFilter(c.id as any);
                          if (c.id === 'Singapore') setLocation('Singapore');
                          else if (c.id === 'Malaysia') setLocation('All');
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          countryFilter === c.id
                            ? 'bg-[#1E2A44] text-white shadow-xs'
                            : 'bg-[#FAF8F5] border border-[#E8E2D6] text-[#5B6478] hover:text-[#1E2A44]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Search Form: Type-In Search First */}
                <form onSubmit={handleStructuredSearch} className="space-y-3.5">
                  {/* COMPARTMENT 1: Prominent Free-Text Typeable Search Bar */}
                  <div className="relative p-3 rounded-2xl border-2 border-amber-400 bg-amber-50/20 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all shadow-xs">
                    <label className="block font-mono text-[9px] text-amber-800 font-bold mb-1 flex items-center justify-between uppercase">
                      <span className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-amber-600" />
                        <span>TYPE PROPERTY NAME, CITY, DISTRICT, OR KEYWORDS</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal">Type freely</span>
                    </label>

                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={typedQuery}
                        onChange={(e) => {
                          setTypedQuery(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="e.g. Marina One, Wallich, The RuMa, Penang seafront, 3 bedroom condo..."
                        className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1E2A44] placeholder-slate-400 focus:outline-none pr-8"
                      />
                      {typedQuery && (
                        <button
                          type="button"
                          onClick={() => setTypedQuery('')}
                          className="absolute right-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Instant Live Suggestions Dropdown */}
                    {showSuggestions && liveSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-amber-300 p-2 z-50 animate-fadeIn">
                        <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold">
                          Direct Property Matches
                        </div>
                        {liveSuggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onSelectProperty(s);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="truncate pr-2">
                              <div className="font-semibold text-xs text-[#1E2A44] group-hover:text-amber-800 truncate">
                                {s.title}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {s.country === 'Singapore' ? '🇸🇬 Singapore' : '🇲🇾 Malaysia'} • {s.city} • {s.propertyType}
                              </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-lg shrink-0">
                              {s.currency} {s.price.toLocaleString()} {s.purpose === 'Rent' ? '/ mo' : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* COMPARTMENT 2: Location Hotspots (Singapore & Malaysia) */}
                  <div className="p-3 rounded-xl border border-[#E8E2D6] bg-[#FAF8F5] hover:border-[#FEB800] focus-within:border-[#FEB800] focus-within:bg-white transition-all">
                    <label className="block font-mono text-[9px] text-slate-600 font-bold mb-1 flex items-center gap-1.5 uppercase">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>MARKET DESTINATION &amp; DISTRICT HOTSPOTS</span>
                    </label>
                    <select
                      value={location}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocation(val);
                        if (val === 'Singapore') {
                          setCountryFilter('Singapore');
                        } else if (val !== 'All') {
                          setCountryFilter('Malaysia');
                        }
                      }}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1E2A44] focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Cross-Border Markets (Singapore &amp; Malaysia)</option>
                      <option value="Singapore">🇸🇬 Singapore (District 01, 02, 06, 15 - Marina Bay, Tanjong Pagar, East Coast)</option>
                      <option value="Kuala Lumpur">🇲🇾 Kuala Lumpur (KLCC, Bukit Bintang, Mont Kiara, Sentul)</option>
                      <option value="Selangor">🇲🇾 Selangor (Petaling Jaya, Subang Jaya, Bandar Rimbayu)</option>
                      <option value="Penang">🇲🇾 Penang (George Town, Gurney Drive, Gelugor)</option>
                      <option value="Johor Bahru">🇲🇾 Johor Bahru (RTS Link, CIQ, Bukit Chagar)</option>
                    </select>
                  </div>

                  {/* COMPARTMENT 3: Property Typology */}
                  <div className="p-3 rounded-xl border border-[#E8E2D6] bg-[#FAF8F5] hover:border-[#FEB800] focus-within:border-[#FEB800] focus-within:bg-white transition-all">
                    <label className="block font-mono text-[9px] text-slate-600 font-bold mb-1 flex items-center gap-1.5 uppercase">
                      <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>PROPERTY TYPOLOGY</span>
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1E2A44] focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Typologies (Condo, Executive, Landed)</option>
                      <option value="Condo">Condominium / High-Rise Strata</option>
                      <option value="Apartment">Serviced Apartment / Suite</option>
                      <option value="Terrace">Landed Link / Terrace House</option>
                      <option value="Semi-detached">Semi-Detached / Bungalow Villa</option>
                    </select>
                  </div>

                  {/* COMPARTMENT 4: Maximum Acquisition Budget */}
                  <div className="p-3 rounded-xl border border-[#E8E2D6] bg-[#FAF8F5] hover:border-[#FEB800] focus-within:border-[#FEB800] focus-within:bg-white transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[9px] text-emerald-800 font-bold flex items-center gap-1.5 uppercase">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{purpose === 'Rent' ? 'MAX MONTHLY RENT' : 'MAX PURCHASE BUDGET'}</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {currencySymbol} {maxPrice.toLocaleString()} {purpose === 'Rent' ? '/mo' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-slate-500">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          min={purpose === 'Rent' ? 500 : 100000}
                          step={purpose === 'Rent' ? 250 : 25000}
                          value={maxPrice > 0 ? maxPrice : (purpose === 'Rent' ? 4500 : 1800000)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const minVal = purpose === 'Rent' ? 500 : 100000;
                            if (isNaN(val) || val <= 0) {
                              setMaxPrice(minVal);
                            } else {
                              setMaxPrice(Math.max(minVal, val));
                            }
                          }}
                          placeholder={`Enter budget in ${currencySymbol}`}
                          className="w-full pl-10 pr-3 py-1.5 rounded-lg bg-white border border-[#E8E2D6] text-xs sm:text-sm font-mono font-bold text-[#1E2A44] focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 shrink-0">
                        {currencySymbol} {Math.max(purpose === 'Rent' ? 500 : 100000, maxPrice).toLocaleString()}
                      </span>
                    </div>

                    {/* Quick Preset Budget Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                      {(purpose === 'Rent'
                        ? (isSingaporeTarget
                            ? [
                                { label: 'S$ 3.5k', val: 3500 },
                                { label: 'S$ 5.5k', val: 5500 },
                                { label: 'S$ 8.0k', val: 8000 },
                                { label: 'S$ 12k+', val: 12000 },
                              ]
                            : [
                                { label: 'RM 2.5k', val: 2500 },
                                { label: 'RM 4.5k', val: 4500 },
                                { label: 'RM 6.5k', val: 6500 },
                                { label: 'RM 10k+', val: 10000 },
                              ])
                        : (isSingaporeTarget
                            ? [
                                { label: 'S$ 1.5M', val: 1500000 },
                                { label: 'S$ 2.0M', val: 2000000 },
                                { label: 'S$ 2.5M', val: 2500000 },
                                { label: 'S$ 3.5M+', val: 3500000 },
                              ]
                            : [
                                { label: 'RM 600k', val: 600000 },
                                { label: 'RM 1.0M', val: 1000000 },
                                { label: 'RM 1.8M', val: 1800000 },
                                { label: 'RM 3.5M+', val: 3500000 },
                              ])
                      ).map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMaxPrice(chip.val)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                            maxPrice === chip.val
                              ? 'bg-[#1E2A44] text-white'
                              : 'bg-white border border-[#E8E2D6] text-[#5B6478] hover:border-amber-400'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Action Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#003580] hover:bg-[#00224F] text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-md hover:shadow-xl transition-all transform active:scale-[0.99] cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-[#FEB800]" />
                    <span>Search Verified Properties</span>
                    <ArrowRight className="w-4 h-4 text-[#FEB800]" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= VERIFIED PROPERTY FEED ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Feed Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D6] pb-4">
          <div>
            <span className="font-mono text-[10px] text-amber-700 font-bold uppercase tracking-wider">
              CURATED PROPERTY REPERTORY
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#1E2A44]">
              Institutional-Grade Listings
            </h2>
            <p className="text-xs text-[#5B6478] mt-0.5">
              Verified CCC/CSC completions, cross-border currency prices, and architectural blueprints
            </p>
          </div>

          {/* Quick Filter Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'All Listings' },
              { id: 'buy', label: '🏡 Buying Only' },
              { id: 'rent', label: '🔑 Rentals Only' },
              { id: 'singapore', label: '🇸🇬 Singapore' },
              { id: 'malaysia', label: '🇲🇾 Malaysia' },
              { id: 'below_value', label: 'Below Market Value' },
              { id: 'freehold', label: 'Freehold Only' },
              { id: 'condo', label: 'Condos & Suites' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFeedFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  feedFilter === f.id
                    ? 'bg-[#1E2A44] text-white shadow-xs'
                    : 'bg-white border border-[#E8E2D6] text-[#5B6478] hover:text-[#1E2A44] hover:bg-[#FAF7F0]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Grid using Enhanced PropertyCard with Dual Currency and Photo Carousel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 apple-reveal">
          {displayedProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isSaved={savedPropertyIds.includes(prop.id)}
              hasCaseFile={false}
              userCurrency={activeCurrency}
              onToggleSave={onToggleSave}
              onViewDetails={onSelectProperty}
              onStartDueDiligence={onStartDueDiligence}
            />
          ))}
        </div>
      </section>

      {/* ================= EDITORIAL TRUST & METHODOLOGY SECTION ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 apple-reveal">
        <div className="bg-white border border-[#E8E2D6] rounded-3xl p-8 sm:p-12 shadow-[0_20px_60px_rgba(30,42,68,0.06)] space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="font-mono text-[10px] text-amber-700 font-bold uppercase tracking-wider">
              SYSTEMATIC BUYER ADVOCACY
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#1E2A44]">
              How Homestory protects cross-border home buyers
            </h2>
            <p className="text-sm text-[#5B6478] leading-relaxed">
              Real estate marketing glosses over defect history, sinking fund deficits, and cross-border currency conversion risks. Homestory runs cold, independent due diligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D6] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D6] flex items-center justify-center text-[#C98A3E] shadow-xs">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1E2A44]">
                Price Corridor &amp; Fair Value
              </h3>
              <p className="text-xs text-[#5B6478] leading-relaxed">
                We synthesize recent caveat transaction records from JPPH (Malaysia) and URA REALIS (Singapore) to establish empirical fair-value corridors.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D6] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D6] flex items-center justify-center text-[#C98A3E] shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1E2A44]">
                Dual Currency &amp; DSR Stress
              </h3>
              <p className="text-xs text-[#5B6478] leading-relaxed">
                Whether you are in Malaysia or Singapore, view prices in your local currency with automated exchange rates and test household DSR resilience against a 2% rate spike.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D6] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D6] flex items-center justify-center text-[#C98A3E] shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1E2A44]">
                Public Developer Signals
              </h3>
              <p className="text-xs text-[#5B6478] leading-relaxed">
                Inspect tribunal records, late delivery track records, and joint-venture corporate health with zero commercial bias.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
