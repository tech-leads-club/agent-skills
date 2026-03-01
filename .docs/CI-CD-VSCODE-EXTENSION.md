# VS Code Extension CI/CD Runbook

## Workflows

- `vscode-extension-ci.yml` (PR/push)
  - Runs `nx` lint/test/build, the integration harness (`npm run test:integration --workspace=agent-skills`) after building the extension, and the `nx package` target inside `packages/vscode-extension`.
  - Uploads a single `.vsix` artifact named `vscode-extension-vsix` with a 7‑day retention window so that release engineers can grab the build if needed.
- `vscode-extension-release.yml` (push to `main` and `workflow_dispatch`)
  - `release-package` job runs `npm run release:vscode:package`, packages the VSIX via `semantic-release-vsce` + `semantic-release-stop-before-publish`, and uploads `artifacts/vscode-extension.vsix` as `vscode-extension-vsix` (30‑day retention).
  - `release-publish` job downloads that artifact, validates the `VSCE_PAT`/`OVSX_PAT` guard script, and runs `npm run release:vscode:publish` so semantic release can publish to both registries with `skipDuplicate: true`.

## Artifact + Config Contract

- Package job writes the VSIX into `packages/vscode-extension` and copies it to `artifacts/vscode-extension.vsix` before uploading.
- Publish job feeds that exact file into `.github/release/vscode-extension/publish.config.mjs` via `publishPackagePath` so `semantic-release-vsce` never rebuilds the VSIX.
- Both configs inherit shared metadata from `.github/release/vscode-extension/shared.config.mjs`, so the unique tag format `vscode-extension-v${version}` is preserved for every release.

## Secrets & Guardrails

- The only secrets used in this lane are `VSCE_PAT` (VS Marketplace) and `OVSX_PAT` (Open VSX). Store them in the protected repository environment that backs the release workflow.
- The publish job runs `.github/scripts/ensure-release-secrets.mjs`; missing secrets cause the job to fail before `semantic-release` executes and emit an explicit summary row in `GITHUB_STEP_SUMMARY`.
- Secrets are scoped to the publish job only. The package job never references these tokens, so forked PRs can safely run CI without access to publish credentials.

## Dry-Run + Validation Commands

- `npm run release:vscode:package -- --dry-run` — validates `.github/release/vscode-extension/package.config.mjs` and ensures the staging release pipeline never publishes artifacts.
- `npm run release:vscode:publish -- --dry-run` — verifies the publish config can find `artifacts/vscode-extension.vsix` without hitting the marketplaces.
- Both scripts rely on the new `semantic-release` entries in the root `package.json`; pass `-- --dry-run` to keep `semantic-release` in validation mode without touching the registries.

## Release Recovery + Reporting

- Artifact reruns: when a publish job fails, reuse the same workflow run in GitHub Actions and rerun the `release-publish` job; the package job is not rerun and the existing `artifacts/vscode-extension.vsix` artifact is preserved for 30 days.
- Duplicate-safe publishes: `semantic-release-vsce` is configured with `skipDuplicate: true`, so rerunning the publish job handles the “version already exists” scenario without failing the workflow.
- Failure messaging: the guard script and workflow logs explicitly mention which registry is missing tokens (VS Marketplace vs Open VSX) so maintainers can rotate the correct credential and rerun the publish job.

## Final Validation Checklist

1. `npx nx run vscode-extension:lint`
2. `npx nx run vscode-extension:test`
3. `npx nx run vscode-extension:build`
4. `npx nx run vscode-extension:package`
5. `npm run test:integration --workspace=agent-skills`
6. Run the dry-run commands above to make sure both semantic-release configs are healthy.

Keep this document evergreen whenever release scripts or secret requirements change.
