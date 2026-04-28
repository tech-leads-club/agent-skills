# Excalidraw Element Types Guide

Read this file when you need detailed guidance on which elements to use for specific diagram types, and how to construct them correctly.

For the JSON properties and format, see `excalidraw-schema.md`.

## Element Type Overview

| Type        | Shape | Primary Use                            | Text binding        | Arrow binding   |
| ----------- | ----- | -------------------------------------- | ------------------- | --------------- |
| `rectangle` | □     | Boxes, containers, process steps       | via `boundElements` | Arrows can bind |
| `ellipse`   | ○     | Start/end, states, emphasis            | via `boundElements` | Arrows can bind |
| `diamond`   | ◇     | Decision points, conditions            | via `boundElements` | Arrows can bind |
| `arrow`     | →     | Directional flow, relationships        | via `boundElements` | Binds to shapes |
| `line`      | —     | Non-directional connections, dividers  | ❌                   | Binds to shapes |
| `text`      | A     | Standalone labels, titles, annotations | —                   | Not bindable    |

## Shapes — Rectangle, Ellipse, Diamond

### When to use each

| Shape         | Best for                                         | Visual meaning                            |
| ------------- | ------------------------------------------------ | ----------------------------------------- |
| **Rectangle** | Process steps, entities, components, data stores | "This is a thing" or "This is an action"  |
| **Ellipse**   | Start/end terminals, states, emphasis            | "This is a boundary" or "This is a state" |
| **Diamond**   | Decision points, conditional branches            | "This is a question"                      |

### Text in shapes

**NEVER use `label: { text: "..." }` shorthand** — it is not supported in the `.excalidraw` file format. Always create a separate `text` element and link it via `containerId` and `boundElements`.

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
    "backgroundColor": "transparent",
    "autoResize": true,
    "roundness": null
  }
]
```

**Multi-line text:** Use `\n` in the `text` and `originalText` fields:

```json
{
  "text": "User\nAuthentication\nService",
  "originalText": "User\nAuthentication\nService"
}
```

**Text element positioning inside a container at (x, y, w, h):**

- `text.x = container.x + 20`
- `text.y = container.y + (container.height / 2) - (fontSize / 2)`
- `text.width = container.width - 40`
- `text.height = fontSize * 1.25`

### Size guidelines

| Content length | Rectangle | Ellipse | Diamond |
| -------------- | --------- | ------- | ------- |
| 1 word         | 140×70    | 120×120 | 140×140 |
| 2-4 words      | 200×80    | 160×120 | 180×180 |
| Short sentence | 280×100   | 200×140 | 220×220 |

### Styling for elegance

**Use stroke + fill combinations** — matching stroke to the fill's deeper shade:

| Role    | Fill      | Stroke    | Effect                        |
| ------- | --------- | --------- | ----------------------------- |
| Primary | `#a5d8ff` | `#1971c2` | Blue card with defined border |
| Success | `#b2f2bb` | `#2f9e44` | Green step with emphasis      |
| Warning | `#ffec99` | `#e67700` | Amber decision with warmth    |
| Danger  | `#ffc9c9` | `#e03131` | Red error with urgency        |
| Neutral | `#e9ecef` | `#868e96` | Subtle, de-emphasized         |
| Accent  | `#d0bfff` | `#7048e8` | Purple highlight              |

**fillStyle variations** for visual variety within the same diagram:

- `"solid"` — Clean, modern look (default for most shapes)
- `"hachure"` — Sketchy fill, good for secondary/background elements
- `"cross-hatch"` — Dense fill, good for emphasis or "completed" states

## Arrows

### Basic directional arrow

```json
{
  "id": "flow-1",
  "type": "arrow",
  "x": 300,
  "y": 140,
  "width": 200,
  "height": 0,
  "points": [
    [0, 0],
    [200, 0]
  ],
  "strokeWidth": 2,
  "roundness": { "type": 2 },
  "lastCommittedPoint": null,
  "startArrowhead": null,
  "endArrowhead": "arrow"
}
```

### Arrow with label

Arrow labels also require `boundElements` on the arrow + a separate text element with `containerId`. **Never use `label: { text: "..." }` on arrows.**

