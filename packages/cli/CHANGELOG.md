## 1.1.0 (2026-02-21)

This was a version bump only for @tech-leads-club/agent-skills to align it with other projects, there were no code changes.

## 1.0.2 (2026-02-20)

### 💅 Refactors

- adjust update check timeout constant for clarity ([d61b67faf](https://github.com/tech-leads-club/agent-skills/commit/d61b67faf))
- update CDN reference handling and URL construction logic ([d5e51573d](https://github.com/tech-leads-club/agent-skills/commit/d5e51573d))
- improve update check logic and timeout handling ([dfb2e8fe2](https://github.com/tech-leads-club/agent-skills/commit/dfb2e8fe2))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 1.0.1 (2026-02-20)

This was a version bump only for @tech-leads-club/agent-skills to align it with other projects, there were no code changes.

# 1.0.0 (2026-02-18)

### 🚀 Features

- add onChange callback to MultiSelectPrompt for selection updates ([bc0c94fa2](https://github.com/tech-leads-club/agent-skills/commit/bc0c94fa2))
- add extension detection for agents installation ([370896f38](https://github.com/tech-leads-club/agent-skills/commit/370896f38))
- ⚠️  add CLI description for clarity and security emphasis ([c918702d7](https://github.com/tech-leads-club/agent-skills/commit/c918702d7))
- implement CLI audit functionality with log viewer ([caea9d926](https://github.com/tech-leads-club/agent-skills/commit/caea9d926))
- add readAuditLog function and update logAudit for better path handling ([53188752e](https://github.com/tech-leads-club/agent-skills/commit/53188752e))
- add AuditLogViewer component to display audit entries ([87e111b3f](https://github.com/tech-leads-club/agent-skills/commit/87e111b3f))
- add keyboard shortcuts overlay to MultiSelectPrompt component ([0717a80fc](https://github.com/tech-leads-club/agent-skills/commit/0717a80fc))
- add audit log command to view skill operation logs ([4982fa628](https://github.com/tech-leads-club/agent-skills/commit/4982fa628))
- add atom for managing installed skills and their agents ([6221cb2e7](https://github.com/tech-leads-club/agent-skills/commit/6221cb2e7))
- add selected agents and skills atoms for state management ([23f23c58a](https://github.com/tech-leads-club/agent-skills/commit/23f23c58a))
- add environment check atom for version and global installation status ([9b14a47fd](https://github.com/tech-leads-club/agent-skills/commit/9b14a47fd))
- implement main application component with command handling ([8a9900f15](https://github.com/tech-leads-club/agent-skills/commit/8a9900f15))
- integrate React for interactive CLI commands and improve user experience ([353fa504a](https://github.com/tech-leads-club/agent-skills/commit/353fa504a))
- add GitHubContributor interface and GroupedSkills type ([da9cd92ba](https://github.com/tech-leads-club/agent-skills/commit/da9cd92ba))
- implement cache management CLI functionality ([e6d9d6c93](https://github.com/tech-leads-club/agent-skills/commit/e6d9d6c93))
- implement CLI install functionality for skill management ([1d8dcbb8a](https://github.com/tech-leads-club/agent-skills/commit/1d8dcbb8a))
- implement CLI remove functionality for skill management ([d3590a83d](https://github.com/tech-leads-club/agent-skills/commit/d3590a83d))
- implement CLI update functionality for skills management ([3a9b22198](https://github.com/tech-leads-club/agent-skills/commit/3a9b22198))
- add AnimatedTransition component for smooth visibility transitions ([ce5c7c93e](https://github.com/tech-leads-club/agent-skills/commit/ce5c7c93e))
- add CategoryHeader component for displaying category information ([2356d5348](https://github.com/tech-leads-club/agent-skills/commit/2356d5348))
- add ConfirmPrompt component for user confirmation interactions ([a78148ba2](https://github.com/tech-leads-club/agent-skills/commit/a78148ba2))
- add Header component with version info and notifications ([b4225fe67](https://github.com/tech-leads-club/agent-skills/commit/b4225fe67))
- add FooterBar component for displaying footer hints and status ([7e60da5f4](https://github.com/tech-leads-club/agent-skills/commit/7e60da5f4))
- add index file to export multiple components ([0ee6d74e1](https://github.com/tech-leads-club/agent-skills/commit/0ee6d74e1))
- add InstallResults component for displaying installation results ([86cd9a56b](https://github.com/tech-leads-club/agent-skills/commit/86cd9a56b))
- add KeyboardShortcutsOverlay component for displaying shortcuts ([7fac5fb14](https://github.com/tech-leads-club/agent-skills/commit/7fac5fb14))
- add MultiSelectPrompt component for multi-item selection ([2dd743e12](https://github.com/tech-leads-club/agent-skills/commit/2dd743e12))
- add SearchInput component for filtering skills ([40f59b6f1](https://github.com/tech-leads-club/agent-skills/commit/40f59b6f1))
- add SelectPrompt component for interactive item selection ([ff1e885c5](https://github.com/tech-leads-club/agent-skills/commit/ff1e885c5))
- add SkillCard component for displaying skill information ([a3458b786](https://github.com/tech-leads-club/agent-skills/commit/a3458b786))
- add SkillDetailPanel component for displaying skill details ([9e3f1982f](https://github.com/tech-leads-club/agent-skills/commit/9e3f1982f))
- add StatusBadge and AgentBadge components for status display ([aa5ca397e](https://github.com/tech-leads-club/agent-skills/commit/aa5ca397e))
- add hooks for agent management and skill handling ([6a97bdba4](https://github.com/tech-leads-club/agent-skills/commit/6a97bdba4))
- add useAgents hook for managing agent selection and detection ([dff6d0255](https://github.com/tech-leads-club/agent-skills/commit/dff6d0255))
- implement useConfig hook for managing user configuration state ([9bd6bddae](https://github.com/tech-leads-club/agent-skills/commit/9bd6bddae))
- add custom hook for filtering items based on query ([2496b7c9f](https://github.com/tech-leads-club/agent-skills/commit/2496b7c9f))
- add custom hook for managing installation of skills ([b58dfbfb9](https://github.com/tech-leads-club/agent-skills/commit/b58dfbfb9))
- implement keyboard navigation hook for item selection ([2fd86bbf2](https://github.com/tech-leads-club/agent-skills/commit/2fd86bbf2))
- add custom hook for removing skills and managing state ([bb40ff279](https://github.com/tech-leads-club/agent-skills/commit/bb40ff279))
- add custom hook for managing skill content and loading state ([bfd22f199](https://github.com/tech-leads-club/agent-skills/commit/bfd22f199))
- implement custom hook for managing skills and loading state ([990af631a](https://github.com/tech-leads-club/agent-skills/commit/990af631a))
- add wizard step hook for managing multi-step processes ([54d2fcc17](https://github.com/tech-leads-club/agent-skills/commit/54d2fcc17))
- add agent configuration and detection functionality ([3efd661f2](https://github.com/tech-leads-club/agent-skills/commit/3efd661f2))
- implement audio player functionality for multiple platforms ([bf159a5fe](https://github.com/tech-leads-club/agent-skills/commit/bf159a5fe))
- add audit logging functionality for skill actions ([a94bed0ca](https://github.com/tech-leads-club/agent-skills/commit/a94bed0ca))
- implement category management functions and metadata handling ([83c88635d](https://github.com/tech-leads-club/agent-skills/commit/83c88635d))
- add constants for configuration and project structure ([dab3be233](https://github.com/tech-leads-club/agent-skills/commit/dab3be233))
- add utility functions for path resolution in monorepo ([19e14aa3a](https://github.com/tech-leads-club/agent-skills/commit/19e14aa3a))
- add function to format category badge display ([eaae1cf1c](https://github.com/tech-leads-club/agent-skills/commit/eaae1cf1c))
- add category colors and functions to retrieve them ([b2f691190](https://github.com/tech-leads-club/agent-skills/commit/b2f691190))
- implement user configuration management with load and save functions ([162fd26b1](https://github.com/tech-leads-club/agent-skills/commit/162fd26b1))
- add functions to fetch GitHub contributors and repository stars ([640a4bca0](https://github.com/tech-leads-club/agent-skills/commit/640a4bca0))
- add functions to retrieve npm global root and check installation ([a7e53451b](https://github.com/tech-leads-club/agent-skills/commit/a7e53451b))
- add index file to export service modules ([c519f3ec5](https://github.com/tech-leads-club/agent-skills/commit/c519f3ec5))
- implement skill installation and management functionality ([eacfef4c5](https://github.com/tech-leads-club/agent-skills/commit/eacfef4c5))
- implement skill lock file management and operations ([51558530c](https://github.com/tech-leads-club/agent-skills/commit/51558530c))
- implement markdown parsing and inline segment handling ([208298fd4](https://github.com/tech-leads-club/agent-skills/commit/208298fd4))
- add package info service for managing package metadata ([6801e7ed8](https://github.com/tech-leads-club/agent-skills/commit/6801e7ed8))
- add function to find project root directory ([78fdfeed0](https://github.com/tech-leads-club/agent-skills/commit/78fdfeed0))
- implement skills registry management and caching functionality ([8f9149287](https://github.com/tech-leads-club/agent-skills/commit/8f9149287))
- implement local skills discovery and management functions ([d08d6109f](https://github.com/tech-leads-club/agent-skills/commit/d08d6109f))
- add terminal size utilities for panel display logic ([4bc60d208](https://github.com/tech-leads-club/agent-skills/commit/4bc60d208))
- implement caching mechanism for update checks ([3580bcd08](https://github.com/tech-leads-club/agent-skills/commit/3580bcd08))
- add update check functionality for package versioning ([9c45a396b](https://github.com/tech-leads-club/agent-skills/commit/9c45a396b))
- add color palette and gradient stops for theming ([ea3b1351f](https://github.com/tech-leads-club/agent-skills/commit/ea3b1351f))
- add symbols for UI elements in the theme ([85abc6090](https://github.com/tech-leads-club/agent-skills/commit/85abc6090))
- add ActionSelector for skill management options ([d28b241ba](https://github.com/tech-leads-club/agent-skills/commit/d28b241ba))
- implement AgentSelector for selecting and managing agents ([aca114ef3](https://github.com/tech-leads-club/agent-skills/commit/aca114ef3))
- add CreditsView component for displaying contributors and stats ([90f00dce2](https://github.com/tech-leads-club/agent-skills/commit/90f00dce2))
- add InstallConfig component for skill installation configuration ([4fa0871ba](https://github.com/tech-leads-club/agent-skills/commit/4fa0871ba))
- implement InstallWizard for skill installation process ([ee219886c](https://github.com/tech-leads-club/agent-skills/commit/ee219886c))
- add ListView component for displaying installed skills ([a42f41064](https://github.com/tech-leads-club/agent-skills/commit/a42f41064))
- implement RemoveWizard for skill removal process ([f306b446b](https://github.com/tech-leads-club/agent-skills/commit/f306b446b))
- implement SkillBrowser component for skill management interface ([b8ed6b008](https://github.com/tech-leads-club/agent-skills/commit/b8ed6b008))
- add UpdateView component for managing skill updates ([2bd0a2054](https://github.com/tech-leads-club/agent-skills/commit/2bd0a2054))
- implement useKonamiCode hook for Konami code detection ([de86aded2](https://github.com/tech-leads-club/agent-skills/commit/de86aded2))
- add exports for ArcadeMenu and VibeInvaders components ([f1c99d869](https://github.com/tech-leads-club/agent-skills/commit/f1c99d869))
- implement arcade menu with navigation and game selection ([47d30f5c7](https://github.com/tech-leads-club/agent-skills/commit/47d30f5c7))
- add VibeInvaders game implementation with player and invaders ([762fd6f2c](https://github.com/tech-leads-club/agent-skills/commit/762fd6f2c))
- update TypeScript configuration for module resolution and libraries ([5adf23819](https://github.com/tech-leads-club/agent-skills/commit/5adf23819))
- add chiptune audio asset for enhanced user experience ([67e650065](https://github.com/tech-leads-club/agent-skills/commit/67e650065))

### 🩹 Fixes

- ensure destination directory exists before copying skill files ([bf1f7c8f8](https://github.com/tech-leads-club/agent-skills/commit/bf1f7c8f8))

### 💅 Refactors

- add setSelectedAgents to MultiSelectPrompt onChange handler ([fa3216026](https://github.com/tech-leads-club/agent-skills/commit/fa3216026))
- simplify mock implementations in useConfig tests ([c03a94b34](https://github.com/tech-leads-club/agent-skills/commit/c03a94b34))
- improve config loading and saving logic in tests ([ef8afd9c3](https://github.com/tech-leads-club/agent-skills/commit/ef8afd9c3))
- streamline terminal size mocking in tests ([7e8f1e185](https://github.com/tech-leads-club/agent-skills/commit/7e8f1e185))
- improve config saving process with temporary file handling ([0319b7a9d](https://github.com/tech-leads-club/agent-skills/commit/0319b7a9d))
- make timestamp optional and handle undefined values in AuditLogViewer ([cb4475d34](https://github.com/tech-leads-club/agent-skills/commit/cb4475d34))
- improve checkbox and color logic based on installation status ([a626fe8bb](https://github.com/tech-leads-club/agent-skills/commit/a626fe8bb))
- remove unused hooks from index export ([fb70807eb](https://github.com/tech-leads-club/agent-skills/commit/fb70807eb))
- enhance installation result display and error handling ([ff813df75](https://github.com/tech-leads-club/agent-skills/commit/ff813df75))
- improve skill resolution logic in installer hook ([b4a974240](https://github.com/tech-leads-club/agent-skills/commit/b4a974240))
- move AUDIT_LOG_FILE constant to global configuration section ([018542722](https://github.com/tech-leads-club/agent-skills/commit/018542722))
- rename installedSkillsAtom to installedSkillsAsyncAtom and unwrap it ([6d7943e77](https://github.com/tech-leads-club/agent-skills/commit/6d7943e77))
- expose EnvironmentCheckState interface and clean up logic ([ce9c26f71](https://github.com/tech-leads-club/agent-skills/commit/ce9c26f71))
- clean up project.json formatting and structure ([9fed256dc](https://github.com/tech-leads-club/agent-skills/commit/9fed256dc))
- streamline symlink creation and enhance install result details ([51b48e83e](https://github.com/tech-leads-club/agent-skills/commit/51b48e83e))
- replace local state with jotai atoms for selected agents and skills ([fa36beccb](https://github.com/tech-leads-club/agent-skills/commit/fa36beccb))
- replace useInstalledSkills hook with useAtomValue for installedSkills ([d97cc3ca7](https://github.com/tech-leads-club/agent-skills/commit/d97cc3ca7))
- replace useInstalledSkills hook with installedSkillsAtom ([661975f43](https://github.com/tech-leads-club/agent-skills/commit/661975f43))
- replace useInstalledSkills hook with installedSkillsAtom ([3eef5128a](https://github.com/tech-leads-club/agent-skills/commit/3eef5128a))
- replace useInstalledSkills hook with installedSkillsAtom ([4880a24c0](https://github.com/tech-leads-club/agent-skills/commit/4880a24c0))
- replace useEnvironmentCheck hook with environmentCheckAtom ([34947b328](https://github.com/tech-leads-club/agent-skills/commit/34947b328))
- enhance diagnostics configuration in jest transform ([5dc3d2d71](https://github.com/tech-leads-club/agent-skills/commit/5dc3d2d71))
- add allowImportingTsExtensions option to compiler options ([ef57355f5](https://github.com/tech-leads-club/agent-skills/commit/ef57355f5))
- change moduleResolution to node16 for compatibility ([7892b482a](https://github.com/tech-leads-club/agent-skills/commit/7892b482a))
- update import path for constants in config service ([533b57374](https://github.com/tech-leads-club/agent-skills/commit/533b57374))
- update import path for PACKAGE_NAME in global-path service ([dbeb0802e](https://github.com/tech-leads-club/agent-skills/commit/dbeb0802e))
- update import path for constants in installer service ([3a1ebe864](https://github.com/tech-leads-club/agent-skills/commit/3a1ebe864))
- update import path for constants in lockfile service ([1939a774c](https://github.com/tech-leads-club/agent-skills/commit/1939a774c))
- update import path for constants in registry service ([d31a04928](https://github.com/tech-leads-club/agent-skills/commit/d31a04928))
- remove unused local skills path logic and related imports ([d8a3f40a5](https://github.com/tech-leads-club/agent-skills/commit/d8a3f40a5))
- update import path for constants in update cache service ([67cc318a8](https://github.com/tech-leads-club/agent-skills/commit/67cc318a8))
- update import path for package name constant ([dbaebc346](https://github.com/tech-leads-club/agent-skills/commit/dbaebc346))
- reorganize local skills catalog checks and remove unused function ([fe95ffc00](https://github.com/tech-leads-club/agent-skills/commit/fe95ffc00))
- update import path for PACKAGE_NAME to use constants module ([a2ca48990](https://github.com/tech-leads-club/agent-skills/commit/a2ca48990))
- replace hardcoded skills directory path with constant ([dbab170cb](https://github.com/tech-leads-club/agent-skills/commit/dbab170cb))
- replace hardcoded paths with constants for better maintainability ([eb6568082](https://github.com/tech-leads-club/agent-skills/commit/eb6568082))
- remove hardcoded package name from package-info ([5aa5ef9b0](https://github.com/tech-leads-club/agent-skills/commit/5aa5ef9b0))
- replace hardcoded values with constants for configuration ([35026b6c1](https://github.com/tech-leads-club/agent-skills/commit/35026b6c1))
- update cache TTL constant to use value from constants module ([63f10e420](https://github.com/tech-leads-club/agent-skills/commit/63f10e420))
- reorder imports for better organization ([fb9a48c8e](https://github.com/tech-leads-club/agent-skills/commit/fb9a48c8e))
- update JSX settings in TypeScript configuration ([b5a2c187b](https://github.com/tech-leads-club/agent-skills/commit/b5a2c187b))
- update jest configuration for improved test matching and module handling ([f44ff64f1](https://github.com/tech-leads-club/agent-skills/commit/f44ff64f1))
- remove implicit dependencies and streamline build targets ([8b8dcbc0c](https://github.com/tech-leads-club/agent-skills/commit/8b8dcbc0c))

### ⚠️  Breaking Changes

- add CLI description for clarity and security emphasis  ([c918702d7](https://github.com/tech-leads-club/agent-skills/commit/c918702d7))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.13.0 (2026-02-10)

### 🚀 Features

- add TRAE agent configuration and update documentation ([93ef566](https://github.com/tech-leads-club/agent-skills/commit/93ef566))

### 💅 Refactors

- change installation method from 'symlink' to 'copy' ([82c451f](https://github.com/tech-leads-club/agent-skills/commit/82c451f))
- change option from 'copy' to 'symlink' for skill installation ([b8519d8](https://github.com/tech-leads-club/agent-skills/commit/b8519d8))

### ❤️ Thank You

- Felipe Rodrigues @felipfr
- may-santos

## 0.12.0 (2026-02-10)

### 🚀 Features

- enhance skill update command to fetch and update installed skills ([5e40f99](https://github.com/tech-leads-club/agent-skills/commit/5e40f99))
- add content hash to skill lock entry during installation ([5117c51](https://github.com/tech-leads-club/agent-skills/commit/5117c51))
- add content hash parameter to skill lock entry ([6955ad5](https://github.com/tech-leads-club/agent-skills/commit/6955ad5))
- add content hash management for skill metadata caching ([a928fee](https://github.com/tech-leads-club/agent-skills/commit/a928fee))
- add content hash computation and metadata handling tests ([a95f0f7](https://github.com/tech-leads-club/agent-skills/commit/a95f0f7))
- implement smart update functionality for skills installation ([d3e1da3](https://github.com/tech-leads-club/agent-skills/commit/d3e1da3))
- implement smart update configuration for agents ([882bd53](https://github.com/tech-leads-club/agent-skills/commit/882bd53))
- **cli:** add support for Droid agent ([1e2a70a](https://github.com/tech-leads-club/agent-skills/commit/1e2a70a))

### 🩹 Fixes

- **cli:** add dynamic pagination to select prompts ([8a6c755](https://github.com/tech-leads-club/agent-skills/commit/8a6c755))

### 💅 Refactors

- **cli:** unify pagination logic and truncate long options ([c275894](https://github.com/tech-leads-club/agent-skills/commit/c275894))

### ❤️ Thank You

- Edmar Paulino
- Felipe Rodrigues @felipfr

## 0.11.1 (2026-02-07)

### 🩹 Fixes

- update log message to trigger release ([0e483f6](https://github.com/tech-leads-club/agent-skills/commit/0e483f6))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.11.0 (2026-02-06)

This was a version bump only for @tech-leads-club/agent-skills to align it with other projects, there were no code changes.

## 0.10.0 (2026-02-06)

### 🚀 Features

- enhance registry fetching with fallback and improved concurrency ([b2aa436](https://github.com/tech-leads-club/agent-skills/commit/b2aa436))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.9.1 (2026-02-06)

### 🩹 Fixes

- remove unused global skills path functions ([be047f0](https://github.com/tech-leads-club/agent-skills/commit/be047f0))
- remove unused global skill path retrieval in symlink handler ([5dfa447](https://github.com/tech-leads-club/agent-skills/commit/5dfa447))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.9.0 (2026-02-06)

### 🚀 Features

- enhance skill installation process with update handling and validation ([1f478da](https://github.com/tech-leads-club/agent-skills/commit/1f478da))
- update CDN URL structure and improve skill metadata fetching ([d0c44b1](https://github.com/tech-leads-club/agent-skills/commit/d0c44b1))
- enhance installation wizard with skill validation and update handling ([a1ffa7b](https://github.com/tech-leads-club/agent-skills/commit/a1ffa7b))
- update installation summary message to reflect action type ([84cfbfb](https://github.com/tech-leads-club/agent-skills/commit/84cfbfb))
- add functions to retrieve installed skills and update configurations ([622980b](https://github.com/tech-leads-club/agent-skills/commit/622980b))
- add prefix text to spinner for improved UI consistency ([17f47cb](https://github.com/tech-leads-club/agent-skills/commit/17f47cb))
- add optional isUpdate field to install options ([88fa776](https://github.com/tech-leads-club/agent-skills/commit/88fa776))
- add spinner utility for loading states in CLI ([da26d28](https://github.com/tech-leads-club/agent-skills/commit/da26d28))
- enhance multi-select and confirm prompts with improved rendering and state management ([03c78c4](https://github.com/tech-leads-club/agent-skills/commit/03c78c4))
- enhance interactive installation with async skill loading and updates ([5dc80d2](https://github.com/tech-leads-club/agent-skills/commit/5dc80d2))
- implement skills discovery and management functions ([5f497da](https://github.com/tech-leads-club/agent-skills/commit/5f497da))
- implement skills registry management and caching functionality ([af90dea](https://github.com/tech-leads-club/agent-skills/commit/af90dea))
- update skill loading to use async function with spinner ([c45688d](https://github.com/tech-leads-club/agent-skills/commit/c45688d))
- add optional forceUpdate property to InstallOptions interface ([d63dc4d](https://github.com/tech-leads-club/agent-skills/commit/d63dc4d))
- add commands for updating and managing skills cache ([4dd2a20](https://github.com/tech-leads-club/agent-skills/commit/4dd2a20))

### ❤️ Thank You

- Felipe Rodrigues

## 0.8.1 (2026-02-05)

### 🩹 Fixes

- improve pagination logic ([a63e1d4](https://github.com/tech-leads-club/agent-skills/commit/a63e1d4))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.8.0 (2026-02-05)

### 🚀 Features

- enhance skill and agent selection with cursor support ([bcee6be](https://github.com/tech-leads-club/agent-skills/commit/bcee6be))

### 🩹 Fixes

- resolve dependency conflicts and ensure cross-platform test compatibility ([b642481](https://github.com/tech-leads-club/agent-skills/commit/b642481))

### ❤️ Thank You

- Edmar Paulino

## 0.7.0 (2026-01-31)

### 🚀 Features

- add grouped multi-select functionality with headers ([a7812b2](https://github.com/tech-leads-club/agent-skills/commit/a7812b2))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.6.0 (2026-01-31)

This was a version bump only for @tech-leads-club/agent-skills to align it with other projects, there were no code changes.

## 0.5.3 (2026-01-29)

### 🩹 Fixes

- antigravity global location path for skills ([bb85ec1](https://github.com/tech-leads-club/agent-skills/commit/bb85ec1))

### ❤️ Thank You

- Edmar Paulino

## 0.5.2 (2026-01-27)

### 🩹 Fixes

- ensure correct categories file path resolution ([02c5968](https://github.com/tech-leads-club/agent-skills/commit/02c5968))
- improve skills directory lookup logic ([a9eecea](https://github.com/tech-leads-club/agent-skills/commit/a9eecea))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.5.1 (2026-01-27)

### 🩹 Fixes

- **cli:** force bump to 0.5.1 ([c3624d2](https://github.com/tech-leads-club/agent-skills/commit/c3624d2))
- **cli:** force bump to 0.5.1 ([1f9f780](https://github.com/tech-leads-club/agent-skills/commit/1f9f780))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.5.0 (2026-01-27)

This was a version bump only for @tech-leads-club/agent-skills to align it with other projects, there were no code changes.

## 0.3.0 (2026-01-26)

### 🚀 Features

- add shebang to JavaScript output for CLI compatibility ([f2c9453](https://github.com/tech-leads-club/agent-skills/commit/f2c9453))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.2.0 (2026-01-25)

### 🚀 Features

- use package version from package.json for CLI versioning ([cc23397](https://github.com/tech-leads-club/agent-skills/commit/cc23397))
- add installation summary display for skills and agents ([13dc11f](https://github.com/tech-leads-club/agent-skills/commit/13dc11f))
- implement interactive installation wizard for skills and agents ([3bdd983](https://github.com/tech-leads-club/agent-skills/commit/3bdd983))
- add function to display available skills with installation status ([c8896e1](https://github.com/tech-leads-club/agent-skills/commit/c8896e1))
- implement interactive skill removal process ([5ea69a4](https://github.com/tech-leads-club/agent-skills/commit/5ea69a4))
- add functions to display installation and removal results ([4606e3c](https://github.com/tech-leads-club/agent-skills/commit/4606e3c))
- add utility functions for agent options and installed skills ([f54e25c](https://github.com/tech-leads-club/agent-skills/commit/f54e25c))
- add truncate function for text length management ([70870b0](https://github.com/tech-leads-club/agent-skills/commit/70870b0))
- implement blue select and confirm prompts with back navigation ([21b05e1](https://github.com/tech-leads-club/agent-skills/commit/21b05e1))
- add logo generation and screen initialization functions ([359e6a2](https://github.com/tech-leads-club/agent-skills/commit/359e6a2))
- add gradient styles and logging functions for UI components ([75fb2e5](https://github.com/tech-leads-club/agent-skills/commit/75fb2e5))
- update skills directory logic and enhance skill discovery ([da1aff9](https://github.com/tech-leads-club/agent-skills/commit/da1aff9))
- add unit tests for categories configuration and logic ([ca4e001](https://github.com/tech-leads-club/agent-skills/commit/ca4e001))
- implement category management and skill assignment functionality ([7eb3bb2](https://github.com/tech-leads-club/agent-skills/commit/7eb3bb2))
- add detailed install result interface for better tracking ([0d48a0b](https://github.com/tech-leads-club/agent-skills/commit/0d48a0b))
- implement skill lock file management functions ([c8b6e1d](https://github.com/tech-leads-club/agent-skills/commit/c8b6e1d))
- enhance skill installation process with symlink and copy methods ([195ffa0](https://github.com/tech-leads-club/agent-skills/commit/195ffa0))
- add remove command for uninstalling skills ([a8be796](https://github.com/tech-leads-club/agent-skills/commit/a8be796))
- add function to find project root directory ([1cfe620](https://github.com/tech-leads-club/agent-skills/commit/1cfe620))
- use project root for skill installation paths ([f27e81c](https://github.com/tech-leads-club/agent-skills/commit/f27e81c))
- enhance agent installation detection for project root ([b7fca84](https://github.com/tech-leads-club/agent-skills/commit/b7fca84))
- add global path utilities for skill management ([36f45e5](https://github.com/tech-leads-club/agent-skills/commit/36f45e5))
- implement global symlink handling for skill installation ([b45b92e](https://github.com/tech-leads-club/agent-skills/commit/b45b92e))
- add update check functionality for package versioning ([e034070](https://github.com/tech-leads-club/agent-skills/commit/e034070))
- enhance installer tests with global symlink handling ([b44be21](https://github.com/tech-leads-club/agent-skills/commit/b44be21))
- add project configuration for CLI application ([1ee7ad5](https://github.com/tech-leads-club/agent-skills/commit/1ee7ad5))
- implement skill installation and listing functionality ([ba9cb2c](https://github.com/tech-leads-club/agent-skills/commit/ba9cb2c))
- implement interactive skill installation and listing commands ([945f255](https://github.com/tech-leads-club/agent-skills/commit/945f255))
- add agent configuration and detection functionality ([b35851a](https://github.com/tech-leads-club/agent-skills/commit/b35851a))
- implement skill discovery and management functions ([4fd5139](https://github.com/tech-leads-club/agent-skills/commit/4fd5139))
- add interfaces for agent configuration and skill management ([74ea8f8](https://github.com/tech-leads-club/agent-skills/commit/74ea8f8))
- add TypeScript configuration for testing with Jest ([32aa9a1](https://github.com/tech-leads-club/agent-skills/commit/32aa9a1))
- add TypeScript configuration for CLI package ([f23d900](https://github.com/tech-leads-club/agent-skills/commit/f23d900))
- add initial CLI package configuration for agent skills ([072af1d](https://github.com/tech-leads-club/agent-skills/commit/072af1d))
- add Jest configuration for CLI testing ([b7d098e](https://github.com/tech-leads-club/agent-skills/commit/b7d098e))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.1.0-beta.3 (2026-01-25)

### 🚀 Features

- use package version from package.json for CLI versioning ([cc23397](https://github.com/tech-leads-club/agent-skills/commit/cc23397))
- add installation summary display for skills and agents ([13dc11f](https://github.com/tech-leads-club/agent-skills/commit/13dc11f))
- implement interactive installation wizard for skills and agents ([3bdd983](https://github.com/tech-leads-club/agent-skills/commit/3bdd983))
- add function to display available skills with installation status ([c8896e1](https://github.com/tech-leads-club/agent-skills/commit/c8896e1))
- implement interactive skill removal process ([5ea69a4](https://github.com/tech-leads-club/agent-skills/commit/5ea69a4))
- add functions to display installation and removal results ([4606e3c](https://github.com/tech-leads-club/agent-skills/commit/4606e3c))
- add utility functions for agent options and installed skills ([f54e25c](https://github.com/tech-leads-club/agent-skills/commit/f54e25c))
- add truncate function for text length management ([70870b0](https://github.com/tech-leads-club/agent-skills/commit/70870b0))
- implement blue select and confirm prompts with back navigation ([21b05e1](https://github.com/tech-leads-club/agent-skills/commit/21b05e1))
- add logo generation and screen initialization functions ([359e6a2](https://github.com/tech-leads-club/agent-skills/commit/359e6a2))
- add gradient styles and logging functions for UI components ([75fb2e5](https://github.com/tech-leads-club/agent-skills/commit/75fb2e5))
- update skills directory logic and enhance skill discovery ([da1aff9](https://github.com/tech-leads-club/agent-skills/commit/da1aff9))
- add unit tests for categories configuration and logic ([ca4e001](https://github.com/tech-leads-club/agent-skills/commit/ca4e001))
- implement category management and skill assignment functionality ([7eb3bb2](https://github.com/tech-leads-club/agent-skills/commit/7eb3bb2))
- add detailed install result interface for better tracking ([0d48a0b](https://github.com/tech-leads-club/agent-skills/commit/0d48a0b))
- implement skill lock file management functions ([c8b6e1d](https://github.com/tech-leads-club/agent-skills/commit/c8b6e1d))
- enhance skill installation process with symlink and copy methods ([195ffa0](https://github.com/tech-leads-club/agent-skills/commit/195ffa0))
- add remove command for uninstalling skills ([a8be796](https://github.com/tech-leads-club/agent-skills/commit/a8be796))
- add function to find project root directory ([1cfe620](https://github.com/tech-leads-club/agent-skills/commit/1cfe620))
- use project root for skill installation paths ([f27e81c](https://github.com/tech-leads-club/agent-skills/commit/f27e81c))
- enhance agent installation detection for project root ([b7fca84](https://github.com/tech-leads-club/agent-skills/commit/b7fca84))
- add global path utilities for skill management ([36f45e5](https://github.com/tech-leads-club/agent-skills/commit/36f45e5))
- implement global symlink handling for skill installation ([b45b92e](https://github.com/tech-leads-club/agent-skills/commit/b45b92e))
- add update check functionality for package versioning ([e034070](https://github.com/tech-leads-club/agent-skills/commit/e034070))
- enhance installer tests with global symlink handling ([b44be21](https://github.com/tech-leads-club/agent-skills/commit/b44be21))
- add project configuration for CLI application ([1ee7ad5](https://github.com/tech-leads-club/agent-skills/commit/1ee7ad5))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.1.0-beta.2 (2026-01-25)

### 🚀 Features

- add .nvmrc file with Node.js version ([2b0071d](https://github.com/tech-leads-club/agent-skills/commit/2b0071d))
- add TypeScript configuration for project setup ([1abc21f](https://github.com/tech-leads-club/agent-skills/commit/1abc21f))
- add guide for creating AI subagents with isolated context ([0c130d8](https://github.com/tech-leads-club/agent-skills/commit/0c130d8))
- add spec-driven development skill for feature planning ([dfaac3f](https://github.com/tech-leads-club/agent-skills/commit/dfaac3f))
- add design, implementation, task, and validation documentation ([e5f7904](https://github.com/tech-leads-club/agent-skills/commit/e5f7904))
- add skill-creator guide for effective AI agent skills ([b0b5674](https://github.com/tech-leads-club/agent-skills/commit/b0b5674))
- update cursor skill creator description and name for clarity ([997b35e](https://github.com/tech-leads-club/agent-skills/commit/997b35e))
- add cursor subagent creator skill for complex workflows ([6e1b6f0](https://github.com/tech-leads-club/agent-skills/commit/6e1b6f0))
- implement skill installation and listing functionality ([ba9cb2c](https://github.com/tech-leads-club/agent-skills/commit/ba9cb2c))
- implement interactive skill installation and listing commands ([945f255](https://github.com/tech-leads-club/agent-skills/commit/945f255))
- add agent configuration and detection functionality ([b35851a](https://github.com/tech-leads-club/agent-skills/commit/b35851a))
- add interactive skill installation and management prompts ([fe52459](https://github.com/tech-leads-club/agent-skills/commit/fe52459))
- implement skill discovery and management functions ([4fd5139](https://github.com/tech-leads-club/agent-skills/commit/4fd5139))
- add interfaces for agent configuration and skill management ([74ea8f8](https://github.com/tech-leads-club/agent-skills/commit/74ea8f8))
- add TypeScript configuration for testing with Jest ([32aa9a1](https://github.com/tech-leads-club/agent-skills/commit/32aa9a1))
- add TypeScript configuration for CLI package ([f23d900](https://github.com/tech-leads-club/agent-skills/commit/f23d900))
- add initial CLI package configuration for agent skills ([072af1d](https://github.com/tech-leads-club/agent-skills/commit/072af1d))
- add Jest configuration for CLI testing ([b7d098e](https://github.com/tech-leads-club/agent-skills/commit/b7d098e))
- add release workflow for automated deployment on push ([195cad7](https://github.com/tech-leads-club/agent-skills/commit/195cad7))
- add CI configuration for validating skills structure ([66fa03b](https://github.com/tech-leads-club/agent-skills/commit/66fa03b))
- add TypeScript configuration for project setup ([2a7ee33](https://github.com/tech-leads-club/agent-skills/commit/2a7ee33))
- add comprehensive README for agent skills documentation ([7f7063d](https://github.com/tech-leads-club/agent-skills/commit/7f7063d))
- add symlink for AGENTS.md to CLAUDE.md ([a429576](https://github.com/tech-leads-club/agent-skills/commit/a429576))
- add AGENTS.md for guidance on AI coding agents ([3e0917d](https://github.com/tech-leads-club/agent-skills/commit/3e0917d))
- add initial configuration ([4584775](https://github.com/tech-leads-club/agent-skills/commit/4584775))
- add nx configuration for project management and build processes ([c937d0e](https://github.com/tech-leads-club/agent-skills/commit/c937d0e))
- add Jest configuration for project testing ([c5141b9](https://github.com/tech-leads-club/agent-skills/commit/c5141b9))
- add Jest preset configuration for TypeScript testing ([df7f962](https://github.com/tech-leads-club/agent-skills/commit/df7f962))
- add ESLint configuration for TypeScript with recommended rules ([7e04b65](https://github.com/tech-leads-club/agent-skills/commit/7e04b65))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.1.0-beta.1 (2026-01-25)

### 🚀 Features

- add .nvmrc file with Node.js version ([2b0071d](https://github.com/tech-leads-club/agent-skills/commit/2b0071d))
- add TypeScript configuration for project setup ([1abc21f](https://github.com/tech-leads-club/agent-skills/commit/1abc21f))
- add guide for creating AI subagents with isolated context ([0c130d8](https://github.com/tech-leads-club/agent-skills/commit/0c130d8))
- add spec-driven development skill for feature planning ([dfaac3f](https://github.com/tech-leads-club/agent-skills/commit/dfaac3f))
- add design, implementation, task, and validation documentation ([e5f7904](https://github.com/tech-leads-club/agent-skills/commit/e5f7904))
- add skill-creator guide for effective AI agent skills ([b0b5674](https://github.com/tech-leads-club/agent-skills/commit/b0b5674))
- update cursor skill creator description and name for clarity ([997b35e](https://github.com/tech-leads-club/agent-skills/commit/997b35e))
- add cursor subagent creator skill for complex workflows ([6e1b6f0](https://github.com/tech-leads-club/agent-skills/commit/6e1b6f0))
- implement skill installation and listing functionality ([ba9cb2c](https://github.com/tech-leads-club/agent-skills/commit/ba9cb2c))
- implement interactive skill installation and listing commands ([945f255](https://github.com/tech-leads-club/agent-skills/commit/945f255))
- add agent configuration and detection functionality ([b35851a](https://github.com/tech-leads-club/agent-skills/commit/b35851a))
- add interactive skill installation and management prompts ([fe52459](https://github.com/tech-leads-club/agent-skills/commit/fe52459))
- implement skill discovery and management functions ([4fd5139](https://github.com/tech-leads-club/agent-skills/commit/4fd5139))
- add interfaces for agent configuration and skill management ([74ea8f8](https://github.com/tech-leads-club/agent-skills/commit/74ea8f8))
- add TypeScript configuration for testing with Jest ([32aa9a1](https://github.com/tech-leads-club/agent-skills/commit/32aa9a1))
- add TypeScript configuration for CLI package ([f23d900](https://github.com/tech-leads-club/agent-skills/commit/f23d900))
- add initial CLI package configuration for agent skills ([072af1d](https://github.com/tech-leads-club/agent-skills/commit/072af1d))
- add Jest configuration for CLI testing ([b7d098e](https://github.com/tech-leads-club/agent-skills/commit/b7d098e))
- add release workflow for automated deployment on push ([195cad7](https://github.com/tech-leads-club/agent-skills/commit/195cad7))
- add CI configuration for validating skills structure ([66fa03b](https://github.com/tech-leads-club/agent-skills/commit/66fa03b))
- add TypeScript configuration for project setup ([2a7ee33](https://github.com/tech-leads-club/agent-skills/commit/2a7ee33))
- add comprehensive README for agent skills documentation ([7f7063d](https://github.com/tech-leads-club/agent-skills/commit/7f7063d))
- add symlink for AGENTS.md to CLAUDE.md ([a429576](https://github.com/tech-leads-club/agent-skills/commit/a429576))
- add AGENTS.md for guidance on AI coding agents ([3e0917d](https://github.com/tech-leads-club/agent-skills/commit/3e0917d))
- add initial configuration ([4584775](https://github.com/tech-leads-club/agent-skills/commit/4584775))
- add nx configuration for project management and build processes ([c937d0e](https://github.com/tech-leads-club/agent-skills/commit/c937d0e))
- add Jest configuration for project testing ([c5141b9](https://github.com/tech-leads-club/agent-skills/commit/c5141b9))
- add Jest preset configuration for TypeScript testing ([df7f962](https://github.com/tech-leads-club/agent-skills/commit/df7f962))
- add ESLint configuration for TypeScript with recommended rules ([7e04b65](https://github.com/tech-leads-club/agent-skills/commit/7e04b65))

### ❤️ Thank You

- Felipe Rodrigues @felipfr

## 0.1.0-beta.0 (2026-01-25)

### 🚀 Features

- add TypeScript configuration for project setup ([1abc21f](https://github.com/tech-leads-club/agent-skills/commit/1abc21f))
- add guide for creating AI subagents with isolated context ([0c130d8](https://github.com/tech-leads-club/agent-skills/commit/0c130d8))
- add spec-driven development skill for feature planning ([dfaac3f](https://github.com/tech-leads-club/agent-skills/commit/dfaac3f))
- add design, implementation, task, and validation documentation ([e5f7904](https://github.com/tech-leads-club/agent-skills/commit/e5f7904))
- add skill-creator guide for effective AI agent skills ([b0b5674](https://github.com/tech-leads-club/agent-skills/commit/b0b5674))
- update cursor skill creator description and name for clarity ([997b35e](https://github.com/tech-leads-club/agent-skills/commit/997b35e))
- add cursor subagent creator skill for complex workflows ([6e1b6f0](https://github.com/tech-leads-club/agent-skills/commit/6e1b6f0))
- implement skill installation and listing functionality ([ba9cb2c](https://github.com/tech-leads-club/agent-skills/commit/ba9cb2c))
- implement interactive skill installation and listing commands ([945f255](https://github.com/tech-leads-club/agent-skills/commit/945f255))
- add agent configuration and detection functionality ([b35851a](https://github.com/tech-leads-club/agent-skills/commit/b35851a))
- add interactive skill installation and management prompts ([fe52459](https://github.com/tech-leads-club/agent-skills/commit/fe52459))
- implement skill discovery and management functions ([4fd5139](https://github.com/tech-leads-club/agent-skills/commit/4fd5139))
- add interfaces for agent configuration and skill management ([74ea8f8](https://github.com/tech-leads-club/agent-skills/commit/74ea8f8))
- add TypeScript configuration for testing with Jest ([32aa9a1](https://github.com/tech-leads-club/agent-skills/commit/32aa9a1))
- add TypeScript configuration for CLI package ([f23d900](https://github.com/tech-leads-club/agent-skills/commit/f23d900))
- add initial CLI package configuration for agent skills ([072af1d](https://github.com/tech-leads-club/agent-skills/commit/072af1d))
- add Jest configuration for CLI testing ([b7d098e](https://github.com/tech-leads-club/agent-skills/commit/b7d098e))
- add release workflow for automated deployment on push ([195cad7](https://github.com/tech-leads-club/agent-skills/commit/195cad7))
- add CI configuration for validating skills structure ([66fa03b](https://github.com/tech-leads-club/agent-skills/commit/66fa03b))
- add TypeScript configuration for project setup ([2a7ee33](https://github.com/tech-leads-club/agent-skills/commit/2a7ee33))
- add comprehensive README for agent skills documentation ([7f7063d](https://github.com/tech-leads-club/agent-skills/commit/7f7063d))
- add symlink for AGENTS.md to CLAUDE.md ([a429576](https://github.com/tech-leads-club/agent-skills/commit/a429576))
- add AGENTS.md for guidance on AI coding agents ([3e0917d](https://github.com/tech-leads-club/agent-skills/commit/3e0917d))
- add initial configuration ([4584775](https://github.com/tech-leads-club/agent-skills/commit/4584775))
- add nx configuration for project management and build processes ([c937d0e](https://github.com/tech-leads-club/agent-skills/commit/c937d0e))
- add Jest configuration for project testing ([c5141b9](https://github.com/tech-leads-club/agent-skills/commit/c5141b9))
- add Jest preset configuration for TypeScript testing ([df7f962](https://github.com/tech-leads-club/agent-skills/commit/df7f962))
- add ESLint configuration for TypeScript with recommended rules ([7e04b65](https://github.com/tech-leads-club/agent-skills/commit/7e04b65))

### ❤️ Thank You

- Felipe Rodrigues @felipfr