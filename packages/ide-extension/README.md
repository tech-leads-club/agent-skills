# Agent Skills for VS Code

Discover, install, update, and remove AI agent skills without leaving VS Code.

Agent Skills gives your coding assistants access to curated, task-specific capabilities. Instead of manually copying prompts or switching to the terminal, you can manage skills from a native extension UI built for everyday workflow.

## What you can do

- Browse the Tech Leads Club skill catalog directly inside VS Code
- Install skills for supported agents from a guided workflow
- Manage local and global installations from one place
- Update or remove installed skills without leaving the editor
- Respect Workspace Trust so untrusted folders stay limited to safe browsing

## Why this extension exists

The Agent Skills ecosystem already has a strong CLI, but many developers spend most of their time inside the IDE. This extension adds a graphical control plane on top of the same ecosystem so discovery and lifecycle management feel faster, more visual, and easier to adopt across teams.

## How it works

The extension is designed as a bridge to the Agent Skills tooling and registry:

- The marketplace UI loads available skills from the published registry
- The extension host coordinates install, update, and removal workflows
- State is reconciled with the filesystem so external CLI changes are reflected in VS Code
- Restricted workspaces keep local installation actions disabled until the workspace is trusted

## Current experience

The extension currently focuses on the core management flow:

1. Open the Agent Skills view in the Activity Bar
2. Choose whether you want to install, uninstall, or update skills
3. Select the target agents and scope when required
4. Let the extension run the workflow and refresh the installed state

## Supported scenarios

- Discovering curated AI agent skills from a native sidebar experience
- Installing skills for one or more supported coding agents
- Managing workspace and user-level skill installations
- Reviewing extension behavior safely in restricted workspaces

## Project links

- Repository: https://github.com/tech-leads-club/agent-skills
- Extension package: https://github.com/tech-leads-club/agent-skills/tree/main/packages/ide-extension
- Issues: https://github.com/tech-leads-club/agent-skills/issues

## Feedback

If you find a bug, have an idea for the marketplace experience, or want support for a new workflow, open an issue in the repository.
