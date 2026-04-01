---
name: pr
description: Use when the user wants to review a pull request by number. Fetches PR diff, reviews code for issues, tests the changes with Playwright MCP, and posts review comments on GitHub. Trigger: `/pr <number>`
---

# PR Review Skill

Review a GitHub pull request: fetch diff, analyze code, test with Playwright, post comments.

## Invocation

`/pr <number>`

## Workflow

```
/pr <number>
      |
      v
Fetch PR details via gh CLI
      |
  [not found] --> Tell user, stop
      |
  [merged/closed] --> Tell user, stop
      |
      v
Announce: PR title + author + summary
      |
      v
Fetch full diff and changed files
      |
      v
Dispatch parallel review agents:
  1. Code review agent (reads diff, checks for issues)
  2. Playwright test agent (runs app, tests PR changes in browser)
      |
      v
Collect findings from both agents
      |
      v
Post review comments on GitHub via gh CLI
      |
      v
Output summary to user
```

## Step Details

### 1. Fetch PR

```bash
gh pr view <number> --json number,title,body,state,author,baseRefName,headRefName,files,url,additions,deletions,changedFiles
```

Stop if: state is `MERGED` or `CLOSED`, or command errors.

### 2. Fetch Diff and Changed Files

```bash
gh pr diff <number>
```

Also read each changed file to understand full context (not just the diff hunks).

### 3. Code Review (Agent)

Dispatch a **code-reviewer subagent** with:
- The full PR diff
- The list of changed files and their contents
- Project guidelines from CLAUDE.md

The code review agent should check for:
- **Correctness:** Logic errors, off-by-one, null/undefined risks
- **Security:** XSS, injection, exposed secrets, insecure patterns
- **Performance:** N+1 queries, unnecessary re-renders, missing memoization
- **Style:** Violations of project design language and conventions from CLAUDE.md
- **Types:** TypeScript errors, missing types, unsafe casts
- **Best practices:** React 19 patterns, Next.js 16 conventions, Convex best practices

The agent should return a structured list of findings with:
- File path and line number
- Severity: `critical` | `warning` | `suggestion`
- Description of the issue
- Suggested fix (if applicable)

### 4. Playwright Testing (Agent)

Dispatch a **general-purpose subagent** that uses Playwright MCP tools to test the PR changes in the browser:

1. Ensure the dev server is running (`npm run dev` or check if already running)
2. Use `mcp__plugin_playwright_playwright__browser_navigate` to open the relevant page(s) affected by the PR
3. Use `mcp__plugin_playwright_playwright__browser_snapshot` to inspect the rendered page
4. Use `mcp__plugin_playwright_playwright__browser_click`, `browser_fill_form`, etc. to interact with changed UI
5. Use `mcp__plugin_playwright_playwright__browser_take_screenshot` to capture visual state
6. Verify:
   - Pages load without errors (check `browser_console_messages` for errors)
   - UI renders correctly based on the changes
   - Interactive elements work as expected
   - No visual regressions on affected pages

The agent should return:
- List of pages tested
- Any console errors found
- Any UI issues or broken interactions
- Screenshots of tested pages (paths)

### 5. Post Review Comments

Based on findings from both agents, post comments on the PR:

**For file-specific issues (critical/warning):**
```bash
gh api repos/{owner}/{repo}/pulls/<number>/reviews \
  --method POST \
  -f body="<overall summary>" \
  -f event="COMMENT" \
  -f 'comments[][path]=<file>' \
  -f 'comments[][body]=<comment>' \
  -f 'comments[][line]=<line>'
```

**If no issues found:**
```bash
gh pr review <number> --comment --body "$(cat <<'EOF'
✅ **Code Review — No Issues Found**

Reviewed X changed files (Y additions, Z deletions).
Playwright testing passed — no console errors or UI regressions detected.

🤖 Reviewed by Claude Code
EOF
)"
```

**If issues found:**
```bash
gh pr review <number> --comment --body "$(cat <<'EOF'
🔍 **Code Review Summary**

Found N issue(s) across X files:
- 🔴 Critical: N
- 🟡 Warning: N
- 💡 Suggestion: N

<details for each issue>

**Playwright Testing:**
- Pages tested: <list>
- Console errors: <count>
- UI issues: <count>

🤖 Reviewed by Claude Code
EOF
)"
```

For individual file comments, use the PR review API to attach comments to specific lines in the diff.

### 6. Output Summary

Print a concise summary to the user:
- PR title and URL
- Number of issues found by severity
- Playwright test results
- Link to the review on GitHub

## Error Handling

| Situation | Action |
|---|---|
| PR not found | Print error from `gh`, stop |
| PR is merged/closed | Inform user, stop |
| Dev server not running | Start it, wait for ready, then test |
| Playwright connection fails | Skip browser testing, note in review |
| No changed files | Post "nothing to review", stop |
| gh auth issues | Tell user to run `gh auth login` |

## Important Notes

- **Opus orchestrates only** — all actual review work is done by subagents via the Agent tool
- Always checkout the PR branch before testing: `gh pr checkout <number>`
- Post comments respectfully — focus on code, not the author
- Only post comments for real issues, not style nitpicks already handled by linters
- Include line numbers in all file-specific comments
