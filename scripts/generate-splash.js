#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PROJECT_ROOT = path.join(__dirname, '..');

const createSplashSVG = (w, h) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#151B1E"/>
  <g transform="translate(${w/2}, ${h/2 - 50})">
    <!-- Logo mark: rounded square -->
    <rect x="-50" y="-50" width="100" height="100" rx="22" fill="#1A3A7A"/>
    <!-- Person icon -->
    <circle cx="-5" cy="-12" r="16" fill="none" stroke="#fff" stroke-width="3.5"/>
    <path d="M-5 4 C-20 4 -28 16 -28 28 L18 28 C18 16 10 4 -5 4Z" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="16" cy="-16" r="10" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.5"/>
    <path d="M16 -6 C7 -6 3 0 2 6" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <!-- Brand name -->
  <text x="${w/2}" y="${h/2 + 60}" font-family="Inter, -apple-system, Helvetica, Arial, sans-serif" font-size="38" font-weight="800" fill="#F5F7F8" text-anchor="middle" letter-spacing="-1.5">conniku</text>
  <text x="${w/2}" y="${h/2 + 88}" font-family="Inter, -apple-system, Helvetica, Arial, sans-serif" font-size="13" fill="rgba(245,247,248,0.4)" text-anchor="middle" letter-spacing="0.5">Donde los estudiantes se conectan</text>
</svg>`;

const splashSizes = [
  // Android Portrait
  { dir: 'android/app/src/main/res/drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'android/app/src/main/res/drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'android/app/src/main/res/drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'android/app/src/main/res/drawable-port-xxhdpi', w: 960, h: 1600 },
  { dir: 'android/app/src/main/res/drawable-port-xxxhdpi', w: 1280, h: 1920 },
  // Android Landscape
  { dir: 'android/app/src/main/res/drawable-land-mdpi', w: 480, h: 320 },
  { dir: 'android/app/src/main/res/drawable-land-hdpi', w: 800, h: 480 },
  { dir: 'android/app/src/main/res/drawable-land-xhdpi', w: 1280, h: 720 },
  { dir: 'android/app/src/main/res/drawable-land-xxhdpi', w: 1600, h: 960 },
  { dir: 'android/app/src/main/res/drawable-land-xxxhdpi', w: 1920, h: 1280 },
  // Base
  { dir: 'android/app/src/main/res/drawable', w: 480, h: 800, name: 'splash.png' },
];

async function main() {
  console.log('🎨 Generating splash screens...\n');

  for (const { dir, w, h, name } of splashSizes) {
    const outDir = path.join(PROJECT_ROOT, dir);
    fs.mkdirSync(outDir, { recursive: true });

    const svg = Buffer.from(createSplashSVG(w, h));
    const fileName = name || 'splash.png';
    await sharp(svg).resize(w, h).png().toFile(path.join(outDir, fileName));
    console.log(`  ✅ ${dir}/${fileName} (${w}x${h})`);
  }

  // iOS splash
  const iosSplashDir = path.join(PROJECT_ROOT, 'ios-assets', 'splash');
  fs.mkdirSync(iosSplashDir, { recursive: true });

  const iosSizes = [
    { name: 'Default@2x~universal~anyany.png', w: 2732, h: 2732 },
    { name: 'Default-Portrait@2x.png', w: 1242, h: 2208 },
    { name: 'Default-Landscape@2x.png', w: 2208, h: 1242 },
  ];

  for (const { name: fileName, w, h } of iosSizes) {
    const svg = Buffer.from(createSplashSVG(w, h));
    await sharp(svg).resize(w, h).png().toFile(path.join(iosSplashDir, fileName));
    console.log(`  ✅ ios-assets/splash/${fileName} (${w}x${h})`);
  }

  console.log('\n🎉 All splash screens generated!\n');
}

main().catch(console.error);
