# Mini Habit Tracker

A simple and effective React Native app for tracking daily mini-habits with customizable completion levels.

## Features

✓ **Custom Habit Creation** - Define your habits with personalized completion levels  
✓ **Daily Tracking** - Easy 3-level completion system (e.g., Basic, Good, Excellent)  
✓ **Progress Summaries** - View your progress weekly, monthly, yearly, and total  
✓ **Streak Tracking** - Monitor current and longest streaks  
✓ **Google Authentication** - Sync data across devices or continue as guest  
✓ **Local Storage** - Data persists even offline

## Screenshots

_Screenshots will be added after first build_

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- React Native development environment setup
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd MiniHabitTracker
```

2. Install dependencies:
```bash
npm install
```

3. For iOS (macOS only):
```bash
cd ios && pod install && cd ..
```

### Configuration

#### Google Sign-In Setup (Optional)

To enable Google authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sign-In API
4. Create credentials (OAuth 2.0 client ID)
5. Replace `YOUR_WEB_CLIENT_ID` in `src/services/auth.ts` with your actual web client ID

#### Android Setup

1. Add your SHA-1 fingerprint to Google Console
2. Download `google-services.json` and place in `android/app/`

#### iOS Setup

1. Download `GoogleService-Info.plist` and add to iOS project
2. Add URL scheme to `Info.plist`

### Running the App

#### Start Metro Bundler
```bash
npm start
```

#### Run on Android
```bash
npm run android
```

#### Run on iOS
```bash
npm run ios
```

## Usage

1. **First Launch**: Sign in with Google or continue as guest
2. **Create Habit**: Tap "+ New" to create your first habit with custom levels
3. **Daily Tracking**: Tap completion levels to log your daily progress
4. **View Progress**: Check "Summary" tab for detailed analytics

### Example Habit Setup

**Habit**: Reading Books  
**Levels**:
- Basic: Read 2 pages
- Good: Read 30 pages  
- Excellent: Read 60+ pages

## App Architecture

```
src/
├── components/          # React Native components
│   ├── HabitSetup.tsx  # Habit creation form
│   ├── HabitTracker.tsx # Daily tracking interface
│   ├── HabitSummary.tsx # Analytics and summaries
│   └── LoginScreen.tsx  # Authentication screen
├── services/           # Business logic
│   ├── auth.ts        # Google authentication
│   └── storage.ts     # Local data persistence
└── types/             # TypeScript definitions
    └── index.ts       # Data models
```

## Data Models

### Habit
- **id**: Unique identifier
- **name**: Habit name
- **description**: Optional description
- **levels**: Array of completion levels
- **createdAt**: Creation timestamp

### HabitLevel
- **id**: Unique identifier
- **name**: Level name (e.g., "Basic")
- **description**: What this level means
- **value**: Numeric value for analytics

### HabitEntry
- **id**: Unique identifier
- **habitId**: Reference to habit
- **date**: Date in YYYY-MM-DD format
- **levelId**: Which level was completed
- **timestamp**: Exact completion time

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Dark mode support
- [ ] Habit editing and deletion
- [ ] Export data to CSV
- [ ] Habit categories and tags
- [ ] Notification reminders
- [ ] Multiple habits support
- [ ] Cloud sync improvements
- [ ] iOS app release

## Troubleshooting

### Common Issues

**Build Errors**:
- Ensure all dependencies are installed
- Clear Metro cache: `npx react-native start --reset-cache`
- Clean build: `cd android && ./gradlew clean && cd ..`

**Google Sign-In Issues**:
- Verify SHA-1 fingerprint in Google Console
- Check `google-services.json` is in correct location
- Ensure OAuth client ID is correctly configured

## Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Provide logs and device information

---

Built with ❤️ using React Native