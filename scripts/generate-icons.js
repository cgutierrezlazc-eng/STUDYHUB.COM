#!/usr/bin/env node
/**
 * Generate App Icons and Splash Screens for Conniku
 * Uses Node.js canvas-free approach with SVG templates
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Conniku Logo SVG (Sage Serenity Design) ────────────────
const makeIconSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1A3A7A"/>
      <stop offset="100%" style="stop-color:#2D62C8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  <circle cx="256" cy="220" r="80" fill="none" stroke="#fff" stroke-width="14"/>
  <path d="M256 300 C180 300 140 350 140 400 L372 400 C372 350 332 300 256 300Z" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
  <circle cx="340" cy="180" r="50" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="10"/>
  <path d="M340 230 C290 230 265 260 260 300" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="10" stroke-linecap="round"/>
  <text x="256" y="470" font-family="Inter, -apple-system, Helvetica, sans-serif" font-size="60" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing="-2">conniku</text>
</svg>`;

const makeForegroundSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <circle cx="256" cy="200" r="70" fill="none" stroke="#fff" stroke-width="14"/>
  <path d="M256 270 C190 270 155 315 155 360 L357 360 C357 315 322 270 256 270Z" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
  <circle cx="330" cy="165" r="44" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="10"/>
  <path d="M330 209 C286 209 264 238 260 270" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="10" stroke-linecap="round"/>
  <text x="256" y="440" font-family="Inter, -apple-system, Helvetica, sans-serif" font-size="52" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing="-2">conniku</text>
</svg>`;

const makeSplashSVG = (w, h) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#151B1E"/>
  <g transform="translate(${w/2}, ${h/2 - 40})">
    <rect x="-44" y="-44" width="88" height="88" rx="20" fill="#1A3A7A"/>
    <circle cx="0" cy="-8" r="18" fill="none" stroke="#fff" stroke-width="3.5"/>
    <path d="M0 10 C-18 10 -26 22 -26 34 L26 34 C26 22 18 10 0 10Z" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
  </g>
  <text x="${w/2}" y="${h/2 + 70}" font-family="Inter, -apple-system, Helvetica, sans-serif" font-size="36" font-weight="800" fill="#F5F7F8" text-anchor="middle" letter-spacing="-1">
    conn<tspan fill="#2D62C8">iku</tspan>
  </text>
  <text x="${w/2}" y="${h/2 + 100}" font-family="Inter, -apple-system, Helvetica, sans-serif" font-size="14" fill="rgba(245,247,248,0.5)" text-anchor="middle">
    Donde los estudiantes se conectan
  </text>
</svg>`;

// ─── Android Icon Sizes ─────────────────────────────────────
const androidIcons = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// ─── Android Splash Sizes ───────────────────────────────────
const androidSplashPortrait = [
  { dir: 'drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
];

const androidSplashLandscape = [
  { dir: 'drawable-land-mdpi', w: 480, h: 320 },
  { dir: 'drawable-land-hdpi', w: 800, h: 480 },
  { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
  { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
];

// ─── iOS Icon Sizes ─────────────────────────────────────────
const iosIcons = [
  { name: 'AppIcon-20x20@1x.png', size: 20 },
  { name: 'AppIcon-20x20@2x.png', size: 40 },
  { name: 'AppIcon-20x20@3x.png', size: 60 },
  { name: 'AppIcon-29x29@1x.png', size: 29 },
  { name: 'AppIcon-29x29@2x.png', size: 58 },
  { name: 'AppIcon-29x29@3x.png', size: 87 },
  { name: 'AppIcon-40x40@1x.png', size: 40 },
  { name: 'AppIcon-40x40@2x.png', size: 80 },
  { name: 'AppIcon-40x40@3x.png', size: 120 },
  { name: 'AppIcon-60x60@2x.png', size: 120 },
  { name: 'AppIcon-60x60@3x.png', size: 180 },
  { name: 'AppIcon-76x76@1x.png', size: 76 },
  { name: 'AppIcon-76x76@2x.png', size: 152 },
  { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
  { name: 'AppIcon-512@2x.png', size: 1024 },
];

const iosSplash = [
  { name: 'splash-2732x2732.png', w: 2732, h: 2732 },
  { name: 'splash-2732x2732-1.png', w: 2732, h: 2732 },
  { name: 'splash-2732x2732-2.png', w: 2732, h: 2732 },
];

// ─── Generate Files ─────────────────────────────────────────
const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

console.log('Generating Conniku app icons and splash screens...\n');

// Android Icons (SVG files for reference)
androidIcons.forEach(({ dir, size }) => {
  const outDir = path.join(resDir, dir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'ic_launcher.svg'), makeIconSVG(size));
  fs.writeFileSync(path.join(outDir, 'ic_launcher_foreground.svg'), makeForegroundSVG(size));
  console.log(`  Android icon: ${dir} (${size}x${size})`);
});

// Android Splash Screens (SVG files)
[...androidSplashPortrait, ...androidSplashLandscape].forEach(({ dir, w, h }) => {
  const outDir = path.join(resDir, dir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'splash.svg'), makeSplashSVG(w, h));
  console.log(`  Android splash: ${dir} (${w}x${h})`);
});

// Base splash
fs.writeFileSync(path.join(resDir, 'drawable', 'splash.svg'), makeSplashSVG(480, 800));

// iOS directory
const iosIconDir = path.join(__dirname, '..', 'ios-assets', 'AppIcon.appiconset');
const iosSplashDir = path.join(__dirname, '..', 'ios-assets', 'splash');
fs.mkdirSync(iosIconDir, { recursive: true });
fs.mkdirSync(iosSplashDir, { recursive: true });

iosIcons.forEach(({ name, size }) => {
  fs.writeFileSync(path.join(iosIconDir, name.replace('.png', '.svg')), makeIconSVG(size));
  console.log(`  iOS icon: ${name} (${size}x${size})`);
});

// iOS Contents.json
const contentsJson = {
  images: iosIcons.map(({ name, size }) => {
    const match = name.match(/(\d+(?:\.\d+)?)x\1@(\d+)x/)
    const baseSize = match ? match[1] : size
    const scale = match ? match[2] : '1'
    return {
      filename: name,
      idiom: size <= 87 ? 'iphone' : size <= 167 ? 'ipad' : 'ios-marketing',
      scale: `${scale}x`,
      size: `${baseSize}x${baseSize}`,
    }
  }),
  info: { author: 'conniku', version: 1 },
};
fs.writeFileSync(path.join(iosIconDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));

iosSplash.forEach(({ name, w, h }) => {
  fs.writeFileSync(path.join(iosSplashDir, name.replace('.png', '.svg')), makeSplashSVG(w, h));
  console.log(`  iOS splash: ${name} (${w}x${h})`);
});

console.log('\nSVG assets generated successfully!');
console.log('\nTo convert to PNG, use one of these tools:');
console.log('  - macOS: rsvg-convert (brew install librsvg)');
console.log('  - Or use: npx @nickvdberge/svg-to-png');
console.log('  - Or use Android Studio / Xcode to import SVGs directly');
console.log('\nFor production, run:');
console.log('  npm run mobile:android   # Build + open Android Studio');
console.log('  npm run mobile:ios       # Build + open Xcode');
