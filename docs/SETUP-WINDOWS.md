# Setup Guide - AvatarStudio AI for Windows

Complete setup instructions for Windows with NVIDIA CUDA GPU support.

## Prerequisites

### System Requirements
- **Windows**: Windows 10/11 (Pro or higher recommended)
- **Processor**: Intel/AMD with 6+ cores (performance cores)
- **RAM**: 16GB minimum (32GB recommended)
- **Storage**: 100GB+ free space (for models and outputs)
- **Internet**: Good connection for model downloads
- **GPU** (Optional but recommended):
  - NVIDIA GTX/RTX series with CUDA support
  - At least 6GB VRAM (8GB+ recommended)

### Software Requirements
- **Node.js**: 24.0.0+
- **pnpm**: 11.22.0+
- **Python**: 3.10+ (for AI models)
- **Visual Studio Build Tools 2022** (required for native modules)
- **NVIDIA CUDA Toolkit**: 12.0+ (if using NVIDIA GPU)
- **cuDNN**: 8.x+ (if using NVIDIA GPU)

## Step 1: Install Required Tools

### 1.1 Install Visual Studio Build Tools (Required!)

This is **critical** for compiling native Node.js modules on Windows.

```powershell
# Option A: Download installer from Microsoft
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Then run the installer and select:
# - "Desktop development with C++"
# - "C++ CMake tools for Windows"

# Option B: Install via Winget (if available)
winget install Microsoft.VisualStudio.2022.BuildTools
```

**Verify installation:**
```powershell
where cl.exe
# Should show: C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\LLVM\x64\bin\cl.exe
```

### 1.2 Install Python 3.10+ (Required for AI models)

```powershell
# Download from https://www.python.org/downloads/
# Or use Winget:
winget install Python.Python.3.11

# Verify installation
python --version  # Should show 3.11.x
pip --version
```

### 1.3 Install Node.js 24+ and pnpm

```powershell
# Option A: Using Winget
winget install OpenJS.NodeJS.LTS
npm install -g pnpm@11.22.0

# Option B: Using Chocolatey
choco install nodejs pnpm

# Verify installation
node --version  # Should show v24.x.x
npm --version
pnpm --version  # Should show 11.22.0
```

### 1.4 Install Git

```powershell
# Download from https://git-scm.com/download/win
# Or use Winget:
winget install Git.Git

# Verify installation
git --version
```

## Step 2: Clone Repository

```powershell
# Open PowerShell or Command Prompt
git clone https://github.com/bcabreraike-cmyk/avatar-studio-ai
cd avatar-studio-ai
```

## Step 3: Detect GPU & System Configuration

This is critical for optimal performance:

```powershell
pnpm run setup:gpu
```

### Expected output for Windows with NVIDIA GPU:

```
🔍 Detecting GPU and system capabilities...
Platform: win32
Architecture: x64
CPU Count: 12 (or your core count)
Total Memory: 16.00 GB (or more)

🪟 Detected Windows
NVIDIA GPU: ✅ YES
CUDA Version: 12.4
GPU Memory: 8192 MB (8.00 GB)

✅ GPU Detection Complete!
📋 Recommended Configuration:
   GPU Type: CUDA
   Workers: 6
   Max Memory: 11 GB
   Batch Size: 2
```

### If NVIDIA GPU NOT detected:

**Option 1: Verify NVIDIA drivers**
```powershell
# Check if drivers are installed
nvidia-smi

# If not found, download from:
# https://www.nvidia.com/Download/driverDetails.aspx
# Then restart Windows
```

**Option 2: Verify CUDA Toolkit installation**
```powershell
# Download CUDA Toolkit 12.0+ from:
# https://developer.nvidia.com/cuda-downloads

# Run installer and select:
# - CUDA Toolkit 12.x
# - cuDNN (if prompted)
# - Visual Studio Integration

# Then restart PowerShell and try again:
nvcc --version  # Should show CUDA version
```

**Option 3: If still no GPU, will use CPU (slower)**
```
GPU Type will default to: CPU
Performance will be 10-50x slower than GPU
```

## Step 4: Install Dependencies

```powershell
pnpm install
```

This installs all workspace dependencies for:
- Backend (Express)
- Frontend (React)
- Orchestrator (AI engine)
- Shared types

**Time estimate**: 5-10 minutes (first install may be slower)

**If you get errors about native modules:**
```powershell
# Make sure Visual Studio Build Tools are installed (Step 1.1)
# Then try again:
pnpm install --no-frozen-lockfile
```

## Step 5: Download AI Models

This is the largest step (~10GB download):

```powershell
pnpm run setup:models
```

You'll see all available models. Choose one of:

### Option A: Quick Start (Minimal) - Recommended for first time
```powershell
pnpm run setup:models -- --minimal
```
Downloads only essential models (~3GB):
- duix-avatar (avatar generation)
- yolov8 (object detection)

**Time**: ~30 minutes on good internet

### Option B: Full Setup
```powershell
pnpm run setup:models -- --full
```
Downloads all models (~10GB):
- duix-avatar
- stable-diffusion-xl (scene generation)
- wav2lip (lip-sync)
- yolov8 (object detection)
- coqui-tts (text-to-speech)

