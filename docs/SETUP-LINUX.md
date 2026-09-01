# Setup Guide - AvatarStudio AI for Linux

Complete setup instructions for Linux with NVIDIA CUDA or AMD ROCm GPU support.

## Prerequisites

### System Requirements
- **Linux**: Ubuntu 20.04+, CentOS 8+, or other distributions
- **Processor**: Intel/AMD with 6+ cores (performance cores)
- **RAM**: 16GB minimum (32GB recommended)
- **Storage**: 100GB+ free space (for models and outputs)
- **Internet**: Good connection for model downloads
- **GPU** (Optional but recommended):
  - NVIDIA GTX/RTX series with CUDA support (recommended)
  - AMD RDNA2/RDNA3 series with ROCm support
  - At least 6GB VRAM (8GB+ recommended)

### Software Requirements
- **Node.js**: 24.0.0+
- **pnpm**: 11.22.0+
- **Python**: 3.10+ (for AI models)
- **Build essentials**: gcc, g++, make
- **NVIDIA CUDA Toolkit**: 12.0+ (if using NVIDIA GPU)
- **cuDNN**: 8.x+ (if using NVIDIA GPU)
- **AMD ROCm**: 5.7+ (if using AMD GPU)

## Step 1: Install Required Tools

### 1.1 Update System Packages

```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade -y
sudo apt install -y build-essential git curl wget

# CentOS/RHEL
sudo yum groupinstall -y "Development Tools"
sudo yum install -y git curl wget
```

### 1.2 Install Python 3.10+ (Required for AI models)

```bash
# Ubuntu/Debian
sudo apt install -y python3.11 python3.11-dev python3-pip
python3.11 --version

# CentOS/RHEL
sudo yum install -y python3.11 python3.11-devel
python3.11 --version
```

### 1.3 Install Node.js 24+ and pnpm

```bash
# Using NodeSource Repository (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Or using NVM (recommended for version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24

# Install pnpm
npm install -g pnpm@11.22.0

# Verify installation
node --version  # Should show v24.x.x
npm --version
pnpm --version  # Should show 11.22.0
```

### 1.4 Install Git

```bash
# Ubuntu/Debian
sudo apt install -y git

# CentOS/RHEL
sudo yum install -y git

# Verify
git --version
```

## Step 2: Clone Repository

```bash
# Clone and navigate to repo
git clone https://github.com/bcabreraike-cmyk/avatar-studio-ai
cd avatar-studio-ai
```

## Step 3: Detect GPU & System Configuration

This is critical for optimal performance:

```bash
pnpm run setup:gpu
```

### Expected output for Linux with NVIDIA GPU:

```
🔍 Detecting GPU and system capabilities...
Platform: linux
Architecture: x64
CPU Count: 12 (or your core count)
Total Memory: 32.00 GB (or more)

🐧 Detected Linux
NVIDIA GPU: ✅ YES
CUDA Version: 12.4
GPU: NVIDIA RTX 3080
VRAM: 10240 MB

✅ GPU Detection Complete!
📋 Recommended Configuration:
   GPU Type: CUDA
   Workers: 6
   Max Memory: 22 GB
   Batch Size: 2
```

### Expected output for Linux with AMD GPU:

```
🔍 Detecting GPU and system capabilities...
Platform: linux
Architecture: x64
CPU Count: 16
Total Memory: 64.00 GB

🐧 Detected Linux
AMD GPU (ROCm): ✅ YES
ROCm Info: ...

✅ GPU Detection Complete!
📋 Recommended Configuration:
   GPU Type: ROCM
   Workers: 8
   Max Memory: 44 GB
   Batch Size: 3
```

### If NVIDIA GPU NOT detected:

**Option 1: Verify NVIDIA drivers**
```bash
# Check if drivers are installed
nvidia-smi

# If not found, install NVIDIA drivers
# Ubuntu/Debian:
sudo apt install -y nvidia-driver-545  # Adjust version as needed
sudo reboot

# Then verify
nvidia-smi
```

