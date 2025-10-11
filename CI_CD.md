# CI/CD Pipeline Documentation

This document describes the continuous integration and continuous deployment (CI/CD) setup for the ClearSkin-AI project.

## Overview

The project uses GitHub Actions for automated testing, linting, type checking, and project health checks. All workflows are triggered on pushes and pull requests to the `main` and `develop` branches.

## Workflows

### 1. Complete CI Pipeline (`ci.yml`)

**Purpose**: Runs all checks in a single comprehensive workflow.

**Triggers**: Push and PR to `main`, `develop`

**Steps**:
1. Checkout code
2. Setup Node.js (v20)
3. Install dependencies
4. Type checking
5. Linting (continues on error)
6. Test suite with coverage
7. Expo Doctor (continues on error)
8. Upload coverage to Codecov
9. Generate CI summary

**Use Case**: Best for comprehensive validation before merging.

### 2. Test Suite (`test.yml`)

**Purpose**: Runs the complete test suite with coverage reporting.

**Triggers**: Push and PR to `main`, `develop`

**Matrix Strategy**: Tests on Node.js v18 and v20

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run tests with coverage
5. Upload coverage to Codecov
6. Archive test results

**Environment Variables**:
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase URL (from secrets or default)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (from secrets or default)

**Artifacts**:
- Test results
- Coverage reports

### 3. TypeScript Linting (`lint.yml`)

**Purpose**: Checks code quality and style with ESLint.

**Triggers**: Push and PR to `main`, `develop`

**Steps**:
1. Checkout code
2. Setup Node.js (v20)
3. Install dependencies
4. Run ESLint
5. Annotate linting results in PR
6. Upload lint results

**Features**:
- Continues on error (won't fail the build)
- Annotates PR with linting issues
- Generates lint report artifact

### 4. TypeScript Type Check (`type-check.yml`)

**Purpose**: Validates TypeScript types across the entire codebase.

**Triggers**: Push and PR to `main`, `develop`

**Steps**:
1. Checkout code
2. Setup Node.js (v20)
3. Install dependencies
4. Run TypeScript compiler in check mode
5. Generate summary

**Features**:
- Catches type errors early
- Generates summary with results

### 5. Expo Doctor (`expo-doctor.yml`)

**Purpose**: Checks Expo project health and configuration.

**Triggers**: Push and PR to `main`, `develop`

**Steps**:
1. Checkout code
2. Setup Node.js (v20)
3. Install dependencies
4. Install Expo CLI
5. Run Expo Doctor
6. Generate summary

**Features**:
- Continues on error (warnings won't fail the build)
- Checks for common Expo issues
- Validates dependencies

## Local Development

### Running CI Checks Locally

Before pushing code, run these commands locally to catch issues:

```bash
# Run all checks
npm run type-check && npm run lint && npm test && npx expo-doctor

# Individual checks
npm run type-check  # TypeScript type checking
npm run lint        # ESLint
npm test            # Jest tests
npx expo-doctor     # Expo health check
```

### Pre-commit Hook (Optional)

Create `.husky/pre-commit` to run checks before committing:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run type-check
npm run lint
npm test
```

## Coverage Reporting

Test coverage is automatically uploaded to Codecov on every CI run. Coverage thresholds are configured in `jest.config.js`:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## Secrets Configuration

The following secrets should be configured in GitHub repository settings:

### Required Secrets

None - the pipelines work with default test values.

### Optional Secrets

- `EXPO_PUBLIC_SUPABASE_URL`: Production Supabase URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Production Supabase anonymous key
- `CODECOV_TOKEN`: For private repositories using Codecov

### Setting Secrets

1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add secret name and value

## Status Badges

Add these badges to your README.md:

```markdown
![CI Pipeline](https://github.com/YOUR_USERNAME/ClearSkin-AI/workflows/CI%20Pipeline/badge.svg)
![Tests](https://github.com/YOUR_USERNAME/ClearSkin-AI/workflows/Test%20Suite/badge.svg)
![Linting](https://github.com/YOUR_USERNAME/ClearSkin-AI/workflows/TypeScript%20Linting/badge.svg)
![Type Check](https://github.com/YOUR_USERNAME/ClearSkin-AI/workflows/TypeScript%20Type%20Check/badge.svg)
```

## Troubleshooting

### Workflow Fails on Dependencies

**Issue**: `npm ci` fails

**Solution**: 
- Ensure `package-lock.json` is committed
- Try deleting `node_modules` and running `npm install` locally

### Type Check Fails on CI but Passes Locally

**Issue**: Different TypeScript versions

**Solution**:
- Ensure CI uses same Node.js version as local
- Commit `package-lock.json`

### Tests Timeout

**Issue**: Tests take too long

**Solution**:
- Increase timeout in `jest.config.js`
- Optimize slow tests
- Check for infinite loops

### Expo Doctor Warnings

**Issue**: Expo Doctor reports warnings

**Solution**:
- Review warnings (they don't fail the build)
- Update dependencies if needed
- Check Expo documentation

## Workflow Optimization

### Caching

All workflows use npm caching to speed up dependency installation:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### Matrix Strategy

The test workflow runs on multiple Node.js versions to ensure compatibility:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

### Continue on Error

Some workflows continue even if certain steps fail:

```yaml
- name: Run ESLint
  run: npm run lint
  continue-on-error: true
```

## Best Practices

1. **Keep workflows fast**: Optimize tests and use caching
2. **Fail fast**: Critical checks should fail the build
3. **Informative failures**: Use summaries and annotations
4. **Consistent environment**: Use same Node.js version locally and in CI
5. **Keep secrets secure**: Never commit secrets to repository

## Extending the Pipeline

### Adding a New Workflow

1. Create a new file in `.github/workflows/`
2. Define trigger events
3. Add necessary steps
4. Test locally first
5. Commit and push

### Adding New Tests

1. Write tests following the project structure
2. Ensure tests run locally
3. Maintain coverage thresholds
4. Update documentation

## Support

For issues with CI/CD:
1. Check workflow logs in GitHub Actions tab
2. Review this documentation
3. Check `TESTING.md` for testing-specific issues
4. Open an issue with workflow logs attached