```json
[
  {
    "id": "flow-1",
    "type": "arrow",
    "x": 300,
    "y": 140,
    "width": 200,
    "height": 0,
    "points": [[0, 0], [200, 0]],
    "strokeWidth": 2,
    "roundness": { "type": 2 },
    "lastCommittedPoint": null,
    "startArrowhead": null,
    "endArrowhead": "arrow",
    "boundElements": [
      { "type": "text", "id": "text-flow-1" }
    ]
  },
  {
    "id": "text-flow-1",
    "type": "text",
    "x": 360,
    "y": 122,
    "width": 80,
    "height": 18,
    "text": "HTTP/JSON",
    "originalText": "HTTP/JSON",
    "fontSize": 14,
    "fontFamily": 5,
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": "flow-1",
    "lineHeight": 1.25,
    "strokeColor": "#1e1e1e",
    "backgroundColor": "transparent",
    "autoResize": true,
    "roundness": null
  }
]
```

### Bound arrow (connects to shapes)

Use `startBinding`/`endBinding` — **never `start`/`end`**. Connected shapes must list the arrow in their `boundElements`.

```json
[
  {
    "id": "source-box",
    "type": "rectangle",
    "boundElements": [
      { "type": "text", "id": "text-source" },
      { "type": "arrow", "id": "flow-1" }
    ]
  },
  {
    "id": "target-box",
    "type": "rectangle",
    "boundElements": [
      { "type": "text", "id": "text-target" },
      { "type": "arrow", "id": "flow-1" }
    ]
  },
  {
    "id": "flow-1",
    "type": "arrow",
    "points": [[0, 0], [200, 0]],
    "startBinding": { "elementId": "source-box", "focus": 0, "gap": 1 },
    "endBinding": { "elementId": "target-box", "focus": 0, "gap": 1 },
    "lastCommittedPoint": null,
    "startArrowhead": null,
    "endArrowhead": "arrow"
  }
]
```

### Arrow styles for semantic meaning

| Style                  | strokeStyle | strokeWidth | Meaning                              |
| ---------------------- | ----------- | ----------- | ------------------------------------ |
| **Primary flow**       | `"solid"`   | 2           | Main path, normal flow               |
| **Important flow**     | `"solid"`   | 3           | Critical path, emphasis              |
| **Optional/alternate** | `"dashed"`  | 2           | Optional path, fallback              |
| **Indirect/async**     | `"dotted"`  | 2           | Event-driven, async, weak dependency |

### Arrow directions

| Direction          | Points                           | Use case                |
| ------------------ | -------------------------------- | ----------------------- |
| → Right            | `[[0, 0], [200, 0]]`             | Process flow            |
| ↓ Down             | `[[0, 0], [0, 150]]`             | Hierarchy, sequence     |
| ↘ Diagonal         | `[[0, 0], [200, 150]]`           | Cross-connections       |
| → then ↓ (L-shape) | `[[0, 0], [200, 0], [200, 150]]` | Routing around elements |

## Lines

Non-directional connections with no arrowhead:

```json
{
  "type": "line",
  "x": 100,
  "y": 300,
  "points": [
    [0, 0],
    [400, 0]
  ],
  "strokeStyle": "dashed",
  "strokeWidth": 1,
  "strokeColor": "#868e96"
}
```

**Use cases:** Section dividers, boundaries, non-directional relationships (UML association).

## Standalone Text

For titles, headers, annotations not inside a shape. Set `containerId: null`:

```json
{
  "id": "title-1",
  "type": "text",
  "x": 100,
  "y": 40,
  "width": 300,
  "height": 35,
  "text": "System Architecture Overview",
  "originalText": "System Architecture Overview",
  "fontSize": 28,
  "fontFamily": 5,
  "textAlign": "center",
  "strokeColor": "#1e1e1e",
  "containerId": null,
  "lineHeight": 1.25,
  "roundness": null
}
```

**Width/height calculation:**

- Width ≈ `text.length × fontSize × 0.6`
- Height ≈ `fontSize × 1.2 × numberOfLines`

