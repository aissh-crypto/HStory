import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, ArrowRight, Building, MapPin, Camera, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Property } from '../types';
import { getDualCurrencyPrice } from '../utils/currency';

interface SearchResultsScreenProps {
  properties: Property[];
  searchCriteriaText: string;
  onBackToSearch: () => void;
  onSelectProperty: (property: Property) => void;
  savedPropertyIds: string[];
  onToggleSave: (id: string) => void;
  userCurrency?: string;
  onStartDueDiligence?: (property: Property) => void;
}

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({
  properties,
  searchCriteriaText,
  onBackToSearch,
  onSelectProperty,
  savedPropertyIds,
  onToggleSave,
  userCurrency,
  onStartDueDiligence,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Photo carousel indexes per property ID
  const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});

  const getIndex = (id: string) => photoIndexes[id] || 0;

  const handleNextPhoto = (id: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndexes((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % total,
    }));
  };

  const handlePrevPhoto = (id: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndexes((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + total) % total,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8 pb-20">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToSearch}
            className="w-10 h-10 rounded-full border border-[#E8E2D6] bg-white flex items-center justify-center text-[#1E2A44] hover:border-[#C98A3E] transition-all shadow-xs cursor-pointer hover:scale-105"
            aria-label="Back to search"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="font-mono text-[10px] text-amber-700 font-bold uppercase tracking-wider">
              VERIFIED PROPERTY SEARCH
            </span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1E2A44]">
              Matching Properties
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#5B6478] bg-white px-3 py-1.5 rounded-full border border-[#E8E2D6]">
            {properties.length} PROPERTIES FOUND
          </span>
        </div>
      </div>

      {/* Active Filter Criteria Pill */}
      {searchCriteriaText && (
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D6] flex items-center justify-between shadow-xs">
          <div className="truncate">
            <span className="font-mono text-[10px] text-amber-700 font-bold block uppercase tracking-wider">
              ACTIVE SEARCH CRITERIA
            </span>
            <span className="font-sans font-medium text-sm text-[#1E2A44] truncate">{searchCriteriaText}</span>
          </div>
          <button
            onClick={onBackToSearch}
            className="font-mono text-xs text-amber-700 hover:text-amber-800 font-bold hover:underline shrink-0 ml-4 cursor-pointer"
          >
            EDIT QUERY / FILTERS
          </button>
        </div>
      )}

      {/* Results List */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E2D6] shadow-[0_20px_60px_rgba(30,42,68,0.06)] space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F0] border border-[#E8E2D6] flex items-center justify-center text-[#C98A3E] mx-auto">
            <Building className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-xl text-[#1E2A44]">
            No Properties Matched These Criteria
          </h3>
          <p className="text-xs sm:text-sm text-[#5B6478] leading-relaxed">
            Try searching for "Singapore", "Marina One", "Wallich", "Kuala Lumpur", "Penang", or typing a broader price threshold.
          </p>
          <button
            onClick={onBackToSearch}
            className="px-6 py-3 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#C98A3E]" />
            <span>Reset Search Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {properties.map((prop) => {
            const isSaved = savedPropertyIds.includes(prop.id);
            const shortTag = prop.valuation.marketPosition;
            const images = (prop.images && prop.images.length > 0)
              ? prop.images
              : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];
            const photoIdx = getIndex(prop.id);
            const currentImg = images[photoIdx % images.length];

            const dualPrice = getDualCurrencyPrice(prop.price, prop.currency, userCurrency);

            return (
              <div
                key={prop.id}
                className="bg-white border border-[#E8E2D6] rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(30,42,68,0.04)] hover:shadow-[0_20px_50px_rgba(30,42,68,0.12)] hover:border-amber-300 transition-all duration-300 hover:-translate-y-1.5 flex flex-col group justify-between"
              >
                <div>
                  <div
                    className="relative aspect-[16/10] overflow-hidden bg-[#FAF7F0] cursor-pointer select-none"
                    onClick={() => onSelectProperty(prop)}
                  >
                    <img
                      src={currentImg}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-auto">
                      <span className="font-mono text-[9px] px-2.5 py-1 rounded-full bg-[#1E2A44]/90 backdrop-blur-sm text-white font-bold border border-white/20">
                        {prop.country === 'Singapore' ? '🇸🇬 SINGAPORE' : '🇲🇾 MALAYSIA'} • {prop.propertyType}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(prop.id);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          isSaved ? 'bg-rose-500 text-white shadow-md' : 'bg-white/85 text-[#1E2A44] hover:bg-white'
                        }`}
                        title={isSaved ? 'Remove Bookmark' : 'Save Property'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Photo Numbering Indicator (e.g. "1 / 4") */}
                    <div className="absolute top-12 right-3.5 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-semibold border border-white/20 flex items-center gap-1 shadow-md">
                        <Camera className="w-3 h-3 text-amber-400" />
                        <span>{photoIdx + 1} / {images.length}</span>
                      </span>
                    </div>

                    {/* Carousel Arrow Controls */}
                    {images.length > 1 && (
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handlePrevPhoto(prop.id, images.length, e)}
                          className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-md cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleNextPhoto(prop.id, images.length, e)}
                          className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-md cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Price with Dual Currency Display */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white pointer-events-none">
                      <div className="space-y-0.5">
                        <div className="font-serif font-bold text-xl drop-shadow-md">
                          {dualPrice.primary} {prop.purpose === 'Rent' && <span className="text-sm font-sans font-normal opacity-90">/ mo</span>}
                        </div>
                        {dualPrice.converted && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/90 text-slate-950 text-[10px] font-mono font-bold shadow-xs">
                            <span>≈ {dualPrice.converted} {prop.purpose === 'Rent' ? '/ mo' : ''}</span>
                            <span className="text-[8px] font-normal opacity-75">({dualPrice.convertedCurrency})</span>
                          </div>
                        )}
                        <div className="font-mono text-[10px] text-white/85">
                          {prop.purpose === 'Rent'
                            ? `${prop.currency} ${prop.valuation.pricePerSqFt} psf/mo • Monthly Rent`
                            : `${prop.currency} ${prop.valuation.pricePerSqFt.toLocaleString()} / sqft`}
                        </div>
                      </div>

                      <span className="font-mono text-[9px] px-2.5 py-1 rounded-full bg-[#C98A3E] text-white font-bold shadow-xs">
                        {shortTag}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <h3
                        onClick={() => onSelectProperty(prop)}
                        className="font-serif font-bold text-base text-[#1E2A44] group-hover:text-amber-700 transition-colors cursor-pointer line-clamp-1"
                      >
                        {prop.title}
                      </h3>
                      <p className="text-xs text-[#5B6478] flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{prop.address}, {prop.city}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#5B6478] font-mono border-t border-[#E8E2D6] pt-2.5">
                      <span>{prop.bedrooms} Bed</span>
                      <span>•</span>
                      <span>{prop.bathrooms} Bath</span>
                      <span>•</span>
                      <span>{prop.builtUpArea} sqft</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF7F0] border-t border-[#E8E2D6] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#5B6478] font-mono truncate max-w-[60%]">
                    Dev: {prop.developer}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectProperty(prop)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1E2A44] hover:text-amber-700 transition-colors cursor-pointer"
                  >
                    <span>View Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
