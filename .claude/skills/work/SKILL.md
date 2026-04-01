---
name: work
description: Use when the user wants to start working on a GitHub issue by number. Fetches issue details, creates a branch, implements changes, commits, and creates a pull request. Trigger: `/work <number>`
---

# Work Skill

Implement a GitHub issue end-to-end: fetch, plan, code, commit, PR.

## Invocation

`/work <issue-number>`

## Workflow

```
/work <number>
       |
       v
Fetch issue via gh CLI
       |
   [not found] --> Tell user, stop
       |
   [closed]    --> Tell user, stop
       |
       v
Announce: title + brief summary
       |
       v
Create branch from dev
  Format: <type>/<number>-<short-description>
  Types: feat | fix | chore | refactor | docs
  Derive type from labels or title keywords
       |
   [branch exists] --> Tell user, checkout existing branch
       |
       v
Invoke superpowers:brainstorming
  to explore requirements and approach
       |
       v
Write implementation plan
       |
       v
Delegate implementation to subagents (Agent tool)
  Follow CLAUDE.md design guidelines
       |
       v
Stage specific files, commit
  Format: <type>: <description> (#<number>)
       |
       v
Push branch, create PR via gh pr create
       |
       v
Output PR URL
```

## Step Details

### 1. Fetch Issue

```bash
gh issue view <number> --repo chinofyoung/raceday-next \
  --json number,title,body,labels,state
```

Stop with a clear message if: state is `CLOSED`, or the command errors (issue not found).

### 2. Branch Naming

Derive `<type>` from labels first, then fall back to title keywords:
- Label `bug` → `fix`
- Label `enhancement` / `feature` → `feat`
- Label `chore` / `refactor` → use as-is
- No match → `feat`

Slugify the title: lowercase, replace spaces/punctuation with `-`, max 5 words.

```bash
git checkout dev && git pull origin dev
git checkout -b <type>/<number>-<short-description>
```

### 3. Plan with Brainstorming

Invoke `superpowers:brainstorming` with the issue title and body as context before writing any code. Use the output to create a concise numbered plan.

### 4. Implement

Use the **Agent tool** to dispatch the actual implementation work. Per project rules, Opus orchestrates only — subagents do the coding. Subagents must follow `/Users/chinoyoung/Code/raceday/CLAUDE.md` design guidelines.

### 5. Commit

Stage specific files (not `git add -A`). Commit message format:

```
<type>: <short description> (#<number>)
```

Use a HEREDOC to pass the message. Co-author line required:
```
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

### 6. Create PR

```bash
gh pr create \
  --base dev \
  --title "<type>: <short description> (#<number>)" \
  --body "$(cat <<'EOF'
## Summary
- <bullet points>

## Test plan
- [ ] <test step>

Closes #<number>
EOF
)"
```

Return the PR URL to the user.

## Error Handling

| Situation | Action |
|---|---|
| Issue not found | Print error from `gh`, stop |
| Issue is closed | Inform user, ask if they want to continue anyway |
| Branch already exists | Checkout existing branch, inform user, continue |
| Uncommitted changes on dev | Warn user, do not proceed until clean |
| PR already exists for branch | Show existing PR URL, stop |