## Background Zones (Visual Grouping)

Background zones are large semi-transparent rectangles placed **behind** other elements to visually group them into regions. They are a key technique for professional architecture diagrams.

**Key properties for a zone:**

- `opacity: 35` — semi-transparent so elements behind/in front remain visible
- `strokeStyle: "dashed"` — clearly marks it as a boundary, not a shape
- `roughness: 0` — clean edges for background zones
- `fillStyle: "solid"` — needed for the opacity to show color

Zones must be declared **first** in the `elements` array so they render behind everything else.

```json
[
  {
    "id": "zone-backend",
    "type": "rectangle",
    "x": 300,
    "y": 140,
    "width": 480,
    "height": 320,
    "strokeColor": "#1971c2",
    "backgroundColor": "#dbe4ff",
    "fillStyle": "solid",
    "strokeWidth": 1,
    "strokeStyle": "dashed",
    "roughness": 0,
    "opacity": 35,
    "roundness": { "type": 3 },
    "boundElements": []
  }
]
```

Add a standalone text label near the top-left corner of the zone:

```json
{
  "id": "label-zone-backend",
  "type": "text",
  "x": 320,
  "y": 148,
  "width": 120,
  "height": 20,
  "text": "Backend Services",
  "originalText": "Backend Services",
  "fontSize": 14,
  "fontFamily": 5,
  "strokeColor": "#1971c2",
  "containerId": null,
  "lineHeight": 1.25,
  "roundness": null
}
```

**Element order with zones:** zones → shapes → arrows → text elements

**Zone color recommendations:**

| Zone purpose    | backgroundColor | strokeColor |
| --------------- | --------------- | ----------- |
| Services/Logic  | `#dbe4ff`       | `#4c6ef5`   |
| Data layer      | `#d3f9d8`       | `#2f9e44`   |
| External/Users  | `#fff9db`       | `#f08c00`   |
| Messaging/Events| `#f3d9fa`       | `#ae3ec9`   |
| Infrastructure  | `#e3fafc`       | `#0c8599`   |

## Visual Modes

Choose the diagram's visual mode upfront and apply it consistently to all elements.

### Sketch Mode (default — recommended for most diagrams)

Hand-drawn aesthetic, matches Excalidraw's signature look:

- `roughness: 1` on all shapes and arrows
- `fontFamily: 5` (Excalifont) for all text
- `strokeWidth: 2` for shapes, `strokeWidth: 2` for arrows

Best for: informal diagrams, brainstorming, process docs, most use cases.

### Clean Mode (for formal/technical diagrams)

Precise, polished, presentation-ready:

- `roughness: 0` on all shapes and arrows
- `fontFamily: 2` (Helvetica) for body text, `fontFamily: 5` for titles
- `strokeWidth: 1.5-2` for shapes

Best for: executive presentations, client-facing docs, technical specifications.

**Mixed mode:** Use `roughness: 0` for background zones and `roughness: 1` for shapes — zones feel like structure, shapes feel like content.

## Diagram Type Recipes

### Flowchart

```
[Start ellipse] → [Step rect] → [Decision diamond] → Yes → [Step rect] → [End ellipse]
                                                     ↓ No
                                                [Step rect]
```

- Start/End: `ellipse` with light green/red (`#b2f2bb`/`#ffc9c9`), `roundness: null`
- Steps: `rectangle` with light blue (`#a5d8ff`)
- Decisions: `diamond` with amber (`#ffec99`)
- Flow: solid arrows, labeled at decision branches ("Yes"/"No")

### Architecture Diagram

Use **background zones** to show layers (see Background Zones section):

```
[zone: Infrastructure]
  [zone: Backend Services]
    [API Gateway rect] → [Order Service rect] → [Orders DB ellipse]
                              ↓
                        [Event Bus rect] → [Worker rect]
  [zone: Data/Consumers]
```

- Components: `rectangle` with varied colors by layer
- Connections: solid arrows with protocol labels ("REST", "gRPC", "SQL")
- Zone boundaries: semi-transparent dashed rectangles with `opacity: 35`

### ER Diagram