**Option 2: Install CUDA Toolkit**
```bash
# Download from: https://developer.nvidia.com/cuda-downloads
# Select: Linux → x86_64 → Ubuntu/CentOS → your version

# Ubuntu example:
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt update
sudo apt install cuda-toolkit-12-4

# Add to PATH
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# Verify
nvcc --version
```

**Option 3: Install cuDNN**
```bash
# Download from: https://developer.nvidia.com/cudnn
# (Requires NVIDIA account)

# Extract and copy to CUDA directory
tar -xzvf cudnn-linux-x86_64-8.x.x.x_cuda12-archive.tar.xz
sudo cp cudnn-linux-x86_64-8.x.x.x_cuda12-archive/include/cudnn*.h /usr/local/cuda/include/
sudo cp cudnn-linux-x86_64-8.x.x.x_cuda12-archive/lib/libcudnn* /usr/local/cuda/lib64/
sudo chmod a+r /usr/local/cuda/include/cudnn*.h /usr/local/cuda/lib64/libcudnn*
```

**Option 4: For AMD GPU - Install ROCm**
```bash
# Ubuntu example:
wget -q -O - https://repo.radeon.com/rocm/rocm.gpg.key | sudo apt-key add -
echo 'deb [arch=amd64] https://repo.radeon.com/rocm/apt/debian/ jammy main' | sudo tee /etc/apt/sources.list.d/rocm.sources
sudo apt update
sudo apt install -y rocm-dkms rocm-libs rocm-dev

# Add to PATH
echo 'export PATH=$PATH:/opt/rocm/bin' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/rocm/lib' >> ~/.bashrc
source ~/.bashrc

# Verify
rocm-smi
```

## Step 4: Install Dependencies

```bash
pnpm install
```

This installs all workspace dependencies for:
- Backend (Express)
- Frontend (React)
- Orchestrator (AI engine)
- Shared types

**Time estimate**: 5-10 minutes (first install may be slower)

**If you get errors about native modules:**
```bash
# Make sure build-essential is installed
sudo apt install -y build-essential

# Then try again
pnpm install --no-frozen-lockfile
```

## Step 5: Download AI Models

This is the largest step (~10GB download):

```bash
pnpm run setup:models
```

You'll see all available models. Choose one of:

### Option A: Quick Start (Minimal) - Recommended for first time
```bash
pnpm run setup:models -- --minimal
```
Downloads only essential models (~3GB):
- duix-avatar (avatar generation)
- yolov8 (object detection)

**Time**: ~30 minutes on good internet

### Option B: Full Setup
```bash
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

Place them in `./models/` directory (create if doesn't exist).

## Step 6: Configure Environment

```bash
cp .env.example .env
```

For Linux with NVIDIA GPU, edit `.env`:

```bash
# .env

# Platform configuration (auto-detected)
PLATFORM=linux
GPU_TYPE=cuda

# NVIDIA/CUDA Settings
CUDA_VISIBLE_DEVICES=0  # 0 = first GPU, or "0,1" for multiple GPUs
CUDA_HOME=/usr/local/cuda

# Memory Management (adjust based on your system)
# For 32GB RAM + 10GB VRAM:
MAX_MEMORY_MB=22000    # 22GB safe limit
MAX_WORKERS=6          # Half of CPU cores
BATCH_SIZE=2

# For 64GB RAM + 24GB VRAM:
MAX_MEMORY_MB=44000
MAX_WORKERS=8
BATCH_SIZE=4

# For 128GB RAM + 48GB VRAM:
MAX_MEMORY_MB=96000
MAX_WORKERS=16
BATCH_SIZE=8

# Server Configuration
BACKEND_PORT=3000
FRONTEND_PORT=3001

