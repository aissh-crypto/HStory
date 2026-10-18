import React from 'react';
import { Bookmark, FolderCheck, Trash2, ArrowUpRight, Bed, Bath, Maximize2, MapPin } from 'lucide-react';
import { Property, CaseFile } from '../types';

interface SavedPropertiesViewProps {
  savedProperties: Property[];
  caseFiles: CaseFile[];
  onRemoveSaved: (id: string) => void;
  onViewDetails: (property: Property) => void;
  onStartDueDiligence: (property: Property) => void;
  onExploreMore: () => void;
}

export const SavedPropertiesView: React.FC<SavedPropertiesViewProps> = ({
  savedProperties,
  caseFiles,
  onRemoveSaved,
  onViewDetails,
  onStartDueDiligence,
  onExploreMore,
}) => {
  if (savedProperties.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <Bookmark className="w-16 h-16 text-[#C98A3E] mx-auto mb-4 opacity-40" />
        <h2 className="text-2xl font-serif font-bold text-[#1E2A44] mb-2">
          Your Watchlist is Empty
        </h2>
        <p className="text-sm text-[#1E2A44]/70 max-w-md mx-auto mb-6">
          Bookmark promising properties while browsing to compare valuation corridors, simulate mortgage cash flows, and run due diligence.
        </p>
        <button
          onClick={onExploreMore}
          className="px-6 py-2.5 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs sm:text-sm font-semibold transition-colors"
        >
          Explore Verified Properties
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DEC9]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E2A44]">
            Property Acquisition Watchlist
          </h1>
          <p className="text-sm text-[#1E2A44]/70">
            Monitoring <strong>{savedProperties.length}</strong> shortlisted real estate opportunities across target markets.
          </p>
        </div>

        <button
          onClick={onExploreMore}
          className="px-4 py-2 rounded-xl border border-[#E5DEC9] hover:bg-white text-xs font-semibold text-[#1E2A44] transition-colors self-start sm:self-auto"
        >
          + Add More Properties
        </button>
      </div>

      {/* Grid of Saved Properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedProperties.map((property) => {
          const hasCase = caseFiles.some((c) => c.propertyId === property.id);

          return (
            <div
              key={property.id}
              className="bg-white rounded-2xl overflow-hidden border border-[#E5DEC9] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#1E2A44]/90 text-white">
                      {property.country}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#C98A3E]/90 text-white">
                      {property.propertyType}
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveSaved(property.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-rose-600 transition-colors shadow"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow">
                    <div className="text-xl font-serif font-bold">
                      {property.currency} {property.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/90">
                      {property.currency} {property.valuation.pricePerSqFt} / sqft
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3
                      onClick={() => onViewDetails(property)}
                      className="font-serif font-bold text-base text-[#1E2A44] hover:text-[#C98A3E] cursor-pointer line-clamp-1"
                    >
                      {property.title}
                    </h3>
                    <p className="text-xs text-[#1E2A44]/70 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#C98A3E] shrink-0" />
                      <span className="truncate">{property.city}, {property.stateDistrict}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#1E2A44]/70 py-2 border-y border-[#E5DEC9]">
                    <span>{property.bedrooms} Beds</span>
                    <span>{property.bathrooms} Baths</span>
                    <span>{property.builtUpArea} sqft</span>
                    <span>{property.tenure}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  onClick={() => onViewDetails(property)}
                  className="flex-1 py-2 px-3 rounded-xl border border-[#E5DEC9] hover:bg-[#FAF7F0] text-xs font-semibold text-[#1E2A44] transition-colors"
                >
                  View Specs
                </button>

                <button
                  onClick={() => onStartDueDiligence(property)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    hasCase
                      ? 'bg-[#1E2A44] hover:bg-[#2A3B5E] text-white'
                      : 'bg-[#C98A3E] hover:bg-[#b07834] text-white'
                  }`}
                >
                  <FolderCheck className="w-3.5 h-3.5" />
                  <span>{hasCase ? 'Open Dossier' : 'Start Diligence'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
