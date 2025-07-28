# Firebase Setup Instructions

## Security Notice
The `google-services.json` file contains sensitive API keys and has been removed from the repository for security reasons.

## Setup Instructions

### 1. Download Your Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `minihabittracker-b304c`
3. Go to Project Settings (gear icon)
4. In the "Your apps" section, find your Android app
5. Click "Download google-services.json"

### 2. Install the Configuration File
1. Copy the downloaded `google-services.json` file
2. Place it in: `android/app/google-services.json`
3. Make sure the file is NOT committed to git (it's in .gitignore)

### 3. Verify Configuration
The file should contain:
- `project_id`: Your Firebase project ID
- `package_name`: `com.minihabittracker`
- API keys and client IDs for authentication

### 4. Alternative: Use Template
If you need to recreate the file, use `android/app/google-services.json.template` as a starting point and replace the placeholder values with your actual Firebase configuration.

## Security Best Practices
- ✅ `google-services.json` is in .gitignore
- ✅ File removed from git history
- ✅ Template provided for setup
- ✅ API keys are project-specific and restricted

## Required for:
- Firebase Authentication (Google Sign-In)
- Firestore Database
- Firebase Analytics (optional)
- Cloud Messaging (if enabled)

## Important Notes
- Each environment (dev/staging/prod) should have its own Firebase project
- API keys in `google-services.json` are safe for client-side use when properly configured
- Firebase security rules protect your data, not the config file
- For production apps, use Firebase App Check for additional security