# Stitch Integration Guide

Read this file when the user has no existing mockups in Figma or similar tools,
is unsure about what they want visually, or when you need to generate Stitch
prompts or interact with the Stitch MCP. Also read when the user asks about
Stitch setup, configuration, or troubleshooting.

## Table of Contents

1. What is Stitch
2. When to Suggest Stitch
3. MCP Setup & Authentication
4. Generating Effective Stitch Prompts
5. Design Modes
6. Device Types
7. Design Systems via MCP
8. Variants & Creative Range
9. MCP Tools Reference
10. Full Integration Workflow

---

## 1. What is Stitch

Google Stitch (stitch.withgoogle.com) is an AI-powered UI design tool from
Google Labs that generates complete interface designs from text prompts or
uploaded images. It runs on Gemini 3 Pro and Gemini 3 Flash.

Key capabilities for our workflow:

- Generates full UI layouts from natural language descriptions
- Supports mobile, desktop, tablet, and agnostic device types
- Generates multiple design variants for comparison
- Exports HTML/CSS code and Figma-compatible layouts
- Creates interactive prototypes for testing hover states and interactions
- Has a full MCP server with 14 tools for programmatic control
- Supports Design Systems with tokens (colors, typography, shapes)

Stitch is FREE (Google Labs) with generation limits:

- Gemini 3 Flash: faster generation, higher monthly limits
- Gemini 3 Pro: higher fidelity, deeper reasoning, lower limits

Stitch is an IDEATION tool — it generates starting points, not final
production code. This makes it perfect for our workflow: visualize first,
code after approval.

---

## 2. When to Suggest Stitch

### Always suggest when ALL of these are true

- The user has NOT mentioned existing mockups (Figma, Sketch, Adobe XD, etc.)
- The project involves visual UI (not just backend or logic)
- The project has more than one screen OR the user is unsure about direction

### Strongly suggest when ANY of these are true

- User says "I don't know what I want" or similar uncertainty
- User can't provide visual references
- User wants to compare multiple design directions quickly
- Project is in early ideation / MVP phase
- User mentions "prototype" or "mockup" without a specific tool

### Do NOT suggest when

- User already has Figma/Sketch files ready
- User explicitly says they don't want to use external tools
- The task is a single small component (button, input, card)
- User is doing a code-only refactor with no visual changes

### How to suggest it

Frame it as a time-saver, not a requirement. Example:

"Before we write any code, I'd suggest we prototype this in Google Stitch
first. It'll take 2 minutes to generate the screens, you can see exactly
what the result will look like, and we avoid any rework. I can generate
the prompts for you — you just paste them in stitch.withgoogle.com.

If you have the Stitch MCP connected, I can even generate the designs
directly from here. Want me to help you set that up?"

---

## 3. MCP Setup & Authentication

Stitch exposes a remote MCP server at a single URL. Any AI agent or IDE
that supports HTTP-based MCP servers can connect to it.

### Connection Essentials

```
MCP Server URL:  https://stitch.googleapis.com/mcp
Auth method:     API Key (recommended) or OAuth token
```

### API Key Setup (Recommended)

1. Go to stitch.withgoogle.com → Settings → API Keys
2. Click "Create API Key"
3. Copy and store securely (never commit to public repos)

### Generic MCP Configuration Pattern

Every MCP client uses the same core structure — only the config file
format and field names differ. The universal pattern is:

```
Server URL:  https://stitch.googleapis.com/mcp
Header:      X-Goog-Api-Key: <YOUR-API-KEY>
```

When helping the user configure their specific tool:

1. Ask which agent/IDE they use
2. Locate where that tool stores MCP server configs (usually a JSON file)
3. Apply the pattern above using that tool's config schema

For reference, here are examples for common tools (may change — always
defer to the tool's own MCP documentation if these don't work):

**JSON-based config** (Cursor, VSCode, Windsurf, Antigravity, etc.):

```json
{
  "url": "https://stitch.googleapis.com/mcp",
  "headers": {
    "X-Goog-Api-Key": "YOUR-API-KEY"
  }
}
```

**CLI-based config** (Claude Code, Gemini CLI, etc.):

