const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const iconsDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Base SVG: A shield guardian with an emerald pulse and glowing security motif
function getSvg(isMaskable = false) {
  // Maskable icons need more padding (safe area is central 80%)
  const scale = isMaskable ? 0.65 : 0.85;
  const translate = isMaskable ? 89.6 : 38.4; // (512 * (1 - scale)) / 2

  return `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="shieldGrad" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="#6366f1" />
        <stop offset="50%" stop-color="#4f46e5" />
        <stop offset="100%" stop-color="#3730a3" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="100%" stop-color="#10b981" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="16" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="512" height="512" rx="${isMaskable ? 0 : 112}" fill="url(#bgGrad)" />

    <!-- Subtle radar / shield rings -->
    <circle cx="256" cy="256" r="220" stroke="#6366f1" stroke-opacity="0.12" stroke-width="2" />
    <circle cx="256" cy="256" r="170" stroke="#6366f1" stroke-opacity="0.16" stroke-width="2" stroke-dasharray="8 8" />

    <!-- Scaled Guardian Content -->
    <g transform="translate(${translate}, ${translate}) scale(${scale})">
      <!-- Shield Outer Shape with Glow -->
      <path
        d="M256 40C164 40 76 80 76 80V248C76 360 160 442 256 472C352 442 436 360 436 248V80C436 80 348 40 256 40Z"
        fill="url(#shieldGrad)"
        filter="url(#shadow)"
      />

      <!-- Shield Inner Border Highlight -->
      <path
        d="M256 62C180 62 104 96 104 96V246C104 340 176 414 256 442C336 414 408 340 408 246V96C408 96 332 62 256 62Z"
        stroke="#818cf8"
        stroke-width="6"
        stroke-opacity="0.6"
        fill="none"
      />

      <!-- Secure Eye / Radar Core -->
      <circle cx="256" cy="220" r="64" fill="#0f172a" fill-opacity="0.5" />

      <!-- Emerald Checkmark of Verification -->
      <path
        d="M210 220L242 252L304 186"
        stroke="url(#accentGrad)"
        stroke-width="24"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#glow)"
      />

      <!-- Vigilance Beacon / Radar Dot -->
      <circle cx="256" cy="326" r="10" fill="#34d399" filter="url(#glow)" />
      <circle cx="256" cy="326" r="22" stroke="#34d399" stroke-opacity="0.4" stroke-width="4" />
    </g>
  </svg>`;
}

async function run() {
  const standardSvg = Buffer.from(getSvg(false));
  const maskableSvg = Buffer.from(getSvg(true));

  const targets = [
    { name: "icon-192x192.png", size: 192, svg: standardSvg },
    { name: "icon-512x512.png", size: 512, svg: standardSvg },
    { name: "icon-maskable-192x192.png", size: 192, svg: maskableSvg },
    { name: "icon-maskable-512x512.png", size: 512, svg: maskableSvg },
    { name: "apple-touch-icon.png", size: 180, svg: standardSvg },
    { name: "favicon-32x32.png", size: 32, svg: standardSvg },
    { name: "favicon-16x16.png", size: 16, svg: standardSvg },
  ];

  for (const item of targets) {
    const dest = path.join(iconsDir, item.name);
    await sharp(item.svg).resize(item.size, item.size).png().toFile(dest);
    console.log(`Generated: ${item.name} (${item.size}x${item.size})`);
  }

  // Also save standard SVG to public/icons/icon.svg
  fs.writeFileSync(path.join(iconsDir, "icon.svg"), getSvg(false));
  console.log("Generated: icon.svg");
}

run().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
