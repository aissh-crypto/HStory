import React from 'react';
import { Bookmark, ArrowRight, FolderCheck, ShieldCheck, Search, Trash2, MapPin, Building, MessageCircle, Phone, Camera, ArrowLeft } from 'lucide-react';
import { Property, CaseFile } from '../types';

interface SavedScreenProps {
  savedProperties: Property[];
  caseFiles: CaseFile[];
  onSelectProperty: (property: Property) => void;
  onOpenCaseFile: (caseFile: CaseFile) => void;
  onStartDueDiligence: (property: Property) => void;
  onRemoveBookmark: (propertyId: string) => void;
  onNavigateToSearch: () => void;
  onOpenSightView?: (property: Property) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  savedProperties,
  caseFiles,
  onSelectProperty,
  onOpenCaseFile,
  onStartDueDiligence,
  onRemoveBookmark,
  onNavigateToSearch,
  onOpenSightView,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8 pb-20">
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
          <span className="font-label text-[10px] text-[#C98A3E]">
            PORTFOLIO WATCHLIST
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1E2A44]">
            Saved Properties
          </h1>
          <p className="text-sm text-[#5B6478]">
            {savedProperties.length} candidate properties under your active due diligence watchlist.
          </p>
        </div>

        <button
          onClick={onNavigateToSearch}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E2D6] bg-white hover:border-[#C98A3E] text-xs font-semibold text-[#1E2A44] transition-all self-start sm:self-auto shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-[#C98A3E]" />
          <span>Discover More Homes</span>
        </button>
      </div>

      {/* List of Saved Properties */}
      {savedProperties.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#E8E2D6] shadow-[0_20px_60px_rgba(30,42,68,0.06)] space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F0] border border-[#E8E2D6] flex items-center justify-center text-[#C98A3E] mx-auto">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-xl text-[#1E2A44]">
            No Bookmarked Properties Yet
          </h3>
          <p className="text-xs sm:text-sm text-[#5B6478] leading-relaxed">
            Browse homes on the Search screen and click the bookmark icon to save candidate properties for side-by-side comparison and automated stress tests.
          </p>
          <button
            onClick={onNavigateToSearch}
            className="px-6 py-3 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm"
          >
            <Search className="w-4 h-4 text-[#C98A3E]" />
            <span>Search Properties</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {savedProperties.map((prop) => {
            const existingCase = caseFiles.find((c) => c.propertyId === prop.id);

            return (
              <div
                key={prop.id}
                className="bg-white rounded-[24px] overflow-hidden border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] hover:shadow-[0_20px_50px_rgba(30,42,68,0.1)] transition-all flex flex-col group justify-between"
              >
                <div>
                  {/* Photo & Overlays */}
                  <div
                    onClick={() => onSelectProperty(prop)}
                    className="relative aspect-[16/10] overflow-hidden bg-[#FAF7F0] cursor-pointer"
                  >
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                      <span className="font-label text-[9px] px-2.5 py-1 rounded-full bg-[#1E2A44]/90 backdrop-blur-sm text-white">
                        {prop.country} • {prop.propertyType}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBookmark(prop.id);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#5B6478] hover:text-rose-600 transition-colors flex items-center justify-center shadow-xs"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <div className="font-sans font-bold text-xl drop-shadow-xs">
                        {prop.currency} {prop.price.toLocaleString()}
                      </div>
                      <div className="font-mono text-[10px] text-white/85">
                        {prop.currency} {prop.valuation.pricePerSqFt} / sqft
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <h3
                        onClick={() => onSelectProperty(prop)}
                        className="font-serif font-bold text-base text-[#1E2A44] group-hover:text-[#C98A3E] transition-colors cursor-pointer line-clamp-1"
                      >
                        {prop.title}
                      </h3>
                      <p className="text-xs text-[#5B6478] flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C98A3E] shrink-0" />
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

                    <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E2D6] flex items-center justify-between text-[11px]">
                      <span className="font-label text-[9px] text-[#5B6478]">VALUATION</span>
                      <span className="font-medium text-[#1E2A44]">{prop.valuation.marketPosition}</span>
                    </div>

                    {/* Direct Contact for this Specific Saved House */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/60123456789?text=Hello%2C%20I%20have%20saved%20${encodeURIComponent(prop.title)}%20on%20Homestory.%20Can%20we%20schedule%20a%20viewing%3F`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                      {onOpenSightView && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSightView(prop);
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Inspect on-site with SightView AI"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-600" />
                          <span>SightView</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Case File Status & Action Footer */}
                <div className="p-4 bg-[#FAF7F0] border-t border-[#E8E2D6] flex items-center justify-between text-xs">
                  {existingCase ? (
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                      <FolderCheck className="w-4 h-4 text-emerald-600" />
                      <span>Dossier Active ({existingCase.status})</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#5B6478]">
                      Not yet underwritten
                    </div>
                  )}

                  {existingCase ? (
                    <button
                      onClick={() => onOpenCaseFile(existingCase)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      <span>Open Dossier</span>
                      <ArrowRight className="w-3 h-3 text-[#C98A3E]" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartDueDiligence(prop)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C98A3E] hover:bg-[#b07834] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Start Diligence</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
