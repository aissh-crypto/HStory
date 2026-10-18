import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Ensure public directory exists
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create the SVG version of HomeStory Logo Icon
const svgContent = `<svg viewBox="0 0 120 120" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg-grad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#1E2A44" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>

    <!-- Radiant Gold Roofline Gradient -->
    <linearGradient id="gold-roof" x1="20" y1="20" x2="100" y2="60" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="30%" stop-color="#F59E0B" />
      <stop offset="75%" stop-color="#D97706" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>

    <!-- Story Pages Aurora Glow -->
    <linearGradient id="page-grad" x1="30" y1="40" x2="90" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>

    <!-- Vivid Cyan-to-Rose Diligence Line Gradient -->
    <linearGradient id="accent-line" x1="35" y1="50" x2="85" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#EC4899" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>

    <!-- Soft Glow Filter -->
    <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#F59E0B" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Squircle Emblem Container -->
  <rect width="120" height="120" rx="34" fill="url(#bg-grad)" />
  <rect x="2" y="2" width="116" height="116" rx="32" stroke="#F59E0B" stroke-width="3" stroke-opacity="0.45" />

  <!-- Outer Architectural Roofline Gable (Forms the upper sheltering canopy) -->
  <path
    d="M60 22 L20 48 L25 54 L60 31 L95 54 L100 48 Z"
    fill="url(#gold-roof)"
    filter="url(#soft-glow)"
  />

  <!-- Lower Roof Eave Highlights -->
  <path
    d="M25 54 L60 31 L95 54 L91 58 L60 37 L29 58 Z"
    fill="#FBBF24"
    opacity="0.9"
  />

  <!-- Open Book Dossier Wings (Story Foundation) -->
  <!-- Left Page -->
  <path
    d="M28 56 C38 52, 50 51, 58 44 V88 C50 94, 38 95, 28 99 Z"
    fill="url(#page-grad)"
  />
  <!-- Right Page -->
  <path
    d="M92 56 C82 52, 70 51, 62 44 V88 C70 94, 82 95, 92 99 Z"
    fill="url(#page-grad)"
  />

  <!-- Central Book Spine / Pillar -->
  <path
    d="M58 44 C59 43.5, 61 43.5, 62 44 V88 C61 88.5, 59 88.5, 58 88 Z"
    fill="#D97706"
  />

  <!-- Left Page Legal Diligence Text Lines -->
  <line x1="35" y1="64" x2="52" y2="59" stroke="url(#accent-line)" stroke-width="3.5" stroke-linecap="round" />
  <line x1="35" y1="74" x2="52" y2="69" stroke="url(#accent-line)" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.8" />
  <line x1="35" y1="84" x2="48" y2="79" stroke="url(#accent-line)" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.5" />

  <!-- Right Page Legal Diligence Text Lines -->
  <line x1="85" y1="64" x2="68" y2="59" stroke="url(#accent-line)" stroke-width="3.5" stroke-linecap="round" />
  <line x1="85" y1="74" x2="68" y2="69" stroke="url(#accent-line)" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.8" />
  <line x1="85" y1="84" x2="72" y2="79" stroke="url(#accent-line)" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.5" />

  <!-- Central Foundation Ribbon Accent -->
  <circle cx="60" cy="88" r="4" fill="#F59E0B" />
  <circle cx="60" cy="31" r="3" fill="#FDE68A" />
</svg>`;

// Write SVG to public
fs.writeFileSync(path.join(publicDir, 'HomeStory-Logo-Icon.svg'), svgContent, 'utf-8');

