# Excalidraw JSON Schema Reference

Read this file before generating your first diagram. It contains the correct element format, text container model, and binding system.

## Top-Level Structure

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```

## Element Properties

All elements share these base properties:

| Property          | Type        | Default         | Description                                                                             |
| ----------------- | ----------- | --------------- | --------------------------------------------------------------------------------------- |
| `id`              | string      | required        | Unique identifier (e.g., `"step-1"`, `"arrow-a-b"`)                                     |
| `type`            | string      | required        | `"rectangle"`, `"ellipse"`, `"diamond"`, `"arrow"`, `"line"`, `"text"`                  |
| `x`, `y`          | number      | required        | Position in pixels from top-left. Use multiples of 20 for grid alignment.               |
| `width`, `height` | number      | required        | Dimensions in pixels                                                                    |
| `strokeColor`     | string      | `"#1e1e1e"`     | Hex color for outline                                                                   |
| `backgroundColor` | string      | `"transparent"` | Hex color for fill                                                                      |
| `fillStyle`       | string      | `"solid"`       | `"solid"`, `"hachure"`, `"cross-hatch"`                                                 |
| `strokeWidth`     | number      | `2`             | Outline thickness (1-4)                                                                 |
| `strokeStyle`     | string      | `"solid"`       | `"solid"`, `"dashed"`, `"dotted"`                                                       |
| `roughness`       | number      | `1`             | Hand-drawn effect (0 = clean, 1 = sketch, 2 = rough)                                    |
| `opacity`         | number      | `100`           | Transparency (0-100)                                                                    |
| `roundness`       | object/null | varies          | `{ "type": 3 }` for rounded corners, `{ "type": 2 }` for curved arrows, `null` for text |
| `groupIds`        | string[]    | `[]`            | Group membership for compound elements                                                  |
| `locked`          | boolean     | `false`         | Lock element from editing                                                               |

**Required properties on ALL elements (Excalidraw will reject or misrender elements missing these):**

```json
{
  "angle": 0,
  "strokeStyle": "solid",
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "index": "a0",
  "isDeleted": false,
  "link": null,
  "locked": false,
  "seed": 1234567890,
  "version": 1,
  "versionNonce": 987654321,
  "updated": 1706659200000
}
```

- `index` is a fractional z-index string. Use `"a0"`, `"a1"`, `"a2"`, etc. in element order. Text elements must have higher index values than shapes and arrows so they render on top.
- Generate unique `seed` and `versionNonce` per element (any distinct integers work).
- Omitting any of these properties will cause elements to not render correctly.

**Additional required properties for arrows:**

```json
{
  "lastCommittedPoint": null,
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "backgroundColor": "transparent",
  "fillStyle": "solid"
}
```

**Additional required properties for text elements inside containers:**

```json
{
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "autoResize": true
}
```

## Text Inside Shapes (CRITICAL)

**DO NOT use a `label` shorthand or put `text` directly on shape elements.** The `label` shorthand is not parsed by Excalidraw's file format.

**Correct approach:** Add `boundElements` to the shape, then create a **separate text element** that references the shape via `containerId`. Always declare shapes first, arrows second, and text elements last — this ensures text renders on top and is never obscured by arrows.

```json
[
  {
    "id": "step-1",
    "type": "rectangle",
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 80,
    "backgroundColor": "#a5d8ff",
    "fillStyle": "solid",
    "strokeColor": "#1971c2",
    "strokeWidth": 2,
    "roundness": { "type": 3 },
    "boundElements": [
      { "type": "text", "id": "text-step-1" }
    ]
  },
  {
    "id": "text-step-1",
    "type": "text",
    "x": 130,
    "y": 128,
    "width": 140,
    "height": 24,
    "text": "Process Input",
    "originalText": "Process Input",
    "fontSize": 20,
    "fontFamily": 5,
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": "step-1",
    "lineHeight": 1.25,
    "strokeColor": "#1e1e1e",
    "roundness": null
  }
]
```

This works for `rectangle`, `ellipse`, and `diamond` elements.

**Required properties for text elements inside containers:**

| Property        | Value      | Description                                                          |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `containerId`   | required   | ID of the parent shape                                               |
| `originalText`  | required   | Exact copy of `text` — used by the Excalidraw editor                 |
| `lineHeight`    | `1.25`     | Always set this for contained text                                   |
| `text`          | required   | The text content. Use `\n` for line breaks.                          |
| `fontSize`      | `20`       | 14-36 depending on purpose                                           |
| `fontFamily`    | `5`        | 5 = Excalifont (hand-drawn), 1 = Virgil, 2 = Helvetica, 3 = Cascadia |
| `textAlign`     | `"center"` | `"left"`, `"center"`, `"right"`                                      |
| `verticalAlign` | `"middle"` | `"top"`, `"middle"`, `"bottom"`                                      |
| `strokeColor`   | `"#1e1e1e"` | Text color                                                          |
| `roundness`     | `null`     | Always null for text elements                                        |

**Text element positioning inside a container at (x, y, w, h):**

- `text.x = container.x + 20`
- `text.y = container.y + (container.height / 2) - (fontSize / 2)`
- `text.width = container.width - 40`
- `text.height = fontSize * lineHeight`

## Arrows and Bindings (CRITICAL)

### Basic Arrow

```json
{
  "id": "arrow-1",
  "type": "arrow",
  "x": 300,
  "y": 140,
  "width": 100,
  "height": 0,
  "points": [
    [0, 0],
    [100, 0]
  ],
  "roundness": { "type": 2 },
  "strokeWidth": 2
}
```

### Arrow with Label

Arrow labels also require `boundElements` on the arrow and a separate text element with `containerId`. **Do NOT use a `label` shorthand** — it is not supported.

```json
[
  {
    "id": "arrow-1",
    "type": "arrow",
    "x": 300,
    "y": 140,
    "width": 200,
    "height": 0,
    "points": [
      [0, 0],
      [200, 0]
    ],
    "roundness": { "type": 2 },
    "strokeWidth": 2,
    "boundElements": [
      { "type": "text", "id": "text-arrow-1" }
    ]
  },
  {
    "id": "text-arrow-1",
    "type": "text",
    "x": 360,
    "y": 122,
    "width": 80,
    "height": 18,
    "text": "sends data",
    "originalText": "sends data",
    "fontSize": 14,
    "fontFamily": 5,
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": "arrow-1",
    "lineHeight": 1.25,
    "strokeColor": "#1e1e1e",
    "roundness": null
  }
]
```

### Bound Arrows (connect to shapes)

For arrows that move when shapes are repositioned, use `startBinding` and `endBinding`. **Do NOT use `start`/`end`** — they are not valid Excalidraw properties.

Every connected shape must also list the arrow in its `boundElements` array.

**Element ordering matters for z-index:** declare shapes first, arrows second, text elements last — so text always renders on top.

```json
[
  {
    "id": "box-a",
    "type": "rectangle",
    "x": 100,
    "y": 100,
    "width": 160,
    "height": 80,
    "boundElements": [
      { "type": "text", "id": "text-box-a" },
      { "type": "arrow", "id": "arrow-a-b" }
    ]
  },
  {
    "id": "box-b",
    "type": "rectangle",
    "x": 460,
    "y": 100,
    "width": 160,
    "height": 80,
    "boundElements": [
      { "type": "text", "id": "text-box-b" },
      { "type": "arrow", "id": "arrow-a-b" }
    ]
  },
  {
    "id": "arrow-a-b",
    "type": "arrow",
    "x": 260,
    "y": 140,
    "width": 200,
    "height": 0,
    "points": [
      [0, 0],
      [200, 0]
    ],
    "startBinding": { "elementId": "box-a", "focus": 0, "gap": 1 },
    "endBinding": { "elementId": "box-b", "focus": 0, "gap": 1 },
    "boundElements": [
      { "type": "text", "id": "text-arrow-a-b" }
    ]
  },
  {
    "id": "text-box-a",
    "type": "text",
    "x": 120,
    "y": 128,
    "width": 120,
    "height": 24,
    "text": "Service A",
    "originalText": "Service A",
    "fontSize": 20,
    "fontFamily": 5,
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": "box-a",
    "lineHeight": 1.25,
    "strokeColor": "#1e1e1e",
    "roundness": null
  },
  {
    "id": "text-box-b",
    "type": "text",
    "x": 480,
    "y": 128,
    "width": 120,
    "height": 24,
    "text": "Service B",
    "originalText": "Service B",
    "fontSize": 20,
    "fontFamily": 5,
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": "box-b",
    "lineHeight": 1.25,
    "strokeColor": "#1e1e1e",
    "roundness": null
  },
  {
    "id": "text-arrow-a-b",
    "type": "text",
    "x": 320,
    "y": 122,
    "width": 80,
    "height": 18,
    "text": "REST API",
    "originalText": "REST API",
    "fontSize": 14,
    "fontFamily": 5,
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": "arrow-a-b",
    "lineHeight": 1.25,
    "strokeColor": "#1e1e1e",
    "roundness": null
  }
]
```

**Binding properties:**

| Property    | Value   | Description                                             |
| ----------- | ------- | ------------------------------------------------------- |
| `elementId` | string  | ID of the connected shape                               |
| `focus`     | `0`     | Connection point: 0 = center, -1/+1 = top-bottom edges  |
| `gap`       | `1`     | Gap in pixels between arrow tip and shape boundary      |

### Arrow Directions

| Direction      | Points                           |
| -------------- | -------------------------------- |
| Horizontal (→) | `[[0, 0], [200, 0]]`             |
| Vertical (↓)   | `[[0, 0], [0, 150]]`             |
| Diagonal (↘)   | `[[0, 0], [200, 150]]`           |
| L-shaped (→↓)  | `[[0, 0], [200, 0], [200, 150]]` |

## Design Tokens — Elegant Palette

Use these curated colors for professional, modern diagrams. Avoid raw primary colors.

### Light Theme (default)

| Role                  | Fill        | Stroke       | Hex Fill  | Hex Stroke |
| --------------------- | ----------- | ------------ | --------- | ---------- |
| **Primary**           | Soft blue   | Deeper blue  | `#a5d8ff` | `#1971c2`  |
| **Success/Process**   | Mint green  | Forest green | `#b2f2bb` | `#2f9e44`  |
| **Warning/Decision**  | Warm amber  | Deep amber   | `#ffec99` | `#e67700`  |
| **Danger/Error**      | Soft rose   | Deep rose    | `#ffc9c9` | `#e03131`  |
| **Neutral/Secondary** | Light gray  | Medium gray  | `#e9ecef` | `#868e96`  |
| **Accent**            | Soft violet | Deep violet  | `#d0bfff` | `#7048e8`  |
| **Info/Highlight**    | Soft cyan   | Teal         | `#96f2d7` | `#0c8599`  |
| **Canvas**            | White       | —            | `#ffffff` | —          |
| **Default stroke**    | —           | Near-black   | —         | `#1e1e1e`  |