- Entities: `rectangle` with entity name (bold, larger font)
- Attributes: listed in multi-line text inside the entity box
- Relationships: `diamond` with relationship name
- Cardinality: standalone text labels near arrows ("1", "N", "0..1")

### Sequence Diagram

- Actors: `rectangle` at top with actor name
- Lifelines: `line` (vertical, dashed, `strokeStyle: "dashed"`)
- Messages: `arrow` (horizontal, solid = sync, dashed = async)
- Return: `arrow` (dashed, reverse direction)
- Activation: thin `rectangle` on lifeline, no fill

### Mind Map

- Center: large `ellipse` with main topic (bright color, `roughness: 1`)
- Branches: `rectangle` connected via diagonal arrows from center
- Sub-topics: smaller `rectangle` connected from branches
- Use different colors per branch for visual grouping (one color family per branch)

### Class Diagram

- Classes: `rectangle` with multi-line text:

  ```
  ClassName
  ─────────
  -field: Type
  +field: Type
  ─────────
  +method(): Return
  -method(arg): Return
  ```

- Inheritance: solid arrow with label "extends"
- Implementation: dashed arrow with label "implements"
- Association: solid line (no arrowhead)

### Swimlane

- Lanes: tall `rectangle` with `fillStyle: "hachure"`, `opacity: 40`, `roughness: 0`
- Lane headers: standalone `text` at top of each lane
- Activities: `rectangle` inside lanes
- Handoffs: arrows crossing lane boundaries

### Data Flow Diagram (DFD)

- External entities: `rectangle` (bold stroke `strokeWidth: 3`)
- Processes: `ellipse` with process number and name
- Data stores: `rectangle` with open side (use two horizontal lines via `line` elements)
- Data flows: labeled arrows (always show data name on arrow)
- Direction: left-to-right or top-left to bottom-right

## Design Principles for Elegant Diagrams

1. **Visual hierarchy** — Use size and color intensity to signal importance. Primary elements get saturated fills; secondary elements use neutral or hachure fills.

2. **Consistent stroke weight** — Use `strokeWidth: 2` for all shapes and arrows. Only increase to 3-4 to emphasize critical paths.

3. **Color harmony** — Use at most 3-4 fill colors per diagram. Pick from the same palette row (see excalidraw-schema.md Design Tokens). Avoid mixing warm and cool haphazardly.

4. **Whitespace is structure** — More spacing between unrelated groups, less between related elements. This creates visual grouping without borders.

5. **Aligned, not scattered** — Align elements on a grid. Centers should be aligned vertically or horizontally whenever possible.

6. **Label everything that isn't obvious** — Every arrow should either have a label or its meaning should be clear from context. Every shape needs text.

7. **Flow direction convention** — Left-to-right for process flows. Top-to-bottom for hierarchies and sequences. Pick one and be consistent.

8. **Matching stroke to fill** — Use the deeper shade from the palette as stroke color for the corresponding fill. This creates depth and definition.

9. **Background zones over borders** — For grouping related elements, prefer semi-transparent background zones over explicit border rectangles. Zones feel spatial; borders feel like containers.

10. **Choose visual mode upfront** — Decide Sketch or Clean mode before generating elements. Never mix `roughness: 0` and `roughness: 1` on same-level shapes (zones and shapes can differ intentionally).

## Summary

| When you need...               | Use this element                                                              |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Process box, entity, component | `rectangle` with `boundElements` + separate text element                      |
| Decision point                 | `diamond` with `boundElements` + separate text element                        |
| Start/End terminal             | `ellipse` with `boundElements` + separate text element (`roundness: null`)    |
| Flow direction                 | `arrow` with `startBinding`/`endBinding`, label via `boundElements` if needed |
| Title/Header                   | `text` (large font, `containerId: null`)                                      |
| Annotation                     | `text` (small font, `containerId: null`, positioned near target)              |
| Non-directional connection     | `line`                                                                        |
| Section divider                | `line` (horizontal, dashed)                                                   |
| Visual grouping region         | `rectangle` (large, `opacity: 35`, `strokeStyle: "dashed"`, `roughness: 0`)  |
