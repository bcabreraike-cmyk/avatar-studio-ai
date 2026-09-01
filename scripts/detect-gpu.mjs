#!/usr/bin/env node

import os from 'os';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PLATFORM = process.platform;
const ARCH = process.arch;

function execute(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      ...options,
    }).trim();
  } catch (e) {
    return null;
  }
}

function detectGPU() {
  console.log('🔍 Detecting GPU and system capabilities...');
  console.log(`Platform: ${PLATFORM}`);
  console.log(`Architecture: ${ARCH}`);
  console.log(`CPU Count: ${os.cpus().length}`);
  console.log(`Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB\n`);

  let gpuType = 'cpu';
  let gpuMemory = 0;
  let gpuName = null;
  let cudaVersion = null;
  let metalSupported = false;
  let rocmVersion = null;

  try {
    if (PLATFORM === 'darwin') {
      // macOS - Check for Metal (Apple Silicon)
      console.log('📱 Detected macOS');
      metalSupported = true;

      try {
        const sysctl = execute('sysctl -a | grep -i gpu || echo "no gpu"');
        console.log('Metal GPU Support: ✅ YES');
        console.log('GPU Framework: Metal (Apple Native)');

        // Check if Apple Silicon
        const cpuBrand = execute('sysctl -n machdep.cpu.brand_string');
        if (cpuBrand && cpuBrand.includes('Apple')) {
          console.log(`✨ Apple Silicon detected: ${cpuBrand}`);
          gpuName = cpuBrand;
          gpuType = 'metal';
        }
      } catch (e) {
        console.log('Metal GPU Support: ⚠️  Manual check needed');
      }
    } else if (PLATFORM === 'linux') {
      console.log('🐧 Detected Linux');

      // Check for CUDA
      let cudaFound = false;
      try {
        const nvidiaSmi = execute('nvidia-smi --version');
        if (nvidiaSmi) {
          gpuType = 'cuda';
          cudaFound = true;
          const cudaMatch = nvidiaSmi.match(/CUDA Version: ([\d.]+)/);
          if (cudaMatch) cudaVersion = cudaMatch[1];
          console.log(`NVIDIA GPU: ✅ YES`);
          console.log(`CUDA Version: ${cudaVersion}`);

          // Get GPU details
          const gpuInfo = execute('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader');
          if (gpuInfo) {
            console.log(`GPU Info: ${gpuInfo.trim()}`);
            gpuName = gpuInfo.split(',')[0];
            gpuMemory = parseInt(gpuInfo.split(',')[1]);
          }
        }
      } catch (e) {
        // Ignore
      }

      // Check for ROCm (AMD) if CUDA not found
      if (!cudaFound) {
        try {
          const rocmSmi = execute('rocm-smi');
          if (rocmSmi) {
            gpuType = 'rocm';
            console.log(`AMD GPU (ROCm): ✅ YES`);
            console.log(`ROCm Info:\n${rocmSmi}`);
            gpuName = 'AMD ROCm';
          }
        } catch (rocmError) {
          console.log('🔴 No GPU detected. Will use CPU (slower)');
        }
      }
    } else if (PLATFORM === 'win32') {
      console.log('🪟 Detected Windows');

      // Check for NVIDIA CUDA on Windows
      try {
        // Try to find nvidia-smi
        const nvidiaSmiPath = execute('where nvidia-smi');
        if (nvidiaSmiPath) {
          gpuType = 'cuda';
          console.log('NVIDIA GPU: ✅ YES');

          // Get CUDA version
          const nvidiaSmi = execute('nvidia-smi --version');
          if (nvidiaSmi) {
            const cudaMatch = nvidiaSmi.match(/CUDA Version: ([\d.]+)/);
            if (cudaMatch) cudaVersion = cudaMatch[1];
            console.log(`CUDA Version: ${cudaVersion}`);
          }

          // Get GPU details
          const gpuInfo = execute('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader');
          if (gpuInfo) {
            const parts = gpuInfo.split(',');
            gpuName = parts[0];
            const memoryStr = parts[1].trim();
            gpuMemory = parseInt(memoryStr.split(' ')[0]);
            console.log(`GPU: ${gpuName}`);
            console.log(`VRAM: ${memoryStr}`);
          }
        }
      } catch (e) {
        console.log('❌ NVIDIA GPU not detected');
        console.log('   To use NVIDIA GPU:');
        console.log('   1. Install NVIDIA drivers from https://www.nvidia.com/Download/driverDetails.aspx');
        console.log('   2. Install CUDA Toolkit from https://developer.nvidia.com/cuda-downloads');
        console.log('   3. Restart your computer');
        console.log('   Otherwise, will use CPU (much slower)');
      }
    }
  } catch (error) {
    console.error('Error detecting GPU:', error.message);
  }

  // Generate config
  const config = {
    platform: PLATFORM,
    arch: ARCH,
    gpuType,
    gpuName: gpuName || 'N/A',
    gpuMemory: gpuMemory > 0 ? `${gpuMemory} MB` : 'N/A',
    cpuCount: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    metalSupported,
    cudaVersion: cudaVersion || 'N/A',
    rocmVersion: rocmVersion || 'N/A',
    timestamp: new Date().toISOString(),
  };

  // Write to file
  const configDir = path.join('.', 'config');
  const configPath = path.join(configDir, 'system-config.json');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log('\n✅ GPU Detection Complete!');
  console.log(`Config saved to: ${configPath}\n`);
  console.log('📋 Recommended Configuration:');
  console.log(`   GPU Type: ${gpuType.toUpperCase()}`);
  console.log(`   Workers: ${Math.floor(os.cpus().length / 2)}`);
  console.log(`   Max Memory: ${Math.floor(os.totalmem() / 1024 / 1024 / 1024 * 0.7)} GB`);
  console.log(`   Batch Size: ${gpuType === 'cpu' ? 1 : 2}`);

  if (gpuType === 'cpu') {
    console.log('\n⚠️  WARNING: No GPU detected!');
    console.log('   Processing will be very slow. Consider:');
    if (PLATFORM === 'win32') {
      console.log('   - Installing NVIDIA drivers & CUDA Toolkit');
    } else if (PLATFORM === 'linux') {
      console.log('   - Installing NVIDIA drivers & CUDA, or AMD drivers & ROCm');
    } else if (PLATFORM === 'darwin') {
      console.log('   - Using a Mac with Apple Silicon (M1/M2/M3/M4)');
    }
  }

  console.log('');
  return config;
}

detectGPU();