### Open Colors — Full Palette

Excalidraw's native color picker is built around [Open Colors](https://yeun.github.io/open-colors/). Use shade-2 for fills and shade-8 for matching strokes to create depth.

| Family  | Fill (shade-2) | Stroke (shade-8) | Fill hex  | Stroke hex |
| ------- | -------------- | ---------------- | --------- | ---------- |
| Gray    | `gray-2`       | `gray-8`         | `#e9ecef` | `#343a40`  |
| Red     | `red-2`        | `red-8`          | `#ffc9c9` | `#c92a2a`  |
| Pink    | `pink-2`       | `pink-8`         | `#fcc2d7` | `#a61e4d`  |
| Grape   | `grape-2`      | `grape-8`        | `#e5dbff` | `#6741d9`  |
| Violet  | `violet-2`     | `violet-8`       | `#d0bfff` | `#5f3dc4`  |
| Indigo  | `indigo-2`     | `indigo-8`       | `#bac8ff` | `#3b5bdb`  |
| Blue    | `blue-2`       | `blue-8`         | `#a5d8ff` | `#1864ab`  |
| Cyan    | `cyan-2`       | `cyan-8`         | `#99e9f2` | `#0b7285`  |
| Teal    | `teal-2`       | `teal-8`         | `#96f2d7` | `#087f5b`  |
| Green   | `green-2`      | `green-8`        | `#b2f2bb` | `#2b8a3e`  |
| Lime    | `lime-2`       | `lime-8`         | `#d8f5a2` | `#5c940d`  |
| Yellow  | `yellow-2`     | `yellow-8`       | `#ffec99` | `#e67700`  |
| Orange  | `orange-2`     | `orange-8`       | `#ffd8a8` | `#d9480f`  |

