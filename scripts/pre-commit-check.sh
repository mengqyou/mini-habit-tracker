#!/bin/bash

# Simplified pre-commit security check
# Focuses on critical API key exposure only

echo "🔍 Pre-commit security check..."

# Critical patterns that should NEVER be in source code (using regex patterns)
OLD_API_KEY="AIzaSyBKzBZGr92taZBi69S07mFULCKmR6FPU-k"  # Our old exposed key

CRITICAL_PATTERNS=(
    "sk_live_[0-9a-zA-Z]{24}"  # Stripe live keys
    "xoxp-[0-9]{12}-[0-9]{12}-[0-9]{12}-[0-9a-f]{32}"  # Slack tokens
    "github_pat_[0-9A-Za-z_]{82}"  # GitHub personal access tokens
    "ghp_[0-9A-Za-z]{36}"  # GitHub tokens
)

# Get staged files for commit
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo "✅ No files to check"
    exit 0
fi

CRITICAL_FOUND=false

echo "📁 Checking staged files..."

# Check each staged file for critical secrets
for file in $STAGED_FILES; do
    if [[ -f "$file" ]] && ! file "$file" | grep -q "binary"; then
        # Skip checking our own security scripts to avoid self-detection
        if [[ "$file" == *"pre-commit"* ]] || [[ "$file" == *"scan-secrets"* ]]; then
            continue
        fi
        
        # Check for old API key
        if git show ":$file" 2>/dev/null | grep -F "$OLD_API_KEY" >/dev/null; then
            echo "🚨 CRITICAL: Old exposed API key found in $file"
            echo "   This is the previously leaked key - it should never appear!"
            CRITICAL_FOUND=true
        fi
        
        # Check other patterns
        for pattern in "${CRITICAL_PATTERNS[@]}"; do
            if git show ":$file" 2>/dev/null | grep -E "$pattern" >/dev/null; then
                echo "🚨 CRITICAL: Exposed secret found in $file"
                echo "   Pattern: $pattern"
                CRITICAL_FOUND=true
            fi
        done
    fi
done

if [ "$CRITICAL_FOUND" = true ]; then
    echo ""
    echo "🚫 COMMIT BLOCKED: Critical secrets detected!"
    echo "   Remove exposed secrets before committing."
    exit 1
else
    echo "✅ Security check passed!"
    exit 0
fi