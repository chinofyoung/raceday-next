---
name: hotfix
description: Use when the user runs /hotfix to create a new auto-incremented hotfix branch from main. Creates branch in format hotfix-X.Y.Z and switches to it.
---

# Hotfix Branch Creator

Creates a new hotfix branch from `main` with auto-incrementing version numbers in the format `hotfix-X.Y.Z` (version.feature.hotfix).

## How It Works

1. Fetch latest from remote
2. Find the highest existing `hotfix-*` branch (local + remote)
3. Increment the hotfix number (Z). If no hotfix branches exist, start at `hotfix-0.0.1`
4. Create the new branch from `main` and switch to it

## Incrementing Rules

- Default: increment the **hotfix** (patch) number: `hotfix-0.0.1` → `hotfix-0.0.2`
- If user says "feature": increment the **feature** (minor) number and reset hotfix: `hotfix-0.1.0`
- If user says "version": increment the **version** (major) number and reset others: `hotfix-1.0.0`

## Implementation

Run these commands in sequence:

```bash
# 1. Fetch latest
git fetch origin

# 2. Find highest hotfix branch version
# Parse all hotfix-X.Y.Z branches (local + remote), sort by version, take highest
LATEST=$(git branch -a | grep -oE 'hotfix-[0-9]+\.[0-9]+\.[0-9]+' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)

# 3. Calculate next version
if [ -z "$LATEST" ]; then
  NEXT="hotfix-0.0.1"
else
  VERSION=$(echo "$LATEST" | sed 's/hotfix-//')
  MAJOR=$(echo "$VERSION" | cut -d. -f1)
  MINOR=$(echo "$VERSION" | cut -d. -f2)
  PATCH=$(echo "$VERSION" | cut -d. -f3)
  PATCH=$((PATCH + 1))
  NEXT="hotfix-${MAJOR}.${MINOR}.${PATCH}"
fi

# 4. Create branch from main and switch to it
git checkout main
git pull origin main
git checkout -b "$NEXT"
```

After running, confirm to the user:
- The branch name created
- That it was branched from `main`
- The previous branch they were on (in case they want to switch back)