### Curated Professional Palettes

Use one palette per diagram for visual coherence:

**Blue-Tech** (APIs, microservices, cloud):

- API/Gateway: fill `#a5d8ff`, stroke `#1971c2`
- Services: fill `#b2f2bb`, stroke `#2f9e44`
- Data: fill `#96f2d7`, stroke `#0c8599`
- Events: fill `#d0bfff`, stroke `#7048e8`

**Warm-Neutral** (business processes, workflows):

- Primary: fill `#ffd8a8`, stroke `#d9480f`
- Secondary: fill `#ffec99`, stroke `#e67700`
- Supporting: fill `#e9ecef`, stroke `#868e96`
- Action: fill `#b2f2bb`, stroke `#2f9e44`

**Monochrome** (clean/minimal):

- Main: fill `#e9ecef`, stroke `#343a40`
- Emphasis: fill `#ced4da`, stroke `#212529`
- Accent: fill `#a5d8ff`, stroke `#1971c2` (single color accent)

### Dark Theme

When user requests dark mode, set `"viewBackgroundColor": "#1e1e1e"` and use these:

| Role               | Fill       | Stroke      | Hex Fill  | Hex Stroke |
| ------------------ | ---------- | ----------- | --------- | ---------- |
| **Primary**        | Deep blue  | Light blue  | `#1864ab` | `#74c0fc`  |
| **Success**        | Deep green | Light green | `#2b8a3e` | `#8ce99a`  |
| **Warning**        | Deep amber | Light amber | `#e67700` | `#ffd43b`  |
| **Danger**         | Deep red   | Light red   | `#c92a2a` | `#ff8787`  |
| **Neutral**        | Dark gray  | Light gray  | `#343a40` | `#adb5bd`  |
| **Default stroke** | —          | White       | —         | `#ffffff`  |

