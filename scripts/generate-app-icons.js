#!/usr/bin/env node
/**
 * Conniku — App Icon Generator
 * Generates proper PNG icons for Android and iOS using SVG + sharp/canvas
 *
 * Usage: node scripts/generate-app-icons.js
 * Requires: npm install -g sharp (or: npm install sharp --save-dev)
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp, fallback to SVG-only approach
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.log('⚠️  sharp not found. Will generate SVG templates only.');
  console.log('   Install sharp for PNG generation: npm install sharp --save-dev\n');
}

const PROJECT_ROOT = path.join(__dirname, '..');

// Conniku app icon SVG (high-quality vector)
const createIconSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A3A7A"/>
      <stop offset="100%" stop-color="#2D62C8"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- Main person (head) -->
  <circle cx="230" cy="185" r="58" fill="none" stroke="#fff" stroke-width="16"/>
  <!-- Main person (body) -->
  <path d="M230 243 C168 243 135 290 135 340 L325 340 C325 290 292 243 230 243Z" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Secondary person (head) -->
  <circle cx="330" cy="170" r="40" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="12"/>
  <!-- Secondary person (body) -->
  <path d="M330 210 C286 210 262 240 258 270" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="12" stroke-linecap="round"/>
  <!-- Connection dots -->
  <circle cx="290" cy="200" r="6" fill="rgba(255,255,255,0.4)"/>
  <circle cx="280" cy="220" r="4" fill="rgba(255,255,255,0.3)"/>
  <!-- Text: conniku -->
  <text x="256" y="420" font-family="Inter, -apple-system, Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing="-3">conniku</text>
</svg>`;

// Adaptive icon foreground (no background, centered in 108dp safe zone)
const createForegroundSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 108 108">
  <!-- Main person (head) -->
  <circle cx="46" cy="36" r="11" fill="none" stroke="#fff" stroke-width="3"/>
  <!-- Main person (body) -->
  <path d="M46 47 C34 47 28 56 28 65 L64 65 C64 56 58 47 46 47Z" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <!-- Secondary person (head) -->
  <circle cx="66" cy="33" r="7.5" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.3"/>
  <!-- Secondary person (body) -->
  <path d="M66 41 C57 41 53 47 52 52" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.3" stroke-linecap="round"/>
</svg>`;

// ─── Android Sizes ──────────────────────────────────────────
const androidIcons = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// ─── iOS Sizes ──────────────────────────────────────────────
const iosIcons = [
  { name: 'icon-20.png', size: 20 },
  { name: 'icon-20@2x.png', size: 40 },
  { name: 'icon-20@3x.png', size: 60 },
  { name: 'icon-29.png', size: 29 },
  { name: 'icon-29@2x.png', size: 58 },
  { name: 'icon-29@3x.png', size: 87 },
  { name: 'icon-40.png', size: 40 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-76.png', size: 76 },
  { name: 'icon-76@2x.png', size: 152 },
  { name: 'icon-83.5@2x.png', size: 167 },
  { name: 'icon-1024.png', size: 1024 },
];

async function generateIcons() {
  console.log('🎨 Generating Conniku app icons...\n');

  const resDir = path.join(PROJECT_ROOT, 'android', 'app', 'src', 'main', 'res');
  const iosDir = path.join(PROJECT_ROOT, 'ios-assets', 'AppIcon.appiconset');

  fs.mkdirSync(iosDir, { recursive: true });

  if (sharp) {
    // Generate PNG icons with sharp
    for (const { folder, size } of androidIcons) {
      const dir = path.join(resDir, folder);
      fs.mkdirSync(dir, { recursive: true });

      // Standard icon
      const iconBuffer = Buffer.from(createIconSVG(size));
      await sharp(iconBuffer).resize(size, size).png().toFile(path.join(dir, 'ic_launcher.png'));

      // Round icon (same for now)
      await sharp(iconBuffer).resize(size, size).png().toFile(path.join(dir, 'ic_launcher_round.png'));

      // Foreground for adaptive
      const fgBuffer = Buffer.from(createForegroundSVG(size));
      await sharp(fgBuffer).resize(size, size).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));

      console.log(`  ✅ Android ${folder}: ${size}x${size}px`);
    }

    // iOS icons
    for (const { name, size } of iosIcons) {
      const iconBuffer = Buffer.from(createIconSVG(size));
      await sharp(iconBuffer).resize(size, size).png().toFile(path.join(iosDir, name));
      console.log(`  ✅ iOS ${name}: ${size}x${size}px`);
    }

    console.log('\n✅ All PNG icons generated successfully!');
  } else {
    // SVG-only fallback
    for (const { folder, size } of androidIcons) {
      const dir = path.join(resDir, folder);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'ic_launcher.svg'), createIconSVG(size));
      console.log(`  📝 Android ${folder}: SVG template (${size}x${size})`);
    }

    for (const { name, size } of iosIcons) {
      fs.writeFileSync(path.join(iosDir, name.replace('.png', '.svg')), createIconSVG(size));
      console.log(`  📝 iOS ${name}: SVG template (${size}x${size})`);
    }

    console.log('\n📝 SVG templates generated. To convert to PNG:');
    console.log('   npm install sharp --save-dev');
    console.log('   node scripts/generate-app-icons.js');
  }

  // Also generate a high-res icon for Play Store (512x512)
  const playStoreDir = path.join(PROJECT_ROOT, 'store-assets');
  fs.mkdirSync(playStoreDir, { recursive: true });

  if (sharp) {
    const hiResBuffer = Buffer.from(createIconSVG(512));
    await sharp(hiResBuffer).resize(512, 512).png().toFile(path.join(playStoreDir, 'play-store-icon-512.png'));
    console.log('\n  ✅ Play Store icon: 512x512px');
  }

  fs.writeFileSync(path.join(playStoreDir, 'icon-source.svg'), createIconSVG(1024));
  console.log('  📝 Source SVG: 1024x1024 (store-assets/icon-source.svg)');

  console.log('\n🎉 Done! Icon files are ready.\n');
}

generateIcons().catch(console.error);
