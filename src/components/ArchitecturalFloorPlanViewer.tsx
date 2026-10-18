import React, { useState } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Maximize2,
  Compass,
  FileDown,
  Info,
  Sliders,
} from 'lucide-react';
import { FloorPlanVariation, Property } from '../types';

interface ArchitecturalFloorPlanViewerProps {
  property: Property;
  variations?: FloorPlanVariation[];
}

export const ArchitecturalFloorPlanViewer: React.FC<ArchitecturalFloorPlanViewerProps> = ({
  property,
  variations,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeTheme, setActiveTheme] = useState<'blueprint' | 'monochrome'>('blueprint');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  // Fallback variations if none provided on property
  const activeVariations: FloorPlanVariation[] =
    variations && variations.length > 0
      ? variations
      : [
          {
            typeCode: 'Type A',
            name: `${property.bedrooms}-Bedroom Executive Suite`,
            builtUpSqft: property.builtUpArea,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            floorPlanImageUrl: '',
            keyFeatures: [
              'Spacious linear Living & Dining zone with cross-ventilation',
              'Deep alfresco Balcony overlooking city/greens',
              'Ensuite Master Bedroom with built-in wardrobe alcove',
              'Enclosed contemporary kitchen with dry/wet separation',
            ],
            dimensions: {
              livingDining: '6.8m × 4.2m',
              masterBedroom: '4.5m × 3.8m',
              balcony: '3.6m × 1.6m',
              kitchen: '3.2m × 2.4m',
            },
          },
          {
            typeCode: 'Type B',
            name: `${property.bedrooms + 1}-Bedroom Deluxe Family Residence`,
            builtUpSqft: Math.round(property.builtUpArea * 1.25),
            bedrooms: property.bedrooms + 1,
            bathrooms: property.bathrooms + 1,
            floorPlanImageUrl: '',
            keyFeatures: [
              'Dual-aspect corner orientation with floor-to-ceiling glazing',
              'Junior Master with dedicated ensuite bathroom',
              'Expanded dry kitchen with breakfast bar island',
              'Direct service yard and discreet AC ledge positioning',
            ],
            dimensions: {
              livingDining: '7.4m × 4.6m',
              masterBedroom: '5.0m × 4.0m',
              balcony: '4.2m × 1.8m',
              kitchen: '3.8m × 2.6m',
            },
          },
          {
            typeCode: 'Type C (Dual Key)',
            name: 'Dual-Key Multigenerational & High-Yield Layout',
            builtUpSqft: Math.round(property.builtUpArea * 1.45),
            bedrooms: property.bedrooms + 2,
            bathrooms: property.bathrooms + 1,
            floorPlanImageUrl: '',
            keyFeatures: [
              'Foyer with twin independent security access doors',
              'Independent self-contained studio unit with kitchenette',
              'Main 2/3-bedroom private family residence',
              'Maximum investment rental yield with zero shared privacy compromises',
            ],
            dimensions: {
              livingDining: '8.0m × 4.8m',
              masterBedroom: '5.2m × 4.2m',
              balcony: '4.5m × 2.0m',
              kitchen: '4.0m × 3.0m',
            },
          },
        ];

  const currentVar = activeVariations[selectedIdx] || activeVariations[0];

  const isBlueprint = activeTheme === 'blueprint';

  // SVG palette based on architectural theme
  const bgClass = isBlueprint ? 'bg-[#0E2038]' : 'bg-[#FAFAFA]';
  const wallStroke = isBlueprint ? '#60A5FA' : '#1E293B';
  const wallFill = isBlueprint ? '#1E3A5F' : '#334155';
  const roomLabelColor = isBlueprint ? '#93C5FD' : '#1E293B';
  const dimensionColor = isBlueprint ? '#F59E0B' : '#C2410C';
  const gridColor = isBlueprint ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E2D6] shadow-[0_12px_40px_rgba(30,42,68,0.06)] space-y-6">
      {/* Top Header & Unit Variation Switcher Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Layers className="w-4 h-4" />
            </span>
            <span className="font-mono text-[10px] tracking-widest text-amber-700 font-bold uppercase">
              ARCHITECTURAL DUE DILIGENCE
            </span>
          </div>
          <h3 className="font-serif font-bold text-xl text-[#1E2A44] mt-1">
            2D Architectural Floor Plan &amp; Layout Blueprint
          </h3>
          <p className="text-xs text-[#5B6478] mt-0.5">
            Cadastral room dimensions, structural walls, door arcs, and load-bearing partitions
          </p>
        </div>

        {/* Variation Buttons (Type A, Type B, Type C) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F4EFE6] border border-[#E8E2D6] overflow-x-auto no-scrollbar">
          {activeVariations.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedIdx === i
                  ? 'bg-[#1E2A44] text-white shadow-sm ring-1 ring-[#1E2A44]'
                  : 'text-[#5B6478] hover:text-[#1E2A44] hover:bg-white/60'
              }`}
            >
              {v.typeCode}
            </button>
          ))}
        </div>
      </div>

      {/* Blueprint Specification Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6]">
        <div>
          <span className="block font-mono text-[9px] text-[#5B6478] uppercase">UNIT DESIGNATION</span>
          <span className="font-serif font-bold text-sm text-[#1E2A44]">{currentVar.typeCode}</span>
        </div>
        <div>
          <span className="block font-mono text-[9px] text-[#5B6478] uppercase">GROSS BUILT-UP AREA</span>
          <span className="font-mono font-bold text-sm text-[#1E2A44]">
            {currentVar.builtUpSqft.toLocaleString()} sq ft ({Math.round(currentVar.builtUpSqft * 0.0929)} m²)
          </span>
        </div>
        <div>
          <span className="block font-mono text-[9px] text-[#5B6478] uppercase">CONFIGURATION</span>
          <span className="font-mono font-bold text-sm text-emerald-700">
            {currentVar.bedrooms} Beds • {currentVar.bathrooms} Baths
          </span>
        </div>
        <div>
          <span className="block font-mono text-[9px] text-[#5B6478] uppercase">NORTH ORIENTATION</span>
          <span className="font-mono font-bold text-sm text-amber-700 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            North-East (Morning Sun)
          </span>
        </div>
      </div>

      {/* Interactive Blueprint Canvas Viewer */}
      <div className="relative rounded-2xl overflow-hidden border border-[#CBD5E1] shadow-inner">
        {/* Canvas Toolbar overlay (Zoom, Mode, Dimensions toggle) */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          {/* Blueprint Title badge */}
          <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-mono border border-white/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SCALE: 1:100 • CAD REV 3.2</span>
          </div>

          {/* Controls: Zoom, Theme Switcher, Toggle Dimensions */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/20 text-white">
            <button
              type="button"
              onClick={() => setActiveTheme(isBlueprint ? 'monochrome' : 'blueprint')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                isBlueprint ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'
              }`}
              title="Switch Blueprint / Monochrome CAD style"
            >
              {isBlueprint ? 'BLUEPRINT' : 'MONO CAD'}
            </button>
            <button
              type="button"
              onClick={() => setShowDimensions(!showDimensions)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                showDimensions ? 'bg-amber-500 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Toggle Room Dimensions"
            >
              DIMENSIONS
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.0))}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scalable Vector CAD Architectural Blueprint Drawing */}
        <div
          className={`w-full overflow-auto p-4 sm:p-8 flex items-center justify-center min-h-[380px] sm:min-h-[440px] transition-colors duration-300 ${bgClass}`}
        >
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
            }}
            className="w-full max-w-[720px] aspect-[16/11]"
          >
            <svg
              viewBox="0 0 800 550"
              className="w-full h-full select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Architectural Grid Pattern */}
                <pattern id="archGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke={gridColor} strokeWidth="1" />
                </pattern>
                {/* Diagonal Hatch for Structural Columns */}
                <pattern id="columnHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke={isBlueprint ? '#93C5FD' : '#475569'} strokeWidth="1.5" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="800" height="550" fill="url(#archGrid)" />

              {/* Title Block on Blueprint */}
              <g transform="translate(30, 30)">
                <text x="0" y="16" fill={roomLabelColor} fontFamily="monospace" fontSize="11" fontWeight="bold" letterSpacing="1">
                  HOMESTORY CAD ENGINE • {property.title.toUpperCase()}
                </text>
                <text x="0" y="32" fill={dimensionColor} fontFamily="monospace" fontSize="10">
                  LAYOUT: {currentVar.typeCode.toUpperCase()} • BUILT-UP {currentVar.builtUpSqft} SQ FT
                </text>
              </g>

              {/* North Indicator */}
              <g transform="translate(730, 45)">
                <circle cx="0" cy="0" r="18" fill="none" stroke={roomLabelColor} strokeWidth="1.5" strokeDasharray="3,3" />
                <polygon points="0,-14 5,4 0,0 -5,4" fill={dimensionColor} />
                <text x="0" y="-18" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="11" fontWeight="bold">
                  N
                </text>
              </g>

              {/* ================= APARTMENT EXTERIOR BOUNDING WALLS ================= */}
              {/* Outer boundary wall with double stroke */}
              <rect
                x="80"
                y="70"
                width="640"
                height="410"
                fill={isBlueprint ? 'rgba(30, 58, 95, 0.4)' : '#FFFFFF'}
                stroke={wallStroke}
                strokeWidth="4"
                rx="4"
              />

              {/* ================= INTERIOR ROOM PARTITIONS ================= */}
              {/* Balcony (Top Right) */}
              <g>
                <rect x="440" y="70" width="280" height="90" fill={isBlueprint ? 'rgba(59, 130, 246, 0.15)' : '#F1F5F9'} stroke={wallStroke} strokeWidth="2" strokeDasharray="6,4" />
                {/* Balcony Glass Railing */}
                <line x1="440" y1="74" x2="720" y2="74" stroke={isBlueprint ? '#38BDF8' : '#0EA5E9'} strokeWidth="3" />
                <text x="580" y="115" textAnchor="middle" fill={roomLabelColor} fontFamily="sans-serif" fontSize="12" fontWeight="bold">
                  ALFRESCO BALCONY
                </text>
                {showDimensions && (
                  <text x="580" y="135" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="10">
                    {currentVar.dimensions?.balcony || '3.6m × 1.6m'}
                  </text>
                )}
              </g>

              {/* Living & Dining Area (Center-Right) */}
              <g>
                <rect x="360" y="160" width="360" height="210" fill="none" stroke={wallStroke} strokeWidth="2" />
                {/* Sliding Glass Door to Balcony */}
                <line x1="480" y1="160" x2="680" y2="160" stroke={isBlueprint ? '#38BDF8' : '#0284C7'} strokeWidth="4" strokeDasharray="16,6" />
                {/* Dining Table Representation */}
                <rect x="390" y="190" width="80" height="50" rx="4" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeWidth="1.5" />
                <circle cx="380" cy="215" r="5" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} />
                <circle cx="480" cy="215" r="5" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} />
                {/* Sofa & Coffee Table */}
                <rect x="520" y="240" width="160" height="35" rx="4" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeWidth="1.5" />
                <rect x="550" y="290" width="100" height="40" rx="3" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeWidth="1" strokeDasharray="3,3" />

                <text x="580" y="200" textAnchor="middle" fill={roomLabelColor} fontFamily="sans-serif" fontSize="14" fontWeight="bold">
                  LIVING &amp; DINING HALL
                </text>
                {showDimensions && (
                  <text x="580" y="222" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="11" fontWeight="bold">
                    {currentVar.dimensions?.livingDining || '6.8m × 4.2m'}
                  </text>
                )}
              </g>

              {/* Master Bedroom Suite (Left / Top-Left) */}
              <g>
                <rect x="80" y="70" width="280" height="200" fill="none" stroke={wallStroke} strokeWidth="3" />
                {/* Master Bed (King Size) */}
                <rect x="130" y="100" width="110" height="130" rx="4" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeWidth="2" />
                {/* Pillows */}
                <rect x="140" y="106" width="40" height="22" rx="3" fill="none" stroke={isBlueprint ? '#94A3B8' : '#CBD5E1'} />
                <rect x="190" y="106" width="40" height="22" rx="3" fill="none" stroke={isBlueprint ? '#94A3B8' : '#CBD5E1'} />
                {/* Bedside tables */}
                <rect x="105" y="105" width="20" height="25" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} />
                <rect x="245" y="105" width="20" height="25" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} />
                {/* Wardrobe */}
                <rect x="275" y="80" width="75" height="120" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeDasharray="6,4" />
                <text x="312" y="145" textAnchor="middle" fill={roomLabelColor} fontFamily="sans-serif" fontSize="9">
                  WALK-IN
                </text>

                <text x="185" y="180" textAnchor="middle" fill={roomLabelColor} fontFamily="sans-serif" fontSize="13" fontWeight="bold">
                  MASTER SUITE
                </text>
                {showDimensions && (
                  <text x="185" y="200" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="11" fontWeight="bold">
                    {currentVar.dimensions?.masterBedroom || '4.5m × 3.8m'}
                  </text>
                )}

                {/* Door Swing Arc */}
                <path d="M 330 270 A 30 30 0 0 1 360 240" fill="none" stroke={dimensionColor} strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="330" y1="270" x2="330" y2="240" stroke={wallStroke} strokeWidth="2" />
              </g>

              {/* Master Ensuite Bathroom (Bottom Left) */}
              <g>
                <rect x="80" y="270" width="160" height="130" fill="none" stroke={wallStroke} strokeWidth="2.5" />
                {/* Shower stall */}
                <rect x="85" y="275" width="60" height="60" fill="none" stroke={isBlueprint ? '#38BDF8' : '#0284C7'} strokeWidth="1.5" />
                <line x1="85" y1="275" x2="145" y2="335" stroke={isBlueprint ? '#38BDF8' : '#0284C7'} strokeWidth="1" strokeDasharray="3,3" />
                {/* Water Closet (WC) */}
                <ellipse cx="185" cy="305" rx="14" ry="18" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeWidth="1.5" />
                {/* Vanity basin */}
                <rect x="160" y="360" width="55" height="30" rx="3" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeWidth="1.5" />
                <ellipse cx="187" cy="375" rx="16" ry="9" fill="none" stroke={isBlueprint ? '#38BDF8' : '#0284C7'} />

                <text x="140" y="348" textAnchor="middle" fill={roomLabelColor} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
                  ENSUITE BATH
                </text>
              </g>

              {/* Bedroom 2 / Study (Bottom Center) */}
              <g>
                <rect x="240" y="270" width="160" height="130" fill="none" stroke={wallStroke} strokeWidth="2.5" />
                {/* Queen Bed */}
                <rect x="270" y="300" width="90" height="90" rx="3" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeWidth="1.5" />
                <rect x="280" y="305" width="30" height="18" rx="2" fill="none" stroke={isBlueprint ? '#94A3B8' : '#CBD5E1'} />
                <rect x="320" y="305" width="30" height="18" rx="2" fill="none" stroke={isBlueprint ? '#94A3B8' : '#CBD5E1'} />

                <text x="320" y="355" textAnchor="middle" fill={roomLabelColor} fontFamily="sans-serif" fontSize="11" fontWeight="bold">
                  BEDROOM 2
                </text>
                {showDimensions && (
                  <text x="320" y="372" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="9">
                    3.4m × 3.0m
                  </text>
                )}
              </g>

              {/* Gourmet Kitchen & Utility (Bottom Right) */}
              <g>
                <rect x="400" y="370" width="200" height="110" fill="none" stroke={wallStroke} strokeWidth="2.5" />
                {/* Countertop with Sink & Hob */}
                <rect x="405" y="375" width="190" height="35" fill="none" stroke={isBlueprint ? '#64748B' : '#94A3B8'} strokeWidth="1.5" />
                {/* Double Basin Sink */}
                <rect x="430" y="380" width="40" height="22" rx="2" fill="none" stroke={isBlueprint ? '#38BDF8' : '#0284C7'} strokeWidth="1" />
                {/* 3-Burner Induction Hob */}
                <circle cx="530" cy="392" r="8" fill="none" stroke={dimensionColor} />
                <circle cx="550" cy="392" r="8" fill="none" stroke={dimensionColor} />

                <text x="500" y="440" textAnchor="middle" fill={roomLabelColor} fontFamily="sans-serif" fontSize="12" fontWeight="bold">
                  KITCHEN &amp; YARD
                </text>
                {showDimensions && (
                  <text x="500" y="458" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="10">
                    {currentVar.dimensions?.kitchen || '3.2m × 2.4m'}
                  </text>
                )}
              </g>

              {/* Entrance Foyer & Main Door (Far Bottom Right) */}
              <g>
                <rect x="600" y="370" width="120" height="110" fill="none" stroke={wallStroke} strokeWidth="2.5" />
                {/* Main Door Opening with Swing Arc */}
                <path d="M 680 480 A 40 40 0 0 1 720 440" fill="none" stroke={dimensionColor} strokeWidth="2" strokeDasharray="3,3" />
                <line x1="680" y1="480" x2="680" y2="440" stroke={wallStroke} strokeWidth="3" />
                <polygon points="680,480 675,470 685,470" fill={dimensionColor} />

                <text x="660" y="420" textAnchor="middle" fill={roomLabelColor} fontFamily="sans-serif" fontSize="11" fontWeight="bold">
                  FOYER
                </text>
                <text x="660" y="455" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="9">
                  MAIN ENTRY
                </text>
              </g>

              {/* Structural Reinforced Columns (Filled Hatch) */}
              <rect x="76" y="66" width="16" height="16" fill="url(#columnHatch)" stroke={wallStroke} strokeWidth="1.5" />
              <rect x="356" y="66" width="16" height="16" fill="url(#columnHatch)" stroke={wallStroke} strokeWidth="1.5" />
              <rect x="712" y="66" width="16" height="16" fill="url(#columnHatch)" stroke={wallStroke} strokeWidth="1.5" />
              <rect x="76" y="266" width="16" height="16" fill="url(#columnHatch)" stroke={wallStroke} strokeWidth="1.5" />
              <rect x="712" y="366" width="16" height="16" fill="url(#columnHatch)" stroke={wallStroke} strokeWidth="1.5" />
              <rect x="76" y="472" width="16" height="16" fill="url(#columnHatch)" stroke={wallStroke} strokeWidth="1.5" />
              <rect x="712" y="472" width="16" height="16" fill="url(#columnHatch)" stroke={wallStroke} strokeWidth="1.5" />

              {/* Exterior Dimension Annotation Arrows */}
              {showDimensions && (
                <g>
                  {/* Top overall dimension line */}
                  <line x1="80" y1="50" x2="720" y2="50" stroke={dimensionColor} strokeWidth="1.5" />
                  <line x1="80" y1="45" x2="80" y2="55" stroke={dimensionColor} strokeWidth="1.5" />
                  <line x1="720" y1="45" x2="720" y2="55" stroke={dimensionColor} strokeWidth="1.5" />
                  <rect x="360" y="40" width="80" height="18" fill={isBlueprint ? '#0E2038' : '#FAFAFA'} />
                  <text x="400" y="53" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="11" fontWeight="bold">
                    12,800 mm
                  </text>

                  {/* Left overall dimension line */}
                  <line x1="55" y1="70" x2="55" y2="480" stroke={dimensionColor} strokeWidth="1.5" />
                  <line x1="50" y1="70" x2="60" y2="70" stroke={dimensionColor} strokeWidth="1.5" />
                  <line x1="50" y1="480" x2="60" y2="480" stroke={dimensionColor} strokeWidth="1.5" />
                  <rect x="38" y="265" width="34" height="20" fill={isBlueprint ? '#0E2038' : '#FAFAFA'} />
                  <text x="55" y="280" textAnchor="middle" fill={dimensionColor} fontFamily="monospace" fontSize="10" fontWeight="bold" transform="rotate(-90 55 280)">
                    8,200 mm
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Room Dimensions & Layout Highlights Grid */}
      <div className="space-y-4">
        <h4 className="font-serif font-bold text-base text-[#1E2A44] flex items-center gap-2">
          <span>Cadastral Room Dimensions</span>
          <span className="text-xs font-normal text-slate-500">• {currentVar.name}</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-[#E8E2D6] bg-[#FAF8F5]">
            <span className="block font-mono text-[9px] text-[#5B6478] uppercase">LIVING / DINING</span>
            <span className="font-mono font-bold text-sm text-[#1E2A44] mt-0.5 block">
              {currentVar.dimensions?.livingDining || '6.8m × 4.2m'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Cross-ventilated linear hall</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E8E2D6] bg-[#FAF8F5]">
            <span className="block font-mono text-[9px] text-[#5B6478] uppercase">MASTER BEDROOM</span>
            <span className="font-mono font-bold text-sm text-[#1E2A44] mt-0.5 block">
              {currentVar.dimensions?.masterBedroom || '4.5m × 3.8m'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Fits King bed + wardrobe</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E8E2D6] bg-[#FAF8F5]">
            <span className="block font-mono text-[9px] text-[#5B6478] uppercase">BALCONY VERANDAH</span>
            <span className="font-mono font-bold text-sm text-[#1E2A44] mt-0.5 block">
              {currentVar.dimensions?.balcony || '3.6m × 1.6m'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Tempered glass balustrade</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E8E2D6] bg-[#FAF8F5]">
            <span className="block font-mono text-[9px] text-[#5B6478] uppercase">KITCHEN &amp; YARD</span>
            <span className="font-mono font-bold text-sm text-[#1E2A44] mt-0.5 block">
              {currentVar.dimensions?.kitchen || '3.2m × 2.4m'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Enclosed wet/dry exhaust</span>
          </div>
        </div>

        {/* Layout Architectural Features */}
        <div className="pt-2">
          <span className="block font-mono text-[10px] text-[#5B6478] uppercase tracking-wider font-bold mb-2">
            LAYOUT HIGHLIGHTS &amp; DUE DILIGENCE AUDIT
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentVar.keyFeatures.map((feat, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 text-xs text-[#1E2A44]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
