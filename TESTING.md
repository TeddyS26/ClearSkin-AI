# Testing Guide for ClearSkin-AI

This document provides comprehensive information about the testing setup and best practices for the ClearSkin-AI project.

## Table of Contents

- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD Pipelines](#cicd-pipelines)
- [Troubleshooting](#troubleshooting)

## Testing Stack

The project uses the following testing tools:

- **Jest**: Testing framework
- **React Native Testing Library**: Component testing
- **Jest-Expo**: Expo-specific Jest preset
- **TypeScript**: Type-safe tests

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- src/lib/__tests__/scan.test.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="sign in"
```

## Test Coverage

The project aims for 80% code coverage across all metrics:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

Coverage reports are generated in the `coverage/` directory after running tests.

### View coverage report
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Writing Tests

### Unit Tests Structure

Tests are organized alongside the code they test:

```
src/
├── lib/
│   ├── scan.ts
│   └── __tests__/
│       └── scan.test.ts
components/
├── HeatmapOverlay.tsx
└── __tests__/
    └── HeatmapOverlay.test.tsx
```

### Example Test

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('should handle button press', async () => {
    const mockFn = jest.fn();
    const { getByText } = render(<MyComponent onPress={mockFn} />);
    
    fireEvent.press(getByText('Click me'));
    
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalled();
    });
  });
});
```

### Testing Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how it does it.
2. **Use meaningful test descriptions**: Describe what the test is checking.
3. **Arrange-Act-Assert pattern**: Structure tests clearly.
4. **Mock external dependencies**: Use Jest mocks for API calls, navigation, etc.
5. **Test edge cases**: Include tests for error states, empty data, etc.

### Mocking

Common mocks are configured in `jest.setup.js`:

- Expo Router
- Supabase client
- File System
- Image Picker
- React Native components

To mock a module in a specific test:

```typescript
jest.mock('../myModule', () => ({
  myFunction: jest.fn(),
}));
```

## CI/CD Pipelines

The project includes several GitHub Actions workflows:

### 1. Test Suite (`test.yml`)
Runs the full test suite with coverage on multiple Node.js versions.

### 2. TypeScript Linting (`lint.yml`)
Runs ESLint to check code quality and style.

### 3. Type Check (`type-check.yml`)
Runs TypeScript compiler to check for type errors.

### 4. Expo Doctor (`expo-doctor.yml`)
Runs Expo Doctor to check project health.

### 5. Complete CI Pipeline (`ci.yml`)
Runs all checks together for comprehensive validation.

### Running Pipelines Locally

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm test

# Expo doctor
npx expo-doctor
```

## Troubleshooting

### Tests fail with "Cannot find module"
- Ensure all dependencies are installed: `npm install`
- Clear Jest cache: `npx jest --clearCache`

### React Native component not rendering
- Check if the component is properly mocked in `jest.setup.js`
- Use `toJSON()` for snapshot testing

### Timeout errors
- Increase timeout for specific tests: `jest.setTimeout(10000)`
- Use `waitFor` for async operations

### Coverage not updating
- Clear coverage cache: `rm -rf coverage/`
- Run tests again: `npm test`

### Mock not working
- Ensure mock is defined before imports
- Use `jest.clearAllMocks()` in `beforeEach`

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing/)

## Contributing

When adding new features:
1. Write tests for the new code
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this document if needed