```
<tool> mcp add stitch --transport http https://stitch.googleapis.com/mcp --header "X-Goog-Api-Key: YOUR-API-KEY"
```

The exact file path and wrapping structure varies per tool. If the user
doesn't know where their config goes, suggest checking the tool's docs
for "MCP server configuration" or "remote MCP setup".

### OAuth (Advanced — edge cases only)

Some environments don't allow persistent API keys on disk. In those
cases, Stitch supports OAuth via Google Cloud Application Default
Credentials. This requires the gcloud CLI, a Google Cloud project with
the Stitch API enabled, and generates short-lived tokens (~1 hour).

The OAuth setup header pattern is:

```
Authorization:      Bearer <ACCESS_TOKEN>
X-Goog-User-Project: <PROJECT_ID>
```

If the user needs OAuth, refer them to the official Stitch MCP setup
documentation at stitch.withgoogle.com/docs/mcp/setup for the most
current instructions. Do NOT attempt to script this — the process
involves browser-based login flows that are best done interactively.

### Verifying Connection

After setup, ask the agent: "Show me my Stitch projects" or
"List my Stitch projects". If it returns results or an empty list
(not an error), the connection is working.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| "Unauthenticated" error | API key invalid or OAuth token expired — regenerate |
| "Permission denied" | For OAuth: ensure `serviceUsageConsumer` role is granted |
| Connection timeout | Stitch MCP is remote — check internet, retry in 30s |
| Tool not found | Ensure MCP URL is exactly `https://stitch.googleapis.com/mcp` |
| Config not recognized | Check your tool's MCP docs for the correct config format |

---

## 4. Generating Effective Stitch Prompts

### The Prompt Formula

Every Stitch prompt should follow this structure:

```
Idea:    What it is (app type, purpose, name if applicable)
Theme:   The core visual direction (adjectives, style keywords, contrast)
Content: The actual content on the screen (sections, components, text)
Image:   Optional reference image for visual direction
```

The first prompt does NOT need to be perfect. Stitch is iterative —
generate, review, refine one thing at a time.

### Prompt Quality Rules

DO:

- Be specific about what components appear on screen
- Use UI/UX keywords: "navigation bar", "card layout", "hero section",
  "call-to-action button", "drop shadow", "visual hierarchy"
- Set the vibe with adjectives: "minimalist", "vibrant", "high-contrast"
- Reference specific screens: "On the login screen, change..."
- One major change per refinement prompt

DON'T:

- Write 5000+ character prompts (Stitch drops components)
- Combine multiple structural changes in one edit prompt
- Say vague things like "make it look cool" — use Style Word Bank instead
- Forget to specify which screen when editing

### Translating Design Direction to Stitch Prompts

When generating prompts from the agreed Design Direction (Phase 3),
map each element systematically:

| Design Direction element | Stitch prompt mapping |
|--------------------------|----------------------|
| Mood/vibe | Idea + Theme section with adjectives |
| Color palette | Theme: specific hex codes or mood description |
| Typography | Theme: font name if in Stitch's 29 fonts, or description |
| Layout approach | Content: describe grid, spacing, component arrangement |
| Icon style | Content: describe icon treatment in components |
| References applied | Use key descriptors from refs, not URLs |

### Stitch's Supported Fonts (29 families)

Sans-serif: Inter, Roboto, DM Sans, Geist, Sora, Manrope, Lexend,
Epilogue, Be Vietnam Pro, Plus Jakarta Sans, Public Sans, Space Grotesk,
Spline Sans, Work Sans, Montserrat, Metropolis, Source Sans Three,
Nunito Sans, Arimo, Hanken Grotesk, Rubik, IBM Plex Sans

Serif: Newsreader, Noto Serif, Domine, Libre Caslon Text, EB Garamond,
Literata, Source Serif Four

If the user's chosen font is not in this list, pick the closest match
from the list above and note the substitution. The final code will use
the actual desired font — Stitch is just for prototyping.

### Prompt Templates by Project Type

**Landing Page:**

