# Test Configuration and Cleanup Rules

## Auto-Cleanup Rules

This project follows strict cleanup rules to ensure no test artifacts remain after testing:

### 1. **Automatic Cleanup Patterns**

Test files matching these patterns are automatically cleaned up:

- `*.test.tmp` - Temporary test files
- `*.spec.tmp` - Temporary spec files
- `test-output-*` - Test output files
- `temp-test-files/` - Temporary test directories
- `test-results.log` - Test log files

### 2. **Cleanup Triggers**

Cleanup is triggered by:

- Script exit (via bash `trap`)
- Test completion (successful or failed)
- Manual cleanup command: `npm run test:clean`

### 3. **ESLint Rules for Test Files**

The following ESLint rules help prevent test file remnants:

```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-debugger": "error",
    "no-unused-vars": [
      "error",
      {
        "varsIgnorePattern": "^(test|spec|mock|stub)_.*",
        "argsIgnorePattern": "^_"
      }
    ]
  }
}
```

### 4. **Git Ignore Rules**

Add these patterns to `.gitignore`:

```gitignore
# Test artifacts
*.test.tmp
*.spec.tmp
test-output-*
temp-test-files/
test-results.log
.test-cache/
coverage/
.nyc_output/
```

### 5. **Package.json Scripts**

Recommended test scripts with cleanup:

```json
{
  "scripts": {
    "test": "npm run test:api && npm run test:clean",
    "test:api": "./test-api.sh",
    "test:clean": "node scripts/cleanup-test-files.js",
    "test:watch": "npm run test && npm run test:clean",
    "pretest": "npm run test:clean"
  }
}
```

### 6. **CI/CD Integration**

For GitHub Actions or other CI systems:

```yaml
- name: Run tests with cleanup
  run: |
    npm run test
    # Ensure cleanup even if tests fail
    npm run test:clean || true
```

### 7. **Development Guidelines**

- **Never commit test artifacts**: Use `.gitignore` patterns
- **Use temporary directories**: All test files should go in `temp-*` directories
- **Add cleanup to test scripts**: Every test script should clean up after itself
- **Use descriptive temp file names**: Include timestamps or random IDs to avoid conflicts

### 8. **Cleanup Verification**

To verify cleanup is working:

```bash
# Run tests
npm run test

# Check for leftover files (should return empty)
find . -name "*.test.tmp" -o -name "*.spec.tmp" -o -name "test-output-*"
```

## Implementation Status

✅ **Enhanced test-api.sh** with automatic cleanup  
⏳ **Cleanup script** (see scripts/cleanup-test-files.js)  
⏳ **Package.json scripts** (needs to be added)  
⏳ **Git ignore rules** (needs to be added)  
⏳ **ESLint configuration** (needs to be updated)
