---
name: sequenzy-email-marketing
description: Build and operate Sequenzy lifecycle email workflows. Use when the user asks to create onboarding emails, winback campaigns, subscriber segments, email templates, campaign tests, or Sequenzy stats reports. Do NOT use for generic cold outreach copywriting, CRM setup, or non-email marketing tasks.
metadata:
  version: 1.0.0
  author: github.com/polnikale
---

# Sequenzy Email Marketing

Use this skill to help an agent safely operate Sequenzy for lifecycle email marketing.

## Process

1. Verify authentication with `sequenzy whoami` or a configured `SEQUENZY_API_KEY`.
2. Inspect the target account, company, list, segment, campaign, sequence, or template before changing anything.
3. Draft the lifecycle flow: goal, audience, timing, subject lines, body copy, CTA, and success metric.
4. Create or update the relevant Sequenzy objects with the CLI/API or dashboard.
5. Send a test email before live delivery when supported.
6. Ask for explicit approval before enabling a sequence or sending to real subscribers.
7. Report exactly what changed and the next action needed.

## Useful Commands

```bash
npm install -g @sequenzy/cli@latest
sequenzy whoami
sequenzy subscribers list
sequenzy lists list
sequenzy segments list
sequenzy templates list
sequenzy campaigns list
sequenzy sequences list
sequenzy stats
```

## Safety

- Never include API keys or secrets in emails, logs, or committed files.
- Validate recipient emails and sender identity before tests or sends.
- Keep marketing copy honest and specific.
- Treat live sends as approval-gated external actions.