```
Idea: A landing page for [product/service name] — [one-line description].
Theme: [mood adjectives]. [Light/Dark] theme with [color description].
  [Style keyword if applicable: Editorial, Bento Grid, Swiss Style, etc.]
Content: Hero section with headline "[actual headline text]" and
  subheadline "[actual subheadline]". [CTA button text]. Features section
  with [N] cards showing [what each card represents]. [Additional sections:
  testimonials, pricing, FAQ, footer]. Navigation with links to [items].
```

**Dashboard:**

```
Idea: A [type] dashboard for [purpose/audience].
Theme: [mood]. [Light/Dark] mode with [color] accents. Dense but organized.
Content: Sidebar navigation with [items]. Main area with [widget types:
  charts, KPIs, tables, etc.]. Header with [search/notifications/profile].
  [Specific data to display in each widget].
```

**Mobile App Screen:**

```
Idea: [Screen name] screen for [app name] — [app description].
Theme: [mood]. [Color scheme]. [Style keyword].
Content: [Top navigation/header]. [Main content area with specific
  components]. [Bottom navigation with tab items]. [Specific text,
  labels, and placeholder data].
```

**E-commerce:**

```
Idea: [Page type: product listing / product detail / cart / checkout]
  for [store name] selling [product type].
Theme: [mood]. [Colors]. [Style: minimal, luxury, playful, etc.]
Content: [Specific components: product grid with N columns, filters,
  price display, add-to-cart button, image gallery, reviews section].
```

### Refinement Prompt Patterns

After initial generation, refine with targeted prompts:

- Layout: "Change the product grid from 2 columns to a 4-column desktop
  layout. Maintain the card spacing and style."
- Typography: "Change headings to a serif font. Increase the hero
  headline size to create stronger visual hierarchy."
- Color: "Update the accent color to [hex]. Ensure all interactive
  elements (buttons, links) use this new accent."
- Component: "Add a search bar to the header, positioned to the right
  of the logo. Style it with a subtle border and search icon."
- Imagery: "Change background of all product images to light taupe.
  Ensure images have consistent padding within their cards."

---

## 5. Design Modes

### Thinking with 3 Pro

- **Use for:** Complex logic, multi-section layouts, dashboards,
  production-candidate designs
- **Behavior:** Takes longer, "thinks" through implications — navigation
  flow, hierarchy, color interactions
- **Best when:** Building complex dashboards, nuanced landing pages,
  multi-step flows
- **MCP `modelId`:** `GEMINI_3_PRO` (current value — may change as new
  models are released)

### Gemini 3 Flash

- **Use for:** Quick ideation, rapid iteration, exploring multiple concepts
- **Behavior:** Fast generation, good for getting past blank canvas
- **Best when:** Early exploration, generating many options quickly
- **MCP `modelId`:** `GEMINI_3_FLASH` (current value — may change)

### Default Model Selection

When generating via MCP, use `MODEL_ID_UNSPECIFIED` as the default.
This lets Stitch choose the best available model automatically. Only
specify a concrete model when the user has an explicit need:

- Speed priority → use the Flash-tier model
- Quality priority → use the Pro-tier model
- No preference → omit `modelId` or use `MODEL_ID_UNSPECIFIED`

Note: model enum values are set by Stitch's API and may be updated
as new models are released. If a known enum value stops working,
fall back to `MODEL_ID_UNSPECIFIED` and inform the user.

### Redesign (Nano Banana Pro)

- **Use for:** Modernizing existing UIs, stylistic experiments, vibe-based
  workflows
- **Behavior:** Excels at applying specific design aesthetics
- **Only in Stitch UI** (not available via MCP)

### The Style Word Bank (for Redesign mode and prompt enrichment)

Use these keywords to give precise creative direction:

**Layout & Structure:**

- Bento Grid — modular, card-based, compartmentalized
- Editorial — magazine feel, large serif headings, generous whitespace
- Swiss Style — grid systems, sans-serif, flush-left, objectively clear
- Split-Screen — vertical division, color block paired with imagery

**Texture & Depth:**

- Glassmorphism — frosted glass, translucency, background blur
- Claymorphism — soft 3D shapes, inner shadows, friendly/tactile
- Skeuomorphic — realistic textures (leather, paper, metal)
- Grainy/Noise — film grain overlays on gradients, warmth

