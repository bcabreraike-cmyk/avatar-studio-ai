#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const MODELS_PATH = process.env.MODELS_PATH || './models';

const MODELS = [
  {
    name: 'duix-avatar',
    description: 'Hyperrealistic avatar generation',
    size: '2.1 GB',
    url: 'https://github.com/duixcom/Duix-Avatar',
  },
  {
    name: 'stable-diffusion-xl',
    description: 'Scene generation from text',
    size: '6.9 GB',
    note: 'Run locally with diffusers library',
  },
  {
    name: 'wav2lip',
    description: 'Lip-sync from audio',
    size: '500 MB',
    url: 'https://github.com/Rudrabha/Wav2Lip',
  },
  {
    name: 'yolov8',
    description: 'Object detection for measurements',
    size: '50 MB',
  },
  {
    name: 'coqui-tts',
    description: 'Local text-to-speech',
    size: '300 MB',
  },
];

function setupModels() {
  console.log('\n📦 AvatarStudio AI - Model Setup\n');

  if (!fs.existsSync(MODELS_PATH)) {
    fs.mkdirSync(MODELS_PATH, { recursive: true });
    console.log(`✅ Created models directory: ${MODELS_PATH}\n`);
  }

  console.log('📋 Available Models to Download:\n');
  MODELS.forEach((model, i) => {
    console.log(`${i + 1}. ${model.name}`);
    console.log(`   Description: ${model.description}`);
    console.log(`   Size: ${model.size}`);
    if (model.url) console.log(`   Source: ${model.url}`);
    if (model.note) console.log(`   Note: ${model.note}`);
    console.log();
  });

  console.log('⚠️  Total size: ~10 GB (requires good internet & disk space)');
  console.log('\n📌 Quick Start (Minimal Setup):');
  console.log('   pnpm run setup:models -- --minimal');
  console.log('\n📌 Full Setup:');
  console.log('   pnpm run setup:models -- --full');
  console.log('\n📌 Manual Setup:');
  console.log('   Each model can be downloaded individually from the links above.');
  console.log('   Place them in the ./models directory.\n');
}

setupModels();
