# Init

`/demo init` prepares a project for recording: the config file, plus agent docs that say how to start the app and sign in. Nothing is recorded.

1. Run `$SKILL_DIR/scripts/config` and keep its one-line output (`created:` or `exists:` plus the path). An existing file is never touched.
2. Read the project's agent docs (AGENTS.md, CLAUDE.md, README) and check that they cover what a demo needs:
   - **Start**: the command that starts the app locally.
   - **URL**: where it serves. The recorder uses `http://localhost:$PORT` (environment, then `.env`, else 3000), which reaches the host's localhost on Linux and macOS, so only a different host needs `app.url` in `.demos/demo.config.mjs`.
   - **Sign-in**: the sign-in path and a test account (credentials or seeded personas).
3. If all three are documented, say so and change nothing.
4. Otherwise investigate the code for the gaps only: routes, the sign-in form and controller, seeds and fixtures, dev scripts (`bin/dev`, `Procfile*`, `package.json`), env files for the port. Draft a short section covering just what's missing, show it to the user, and write it into AGENTS.md (or the project's existing agent doc) only after they approve. Never invent credentials: if no test account exists, say so and suggest how to create one (a seed, a fixture, a console command).
5. Report what was found, what was added, and the config path.