### Typography Scale

| Purpose         | Font Size | Font Family     |
| --------------- | --------- | --------------- |
| Diagram title   | 28-32     | `fontFamily: 5` |
| Section header  | 22-24     | `fontFamily: 5` |
| Element label   | 18-20     | `fontFamily: 5` |
| Arrow label     | 14-16     | `fontFamily: 5` |
| Annotation/note | 12-14     | `fontFamily: 5` |

### Spacing System

All spacing based on `gridSize: 20`:

| Context                         | Value     | Grid multiples |
| ------------------------------- | --------- | -------------- |
| Between elements (horizontal)   | 200-300px | 10-15 units    |
| Between elements (vertical)     | 100-150px | 5-7.5 units    |
| Element padding (inside shapes) | 20-40px   | 1-2 units      |
| Arrow-to-shape clearance        | 20px      | 1 unit         |
| Canvas margin                   | 60px      | 3 units        |
| Between groups of elements      | 400px     | 20 units       |

## Font Families

| ID  | Name       | Style                | When to use                                        |
| --- | ---------- | -------------------- | -------------------------------------------------- |
| 5   | Excalifont | Hand-drawn (newest)  | Default — matches Excalidraw's signature aesthetic |
| 1   | Virgil     | Hand-drawn (classic) | Fallback if fontFamily 5 is not supported          |
| 2   | Helvetica  | Clean sans-serif     | Technical/formal diagrams when requested           |
| 3   | Cascadia   | Monospace            | Code labels, technical identifiers                 |

**Default to fontFamily 5 for all text** unless the user explicitly requests a formal/clean style.

## Visual Modes

Choose a visual mode upfront and apply it consistently. Never mix modes on same-level elements.

### Sketch Mode (default)

Excalidraw's signature hand-drawn aesthetic:

