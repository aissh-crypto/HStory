import React, { useState } from 'react';
import {
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Bookmark,
  FolderCheck,
  TrendingUp,
  Award,
  ChevronRight,
  ChevronLeft,
  Camera,
  Layers,
} from 'lucide-react';
import { Property } from '../types';
import { getDualCurrencyPrice } from '../utils/currency';

interface PropertyCardProps {
  property: Property;
  isSaved: boolean;
  hasCaseFile: boolean;
  userCurrency?: string;
  onToggleSave: (propertyId: string) => void;
  onViewDetails: (property: Property) => void;
  onStartDueDiligence: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isSaved,
  hasCaseFile,
  userCurrency,
  onToggleSave,
  onViewDetails,
  onStartDueDiligence,
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  // Collect all available gallery images or fallback to property.images
  const allImages = (property.images && property.images.length > 0)
    ? property.images
    : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];

  const totalPhotos = allImages.length;
  const currentPhoto = allImages[photoIndex % totalPhotos];

  // Dual Currency calculations (e.g. S$ for Singapore + RM for Malaysian buyer, or vice versa)
  const dualPrice = getDualCurrencyPrice(property.price, property.currency, userCurrency);

  const marketPositionBadge = {
    'Below Fair Value': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Below Market Value': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Fairly Valued': 'bg-blue-100 text-blue-800 border-blue-300',
    'Premium Tier': 'bg-amber-100 text-amber-800 border-amber-300',
    'Overpriced': 'bg-rose-100 text-rose-800 border-rose-300',
  }[property.valuation.marketPosition] || 'bg-gray-100 text-gray-800 border-gray-300';

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.05)] hover:shadow-[0_22px_48px_rgba(30,42,68,0.12),0_8px_18px_rgba(201,138,62,0.08)] hover:border-amber-300/80 transition-all duration-300 hover:-translate-y-1.5 flex flex-col group justify-between apple-reveal">
      {/* Property Image & Interactive Carousel */}
      <div
        className="relative aspect-[16/10] overflow-hidden bg-[#FAF7F0] cursor-pointer select-none"
        onClick={() => onViewDetails(property)}
      >
        <img
          src={currentPhoto}
          alt={`${property.title} - Photo ${photoIndex + 1}`}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/35 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1E2A44]/90 backdrop-blur-md text-white border border-white/20">
              {property.country === 'Singapore' ? '🇸🇬 SINGAPORE' : '🇲🇾 MALAYSIA'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C98A3E]/95 backdrop-blur-md text-white border border-amber-300/30">
              {property.purpose}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md text-white/90">
              {property.tenure}
            </span>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(property.id);
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-xs ${
              isSaved
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-[#1E2A44] hover:scale-110'
            }`}
            title={isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Photo Numbering Indicator (e.g. "1 / 4") */}
        <div className="absolute top-12 right-3 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-semibold border border-white/20 flex items-center gap-1 shadow-md">
            <Camera className="w-3 h-3 text-amber-400" />
            <span>{photoIndex + 1} / {totalPhotos}</span>
          </span>
        </div>

        {/* Photo Navigation Arrow Controls (Visible on hover or mobile) */}
        {totalPhotos > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer"
              title="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer"
              title="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom Image Overlay: Price with Dual-Currency Display */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white pointer-events-none">
          <div className="space-y-0.5 max-w-[65%]">
            {/* Primary Local Price */}
            <div className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white drop-shadow-md">
              {dualPrice.primary} {property.purpose === 'Rent' && <span className="text-sm font-sans font-normal opacity-90">/ mo</span>}
            </div>

            {/* Dual Currency Conversion Badge for Cross-Border Buyers */}
            {dualPrice.converted && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/90 text-slate-950 text-[11px] font-mono font-bold shadow-xs">
                <span>≈ {dualPrice.converted} {property.purpose === 'Rent' ? '/ mo' : ''}</span>
                <span className="text-[9px] font-normal opacity-75">({dualPrice.convertedCurrency})</span>
              </div>
            )}

            <div className="text-[11px] text-white/80 font-medium">
              {property.purpose === 'Rent'
                ? `${property.currency} ${property.valuation.pricePerSqFt} psf/mo • Monthly Rent`
                : `${property.currency} ${property.valuation.pricePerSqFt.toLocaleString()} / sqft`}
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${marketPositionBadge}`}>
              {property.valuation.marketPosition}
            </span>
            <div className="text-[11px] text-white/95 font-medium flex items-center justify-end gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>{property.valuation.grossRentalYield} Yield</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Title & Location */}
          <div>
            <h3
              onClick={() => onViewDetails(property)}
              className="font-serif font-bold text-lg text-[#1E2A44] group-hover:text-amber-700 transition-colors cursor-pointer line-clamp-1"
            >
              {property.title}
            </h3>
            <p className="text-xs text-[#5B6478] line-clamp-1 mt-0.5">
              {property.address}, {property.city}
            </p>
          </div>

          {/* Key Specs Bar */}
          <div className="grid grid-cols-4 gap-2 py-2.5 px-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] text-[#1E2A44] text-xs">
            <div className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-[#C98A3E]" />
              <span className="font-semibold">{property.bedrooms}</span>
              <span className="text-[10px] text-[#5B6478] hidden sm:inline">Beds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-3.5 h-3.5 text-[#C98A3E]" />
              <span className="font-semibold">{property.bathrooms}</span>
              <span className="text-[10px] text-[#5B6478] hidden sm:inline">Baths</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#C98A3E]" />
              <span className="font-semibold">{property.builtUpArea}</span>
              <span className="text-[10px] text-[#5B6478]">sqft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C98A3E]" />
              <span className="font-semibold">{property.yearBuilt}</span>
            </div>
          </div>

          {/* Developer Signal & Floor Plan Indicator */}
          <div className="flex items-center justify-between text-[11px] pt-0.5 text-[#5B6478]">
            <div className="flex items-center gap-1.5 truncate max-w-[65%]">
              <Award className="w-3.5 h-3.5 text-[#C98A3E] shrink-0" />
              <span className="truncate">
                Dev: <strong className="text-[#1E2A44]">{property.developer}</strong>
              </span>
            </div>
            <span className="shrink-0 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
              {property.developerSignals.reputationScore}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#E8E2D6] flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewDetails(property);
            }}
            className="flex-1 py-2 px-3 rounded-xl border border-[#E8E2D6] hover:bg-[#FAF7F0] text-xs font-semibold text-[#1E2A44] transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Blueprint &amp; Specs</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStartDueDiligence(property);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              hasCaseFile
                ? 'bg-[#1E2A44] hover:bg-[#2A3B5E] text-[#F3EEE4]'
                : 'bg-gradient-to-r from-[#C98A3E] to-[#B2762A] hover:opacity-95 text-white'
            }`}
          >
            <FolderCheck className="w-3.5 h-3.5" />
            <span>{hasCaseFile ? 'Open Dossier' : 'Due Diligence'}</span>
            <ChevronRight className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
