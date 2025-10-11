# ClearSkin-AI

A React Native mobile application for skin analysis using AI, built with Expo.

## 🚀 Features

- **AI-Powered Skin Analysis**: Upload photos for comprehensive skin analysis
- **Authentication**: Secure user authentication with Supabase
- **Scan History**: Track your skin health over time
- **Heatmap Visualizations**: View detailed skin condition heatmaps
- **Multiple Scan Angles**: Front, left, and right face scanning
- **Real-time Analysis**: Get instant feedback on skin conditions

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **UI**: NativeWind (TailwindCSS for React Native)
- **Backend**: Supabase (Auth, Database, Storage)
- **Navigation**: Expo Router
- **Icons**: Lucide React Native
- **Testing**: Jest, React Native Testing Library

## 🛠️ Installation

### Prerequisites

- Node.js (v18 or v20)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ClearSkin-AI.git
   cd ClearSkin-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on a device or emulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 🧪 Testing

This project has comprehensive test coverage with unit tests for all components and utilities.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

The project maintains **80% code coverage** across:
- Unit tests for all utility functions
- Component tests for UI elements
- Integration tests for authentication flows

For detailed testing information, see [TESTING.md](./TESTING.md).

## 🔄 CI/CD

The project uses GitHub Actions for continuous integration with the following pipelines:

- **Test Suite**: Runs all tests with coverage reporting
- **TypeScript Linting**: Checks code quality with ESLint
- **Type Checking**: Validates TypeScript types
- **Expo Doctor**: Checks project health

For detailed CI/CD information, see [CI_CD.md](./CI_CD.md).

## 📦 Scripts

```bash
# Development
npm start              # Start Expo development server
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run web           # Run in web browser

# Testing
npm test              # Run tests
npm run test:watch    # Run tests in watch mode

# Code Quality
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript type checking

# Expo
npx expo-doctor       # Check project health
```

## 📁 Project Structure

```
ClearSkin-AI/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation screens
│   ├── auth/                # Authentication screens
│   ├── scan/                # Scanning flow screens
│   └── index.tsx            # App entry point
├── components/              # Reusable components
│   ├── HeatmapOverlay.tsx
│   ├── HeatmapLegend.tsx
│   └── __tests__/          # Component tests
├── src/
│   ├── ctx/                # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/                # Utility functions
│   │   ├── scan.ts
│   │   ├── supabase.ts
│   │   └── __tests__/     # Utility tests
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── jest.config.js          # Jest configuration
├── jest.setup.js           # Jest setup file
├── .eslintrc.js           # ESLint configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🎨 Styling

The project uses **NativeWind** for styling, which brings Tailwind CSS utility classes to React Native:

```tsx
<View className="flex-1 bg-emerald-50 p-4">
  <Text className="text-2xl font-bold text-gray-900">
    Hello World
  </Text>
</View>
```

## 🔐 Authentication

Authentication is handled through Supabase Auth:

- Email/Password authentication
- Persistent sessions
- Automatic token refresh
- Protected routes with `AuthContext`

## 🗄️ Database

The app uses Supabase for backend services:

- **scan_sessions**: Stores scan data and results
- **Storage**: Stores uploaded images
- **Edge Functions**: Image analysis and URL signing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Quality Standards

- Maintain test coverage above 80%
- Follow TypeScript strict mode
- Use ESLint rules
- Write meaningful commit messages
- Document new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - React Native framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [NativeWind](https://www.nativewind.dev/) - TailwindCSS for React Native
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) - Testing utilities

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## 🔗 Links

- [Testing Documentation](./TESTING.md)
- [CI/CD Documentation](./CI_CD.md)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)

