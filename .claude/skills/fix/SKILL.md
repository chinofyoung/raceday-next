---
name: fix
description: Use when the user wants to address review comments on a pull request. Fetches PR review comments, fixes the issues in code, and replies on GitHub confirming the fixes. Trigger: `/fix <number>`
---

# Fix PR Comments Skill

Address review comments on a GitHub pull request: fetch comments, fix code, reply with results.

## Invocation

`/fix <number>`

## Workflow

```
/fix <number>
      |
      v
Fetch PR details via gh CLI
      |
  [not found] --> Tell user, stop
      |
  [merged/closed] --> Tell user, stop
      |
      v
Checkout the PR branch
      |
      v
Fetch all review comments AND conversation comments on the PR
      |
  [no comments of either type] --> Tell user "no comments to address", stop
      |
      v
Group comments by file and thread
      |
      v
For each actionable comment/thread:
  1. Read the referenced file and surrounding context
  2. Understand the requested change
  3. Dispatch coder-agent to implement the fix
  4. Reply to the comment on GitHub confirming the fix
      |
      v
Stage and commit all fixes
      |
      v
Push to the PR branch
      |
      v
Post a summary comment on the PR
      |
      v
Output summary to user
```

## Step Details

### 1. Fetch PR

```bash
gh pr view <number> --json number,title,state,headRefName,url,additions,deletions,changedFiles
```

Stop if: state is `MERGED` or `CLOSED`, or command errors.

### 2. Checkout PR Branch

```bash
gh pr checkout <number>
```

### 3. Fetch Review Comments

Fetch all review comments (inline code comments from reviews):

```bash
gh api repos/{owner}/{repo}/pulls/<number>/comments --paginate
```

Also fetch issue-level comments (general PR conversation):

```bash
gh api repos/{owner}/{repo}/issues/<number>/comments --paginate
```

**For review comments**, parse:
- `id` — comment ID (needed for replies)
- `body` — the comment text
- `path` — file path
- `line` or `original_line` — line number
- `in_reply_to_id` — thread parent (to group threads)
- `user.login` — who wrote it

**For conversation comments**, parse:
- `id` — comment ID (needed for replies)
- `body` — the comment text
- `user.login` — who wrote it
- `html_url` — for reference in summary

Note: Conversation comments have no `path` or `line` — they are general PR-level feedback.

**Filter out (both types):**
- Comments by bots (login contains `[bot]` or is `github-actions`)
- Comments that are already resolved/outdated
- Comments that are pure acknowledgments ("thanks", "LGTM", etc.)
- Your own previous fix-confirmation replies
- Summary comments posted by this skill (contain "Review Feedback Addressed")

### 4. Group and Prioritize

**Review comments:** Group into threads by `in_reply_to_id`. For each thread, use the latest unaddressed comment as the action item.

**Conversation comments:** Treat each as a standalone item (no threading). These are general PR-level feedback that may reference specific files/lines in prose but don't have structured file/line metadata.

Classify each comment (both types):
- **Actionable**: Requests a code change, points out a bug, asks for a refactor
- **Question**: Asks for clarification — reply with an answer, no code change needed
- **Non-actionable**: Praise, acknowledgments, meta-discussion — skip

For conversation comments that reference specific code, extract file paths and line numbers from the comment body to provide context to the coder-agent.

### 5. Fix Each Comment

For each actionable comment, dispatch a **coder-agent** subagent with:
- The comment body and context
- The file path and line number
- The current file contents
- Project guidelines from CLAUDE.md

The agent should make the minimal change needed to address the feedback. Do not over-engineer or refactor beyond what was requested.

For questions, dispatch a **general-purpose** subagent to research the answer from the codebase and draft a reply.

### 6. Reply to Each Comment

After fixing, reply to each comment on GitHub using the appropriate endpoint based on comment type.

#### Review comments (inline code comments)

**For code fixes:**
```bash
gh api repos/{owner}/{repo}/pulls/<number>/comments/<comment_id>/replies \
  --method POST \
  -f body="Fixed — <brief description of what was changed>."
```

**For questions:**
```bash
gh api repos/{owner}/{repo}/pulls/<number>/comments/<comment_id>/replies \
  --method POST \
  -f body="<answer to the question>"
```

#### Conversation comments (general PR comments)

Conversation comments use the **issues** API, not the pulls review comments API.

**For code fixes:**
```bash
gh api repos/{owner}/{repo}/issues/<number>/comments \
  --method POST \
  -f body="Addressed — <brief description of what was changed>.

> In reply to @<user>'s [comment](<html_url>)"
```

**For questions:**
```bash
gh api repos/{owner}/{repo}/issues/<number>/comments \
  --method POST \
  -f body="<answer to the question>

> In reply to @<user>'s [comment](<html_url>)"
```

Note: The issues comment endpoint creates a new conversation comment (there is no thread-reply API for issue comments). Include a quote linking back to the original comment for context.

### 7. Commit and Push

Stage specific changed files (not `git add -A`). Commit message format:

```
fix: address PR review feedback (#<number>)
```

Use a HEREDOC. Co-author line required:
```
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

Then push:
```bash
git push
```

### 8. Post Summary Comment

Post a summary on the PR conversation:

```bash
gh pr comment <number> --body "$(cat <<'EOF'
## Review Feedback Addressed

| Comment | Type | Action | Status |
|---------|------|--------|--------|
| <truncated comment> | Review / Conversation | <what was done> | Fixed |
| ... | ... | ... | ... |

All review comments have been addressed in the latest push.

Generated with Claude Code
EOF
)"
```

### 9. Output to User

Print:
- Number of review comments addressed
- Number of conversation comments addressed
- Number of questions answered
- Number skipped (non-actionable)
- Files changed
- PR URL

## Error Handling

| Situation | Action |
|---|---|
| PR not found | Print error from `gh`, stop |
| PR is merged/closed | Inform user, stop |
| No review comments | Tell user, stop |
| Comment references deleted file | Skip, note in summary |
| Fix conflicts with other changes | Flag to user, do not force |
| Push fails (branch protection) | Tell user to push manually |
| gh auth issues | Tell user to run `gh auth login` |

## Important Notes

- **Opus orchestrates only** — all code fixes are done by subagents via the Agent tool
- Only address comments from human reviewers, not bot-generated comments
- Make minimal, targeted fixes — do not refactor or improve code beyond what was requested
- When a comment is ambiguous, reply asking for clarification rather than guessing
- Always push to the existing PR branch, never create a new branch
- If multiple comments request conflicting changes, flag this to the user
