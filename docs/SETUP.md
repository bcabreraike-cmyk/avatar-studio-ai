# Setup Guide - AvatarStudio AI

Complete setup instructions for your MacBook Pro M-series with Apple Silicon.

## Prerequisites

### System Requirements
- **macOS**: 12.0+ (Monterey or later)
- **Processor**: Apple M1/M2/M3/M4 (A18 Pro supported)
- **RAM**: 16GB minimum (32GB recommended)
- **Storage**: 100GB+ free space (for models and outputs)
- **Internet**: Good connection for model downloads

### Software Requirements
- **Node.js**: 24.0.0+
- **pnpm**: 11.22.0+
- **Python**: 3.10+ (for AI models)
- **Homebrew**: For dependency management

## Step 1: Install Required Tools

### 1.1 Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1.2 Install Python 3.10+
```bash
brew install python@3.11
brew link python@3.11
python3 --version  # Should show 3.11.x
```

### 1.3 Install Node.js 24+
```bash
brew install node
node --version  # Should show v24.x.x
npm install -g pnpm@11.22.0
pnpm --version  # Should show 11.22.0
```

## Step 2: Clone Repository

```bash
git clone https://github.com/bcabreraike-cmyk/avatar-studio-ai
cd avatar-studio-ai
```

## Step 3: Detect GPU & System Configuration

This is critical for optimal performance on your M-series Mac:

```bash
pnpm run setup:gpu
```

This will:
- ✅ Detect Metal GPU support
- ✅ Verify Apple Silicon architecture
- ✅ Calculate optimal worker threads
- ✅ Determine safe memory limits
- ✅ Generate `config/system-config.json`

**Expected output for M-series Mac:**
```
🔍 Detecting GPU and system capabilities...
Platform: darwin
Architecture: arm64
CPU Count: 8 (or 10, 12 depending on M variant)
Total Memory: 16.00 GB (or more)

📱 Detected macOS
Metal GPU Support: ✅ YES
GPU Framework: Metal (Apple Native)
✨ Apple Silicon detected: Apple M3 Pro (or your variant)

✅ GPU Detection Complete!
📋 Recommended Configuration:
   GPU Type: METAL
   Workers: 4
   Max Memory: 11 GB
   Batch Size: 2
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

**Time estimate**: 3-5 minutes

## Step 5: Download AI Models

This is the largest step (~10GB download):

```bash
pnpm run setup:models
```

You'll see all available models. Choose one of:

### Option A: Quick Start (Minimal)
```bash
pnpm run setup:models -- --minimal
```
Downloads only essential models (~3GB):
- duix-avatar (avatar generation)
- yolov8 (object detection)

### Option B: Full Setup
```bash
pnpm run setup:models -- --full
```
Downloads all models (~10GB):
- duix-avatar
- stable-diffusion-xl
- wav2lip
- yolov8
- coqui-tts

### Option C: Manual Download
Download models manually from:
1. [Duix-Avatar](https://github.com/duixcom/Duix-Avatar)
2. [Stable Diffusion XL](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0)
3. [Wav2Lip](https://github.com/Rudrabha/Wav2Lip)
4. [YOLOv8](https://github.com/ultralytics/yolov8)
5. [Coqui TTS](https://github.com/coqui-ai/TTS)

Place them in `./models/` directory.

## Step 6: Configure Environment

```bash
cp .env.example .env
```

For your M-series Mac, the defaults should work. If you want to customize:

```bash
# .env
PLATFORM=macos
GPU_TYPE=metal
MAX_MEMORY_MB=11000  # 11GB safe limit for 16GB Mac
MAX_WORKERS=4        # Half of your CPU cores
BATCH_SIZE=2
BACKEND_PORT=3000
FRONTEND_PORT=3001
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

Output should look like:
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

Open `http://localhost:3001` in your browser.

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

### Example 3: Replicate Object
```bash
curl -X POST http://localhost:3000/api/object/replicate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/furniture.jpg",
    "objectType": "furniture"
  }'
```

### Example 4: Generate Marketing Video
```bash
curl -X POST http://localhost:3000/api/content/marketing \
  -H "Content-Type: application/json" \
  -d '{
    "productImage": "https://example.com/product.jpg",
    "platform": "tiktok",
    "style": "professional"
  }'
```

## Troubleshooting

### Metal GPU Not Detected
```bash
# Re-run detection
pnpm run setup:gpu

# Update macOS to latest version
softwareupdate -l
softwareupdate -i -a

# Restart Mac
```

### Out of Memory Errors
```bash
# Reduce max memory in .env
MAX_MEMORY_MB=8000

# Or reduce batch size
BATCH_SIZE=1
```

### Slow Performance
1. Close other applications
2. Enable high-performance mode: System Preferences → Battery → High Performance
3. Check GPU usage: `Activity Monitor` → GPU tab (should be >70%)
4. Ensure no thermal throttling: Check fan speed with `istats`

### Port Already in Use
```bash
# Use different ports
BACKEND_PORT=3001 FRONTEND_PORT=3002 pnpm run dev
```

### Models Not Downloading
```bash
# Manually download and extract to ./models/
# Check disk space: df -h
# Check internet connection
# Try again: pnpm run setup:models
```

## Performance Optimization for M-series

### For 16GB MacBook Pro:
```bash
MAX_MEMORY_MB=11000
MAX_WORKERS=4
BATCH_SIZE=2
USE_CPU_FALLBACK=true
```

### For 24GB MacBook Pro:
```bash
MAX_MEMORY_MB=16000
MAX_WORKERS=6
BATCH_SIZE=3
USE_CPU_FALLBACK=true
```

### For 32GB+ MacBook Pro:
```bash
MAX_MEMORY_MB=24000
MAX_WORKERS=8
BATCH_SIZE=4
USE_CPU_FALLBACK=false
```

## Expected Performance (M3 Pro)

| Task | Time |
|------|------|
| Avatar Generation | 25-40 seconds |
| Scene Rendering | 45-60 seconds |
| Video Export (15s) | 2-3 minutes |
| Full Workflow | 5-7 minutes |

## Build for Production

```bash
pnpm run build
```

Creates optimized bundles in `dist/` directories.

## Docker Deployment

```bash
# Build Docker image
pnpm run docker:build

# Run with Docker Compose
pnpm run docker:dev
```

## Next Steps

1. **Explore the UI**: http://localhost:3001
2. **Read API docs**: http://localhost:3000/api/docs
3. **Check system**: http://localhost:3000/health
4. **Create your first project**
5. **Generate content**
6. **Monitor learning**: `docs/LEARNING.md`

## Support

- 📚 Documentation: `docs/`
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Email: support@avatarstudio.ai

---

**🎉 You're ready to create amazing content locally on your M-series Mac!**

Happy creating! 🚀
