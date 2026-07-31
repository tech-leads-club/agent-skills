## What this changes

<!-- One or two sentences. -->

Closes #

<!--
A linked issue is required. Pull requests without one may be closed with a pointer to
CONTRIBUTING.md — that is a redirect, not a rejection:
https://github.com/tech-leads-club/agent-skills/blob/main/CONTRIBUTING.md#-how-contributions-work
-->

## Checklist

- [ ] This implements an issue that a maintainer agreed to
- [ ] `npx nx affected -t lint test build --base=origin/main` passes locally
- [ ] Conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`)
- [ ] For a new or changed skill: the `description` follows `[What it does] + [Use when ...] + [Do NOT use for ...]`, and `npm run validate` passes
- [ ] For bundled skill files: they live in `references/`, `scripts/` or `assets/` — no other folder is served over MCP
- [ ] An AI agent was involved, and I reviewed every line — or no agent was involved
