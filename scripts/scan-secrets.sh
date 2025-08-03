#!/bin/bash

# Comprehensive API key and secret scanner
# Can be run manually: ./scripts/scan-secrets.sh
# Or automatically via git pre-commit hook

echo "🔍 Comprehensive Security Scan - Checking for API keys and secrets..."

# Define patterns for different types of API keys and secrets
PATTERNS=(
    "AIzaSy[0-9A-Za-z_-]{33}"  # Google API keys
    "sk_live_[0-9a-zA-Z]{24}"  # Stripe live keys
    "sk_test_[0-9a-zA-Z]{24}"  # Stripe test keys
    "xoxp-[0-9]{12}-[0-9]{12}-[0-9]{12}-[0-9a-f]{32}"  # Slack tokens
    "github_pat_[0-9A-Za-z_]{82}"  # GitHub personal access tokens
    "ghp_[0-9A-Za-z]{36}"  # GitHub personal access tokens (classic)
    "ghs_[0-9A-Za-z]{36}"  # GitHub OAuth tokens
    "ghu_[0-9A-Za-z]{36}"  # GitHub user tokens
    "pk_live_[0-9a-zA-Z]{24}"  # Stripe publishable live keys
    "pk_test_[0-9a-zA-Z]{24}"  # Stripe publishable test keys
    "[0-9]+-[0-9A-Za-z_]{40}"  # Firebase/Google service account keys pattern
)

# Specific patterns for our app (NEVER ALLOW THESE)
FORBIDDEN_PATTERNS=(
    "AIzaSyBKzBZGr92taZBi69S07mFULCKmR6FPU""-k"  # Our old exposed key (split to avoid self-detection)
    "minihabits2024"  # Our keystore passwords (should not be in source)
    "-----BEGIN PRIVATE KEY-----"  # Private keys
    "-----BEGIN RSA PRIVATE KEY-----"  # RSA private keys
)

# Allowed patterns (these are OK in our config files)
ALLOWED_PATTERNS=(
    "AIzaSyAieVHRURxQMZcG70C2YZM6CTkvzWmFmHs"  # Our new secure restricted API key
)

FOUND_SECRETS=false
FOUND_FORBIDDEN=false
VIOLATION_COUNT=0

# Function to check if a pattern is in the allowed list
is_allowed() {
    local found_key="$1"
    for allowed in "${ALLOWED_PATTERNS[@]}"; do
        if [[ "$found_key" == *"$allowed"* ]]; then
            return 0  # Found in allowed list
        fi
    done
    return 1  # Not in allowed list
}

# Function to check a single file
check_file() {
    local file="$1"
    
    # Skip binary files
    if file "$file" 2>/dev/null | grep -q "binary"; then
        return 0
    fi
    
    # Skip if file doesn't exist
    if [[ ! -f "$file" ]]; then
        return 0
    fi
    
    # Check forbidden patterns first (these are always violations)
    for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
        if grep -q -F "$pattern" "$file" 2>/dev/null; then
            echo "🚨 CRITICAL VIOLATION: Forbidden secret found in $file"
            echo "   This was our previously exposed key - it should NEVER appear!"
            FOUND_FORBIDDEN=true
            FOUND_SECRETS=true
            ((VIOLATION_COUNT++))
        fi
    done
    
    # Check other API key patterns
    for pattern in "${PATTERNS[@]}"; do
        local matches=$(grep -o -E "$pattern" "$file" 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            while IFS= read -r match; do
                if ! is_allowed "$match"; then
                    echo "⚠️  POTENTIAL API KEY: Found in $file"
                    echo "   Pattern: $pattern"
                    echo "   Key: ${match:0:15}**REDACTED**"
                    
                    # Show context line
                    grep -n -F "$match" "$file" | head -1 | sed "s/$match/${match:0:15}**REDACTED**/g"
                    echo ""
                    
                    FOUND_SECRETS=true
                    ((VIOLATION_COUNT++))
                else
                    echo "✅ ALLOWED: Secure API key found in $file (whitelisted)"
                fi
            done <<< "$matches"
        fi
    done
}

# Files to check - all source files (exclude package-lock.json integrity hashes)
FILES_TO_CHECK=(
    $(find . -type f \( \
        -name "*.js" -o \
        -name "*.ts" -o \
        -name "*.tsx" -o \
        -name "*.jsx" -o \
        -name "*.json" -o \
        -name "*.plist" -o \
        -name "*.xml" -o \
        -name "*.gradle" -o \
        -name "*.properties" -o \
        -name "*.swift" -o \
        -name "*.m" -o \
        -name "*.h" \
    \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./android/build/*" \
    -not -path "./android/app/build/*" \
    -not -path "./ios/build/*" \
    -not -path "./ios/Pods/*" \
    -not -name "package-lock.json" 2>/dev/null)
)

echo "📁 Checking $(echo "${FILES_TO_CHECK[@]}" | wc -w) source files..."

# Check each file
for file in "${FILES_TO_CHECK[@]}"; do
    check_file "$file"
done

# Additional checks for build artifacts that shouldn't be committed
echo "🔍 Checking for dangerous build artifacts..."

DANGEROUS_ARTIFACTS=(
    "*.pb"
    "*.apk"
    "*.aab"
    "*.ipa"
    "**/build/**"
    "**/resources.pb"
)

for pattern in "${DANGEROUS_ARTIFACTS[@]}"; do
    found_files=$(find . -name "$pattern" -not -path "./.git/*" 2>/dev/null || true)
    if [[ -n "$found_files" ]]; then
        echo "⚠️  BUILD ARTIFACT WARNING: Found files matching $pattern"
        echo "$found_files"
        echo "   These files may contain embedded API keys and should not be committed."
        echo ""
    fi
done

# Check git status for staged files
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
    staged_files=$(git diff --cached --name-only 2>/dev/null || true)
    if [[ -n "$staged_files" ]]; then
        echo "📋 Staged files for commit:"
        echo "$staged_files"
        echo ""
    fi
fi

# Report results
echo "=================================================="
if [ "$FOUND_FORBIDDEN" = true ]; then
    echo "🚨 CRITICAL: Found previously exposed secrets! These must be removed!"
    exit 2
elif [ "$FOUND_SECRETS" = true ]; then
    echo "⚠️  Found $VIOLATION_COUNT potential security issue(s)"
    echo ""
    echo "To fix:"
    echo "1. Remove or replace any exposed secrets"
    echo "2. If these are legitimate API keys, add them to ALLOWED_PATTERNS in this script"
    echo "3. Make sure keys are properly restricted in Google Cloud Console"
    exit 1
else
    echo "✅ Security scan complete - No API keys or secrets detected!"
    echo "✅ Safe to commit!"
    exit 0
fi