# Optional: Performance tuning
USE_CPU_FALLBACK=true  # Use CPU if GPU runs out of memory
ENABLE_GPU_MEMORY_CACHE=true
PYTORCH_CUDA_MEMORY_FRACTION=0.9  # Use 90% of GPU VRAM

# For AMD ROCm:
# GPU_TYPE=rocm
# HIP_VISIBLE_DEVICES=0
```

## Step 7: Start Development Environment

### Option 1: Full Stack (Recommended)
```bash
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
```bash
pnpm run dev:backend
```

### Option 3: Frontend Only
```bash
pnpm run dev:frontend
```

## Step 8: First Run - Create Your First Content

Open `http://localhost:3001` in your browser or use the API:

### Example 1: Generate Avatar
```bash
curl -X POST http://localhost:3000/api/avatar/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/photo.jpg",
    "style": "professional"
  }'
```

### Example 2: Generate Scene
```bash
curl -X POST http://localhost:3000/api/scene/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Modern living room with contemporary furniture",
    "style": "photorealistic",
    "quality": "high"
  }'
```

### Example 3: Check System Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-01T00:00:00.000Z",
  "platform": "linux",
  "gpu": "cuda"
}
```

## Troubleshooting

### NVIDIA GPU Not Detected

```bash
# 1. Check if drivers are installed
nvidia-smi

# If command not found, install drivers:
# Ubuntu:
sudo apt install -y nvidia-driver-545

# CentOS:
sudo yum install -y nvidia-driver-latest-dkms

# Then restart:
sudo reboot

# 2. Check if CUDA Toolkit is installed
nvcc --version

# 3. Check if CUDA is in PATH
echo $CUDA_HOME
echo $PATH

# 4. Re-run detection
pnpm run setup:gpu
```

### AMD ROCm GPU Not Detected

```bash
# 1. Check if ROCm is installed
rocm-smi

# 2. Install ROCm if missing
wget -q -O - https://repo.radeon.com/rocm/rocm.gpg.key | sudo apt-key add -
sudo apt update
sudo apt install -y rocm-dkms

# 3. Add to PATH
echo 'export PATH=$PATH:/opt/rocm/bin' >> ~/.bashrc
source ~/.bashrc

# 4. Verify
rocm-smi
```

### "Command not found: pnpm"

```bash
# Install pnpm globally
npm install -g pnpm@11.22.0

# Or use npm directly
npx pnpm install
```

### Out of Memory Errors

```bash
# Reduce max memory in .env
MAX_MEMORY_MB=16000

# Or reduce batch size
BATCH_SIZE=1

# Or reduce workers
MAX_WORKERS=2

# Restart backend
pnpm run dev:backend
```

### Slow Performance / GPU Not Being Used

```bash
# Check GPU usage
nvidia-smi  # Watch GPU% - should be >80% if GPU is being used

# Or for AMD:
rocm-smi

# If CPU is high but GPU is low, increase GPU memory:
PYTORCH_CUDA_MEMORY_FRACTION=0.95
pnpm run dev:backend

# Monitor in real-time
watch -n 1 nvidia-smi  # Updates every 1 second
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different ports
BACKEND_PORT=3001 FRONTEND_PORT=3002 pnpm run dev
```

### Models Not Downloading

```bash
# Check disk space
df -h

# Check internet connection
ping google.com

# Try downloading again
pnpm run setup:models -- --minimal

