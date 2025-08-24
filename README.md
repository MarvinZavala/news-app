# News App

Mobile news application developed with React Native and Expo.

## Technologies used

- React Native
- Expo SDK 53
- TypeScript
- React Navigation
- AsyncStorage

## Project structure

```
src/
  ├── assets/           # Images, icons and fonts
  ├── components/       # Reusable components
  │   ├── common/       # Basic UI components (Button, Input, etc.)
  │   └── layouts/      # Layout components
  ├── context/          # React contexts (AuthContext, etc.)
  ├── hooks/            # Custom hooks
  ├── navigation/       # React Navigation setup
  ├── screens/          # Application screens
  │   ├── Auth/         # Authentication screens
  │   ├── Home/         # Main screens
  │   └── Onboarding/   # Onboarding screens
  ├── services/         # Services (API, etc.)
  ├── utils/            # Utilities and helpers
  ├── constants/        # Application constants
  ├── styles/           # Global styles
  └── types/            # TypeScript types
```

## Implemented screens

- **Onboarding**: Introduction to the application for new users
- **Login**: User authentication
- **Home**: Main screen with news list

## Requirements

- Node.js >= 16
- Expo CLI
- iOS Simulator/Android Emulator or physical device

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the application: `npm start`

## Development

- `npm run ios`: Start the application in iOS simulator
- `npm run android`: Start the application in Android emulator
- `npm run web`: Start the application in web browser