```json
{
  "roughness": 1,
  "fontFamily": 5
}
```

Apply `roughness: 1` to all shapes and arrows. Use `fontFamily: 5` (Excalifont) for all text.

### Clean Mode

Precise, polished, presentation-ready:

```json
{
  "roughness": 0,
  "fontFamily": 2
}
```

Apply `roughness: 0` to all shapes and arrows. Use `fontFamily: 2` (Helvetica) for body, `fontFamily: 5` for titles.

### Mixed Mode (recommended for architecture)

Background zones clean (`roughness: 0`) + foreground shapes sketchy (`roughness: 1`):

- Zones: `roughness: 0` — structural, precise
- Shapes: `roughness: 1` — content, approachable

## Background Zones

Background zones are semi-transparent dashed rectangles placed **before all other elements** (lowest `index` values) to create visual grouping regions.

**Required zone properties:**

```json
{
  "id": "zone-backend",
  "type": "rectangle",
  "x": 300,
  "y": 140,
  "width": 480,
  "height": 320,
  "angle": 0,
  "strokeColor": "#4c6ef5",
  "backgroundColor": "#dbe4ff",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "strokeStyle": "dashed",
  "roughness": 0,
  "opacity": 35,
  "roundness": { "type": 3 },
  "groupIds": [],
  "frameId": null,
  "index": "a0",
  "isDeleted": false,
  "link": null,
  "locked": false,
  "seed": 111111111,
  "version": 1,
  "versionNonce": 222222222,
  "updated": 1706659200000,
  "boundElements": []
}
```

**Critical zone properties:**

- `opacity: 35` — semi-transparent (20-40 range works; 35 is sweet spot)
- `strokeStyle: "dashed"` — marks zone as boundary, not a regular shape
- `roughness: 0` — clean zone edges even in sketch-mode diagrams
- `fillStyle: "solid"` — required for opacity tinting to work

**Zone label** — add a standalone text near top-left of zone, after other text in the array:

```json
{
  "id": "label-zone-backend",
  "type": "text",
  "x": 320,
  "y": 148,
  "width": 140,
  "height": 18,
  "text": "Backend Services",
  "originalText": "Backend Services",
  "fontSize": 14,
  "fontFamily": 5,
  "strokeColor": "#4c6ef5",
  "textAlign": "left",
  "containerId": null,
  "lineHeight": 1.25,
  "roundness": null
}
```

**Element ordering when zones are present:**

1. Background zones (indices `a0`, `a1`, ...)
2. Content shapes (indices continue after zones)
3. Arrows
4. Text elements (highest indices)

## Frames

Frames are named containers that group elements visually with a title bar. They appear in Excalidraw's left panel for navigation.

```json
{
  "id": "frame-1",
  "type": "frame",
  "x": 80,
  "y": 80,
  "width": 680,
  "height": 480,
  "angle": 0,
  "strokeColor": "#bbb",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "index": "a0",
  "isDeleted": false,
  "link": null,
  "locked": false,
  "seed": 100000001,
  "version": 1,
  "versionNonce": 100000002,
  "updated": 1706659200000,
  "name": "Order Processing Flow",
  "boundElements": []
}
```

Elements inside a frame reference it via `"frameId": "frame-1"`. The frame `name` appears as the frame's title.

Use frames for: multi-page diagrams, distinct diagram sections, export boundaries.

## Coordinate System

- Origin `(0, 0)` is top-left corner
- X increases to the right
- Y increases downward
- All units are in pixels
- Align to grid: position on multiples of 20 (when `gridSize: 20`)

## Element Sizing Guide

| Shape     | Content                  | Width     | Height    |
| --------- | ------------------------ | --------- | --------- |
| Rectangle | Single word              | 140-160px | 60-80px   |
| Rectangle | Short phrase (2-4 words) | 180-220px | 80-100px  |
| Rectangle | Sentence                 | 250-320px | 100-120px |
| Ellipse   | Short text (circle)      | 120×120px | —         |
| Ellipse   | Longer text              | 160×120px | —         |
| Diamond   | Short question           | 140×140px | —         |
| Diamond   | Longer question          | 180×180px | —         |

