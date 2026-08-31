#!/usr/bin/env node

import os from 'os';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PLATFORM = process.platform;
const ARCH = process.arch;

function detectGPU() {
  console.log('🔍 Detecting GPU and system capabilities...');
  console.log(`Platform: ${PLATFORM}`);
  console.log(`Architecture: ${ARCH}`);
  console.log(`CPU Count: ${os.cpus().length}`);
  console.log(`Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB\n`);

  let gpuType = 'cpu';
  let gpuMemory = 0;
  let cudaVersion = null;
  let metalSupported = false;
  let rocmVersion = null;

  try {
    if (PLATFORM === 'darwin') {
      // macOS - Check for Metal (Apple Silicon)
      console.log('📱 Detected macOS');
      metalSupported = true;

      try {
        const sysctl = execSync(
          'sysctl -a | grep -i gpu || echo "no gpu"',
          { encoding: 'utf8' }
        );
        console.log('Metal GPU Support: ✅ YES');
        console.log('GPU Framework: Metal (Apple Native)');

        // Check if Apple Silicon
        const cpuBrand = execSync('sysctl -n machdep.cpu.brand_string', {
          encoding: 'utf8',
        }).trim();
        if (cpuBrand.includes('Apple')) {
          console.log(`✨ Apple Silicon detected: ${cpuBrand}`);
          gpuType = 'metal';
        }
      } catch (e) {
        console.log('Metal GPU Support: ⚠️  Manual check needed');
      }
    } else if (PLATFORM === 'linux') {
      console.log('🐧 Detected Linux');

      // Check for CUDA
      try {
        const nvidiaSmi = execSync('nvidia-smi --version', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        gpuType = 'cuda';
        const cudaMatch = nvidiaSmi.match(/CUDA Version: ([\d.]+)/);
        if (cudaMatch) cudaVersion = cudaMatch[1];
        console.log(`NVIDIA GPU: ✅ YES`);
        console.log(`CUDA Version: ${cudaVersion}`);

        try {
          const gpuInfo = execSync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader', {
            encoding: 'utf8',
          });
          console.log(`GPU Info: ${gpuInfo.trim()}`);
        } catch (e) {
          // Ignore
        }
      } catch (e) {
        // Check for ROCm (AMD)
        try {
          const rocmSmi = execSync('rocm-smi', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          gpuType = 'rocm';
          console.log(`AMD GPU (ROCm): ✅ YES`);
          console.log(`ROCm Info:\n${rocmSmi}`);
        } catch (rocmError) {
          console.log('🔴 No GPU detected. Will use CPU (slower)');
        }
      }
    } else if (PLATFORM === 'win32') {
      console.log('🪟 Detected Windows');

      // Check for NVIDIA CUDA
      try {
        const nvidiaSmi = execSync(
          'where nvidia-smi',
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] },
          (err, stdout) => stdout
        );
        if (nvidiaSmi) {
          gpuType = 'cuda';
          console.log('NVIDIA GPU: ✅ YES');
        }
      } catch (e) {
        console.log('No NVIDIA GPU detected.');
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
    cpuCount: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    metalSupported,
    cudaVersion,
    rocmVersion,
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

  return config;
}

detectGPU();