# If still fails, increase timeout
DOWNLOAD_TIMEOUT=300000 pnpm run setup:models -- --minimal
```

### Permission Issues

```bash
# If you get permission errors on model directories
sudo chown -R $USER:$USER ./models
chmod -R 755 ./models
```

## Performance Optimization for Linux

### For RTX 3060 (12GB VRAM) + 32GB RAM:
```bash
MAX_MEMORY_MB=22000
MAX_WORKERS=6
BATCH_SIZE=2
PYTORCH_CUDA_MEMORY_FRACTION=0.85
```

### For RTX 3080 (10GB VRAM) + 32GB RAM:
```bash
MAX_MEMORY_MB=22000
MAX_WORKERS=8
BATCH_SIZE=3
PYTORCH_CUDA_MEMORY_FRACTION=0.9
```

### For RTX 4090 (24GB VRAM) + 64GB RAM:
```bash
MAX_MEMORY_MB=44000
MAX_WORKERS=12
BATCH_SIZE=4
PYTORCH_CUDA_MEMORY_FRACTION=0.95
```

### For MI300X (192GB VRAM) + 512GB RAM:
```bash
GPU_TYPE=rocm
MAX_MEMORY_MB=384000
MAX_WORKERS=32
BATCH_SIZE=8
```

## Expected Performance

Performance varies significantly by GPU:

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

### AMD MI300X (192GB VRAM):
| Task | Time |
|------|------|
| Avatar Generation | 5-8 seconds |
| Scene Rendering | 10-15 seconds |
| Video Export (15s) | 20-30 seconds |
| Full Workflow | 1-2 minutes |

### CPU Only (No GPU):
| Task | Time |
|------|------|
| Avatar Generation | 120-180 seconds |
| Scene Rendering | 240-360 seconds |
| Video Export (15s) | 10-15 minutes |
| Full Workflow | 30-45 minutes |

## Build for Production

```bash
pnpm run build
```

Creates optimized bundles in `dist/` directories for all packages.

## Docker Deployment (Optional)

```bash
# Build Docker image
pnpm run docker:build

# Run with Docker Compose
pnpm run docker:dev

# With GPU support (NVIDIA):
docker run --gpus all -p 3000:3000 -p 3001:3001 avatar-studio-ai
```

## Useful Linux Commands

### Monitor GPU Usage in Real-Time
```bash
# NVIDIA
watch -n 1 nvidia-smi

# AMD
watch -n 1 rocm-smi

# Both with better formatting
gpu-monitor() {
  while true; do
    clear
    echo "=== GPU Status ===" 
    nvidia-smi || rocm-smi
    sleep 2
  done
}
```

### Check System Resources
```bash
# CPU usage
top -b -n 1 | head -n 15

# Memory usage
free -h

# Disk space
df -h

# System info
uname -a
lsb_release -a
```

### Kill Backend Process
```bash
# Find Node.js processes
ps aux | grep node

# Kill specific process
kill -9 <PID>

# Or kill all Node processes
killall node
```

## Next Steps

1. **Explore the UI**: http://localhost:3001
2. **Read API docs**: http://localhost:3000/api/docs
3. **Check system**: http://localhost:3000/health
4. **Create your first project**
5. **Generate content**
6. **Monitor GPU usage**: `watch -n 1 nvidia-smi`

## Support

- 📚 **Documentation**: `docs/SETUP.md`, `docs/SETUP-WINDOWS.md`, `docs/QUICK-START.md`
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 🐧 **Linux-specific**: Ask in Issues with `[Linux]` tag

---

## Comparison: Linux vs macOS vs Windows

| Feature | Linux (NVIDIA/AMD) | Windows (NVIDIA) | macOS (Metal) |
|---------|------------------|-----------------|--------------|
| GPU Support | CUDA / ROCm | CUDA | Metal (Apple) |
| Setup Complexity | Medium | Medium | Low |
| Installation Time | 30-60 min | 30-60 min | 15-30 min |
| Model Download | 30 min - 2 hours | 30 min - 2 hours | 30 min - 2 hours |
| Performance | Excellent | Excellent | Good |
| Cost | GPU dependent | GPU dependent | Included |
| Multi-GPU Support | ✅ Yes | ✅ Yes | ⚠️ Limited |
| Docker Support | ✅ Yes | ⚠️ WSL 2 needed | ✅ Yes |
| Server Deployment | ✅ Best option | ⚠️ Possible | ⚠️ Limited |

---

**🎉 You're ready to create amazing content on Linux!**

Happy creating! 🚀

---

**Made with ❤️ for creators on Linux**