**Time**: ~2 hours on good internet
**Storage needed**: 100GB+ free space

### Option C: Manual Download
Download models manually from:
1. [Duix-Avatar](https://github.com/duixcom/Duix-Avatar)
2. [Stable Diffusion XL](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0)
3. [Wav2Lip](https://github.com/Rudrabha/Wav2Lip)
4. [YOLOv8](https://github.com/ultralytics/yolov8)
5. [Coqui TTS](https://github.com/coqui-ai/TTS)

Place them in `.\models\` directory (create if doesn't exist).

## Step 6: Configure Environment

```powershell
cp .env.example .env
```

For Windows with NVIDIA GPU, edit `.env`:

```bash
# .env

# Platform configuration (auto-detected)
PLATFORM=win32
GPU_TYPE=cuda

# NVIDIA/CUDA Settings
CUDA_VISIBLE_DEVICES=0  # 0 = first GPU, or "0,1" for multiple GPUs
CUDA_HOME=C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4

# Memory Management (adjust based on your system)
# For 16GB RAM + 8GB VRAM:
MAX_MEMORY_MB=11000    # 11GB safe limit
MAX_WORKERS=6          # Half of CPU cores
BATCH_SIZE=2

# For 32GB RAM + 24GB VRAM:
MAX_MEMORY_MB=24000
MAX_WORKERS=8
BATCH_SIZE=4

# Server Configuration
BACKEND_PORT=3000
FRONTEND_PORT=3001

# Optional: Performance tuning
USE_CPU_FALLBACK=true  # Use CPU if GPU runs out of memory
ENABLE_GPU_MEMORY_CACHE=true
PYTORCH_CUDA_MEMORY_FRACTION=0.9  # Use 90% of GPU VRAM
```

## Step 7: Start Development Environment

### Option 1: Full Stack (Recommended)
```powershell
pnpm run dev
```

This starts:
- Backend API (port 3000)
- Frontend UI (port 3001)
- Orchestrator
- All monitoring tools

Expected output:
```
✅ AvatarStudio AI Backend running at http://localhost:3000
✅ Frontend running at http://localhost:3001
🤖 Orchestrator initialized with 5 AI Agents
✅ All systems ready!
```

### Option 2: Backend Only
```powershell
pnpm run dev:backend
```

### Option 3: Frontend Only
```powershell
pnpm run dev:frontend
```

## Step 8: First Run - Create Your First Content

Open `http://localhost:3001` in your browser.

### Example 1: Generate Avatar
```powershell
curl -X POST http://localhost:3000/api/avatar/generate `
  -H "Content-Type: application/json" `
  -d '{
    "imageUrl": "https://example.com/photo.jpg",
    "style": "professional"
  }'
```

### Example 2: Generate Scene
```powershell
curl -X POST http://localhost:3000/api/scene/generate `
  -H "Content-Type: application/json" `
  -d '{
    "description": "Modern living room with contemporary furniture",
    "style": "photorealistic",
    "quality": "high"
  }'
```

### Example 3: Check System Health
```powershell
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-01T00:00:00.000Z",
  "platform": "win32",
  "gpu": "cuda"
}
```

## Troubleshooting

### NVIDIA GPU Not Detected

```powershell
# 1. Check if drivers are installed
nvidia-smi

# If command not found:
# - Download drivers: https://www.nvidia.com/Download/driverDetails.aspx
# - Install drivers
# - Restart Windows
# - Try nvidia-smi again

# 2. Check if CUDA Toolkit is installed
nvcc --version

# If not found:
# - Download CUDA from: https://developer.nvidia.com/cuda-downloads
# - Run installer
# - Restart PowerShell
# - Try nvcc --version again

# 3. Re-run detection
pnpm run setup:gpu
```

### "cl.exe not found" Error

This means Visual Studio Build Tools aren't installed.

```powershell
# Option 1: Install via Installer (Recommended)
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Run installer, select "Desktop development with C++"

# Option 2: Use PowerShell to find cl.exe
where cl.exe

# Option 3: Add to PATH manually (if found)
# C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\LLVM\x64\bin\
```

### "python not found" Error

```powershell
# Install Python
winget install Python.Python.3.11

# Restart PowerShell
# Verify
python --version
```

### Out of Memory Errors

```powershell
# Reduce max memory in .env
MAX_MEMORY_MB=8000

# Or reduce batch size
BATCH_SIZE=1

# Or reduce workers
MAX_WORKERS=2

# Restart backend
pnpm run dev:backend
```

### Slow Performance / High CPU Usage

```powershell
# Check GPU usage with NVIDIA tools
nvidia-smi  # Watch GPU% - should be >80% if GPU is being used

# Check if CPU is being used instead:
# Open Task Manager (Ctrl+Shift+Esc)
# If CPU is high but GPU is low, increase GPU usage:
PYTORCH_CUDA_MEMORY_FRACTION=0.95
pnpm run dev:backend
```

### Port Already in Use

```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F

# Or use different ports
$env:BACKEND_PORT=3001; $env:FRONTEND_PORT=3002; pnpm run dev
```

### Models Not Downloading

```powershell
# Check disk space
dir C:\  # Look at free space in C: drive

# Check internet connection
ping google.com

# Try downloading again
pnpm run setup:models -- --minimal

# If still fails, increase timeout
$env:DOWNLOAD_TIMEOUT=300000; pnpm run setup:models -- --minimal
```

### Git Clone Fails (SSL Certificate Error)

```powershell
# Temporary workaround (not recommended for production)
git config --global http.sslVerify false
git clone https://github.com/bcabreraike-cmyk/avatar-studio-ai

# Better solution: Install certificates
# https://stackoverflow.com/questions/21181231/server-certificate-verification-failed
```

## Performance Optimization for Windows

### For GTX 1660 (6GB VRAM) + 16GB RAM:
```bash
MAX_MEMORY_MB=9000
MAX_WORKERS=4
BATCH_SIZE=1
PYTORCH_CUDA_MEMORY_FRACTION=0.85
```

### For RTX 3080 (10GB VRAM) + 32GB RAM:
```bash
MAX_MEMORY_MB=20000
MAX_WORKERS=8
BATCH_SIZE=3
PYTORCH_CUDA_MEMORY_FRACTION=0.9
```

### For RTX 4090 (24GB VRAM) + 64GB RAM:
```bash
MAX_MEMORY_MB=48000
MAX_WORKERS=12
BATCH_SIZE=4
PYTORCH_CUDA_MEMORY_FRACTION=0.95
```

## Expected Performance

Performance varies significantly by GPU. Here are some examples:

### NVIDIA RTX 3080 (10GB VRAM):
| Task | Time |
|------|------|
| Avatar Generation | 15-20 seconds |
| Scene Rendering | 30-40 seconds |
| Video Export (15s) | 60-90 seconds |
| Full Workflow | 3-4 minutes |

### NVIDIA RTX 4090 (24GB VRAM):
| Task | Time |
|------|------|
| Avatar Generation | 8-12 seconds |
| Scene Rendering | 15-25 seconds |
| Video Export (15s) | 30-45 seconds |
| Full Workflow | 2-3 minutes |

### CPU Only (No GPU):
| Task | Time |
|------|------|
| Avatar Generation | 120-180 seconds |
| Scene Rendering | 240-360 seconds |
| Video Export (15s) | 10-15 minutes |
| Full Workflow | 30-45 minutes |

## Build for Production

```powershell
pnpm run build
```

Creates optimized bundles in `dist/` directories for all packages.

## Docker Deployment (Optional)

```powershell
# Build Docker image
pnpm run docker:build

# Run with Docker Compose
pnpm run docker:dev
```

**Note**: Docker on Windows requires WSL 2 (Windows Subsystem for Linux 2).

## Useful Windows Commands

### Monitor GPU Usage in Real-Time
```powershell
# Option 1: NVIDIA GPU Monitor
while ($true) { nvidia-smi; Start-Sleep -Seconds 2; Clear-Host }

# Option 2: Use Task Manager (easier)
# Ctrl+Shift+Esc → Performance → GPU
```

### Check System Resources
```powershell
# CPU Usage
Get-Counter '\Processor(_Total)\% Processor Time' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue

# Memory Usage
Get-ComputerInfo | Select-Object CsSystemMemoryTotalPhysicalMemory, CsSystemMemoryAvailablePhysicalMemory

# Disk Space
Get-Volume C | Select-Object SizeRemaining, Size
```

### Kill Backend Process
```powershell
# Find Node.js processes
Get-Process node | Format-Table

# Kill specific process
Stop-Process -Name node -Force
```

## Next Steps

1. **Explore the UI**: http://localhost:3001
2. **Read API docs**: http://localhost:3000/api/docs
3. **Check system**: http://localhost:3000/health
4. **Create your first project**
5. **Generate content**
6. **Monitor GPU usage**: Task Manager → Performance tab

## Support

- 📚 **Documentation**: `docs/SETUP.md`, `docs/SETUP-MACOS.md`, `docs/QUICK-START.md`
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 🪟 **Windows-specific**: Ask in Issues with `[Windows]` tag

---

## Comparison: Windows vs macOS

| Feature | Windows (NVIDIA) | macOS (Metal) |
|---------|-----------------|--------------|
| GPU Support | CUDA (NVIDIA) | Metal (Apple Silicon) |
| Setup Complexity | Medium (CUDA Toolkit) | Low (auto-detected) |
| Installation Time | 30-60 min | 15-30 min |
| Model Download | 30 min - 2 hours | 30 min - 2 hours |
| Performance | Excellent (modern GPU) | Good (Apple Silicon) |
| Cost | GPU dependent | Included in Mac |
| Multi-GPU Support | ✅ Yes | ⚠️ Limited |
| Docker Support | ✅ Yes (WSL 2) | ✅ Yes |

---

**🎉 You're ready to create amazing content on Windows!**

Happy creating! 🚀

---

**Made with ❤️ for creators on Windows**
