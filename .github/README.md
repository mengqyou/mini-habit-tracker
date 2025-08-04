# GitHub Actions Workflows

This directory contains automated workflows for building and testing the Mini Habit Tracker app.

## Available Workflows

### 🚀 `build-android.yml` - Full Build Pipeline
**Triggers:** Push to main, Pull Requests, Manual
- Builds Android APK with full optimization
- Runs comprehensive tests with coverage
- Creates GitHub releases automatically
- Uploads APK as downloadable artifact

### 🛠️ `build-apk-simple.yml` - Simple APK Builder  
**Triggers:** Manual only
- Quick APK build for testing
- Choose debug or release build
- Minimal dependencies for faster builds
- Good for troubleshooting build issues

## How to Use

### Option 1: Automatic Builds (Recommended)
1. Push code to `main` branch
2. GitHub automatically builds APK
3. Download from "Actions" tab or "Releases" section

### Option 2: Manual Build
1. Go to "Actions" tab on GitHub
2. Select "Build APK (Simple)" workflow  
3. Click "Run workflow"
4. Choose build type (debug/release)
5. Download APK from artifacts

## Download Your APK

### From Actions Tab:
1. Go to repository → Actions
2. Click on latest successful build
3. Scroll down to "Artifacts" 
4. Download `mini-habit-tracker-debug.zip`
5. Extract and install `app-debug.apk`

### From Releases (Automatic builds only):
1. Go to repository → Releases
2. Download latest APK directly
3. Install on Android device

## Setup Requirements

### Repository Secrets (for full pipeline):
- `GOOGLE_SERVICES_JSON`: Your Firebase google-services.json content
- `GITHUB_TOKEN`: Automatically provided

### Manual Setup:
- No secrets required for simple builds
- Uses dummy Firebase config for building

## Build Features

✅ **Clean Build Environment**: Always starts fresh  
✅ **Optimized Dependencies**: Cached for faster builds  
✅ **Multiple Build Types**: Debug and release builds  
✅ **Automatic Versioning**: Uses build numbers  
✅ **Artifact Storage**: 30-day retention  
✅ **Cross-Platform**: Builds on Ubuntu runners  

## Troubleshooting

**Build Fails?**
- Try the simple workflow first
- Check logs in Actions tab
- Ensure all dependencies are in package.json

**APK Won't Install?**
- Enable "Install from unknown sources"
- Use debug build for testing
- Check Android version compatibility

**Missing Features in APK?**
- Ensure latest code is pushed to main
- Check that Metro bundler includes all files
- Verify Firebase config is properly set up