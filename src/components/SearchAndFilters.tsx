import React, { useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, RotateCcw, Building2, MapPin, DollarSign } from 'lucide-react';
import { PropertyType, PurchasePurpose } from '../types';
import { api } from '../services/api';
import { HomestoryLogo } from './HomestoryLogo';

interface SearchAndFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedPurpose: string;
  setSelectedPurpose: (purpose: string) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onResetFilters: () => void;
  resultsCount: number;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCity,
  setSelectedCity,
  selectedType,
  setSelectedType,
  selectedPurpose,
  setSelectedPurpose,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  onResetFilters,
  resultsCount,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    setAiInterpretation(null);

    try {
      const result = await api.searchWithAI(aiPrompt);
      if (result.location && result.location !== 'All') {
        setSelectedCity(result.location);
      }
      if (result.propertyType && result.propertyType !== 'All') {
        setSelectedType(result.propertyType);
      }
      if (result.purpose) {
        setSelectedPurpose(result.purpose);
      }
      if (result.maxPrice && result.maxPrice > 0 && result.maxPrice < 50000000) {
        setMaxPrice(result.maxPrice);
      }
      if (result.interpretation) {
        setAiInterpretation(result.interpretation);
      }
      setSearchQuery(aiPrompt);
    } catch (err) {
      console.error('AI search failed', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const samplePrompts = [
    '2-bedroom freehold condos in Kuala Lumpur under RM 2M',
    'High rental yield apartments in Selangor near LRT',
    'Freehold investment properties in Singapore District 15',
    'Luxury 3-bed architect designed homes in Bengaluru',
  ];

  return (
    <div className="bg-[#FAF7F0] border-b border-[#E5DEC9] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Tagline */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E2A44]/5 border border-[#1E2A44]/15 text-[#1E2A44] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#C98A3E]" />
            Next-Gen Property Due Diligence
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1E2A44] tracking-tight">
            Institutional Clarity Before You Sign.
          </h1>
          <p className="text-sm sm:text-base text-[#1E2A44]/75 max-w-2xl mx-auto">
            Audit developer track records, model debt stress tests, scrutinize strata accounts, and generate defensible valuation verdicts powered by Gemini AI.
          </p>
        </div>

        {/* AI Natural Language Search Box */}
        <form onSubmit={handleAiSearch} className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-white rounded-2xl shadow-md border-2 border-[#1E2A44]/15 focus-within:border-[#C98A3E] transition-all p-1.5 sm:p-2">
            <div className="pl-3 sm:pl-4 text-[#C98A3E]">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask anything: e.g. 'Show 2-bed freehold condo in KLCC under RM 2M with high rental yield'..."
              className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm bg-transparent outline-none text-[#1E2A44] placeholder-[#1E2A44]/40 font-medium"
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiPrompt.trim()}
              className="shrink-0 px-4 sm:px-6 py-2.5 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {isAiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#C98A3E]" />
                  <span>Search with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Prompt Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3 text-xs text-[#1E2A44]/70">
            <span className="font-medium text-[#1E2A44]/50">Try:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiPrompt(p);
                  setSearchQuery(p);
                }}
                className="px-2.5 py-1 rounded-full bg-[#E5DEC9]/40 hover:bg-[#E5DEC9] text-[#1E2A44] text-[11px] transition-colors truncate max-w-[260px]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* AI Search Feedback Banner */}
          {aiInterpretation && (
            <div className="mt-3 p-3 rounded-xl bg-[#C98A3E]/10 border border-[#C98A3E]/30 text-xs text-[#1E2A44] flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C98A3E] shrink-0" />
                <span>
                  <strong>Gemini AI interpreted:</strong> {aiInterpretation}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAiInterpretation(null)}
                className="text-[#1E2A44]/50 hover:text-[#1E2A44] text-xs font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </form>

        {/* Structured Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5DEC9] space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Purpose */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60 mb-1 flex items-center gap-1.5">
                <HomestoryLogo markOnly markClassName="w-3.5 h-3.5" />
                Purpose
              </label>
              <select
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] focus:ring-1 focus:ring-[#C98A3E] focus:outline-none text-[#1E2A44]"
              >
                <option value="All">All Purposes</option>
                <option value="Buy">For Purchase (Buy & Invest)</option>
                <option value="Rent">Tenancy (Rent)</option>
              </select>
            </div>

            {/* City / Location */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                City / Market
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] focus:ring-1 focus:ring-[#C98A3E] focus:outline-none text-[#1E2A44]"
              >
                <option value="All">All Markets</option>
                <option value="Kuala Lumpur">Kuala Lumpur, MY</option>
                <option value="Selangor">Selangor / PJ, MY</option>
                <option value="Singapore">Singapore (Prime / East Coast)</option>
                <option value="Bengaluru">Bengaluru, IN</option>
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Property Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] focus:ring-1 focus:ring-[#C98A3E] focus:outline-none text-[#1E2A44]"
              >
                <option value="All">All Types</option>
                <option value="Condo">Condominium</option>
                <option value="Apartment">Serviced Apartment</option>
                <option value="Terrace">Landed Terrace</option>
                <option value="Semi-detached">Semi-Detached</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2A44]/60 mb-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Sort Order
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] focus:ring-1 focus:ring-[#C98A3E] focus:outline-none text-[#1E2A44]"
              >
                <option value="recommended">Recommended (Diligence Ready)</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="year-desc">Newest Construction</option>
              </select>
            </div>
          </div>

          {/* Results count & Reset Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E5DEC9]/60 text-xs">
            <span className="text-[#1E2A44]/70 font-medium">
              Showing <strong className="text-[#1E2A44]">{resultsCount}</strong> verified properties ready for due diligence
            </span>

            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 text-xs text-[#1E2A44]/60 hover:text-[#C98A3E] font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