**Width formula for text:** `text.length × fontSize × 0.6`
**Height formula:** `fontSize × 1.2 × numberOfLines`

## Grouping Elements

Use `groupIds` to create compound elements that move together:

```json
[
  {
    "id": "server-box",
    "type": "rectangle",
    "x": 100,
    "y": 100,
    "width": 180,
    "height": 80,
    "groupIds": ["server-group"],
    "boundElements": [
      { "type": "text", "id": "text-server-box" }
    ]
  },
  {
    "id": "server-icon",
    "type": "text",
    "x": 105,
    "y": 185,
    "width": 30,
    "height": 30,
    "text": "🖥️",
    "fontSize": 20,
    "fontFamily": 5,
    "groupIds": ["server-group"],
    "containerId": null,
    "roundness": null
  },
  {
    "id": "text-server-box",
    "type": "text",
    "x": 120,
    "y": 128,
    "width": 140,
    "height": 24,
    "text": "Web Server",
    "originalText": "Web Server",
    "fontSize": 20,
    "fontFamily": 5,
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": "server-box",
    "lineHeight": 1.25,
    "strokeColor": "#1e1e1e",
    "groupIds": ["server-group"],
    "roundness": null
  }
]
```

## `customData` for Metadata

Store extra information on elements that persists with the file but doesn't render:

```json
{
  "id": "step-1",
  "type": "rectangle",
  "customData": {
    "diagramType": "flowchart",
    "stepNumber": 1,
    "generatedBy": "excalidraw-studio"
  }
}
```

## Complete Minimal Example

A flowchart with two connected shapes. Note the element order: shapes → arrows → text elements (ensures text is always rendered on top, never obscured by arrows).

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "title",
      "type": "text",
      "x": 100,
      "y": 40,
      "width": 300,
      "height": 35,
      "text": "User Registration Flow",
      "originalText": "User Registration Flow",
      "fontSize": 28,
      "fontFamily": 5,
      "textAlign": "center",
      "strokeColor": "#1e1e1e",
      "opacity": 100,
      "roundness": null,
      "containerId": null,
      "lineHeight": 1.25
    },
    {
      "id": "step-1",
      "type": "rectangle",
      "x": 100,
      "y": 120,
      "width": 200,
      "height": 80,
      "strokeColor": "#1971c2",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "roundness": { "type": 3 },
      "boundElements": [
        { "type": "text", "id": "text-step-1" },
        { "type": "arrow", "id": "arrow-1-2" }
      ]
    },
    {
      "id": "step-2",
      "type": "rectangle",
      "x": 400,
      "y": 120,
      "width": 200,
      "height": 80,
      "strokeColor": "#2f9e44",
      "backgroundColor": "#b2f2bb",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "roundness": { "type": 3 },
      "boundElements": [
        { "type": "text", "id": "text-step-2" },
        { "type": "arrow", "id": "arrow-1-2" }
      ]
    },
    {
      "id": "arrow-1-2",
      "type": "arrow",
      "x": 300,
      "y": 160,
      "width": 100,
      "height": 0,
      "points": [
        [0, 0],
        [100, 0]
      ],
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "roundness": { "type": 2 },
      "startBinding": { "elementId": "step-1", "focus": 0, "gap": 1 },
      "endBinding": { "elementId": "step-2", "focus": 0, "gap": 1 }
    },
    {
      "id": "text-step-1",
      "type": "text",
      "x": 130,
      "y": 148,
      "width": 140,
      "height": 24,
      "text": "Enter Email",
      "originalText": "Enter Email",
      "fontSize": 20,
      "fontFamily": 5,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": "step-1",
      "lineHeight": 1.25,
      "strokeColor": "#1e1e1e",
      "roundness": null
    },
    {
      "id": "text-step-2",
      "type": "text",
      "x": 430,
      "y": 148,
      "width": 140,
      "height": 24,
      "text": "Verify Email",
      "originalText": "Verify Email",
      "fontSize": 20,
      "fontFamily": 5,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": "step-2",
      "lineHeight": 1.25,
      "strokeColor": "#1e1e1e",
      "roundness": null
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```