// 2. Pure Node.js PNG Generator
// Creates a valid 128x128 RGBA PNG using zlib
function generateLogoPNG(width, height) {
  // Color palette
  // Background navy: 15, 23, 42 (0x0F, 0x17, 0x2A)
  // Gold: 245, 158, 11 (0xF5, 0x9E, 0x0B)
  // White: 255, 255, 255
  // Indigo: 30, 58, 138 (0x1E, 0x3A, 0x8A)
  // Pink/Rose: 236, 72, 153 (0xEC, 0x48, 0x99)

  const scanlines = [];
  const radius = 32;

  for (let y = 0; y < height; y++) {
    // 1 filter byte (0 = None) + RGBA pixels
    const line = Buffer.alloc(1 + width * 4);
    line[0] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const idx = 1 + x * 4;

      // Check rounded rect squircle
      let insideSquircle = true;
      const cornerR = radius;
      if (x < cornerR && y < cornerR) {
        if (Math.hypot(x - cornerR, y - cornerR) > cornerR) insideSquircle = false;
      } else if (x > width - cornerR && y < cornerR) {
        if (Math.hypot(x - (width - cornerR), y - cornerR) > cornerR) insideSquircle = false;
      } else if (x < cornerR && y > height - cornerR) {
        if (Math.hypot(x - cornerR, y - (height - cornerR)) > cornerR) insideSquircle = false;
      } else if (x > width - cornerR && y > height - cornerR) {
        if (Math.hypot(x - (width - cornerR), y - (height - cornerR)) > cornerR) insideSquircle = false;
      }

      if (!insideSquircle) {
        // Transparent
        line[idx] = 0;
        line[idx + 1] = 0;
        line[idx + 2] = 0;
        line[idx + 3] = 0;
        continue;
      }

      // Default background: gradient navy
      const t = (x + y) / (width + height);
      let r = Math.round(15 + t * 15);
      let g = Math.round(23 + t * 25);
      let b = Math.round(42 + t * 70);
      let a = 255;

      // Border: 2px gold
      const distFromEdge = Math.min(x, width - 1 - x, y, height - 1 - y);
      if (distFromEdge <= 2) {
        r = 245; g = 158; b = 11; a = 180;
      }

      // Centered Roofline Gable: apex at (64, 26)
      // Roof slope: |x - 64|
      const dx = Math.abs(x - 64);
      const roofY = 26 + dx * 0.7; // Gable line
      if (y >= roofY - 5 && y <= roofY + 6 && dx <= 46) {
        // Gold Roof
        r = 245; g = 170; b = 30; a = 255;
      }

      // Open Book Pages: between y = 52 and y = 100, dx <= 42
      if (y >= 52 && y <= 98 && dx >= 2 && dx <= 42) {
        // Book page body
        r = 255; g = 255; b = 255; a = 255;

        // Accent Diligence Lines on pages
        const isLine1 = (y >= 64 && y <= 67 && dx >= 10 && dx <= 32);
        const isLine2 = (y >= 75 && y <= 78 && dx >= 10 && dx <= 32);
        const isLine3 = (y >= 86 && y <= 89 && dx >= 10 && dx <= 26);
        if (isLine1 || isLine2 || isLine3) {
          if (x < 64) {
            // Left page: Violet/Indigo
            r = 99; g = 102; b = 241;
          } else {
            // Right page: Magenta/Rose
            r = 236; g = 72; b = 153;
          }
        }
      }

      // Central Spine: dx <= 2, y between 48 and 98
      if (dx <= 2 && y >= 46 && y <= 98) {
        r = 217; g = 119; b = 6; a = 255;
      }

      // Center gold emblem dot at bottom
      if (Math.hypot(x - 64, y - 98) <= 4) {
        r = 245; g = 158; b = 11; a = 255;
      }

      line[idx] = r;
      line[idx + 1] = g;
      line[idx + 2] = b;
      line[idx + 3] = a;
    }

    scanlines.push(line);
  }

  const rawData = Buffer.concat(scanlines);
  const compressed = zlib.deflateSync(rawData);

  // Build PNG chunks
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);

    // Simple CRC32 implementation
    let crc = 0 ^ -1;
    for (let i = 0; i < toCrc.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ toCrc[i]) & 0xFF];
    }
    crcBuf.writeInt32BE(crc ^ -1, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Precompute CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace: None
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pngBuffer = generateLogoPNG(128, 128);
fs.writeFileSync(path.join(publicDir, 'HomeStory-Logo-Icon.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);

console.log('Successfully generated public/HomeStory-Logo-Icon.png, public/HomeStory-Logo-Icon.svg, and public/logo.png');