**Atmosphere & Era:**

- Brutalist — raw, system fonts, high contrast, hard edges
- Cyberpunk — dark mode, neon accents (cyan/magenta), glitch effects
- Y2K — chrome textures, bubble letters, bright blues/pinks, pill buttons
- Retro-Futurism — 80s synthwave, sunsets, wireframe grids, VHS aesthetic

**Color & Contrast:**

- Duotone — entire UI from two contrasting colors
- Monochromatic — single base hue with shade variations
- Pastel Goth — soft pastels with stark black typography
- Dark Mode OLED — true black (#000000), maximum contrast

These keywords can be combined in prompts:
"Redesign this dashboard. Use a modern Bento Grid layout. Dark mode
background. Use the Inter font for headers."

---

## 6. Device Types

### Choosing the Right Type

| Type | Use when | MCP enum |
|------|----------|----------|
| Mobile | Primary mobile app, phone-first UI | `MOBILE` |
| Desktop | Web apps, dashboards, wide layouts | `DESKTOP` |
| Tablet | Tablet-specific apps, iPad layouts | `TABLET` |
| Agnostic | Not tied to a specific device | `AGNOSTIC` |

### How Device Type Affects Generation

- **Mobile:** Optimizes for vertical scroll, bottom navigation (thumb
  zones), stacked content
- **Desktop:** Optimizes for horizontal layouts, top navigation,
  multi-column grids
- **Tablet:** Hybrid approach

### Translating Between Device Types

Don't resize — translate. When converting app to web (or vice versa),
prompt for the structural changes needed:

```
Navigation: "Consolidate the bottom tab bar into a horizontal
  navigation bar at the top with links for [items]."
Hero: "Transform the stacked mobile hero into a split-layout
  hero section. Text on left, image covering the right."
Grid: "Update from 2-column mobile layout to 4-column desktop grid.
  Maintain the card style and spacing rhythm."
```

Pro tip: When switching device type within a project, Stitch may hide
content below the frame boundary. Increase the frame height to reveal
the full generated layout.

---

## 7. Design Systems via MCP

Design Systems in Stitch ensure visual consistency across all screens
in a project. They map directly to our Design Direction (Phase 3).

### Creating a Design System from Design Direction

Map the agreed Design Direction to Stitch's DesignTheme:

```
Design Direction           → DesignTheme field
─────────────────────────────────────────────
Light/dark preference      → colorMode: "LIGHT" or "DARK"
Heading font               → font: closest from 29 supported fonts
Border radius preference   → roundness: ROUND_FOUR/EIGHT/TWELVE/FULL
Primary brand color (hex)  → customColor: "#hexcode"
Color temperature          → preset: closest preset name
Light background (hex)     → backgroundLight: "#hexcode"
Dark background (hex)      → backgroundDark: "#hexcode"
Overall mood description   → description: brief theme text
Additional guidelines      → styleGuidelines: freeform text
```

### MCP Call: create_design_system

```json
{
  "projectId": "PROJECT_ID",
  "designSystem": {
    "displayName": "Project Brand Identity",
    "theme": {
      "colorMode": "DARK",
      "font": "GEIST",
      "roundness": "ROUND_EIGHT",
      "preset": "blue",
      "customColor": "#1a1a2e",
      "backgroundDark": "#0a0a0f",
      "description": "Clean, modern dark theme with blue accents"
    },
    "styleGuidelines": "Spacious layout with card-based components. Strong typographic hierarchy. Subtle hover animations."
  }
}
```

### Applying to Screens

After creating the design system, apply it to all screens:

```json
{
  "projectId": "PROJECT_ID",
  "selectedScreenIds": ["screen1", "screen2", "screen3"],
  "assetId": "DESIGN_SYSTEM_ASSET_ID"
}
```

This ensures every screen follows the same visual tokens.

---

## 8. Variants & Creative Range

Variants generate 1-5 alternative versions of a screen. Crucial for
the prototyping phase when the user needs to compare options.

### When to Generate Variants

- User is unsure between two visual directions
- Want to explore layout alternatives
- Testing different color schemes
- Getting unstuck ("I know it's not right but I don't know why")

### Creative Range

| Range | Behavior | Use when |
|-------|----------|----------|
| REFINE | Keeps structure, tweaks fonts/spacing/colors | Polishing |
| EXPLORE | Balanced exploration (default) | Comparing options |
| REIMAGINE | Complete restructure allowed | Starting over or pivoting |

### Variant Aspects

Focus generation on specific dimensions:

| Aspect | What changes |
|--------|-------------|
| LAYOUT | Element arrangement and grid structure |
| COLOR_SCHEME | Color palette variations |
| IMAGES | Image usage and treatment |
| TEXT_FONT | Typography choices |
| TEXT_CONTENT | Actual text content |

### MCP Call: generate_variants

```json
{
  "projectId": "PROJECT_ID",
  "selectedScreenIds": ["screen_to_vary"],
  "prompt": "Explore different layout approaches for the hero section while maintaining the dark theme",
  "variantOptions": {
    "variantCount": 3,
    "creativeRange": "EXPLORE",
    "aspects": ["LAYOUT", "COLOR_SCHEME"]
  },
  "deviceType": "DESKTOP"
}
```

Omit `modelId` to let Stitch choose, or specify one if the user
has a preference for speed vs quality.

### Iterating on Variants

1. Generate 3-5 variants with EXPLORE range
2. User picks the closest to their vision
3. Generate 2-3 more with REFINE range on the winner
4. User approves → proceed to code

---

## 9. MCP Tools Reference

### Project Management

| Tool | Purpose | Key params |
|------|---------|-----------|
| `create_project` | New design project | `title` (string) |
| `get_project` | Get project details | `name` (format: `projects/{id}`) |
| `delete_project` | Delete project (irreversible!) | `name` |
| `list_projects` | List all projects | `filter`: "owned" or "shared" |

### Screen Management

| Tool | Purpose | Key params |
|------|---------|-----------|
| `list_screens` | All screens in project | `projectId` |
| `get_screen` | Screen details + code + image URLs | `name`, `projectId`, `screenId` |

The `get_screen` response includes:

- `htmlCode` — File object with `downloadUrl` for the HTML/CSS
- `screenshot` — File object with `downloadUrl` for the PNG image
- `figmaExport` — File object for Figma-compatible export
- `theme` — DesignTheme used for generation
- `prompt` — Original prompt used

### AI Generation

| Tool | Purpose | Key params |
|------|---------|-----------|
| `generate_screen_from_text` | Generate new screen | `projectId`, `prompt`, `deviceType`, `modelId` (optional) |
| `upload_screens_from_images` | Upload images as screens | `projectId`, `images[]` (base64 + mimeType) |
| `edit_screens` | Edit existing screens | `projectId`, `selectedScreenIds[]`, `prompt`, `deviceType`, `modelId` (optional) |
| `generate_variants` | Generate design variants | `projectId`, `selectedScreenIds[]`, `prompt`, `variantOptions`, `modelId` (optional) |

IMPORTANT: `generate_screen_from_text` and `edit_screens` take a few
minutes. Connection errors don't mean failure — check with `get_screen`
after a few minutes. Do NOT retry immediately or you'll create duplicates.

If `output_components` contains `suggestion` entries, present them to
the user. If accepted, call again with the suggestion as the new prompt.

### Design Systems

| Tool | Purpose | Key params |
|------|---------|-----------|
| `create_design_system` | Create new system | `designSystem` (DesignSystem object), `projectId` |
| `update_design_system` | Update existing system | `designSystem` (Asset wrapper with `name`) |
| `list_design_systems` | List systems | `projectId` (optional) |
| `apply_design_system` | Apply to screens | `projectId`, `selectedScreenIds[]`, `assetId` |

### Device Type Enum Values

`DEVICE_TYPE_UNSPECIFIED`, `MOBILE`, `DESKTOP`, `TABLET`, `AGNOSTIC`

### Model ID Enum Values

`MODEL_ID_UNSPECIFIED` (default — recommended), `GEMINI_3_PRO` (higher
quality), `GEMINI_3_FLASH` (faster). These enum values may change as
Stitch releases new models — always prefer `MODEL_ID_UNSPECIFIED` unless
the user has a specific reason to pin a model.

### Roundness Enum Values

`ROUND_FOUR` (4px), `ROUND_EIGHT` (8px), `ROUND_TWELVE` (12px), `ROUND_FULL`

### Color Mode Enum Values

`LIGHT`, `DARK`

### Creative Range Enum Values

`REFINE` (subtle), `EXPLORE` (balanced), `REIMAGINE` (radical)

### Variant Aspect Enum Values

`LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, `TEXT_CONTENT`

### Font Enum Values (29 supported)

INTER, ROBOTO, DM_SANS, GEIST, SORA, MANROPE, LEXEND, EPILOGUE,
BE_VIETNAM_PRO, PLUS_JAKARTA_SANS, PUBLIC_SANS, SPACE_GROTESK,
SPLINE_SANS, WORK_SANS, MONTSERRAT, METROPOLIS, SOURCE_SANS_THREE,
NUNITO_SANS, ARIMO, HANKEN_GROTESK, RUBIK, IBM_PLEX_SANS,
NEWSREADER, NOTO_SERIF, DOMINE, LIBRE_CASLON_TEXT, EB_GARAMOND,
LITERATA, SOURCE_SERIF_FOUR

---

## 10. Full Integration Workflow

### Scenario A: MCP Available (direct integration)

```
1. Create project:
   → create_project(title: "Project Name")
   → Save the returned project ID

2. Create design system from approved Design Direction:
   → create_design_system(projectId, designSystem with theme tokens)
   → Save the returned asset ID

3. Generate first screen:
   → generate_screen_from_text(projectId, prompt, deviceType)
   → Omit modelId to let Stitch choose the best model
   → Wait 1-2 minutes, then get_screen to retrieve result
   → Present screenshot to user for review

4. If user wants alternatives:
   → generate_variants(projectId, screenIds, prompt, variantOptions)
   → Present all variants for comparison

5. If user wants edits:
   → edit_screens(projectId, screenIds, edit prompt)
   → Present updated result

6. Apply design system for consistency:
   → apply_design_system(projectId, allScreenIds, assetId)

7. Once approved, extract code:
   → get_screen for each approved screen
   → Download HTML from htmlCode.downloadUrl
   → Use HTML + screenshot as reference for final code generation

8. Proceed to Execution Plan and Atomic Build phases
   using Stitch outputs as the source of truth.
```

### Scenario B: No MCP (manual Stitch usage)

```
1. Suggest user opens stitch.withgoogle.com

2. Recommend device type based on project:
   - Mobile app → App mode
   - Website/dashboard → Web mode
   - Unsure → Start with primary use case

3. Generate prompts for the user following the formula:
   Idea + Theme + Content (+ optional reference image)

4. User pastes prompt in Stitch, generates design

5. User shares screenshot or describes result

6. Generate refinement prompts one change at a time

7. Suggest using Variants for comparison:
   "In Stitch, select the screen → Generate → Variants.
    Set Creative Range to [Refined/Creative] and generate
    3 options to compare."

8. Suggest using Edit Theme for quick adjustments:
   "Select the screen → Generate → Edit Theme.
    Here you can quickly change light/dark mode, accent
    color, corner radius, and font."

9. Suggest creating a Prototype to test:
   "Select the screen → Generate → Prototype.
    This creates an interactive version — check hover states,
    scroll behavior, and input sizes."

10. Once approved, user exports code (View Code → HTML/CSS)
    or exports to Figma for further refinement.

11. User shares exported code/screenshot for code generation phase.
```

### Converting Stitch HTML to Target Framework

Stitch exports HTML + Tailwind CSS. When converting to the user's
framework, use this approach:

1. Download the HTML from Stitch (via MCP or manual export)
2. Use the HTML as structural reference (not copy-paste)
3. Use the screenshot as visual reference
4. Rewrite in the target framework (React, Vue, Svelte, etc.)
   following the agreed Design Direction tokens
5. Maintain semantic HTML, accessibility, and responsive behavior
6. Replace Tailwind classes with the project's CSS approach if different
