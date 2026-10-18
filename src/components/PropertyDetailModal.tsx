import React, { useState } from 'react';
import { X, Bed, Bath, Maximize2, Calendar, MapPin, Building, ShieldCheck, Sparkles, Navigation, CheckCircle2, ChevronRight, Bookmark } from 'lucide-react';
import { Property, UserProfile } from '../types';
import { COUNTRY_PACKS } from '../data/countryPacks';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onStartDueDiligence: (property: Property) => void;
  onAskAi: (property: Property) => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  userProfile: UserProfile;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  onStartDueDiligence,
  onAskAi,
  isSaved,
  onToggleSave,
  userProfile,
}) => {
  if (!isOpen || !property) return null;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const countryPack = COUNTRY_PACKS[property.country];

  const stampDutyCalc = countryPack.calculateStampDuty(
    property.price,
    userProfile.residencyStatus === 'Foreign Buyer',
    userProfile.buyerRole === 'First-time Homebuyer'
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-[#FAF7F0] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-[#E5DEC9] max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-white border-b border-[#E5DEC9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#1E2A44] text-white">
              {property.country}
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#C98A3E] text-white">
              {property.propertyType}
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#E5DEC9] text-[#1E2A44]">
              {property.tenure}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(property.id)}
              className={`p-2 rounded-xl border border-[#E5DEC9] transition-colors ${
                isSaved ? 'bg-[#C98A3E] text-white' : 'hover:bg-gray-100 text-[#1E2A44]'
              }`}
              title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#E5DEC9] hover:bg-gray-100 text-[#1E2A44] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          {/* Gallery View */}
          <div className="space-y-3">
            <div className="aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img
                src={property.images[selectedImageIndex] || property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            {property.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-[#C98A3E] scale-105 shadow'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title, Address & Pricing Hero */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5DEC9]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E2A44]">
                {property.title}
              </h1>
              <p className="text-sm text-[#1E2A44]/75 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-[#C98A3E] shrink-0" />
                {property.address}, {property.city}
              </p>
            </div>

            <div className="text-left md:text-right">
              <div className="text-xs font-semibold text-[#1E2A44]/60 uppercase tracking-wider">
                Asking Price
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1E2A44]">
                {property.currency} {property.price.toLocaleString()}
              </div>
              <div className="text-xs text-[#1E2A44]/70">
                {property.currency} {property.valuation.pricePerSqFt.toLocaleString()} / sqft • Gross Yield: {property.valuation.grossRentalYield}
              </div>
            </div>
          </div>

          {/* Key Property Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E5DEC9] shadow-sm">
              <div className="text-xs text-[#1E2A44]/60 font-medium flex items-center gap-1.5 mb-1">
                <Bed className="w-4 h-4 text-[#C98A3E]" />
                Bedrooms
              </div>
              <div className="text-xl font-bold text-[#1E2A44]">{property.bedrooms} Units</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5DEC9] shadow-sm">
              <div className="text-xs text-[#1E2A44]/60 font-medium flex items-center gap-1.5 mb-1">
                <Bath className="w-4 h-4 text-[#C98A3E]" />
                Bathrooms
              </div>
              <div className="text-xl font-bold text-[#1E2A44]">{property.bathrooms} Units</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5DEC9] shadow-sm">
              <div className="text-xs text-[#1E2A44]/60 font-medium flex items-center gap-1.5 mb-1">
                <Maximize2 className="w-4 h-4 text-[#C98A3E]" />
                Built-Up Area
              </div>
              <div className="text-xl font-bold text-[#1E2A44]">{property.builtUpArea} sqft</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5DEC9] shadow-sm">
              <div className="text-xs text-[#1E2A44]/60 font-medium flex items-center gap-1.5 mb-1">
                <Calendar className="w-4 h-4 text-[#C98A3E]" />
                Year Built
              </div>
              <div className="text-xl font-bold text-[#1E2A44]">{property.yearBuilt}</div>
            </div>
          </div>

          {/* Description & Developer Track Record */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-serif font-bold text-lg text-[#1E2A44]">
                Property Overview
              </h3>
              <p className="text-sm leading-relaxed text-[#1E2A44]/80">
                {property.description}
              </p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E2A44]/60 mb-2">
                  Building Amenities & Inclusions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white border border-[#E5DEC9] text-xs font-medium text-[#1E2A44]"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Developer Audit Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5DEC9] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1E2A44]/60 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#C98A3E]" />
                  Master Developer
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {property.developerSignals.reputationScore}
                </span>
              </div>

              <div className="font-serif font-bold text-[#1E2A44] text-base">
                {property.developer}
              </div>

              <div className="space-y-1.5 text-xs text-[#1E2A44]/80">
                <div>
                  <strong>Track Record:</strong> {property.developerSignals.completedProjectsCount}
                </div>
                <div>
                  <strong>Handover Delays:</strong> {property.developerSignals.averageDelayMonths}
                </div>
                <div>
                  <strong>Regulatory Status:</strong> {property.developerSignals.regulatoryNotices}
                </div>
              </div>

              <p className="text-xs text-[#1E2A44]/70 pt-2 border-t border-[#E5DEC9] italic">
                {property.developerSignals.summary}
              </p>
            </div>
          </div>

          {/* Infrastructure & Nearby Transit */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1E2A44] flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#C98A3E]" />
              Nearby Infrastructure & Connectivity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {property.nearbyFacilities.map((fac, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white border border-[#E5DEC9] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C98A3E] block">
                      {fac.category}
                    </span>
                    <span className="font-semibold text-[#1E2A44]">{fac.name}</span>
                  </div>
                  <span className="text-[#1E2A44]/70 font-medium shrink-0 ml-2">
                    {fac.distance}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stamp Duty & Acquisition Cost Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5DEC9] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1E2A44] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#C98A3E]" />
                  Statutory Acquisition Costs & Legal Levies
                </h3>
                <p className="text-xs text-[#1E2A44]/70">
                  Calculated under <strong>{countryPack.name}</strong> framework for a <strong>{userProfile.residencyStatus}</strong> ({userProfile.buyerRole}).
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#1E2A44]/60">Total Estimated Levies:</span>
                <div className="text-xl font-bold font-serif text-[#1E2A44]">
                  {property.currency} {(stampDutyCalc.stampDuty + stampDutyCalc.legalFeesEstimate).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {stampDutyCalc.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E5DEC9] text-[#1E2A44] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Footer Actions */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#E5DEC9] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => onAskAi(property)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#C98A3E] text-[#C98A3E] hover:bg-[#C98A3E]/10 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Consult Due Diligence AI</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-[#E5DEC9] hover:bg-gray-100 text-xs sm:text-sm font-semibold text-[#1E2A44] transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => {
                onStartDueDiligence(property);
                onClose();
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <span>Launch Due Diligence Dossier</span>
              <ChevronRight className="w-4 h-4 text-[#C98A3E]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
