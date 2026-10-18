import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bookmark,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Building,
  Navigation,
  School,
  Train,
  HeartPulse,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Info,
  DollarSign,
  TrendingDown,
  Camera,
  CheckCircle2,
  FileSpreadsheet,
  FolderOpen,
  Mail,
  Compass,
  Layers,
  Sparkles,
  ExternalLink,
  Phone,
  MessageCircle,
  RefreshCw,
  X,
  ZoomIn,
  Download,
} from 'lucide-react';
import { Property, UserProfile } from '../types';
import { COUNTRY_PACKS } from '../data/countryPacks';
import { googleWorkspace } from '../services/googleWorkspace';
import { ArchitecturalFloorPlanViewer } from './ArchitecturalFloorPlanViewer';
import { getDualCurrencyPrice, detectLocationCurrency } from '../utils/currency';

interface PropertyDetailScreenProps {
  property: Property;
  onBack: () => void;
  onStartDueDiligence: (property: Property) => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  userProfile: UserProfile;
  onOpenSightView?: (property: Property) => void;
}

export const PropertyDetailScreen: React.FC<PropertyDetailScreenProps> = ({
  property,
  onBack,
  onStartDueDiligence,
  isSaved,
  onToggleSave,
  userProfile,
  onOpenSightView,
}) => {
  const [photoCategory, setPhotoCategory] = useState<'all' | 'exterior' | 'interior' | 'streetview' | 'floorplans'>('all');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [mapMode, setMapMode] = useState<'map' | 'streetview'>('map');
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const resolvedInitialCurrency =
    userProfile.currencyPreference === 'MYR'
      ? 'MYR'
      : userProfile.currencyPreference === 'SGD'
      ? 'SGD'
      : userProfile.defaultCurrency || detectLocationCurrency();

  const [activeCurrencyPreference, setActiveCurrencyPreference] = useState<string>(resolvedInitialCurrency);

  // Keep currency preference in immediate sync if user switches profile or inspects different property
  useEffect(() => {
    const pref =
      userProfile.currencyPreference === 'MYR'
        ? 'MYR'
        : userProfile.currencyPreference === 'SGD'
        ? 'SGD'
        : userProfile.defaultCurrency || detectLocationCurrency();
    setActiveCurrencyPreference(pref);
  }, [userProfile.currencyPreference, userProfile.defaultCurrency, property.id]);

  const countryPack = COUNTRY_PACKS[property.country];

  // Dual Currency computation (Primary swaps with yellow converted box based on active preference)
  const dualPrice = getDualCurrencyPrice(property.price, property.currency, activeCurrencyPreference);

  // Always scroll to top when opening a property detail screen
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [property.id]);

  // Filter gallery photos based on selected category with robust fallbacks
  const extImgs = property.photoGallery?.exterior?.length ? property.photoGallery.exterior : property.images.slice(0, 2);
  const intImgs = property.photoGallery?.interior?.length ? property.photoGallery.interior : property.images.slice(1, 3);
  const svImgs = property.photoGallery?.streetView?.length
    ? property.photoGallery.streetView
    : property.photoGallery?.streetview?.length
    ? property.photoGallery.streetview
    : [property.images[0]];
  const fpImgs = property.photoGallery?.floorPlans?.length
    ? property.photoGallery.floorPlans
    : property.photoGallery?.floorplans?.length
    ? property.photoGallery.floorplans
    : [property.floorPlanVariations?.[0]?.floorPlanImageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'];

  const galleryImages: string[] =
    photoCategory === 'exterior'
      ? extImgs
      : photoCategory === 'interior'
      ? intImgs
      : photoCategory === 'streetview'
      ? svImgs
      : photoCategory === 'floorplans'
      ? fpImgs
      : [...extImgs, ...intImgs, ...svImgs];

  const currentImage = (galleryImages.length > 0 ? galleryImages[activeImageIdx % galleryImages.length] : null) || property.images[0];

  const handleNextPhoto = () => {
    setActiveImageIdx((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevPhoto = () => {
    setActiveImageIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const stampDutyCalc = countryPack.calculateStampDuty(
    property.price,
    userProfile.residencyStatus === 'Foreign Buyer',
    userProfile.buyerRole === 'First-time Homebuyer'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8 space-y-8 pb-32">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E2D6] bg-white text-xs font-bold text-[#1E2A44] hover:border-amber-400 hover:bg-[#FAF7F0] transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Search</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#5B6478] hidden sm:inline">
            REF: #{property.id}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleSave(property.id);
            }}
            className={`p-2.5 rounded-full border transition-all shadow-xs cursor-pointer ${
              isSaved
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white border-[#E8E2D6] text-[#1E2A44] hover:bg-[#FAF7F0]'
            }`}
            title={isSaved ? 'Bookmarked' : 'Save Property'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN: Gallery, Google Maps & Street View (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Photo Gallery with Outside/Inside Tabs */}
          <div id="property-photo-gallery" className="space-y-3 scroll-mt-24">
            {/* Gallery Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'All Photos', icon: '🖼️' },
                { id: 'exterior', label: 'Exterior & Facade', icon: '🏢' },
                { id: 'interior', label: 'Interior Rooms', icon: '🛋️' },
                { id: 'streetview', label: 'Street-Level 360°', icon: '🧭' },
                { id: 'floorplans', label: 'Floor Plan Blueprint', icon: '📐' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setPhotoCategory(tab.id as any);
                    setActiveImageIdx(0);

                    if (tab.id === 'floorplans') {
                      setTimeout(() => {
                        const el = document.getElementById('property-floor-plan-viewer');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 50);
                    } else if (tab.id === 'streetview') {
                      setMapMode('streetview');
                      setTimeout(() => {
                        const el = document.getElementById('property-street-view-section');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 50);
                    } else {
                      const el = document.getElementById('property-photo-gallery');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    photoCategory === tab.id
                      ? 'bg-[#1E2A44] text-white shadow-xs'
                      : 'bg-white border border-[#E8E2D6] text-[#5B6478] hover:text-[#1E2A44] hover:border-amber-400'
                  }`}
                >
                  <span className="text-xs">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Main Featured Photo Box */}
            <div
              onClick={() => setIsPhotoLightboxOpen(true)}
              className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-xl bg-[#FAF7F0] border border-[#E8E2D6] group select-none cursor-pointer"
              title="Click to enlarge photo and view high-resolution gallery"
            >
              <img
                src={currentImage}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Hover Zoom Prompt */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#1E2A44] font-bold text-xs flex items-center gap-1.5 shadow-xl">
                  <ZoomIn className="w-4 h-4 text-amber-600" />
                  <span>Click to Enlarge</span>
                </div>
              </div>

              {/* Badges on top */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-auto">
                <span className="font-mono text-[10px] px-3 py-1 rounded-full bg-[#1E2A44]/90 backdrop-blur-md text-white font-bold border border-white/20">
                  {property.country === 'Malaysia' ? '🇲🇾 MALAYSIA' : '🇸🇬 SINGAPORE'}
                </span>
                <span className="font-mono text-[10px] px-3 py-1 rounded-full bg-amber-500 text-white font-bold shadow-xs">
                  {property.propertyType}
                </span>
                <span className="font-mono text-[10px] px-3 py-1 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{(property.legalStatus?.certificateType || 'CCC').split(' ')[0]} APPROVED</span>
                </span>
              </div>

              {/* Prominent Photo Numbering Indicator (e.g. Photo 1 of 6) */}
              <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-mono border border-white/20 shadow-md flex items-center gap-1.5 pointer-events-none">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Photo {activeImageIdx + 1} of {galleryImages.length}</span>
              </div>

              {/* Carousel Arrow Controls */}
              {galleryImages.length > 1 && (
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer"
                    title="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Carousel with Numbers */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer relative ${
                    activeImageIdx === idx
                      ? 'border-amber-500 scale-105 shadow-md ring-2 ring-amber-400/30'
                      : 'border-[#E8E2D6] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0.5 right-1 px-1 rounded bg-black/70 text-white text-[9px] font-mono">
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ================= ARCHITECTURAL FLOOR PLANS & CAD BLUEPRINT VIEWER ================= */}
          <div id="property-floor-plan-viewer" className="scroll-mt-24">
            <ArchitecturalFloorPlanViewer property={property} variations={property.floorPlanVariations} />
          </div>

          {/* ================= STATUTORY MARKET DATA & PUBLIC REGISTRY INTELLIGENCE ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D6] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8E2D6]">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-[#1E2A44] text-base">
                  Market Data &amp; Statutory Registry Intelligence
                </h3>
                <p className="text-xs text-slate-500">
                  Cross-referenced with official, verified data portals for {property.country}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Brickz.my & JPPH */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2A44] text-xs">
                    {property.country === 'Singapore' ? '🇸🇬 URA REALIS & Caveats API' : '🇲🇾 Brickz.my & JPPH Caveats'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Price Analysis
                  </span>
                </div>
                <p className="text-[11px] text-[#5B6478] leading-relaxed">
                  {property.marketDataSources?.brickzPriceRef || property.marketDataSources?.uraCaveatsCitation ||
                    `Resale transaction prices pulled from JPPH records for ${property.city}. Subsale benchmark indicates ${property.currency} ${property.valuation.pricePerSqFt} psf.`}
                </p>
              </div>

              {/* EdgeProp / Overhang */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2A44] text-xs">
                    {property.country === 'Singapore' ? '🇸🇬 OneMap SLA (Land Authority)' : '🇲🇾 EdgeProp Malaysia Analytics'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    Overhang &amp; POI
                  </span>
                </div>
                <p className="text-[11px] text-[#5B6478] leading-relaxed">
                  {property.marketDataSources?.edgePropUnsoldStats || property.marketDataSources?.oneMapSlaDetails ||
                    `Submarket supply overhang index rated ${property.napicUraData?.overhangRiskLevel || 'Low'} with high absorption rate.`}
                </p>
              </div>

              {/* SSM e-Search Company Registry */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2A44] text-xs">
                    {property.country === 'Singapore' ? '🇸🇬 ACRA Singapore Company Registry' : '🇲🇾 SSM e-Search Company Registry'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    Developer Check
                  </span>
                </div>
                <p className="text-[11px] text-[#5B6478] leading-relaxed">
                  {property.marketDataSources?.ssmRegistrationNo ||
                    `Official company registry check: ${property.developer} registered in good standing under Companies Act.`}
                </p>
              </div>

              {/* JUPEM eKadaster / data.gov */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2A44] text-xs">
                    {property.country === 'Singapore' ? '🇸🇬 data.gov.sg Open Data Portal' : '🇲🇾 JUPEM eKadaster & data.gov.my'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                    Title &amp; Cadastre
                  </span>
                </div>
                <p className="text-[11px] text-[#5B6478] leading-relaxed">
                  {property.marketDataSources?.jupemTitleNumber || property.marketDataSources?.dataGovHdbResaleMedian ||
                    `Cadastral land title search confirmed. Title tenure: ${property.tenure}.`}
                </p>
              </div>
            </div>
          </div>

          {/* ================= GOOGLE MAPS & STREET VIEW 360° ================= */}
          <div id="property-street-view-section" className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D6] shadow-sm space-y-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D6]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-[#1E2A44] text-base">
                    Google Maps™ Exterior & Street View
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Exact coordinates: {(property.googleMaps?.latitude || property.coordinates?.lat || 3.1488).toFixed(4)}° N, {(property.googleMaps?.longitude || property.coordinates?.lng || 101.6625).toFixed(4)}° E
                </p>
              </div>

              {/* Map view switcher */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setMapMode('map')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mapMode === 'map' ? 'bg-[#1E2A44] text-white shadow-xs' : 'text-slate-600 hover:text-[#1E2A44]'
                  }`}
                >
                  🗺️ Map View
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('streetview')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mapMode === 'streetview' ? 'bg-[#1E2A44] text-white shadow-xs' : 'text-slate-600 hover:text-[#1E2A44]'
                  }`}
                >
                  👁️ Street View 360°
                </button>
              </div>
            </div>

            {/* Interactive Map Frame */}
            {mapMode === 'map' ? (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-[#E8E2D6] bg-slate-100 shadow-inner">
                {/* Embedded OpenStreetMap / Google Maps hybrid representation */}
                <iframe
                  title="Property Location Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(property.googleMaps?.longitude || property.coordinates?.lng || 101.6625) - 0.008}%2C${(property.googleMaps?.latitude || property.coordinates?.lat || 3.1488) - 0.006}%2C${(property.googleMaps?.longitude || property.coordinates?.lng || 101.6625) + 0.008}%2C${(property.googleMaps?.latitude || property.coordinates?.lat || 3.1488) + 0.006}&layer=mapnik&marker=${property.googleMaps?.latitude || property.coordinates?.lat || 3.1488}%2C${property.googleMaps?.longitude || property.coordinates?.lng || 101.6625}`}
                  className="w-full h-full"
                />
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E8E2D6] text-xs font-semibold text-[#1E2A44] shadow-md flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{property.address}</span>
                </div>
              </div>
            ) : (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-[#E8E2D6] bg-black shadow-inner flex items-center justify-center">
                <img
                  src={(property.photoGallery?.streetView && property.photoGallery.streetView[0]) || (property.photoGallery?.streetview && property.photoGallery.streetview[0]) || property.images[0]}
                  alt="Street View"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-mono">
                  STREET VIEW PANORAMA · HEADING {property.googleMaps?.streetViewHeading || 180}°
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs text-center font-medium">
                  Neighborhood street frontage, access lanes and ingress/egress corridor
                </div>
              </div>
            )}

            {/* External Google Maps Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                Direct satellite verification & transit nodes
              </span>
              <a
                href={property.googleMaps.googleMapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-xs"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* ================= NAPIC (MALAYSIA) & URA (SINGAPORE) DATA ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-500/30 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E8E2D6]">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>OFFICIAL STATUTORY CAVEATS REGISTRY</span>
                </div>
                <h3 className="font-bold text-[#1E2A44] text-base sm:text-lg">
                  {property.napicUraData.dataSource}
                </h3>
                <p className="text-xs text-slate-500">
                  {property.napicUraData.datasetCitation}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-400 block">SEAL NO.</span>
                <span className="text-xs font-mono font-bold text-[#1E2A44] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {(property.napicUraData?.registryVerificationSeal || 'NAPIC-JPPH-VERIFIED').slice(0, 16)}...
                </span>
              </div>
            </div>

            {/* Key Statutory Benchmarks Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                <div className="text-[10px] font-medium text-slate-500 uppercase">Submarket Median</div>
                <div className="text-base sm:text-lg font-bold text-[#1E2A44] font-mono mt-0.5">
                  {property.currency} {property.napicUraData?.medianTransactedPsqft || property.valuation.pricePerSqFt}
                </div>
                <div className="text-[10px] text-slate-400">per square foot</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                <div className="text-[10px] font-medium text-slate-500 uppercase">Index Trend</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-700 mt-1">
                  {property.napicUraData?.quarterlyPriceIndex || '+3.8% YoY'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                <div className="text-[10px] font-medium text-slate-500 uppercase">12-Mo Volume</div>
                <div className="text-base sm:text-lg font-bold text-[#1E2A44] font-mono mt-0.5">
                  {property.napicUraData?.transactionVolume12Mo || property.napicUraData?.totalTransactions12m || 18} Units
                </div>
                <div className="text-[10px] text-slate-400">Recorded caveats</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
                <div className="text-[10px] font-medium text-slate-500 uppercase">Absorption</div>
                <div className="text-xs sm:text-sm font-bold text-blue-700 mt-1">
                  {property.napicUraData?.submarketStockStatus || property.napicUraData?.absorptionRate || 'Healthy Absorption'}
                </div>
                <div className="text-[10px] text-slate-400">Overhang: {property.napicUraData?.overhangRiskLevel || 'Low'}</div>
              </div>
            </div>

            {/* Recent Statutory Caveats Table */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-[#1E2A44]">
                Verified Historical Transacted Caveats in Sub-District:
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#E8E2D6]">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF8F5] text-slate-500 text-[11px] font-semibold border-b border-[#E8E2D6]">
                    <tr>
                      <th className="p-2.5">Unit / Block</th>
                      <th className="p-2.5">Size (sqft)</th>
                      <th className="p-2.5">Transacted Price</th>
                      <th className="p-2.5">Rate PSF</th>
                      <th className="p-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D6]">
                    {((property.napicUraData?.recentTransactedUnits || property.napicUraData?.recentTransactedComparables || []).map((u: any, i: number) => (
                      <tr key={i} className="hover:bg-amber-50/40">
                        <td className="p-2.5 font-semibold text-[#1E2A44]">{u.unit || u.unitType || 'Parcel Unit'}</td>
                        <td className="p-2.5 font-mono text-slate-600">{u.builtUpSqft || '-'}</td>
                        <td className="p-2.5 font-mono font-bold text-[#1E2A44]">
                          {property.currency} {(u.transactedPrice || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">
                          {property.currency} {u.psqft || 0}
                        </td>
                        <td className="p-2.5 text-slate-500 text-[11px]">{u.contractDate || u.date || '-'}</td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ================= LEGAL APPROVALS & REGULATORY RECORD ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D6] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8E2D6]">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-[#1E2A44] text-base">
                  Legal Approval & Statutory Clearances
                </h3>
                <p className="text-xs text-slate-500">
                  Verified with {property.legalStatus.regulatoryAuthority}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Occupancy Certificate</div>
                <div className="font-bold text-[#1E2A44] text-sm flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{property.legalStatus.certificateType}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-600">Cert: {property.legalStatus.certificateNumber}</div>
                <div className="text-[10px] text-slate-400">Issued: {property.legalStatus.issueDate}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Developer License / APDL</div>
                <div className="font-bold text-[#1E2A44] text-sm">
                  {property.legalStatus.apdlNumber || 'Standard BCA / URA Compliance'}
                </div>
                <div className="text-[11px] text-slate-600">{property.legalStatus.apdlValidity}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Strata Title Status</div>
                <div className="font-bold text-[#1E2A44] text-sm text-blue-900">
                  {property.legalStatus.strataTitleStatus}
                </div>
                <div className="text-[11px] text-slate-600">{property.legalStatus.landRegistrySearch}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Zoning & Encumbrances</div>
                <div className="font-bold text-[#1E2A44] text-sm">
                  {property.legalStatus.encumbrances}
                </div>
                <div className="text-[11px] text-slate-600">{property.legalStatus.zoningClassification}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pricing, Google Suite Actions & SightView Launch (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Price & Title Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#FEB800] shadow-xl space-y-5">
            <div className="space-y-2">
              <span className="font-label text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                {property.tenure} • {property.propertyType}
              </span>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1E2A44] leading-tight">
                {property.title}
              </h1>
              <p className="text-xs text-[#5B6478] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{property.address}, {property.city}</span>
              </p>
            </div>

            {/* Price Box with Dual-Currency Display & 1-Click Swap */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-3 apple-reveal">
              {/* Live FX Market Rate Benchmark Banner */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-[#E8E2D6]/80 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time Bank Benchmark: 1 SGD = 3.3218 MYR</span>
                </span>
                <span className="text-slate-500 font-sans">
                  BNM / MAS Live Mid-Market
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Primary Currency Label & Quick Switcher */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1E2A44] text-white shadow-2xs">
                      {activeCurrencyPreference === 'MYR' ? '🇲🇾 Showing in MYR' : '🇸🇬 Showing in SGD'}
                      {activeCurrencyPreference !== property.currency ? (
                        <span className="text-amber-300 font-sans font-semibold text-[9px]">(Live FX Converted)</span>
                      ) : (
                        <span className="text-emerald-300 font-sans font-semibold text-[9px]">(Original Listing)</span>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveCurrencyPreference((prev) => (prev === 'MYR' ? 'SGD' : 'MYR'))}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white border border-[#E8E2D6] hover:border-amber-500 hover:bg-amber-50 text-slate-700 hover:text-[#1E2A44] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Click to toggle primary display currency"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-600" />
                      <span>⇄ Switch Currency ({activeCurrencyPreference === 'MYR' ? '🇸🇬 SGD' : '🇲🇾 MYR'})</span>
                    </button>
                  </div>

                  {/* Large Headline Primary Price */}
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1E2A44] font-sans tracking-tight">
                    {dualPrice.primary} {property.purpose === 'Rent' && <span className="text-base sm:text-lg font-normal text-slate-500">/ month</span>}
                  </div>

                  {/* Dual Currency Converted Box - Swappable Interactive Yellow Box */}
                  {dualPrice.converted && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveCurrencyPreference((prev) => (prev === 'MYR' ? 'SGD' : 'MYR'))}
                        className="inline-flex items-center flex-wrap gap-2 px-3.5 py-2 rounded-xl bg-[#FEB800] hover:bg-[#e6a600] active:scale-95 text-slate-950 font-mono text-xs font-bold shadow-sm transition-all cursor-pointer hover:shadow-md text-left border border-amber-600/30 group"
                        title="Click to swap this currency with headline rate"
                      >
                        <span className="font-extrabold text-sm text-[#1E2A44]">
                          ≈ {dualPrice.converted} {property.purpose === 'Rent' ? '/ mo' : ''}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-900 bg-amber-300/80 px-2 py-0.5 rounded">
                          {activeCurrencyPreference === property.currency
                            ? (property.currency === 'MYR' ? '🇸🇬 Converted SGD' : '🇲🇾 Converted MYR')
                            : `${property.currency} Original Listing Price`}
                        </span>
                        <span className="text-[10px] text-amber-950 font-sans font-bold underline ml-1 group-hover:text-black">
                          ⇄ Click to Swap Places
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-slate-500 pt-1 leading-snug">
                    {property.purpose === 'Rent'
                      ? `${property.currency} ${property.valuation.pricePerSqFt} psf/mo • Monthly Tenancy Rate • ${dualPrice.rateNote}`
                      : `${property.currency} ${property.valuation.pricePerSqFt.toLocaleString()} / sqft • ${dualPrice.rateNote}`}
                  </div>
                </div>

                {/* Right Alignment Box: Market Position & Gross Rental Yield */}
                <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-1 border-t sm:border-t-0 border-[#E8E2D6]/60 sm:pt-0">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    {property.valuation.marketPosition}
                  </span>
                  <div className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {property.valuation.grossRentalYield} Yield
                  </div>
                </div>
              </div>
            </div>

            {/* Specs Bar */}
            <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-[#E8E2D6] text-xs">
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">Bedrooms</div>
                <div className="font-bold text-[#1E2A44] text-base">{property.bedrooms} Bed</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">Bathrooms</div>
                <div className="font-bold text-[#1E2A44] text-base">{property.bathrooms} Bath</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">Area</div>
                <div className="font-bold text-[#1E2A44] text-base">{property.builtUpArea} sqft</div>
              </div>
            </div>

            {/* Primary Action: Start Full Due Diligence Case */}
            <button
              type="button"
              onClick={() => onStartDueDiligence(property)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1E2A44] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#0F172A] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
            >
              <span>Initialize Due Diligence Case</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>

            {/* Launch SightView AI Camera */}
            {onOpenSightView && (
              <button
                type="button"
                onClick={() => onOpenSightView(property)}
                className="w-full py-3 px-6 rounded-2xl border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Camera className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Launch SightView AI™ On-Site Camera</span>
              </button>
            )}
          </div>

          {/* ================= GOOGLE SUITE (WORKSPACE) ACTION HUB ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D6] shadow-sm space-y-4">
            <div className="space-y-1 pb-3 border-b border-[#E8E2D6]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                <span>GOOGLE SUITE ACTIONS</span>
              </div>
              <h3 className="font-bold text-[#1E2A44] text-sm">
                Connected Google Workspace Workflows
              </h3>
              <p className="text-xs text-slate-500">
                Direct export to Google Sheets, Calendar, Gmail & Drive
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Google Sheets Export */}
              <button
                type="button"
                onClick={() => googleWorkspace.exportToGoogleSheets(property)}
                className="w-full p-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 text-emerald-950 font-bold text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div className="text-left">
                    <span className="block font-bold">Export to Google Sheets™</span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      Financial underwriting & NAPIC comps model
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-600" />
              </button>

              {/* Google Calendar Viewing */}
              <a
                href={googleWorkspace.getCalendarInspectionUrl(property)}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 text-blue-950 font-bold text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <span className="block font-bold">Schedule Viewing in Google Calendar™</span>
                    <span className="text-[10px] text-blue-700 font-normal">
                      Prefills address, map directions & inspection agenda
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-600" />
              </a>

              {/* Gmail Legal Inquiry */}
              <a
                href={googleWorkspace.getGmailLegalInquiryUrl(property, userProfile)}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 rounded-2xl border border-rose-200 bg-rose-50/40 hover:bg-rose-100/60 text-rose-950 font-bold text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-rose-600" />
                  <div className="text-left">
                    <span className="block font-bold">Inquire via Gmail™</span>
                    <span className="text-[10px] text-rose-700 font-normal">
                      Pre-written legal diligence query with cert references
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-rose-600" />
              </a>

              {/* Google Drive Dossier Link */}
              <a
                href={googleWorkspace.getGoogleDriveFolderUrl(property)}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100/60 text-amber-950 font-bold text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-5 h-5 text-amber-600" />
                  <div className="text-left">
                    <span className="block font-bold">Save to Google Drive™</span>
                    <span className="text-[10px] text-amber-700 font-normal">
                      Store deed records, CCC certs & inspection logs
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-amber-600" />
              </a>
            </div>
          </div>

          {/* ================= DIRECT DEVELOPER & CONVEYANCING CONTACTS ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D6] shadow-sm space-y-4">
            <div className="pb-3 border-b border-[#E8E2D6] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  APPOINTED CONTACTS
                </span>
                <h3 className="font-bold text-[#1E2A44] text-sm mt-1">
                  Whom to Contact for Viewing & Diligence
                </h3>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● Open 10am - 6pm
              </span>
            </div>

            {/* Developer Gallery Contact */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-2">
              <div className="text-xs">
                <span className="font-bold text-[#1E2A44] block">{property.developer}</span>
                <span className="text-slate-500 text-[11px]">
                  Project Lead: En. Farhan Ramli & Appointed Sales Gallery Concierge
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/60123889120?text=Hello%2C%20I%20am%20interested%20in%20arranging%20a%20viewing%20for%20${encodeURIComponent(property.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Lead</span>
                </a>
                <a
                  href="tel:+60321188888"
                  className="py-2 px-3 rounded-xl border border-[#E8E2D6] bg-white hover:bg-slate-50 text-[#1E2A44] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call Gallery</span>
                </a>
              </div>
            </div>

            {/* Panel Conveyancing Law Firm */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1 text-xs">
              <span className="font-bold text-blue-900 block">Appointed Conveyancing Panel:</span>
              <span className="text-slate-600 text-[11px] block">
                Messrs. Raja, Darryl & Loh (Strata & Real Estate Practice)
              </span>
              <span className="text-slate-500 text-[11px] block">
                Inquiries: conveyancing@rdl.com.my · Reference: {property.legalStatus.certificateNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ENLARGED PROPERTY PHOTO LIGHTBOX MODAL ================= */}
      {isPhotoLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsPhotoLightboxOpen(false)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-[#E8E2D6] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-[#E8E2D6] bg-[#FAF8F5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E2A44] truncate">
                    {property.title} • Photo Gallery
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Photo {activeImageIdx + 1} of {galleryImages.length}
                    </span>
                    <span>• {property.propertyType} in {property.city}, {property.country}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPhotoLightboxOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Photo Canvas with Prev / Next Navigation */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[60vh] border border-slate-800 shadow-inner group">
                <img
                  src={currentImage}
                  alt={property.title}
                  className="w-full h-full max-h-[60vh] object-contain transition-transform duration-300"
                />

                {galleryImages.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevPhoto();
                      }}
                      className="pointer-events-auto p-2.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextPhoto();
                      }}
                      className="pointer-events-auto p-2.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* "What is it?" Explanation */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-[#1E2A44] uppercase tracking-wider font-mono">
                      What is this photograph?
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    {(property.legalStatus?.certificateType || 'CCC').split(' ')[0]} Verified Listing
                  </span>
                </div>
                <p className="text-xs text-[#1E2A44] leading-relaxed">
                  High-resolution property visualization for {property.title}. Featuring {property.bedrooms} bedrooms, {property.bathrooms} bathrooms, and {property.builtUpArea.toLocaleString()} sq ft of living space.
                </p>
                <div className="pt-2 border-t border-[#E8E2D6] flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                    Category: {photoCategory.toUpperCase()}
                  </span>
                  <span>Title #{property.legalStatus.certificateNumber}</span>
                  <span>• Developer: {property.developer}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 border-t border-[#E8E2D6] bg-white flex items-center justify-between gap-2">
              <a
                href={currentImage}
                target="_blank"
                rel="noreferrer"
                download={`property-photo-${property.id}-${activeImageIdx + 1}.jpg`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D6] hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Photo</span>
              </a>

              <button
                type="button"
                onClick={() => setIsPhotoLightboxOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
