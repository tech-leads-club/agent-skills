# Excalidraw Templates

This directory contains pre-built `.excalidraw` template files for reference. 

**IMPORTANT**: These are large JSON files (10-32KB each) that should **NOT be read by AI agents** to avoid excessive token usage.

## Purpose

These templates are provided as:
- **Human reference** — Users can open them directly in Excalidraw to see examples
- **Backup examples** — Reference implementations of each diagram type
- **Testing artifacts** — Known-good Excalidraw files for validation

## Agent Instructions

**DO NOT read these files.** Instead:

1. Read `../excalidraw-schema.md` for the complete Excalidraw element format and JSON structure
2. Read `../element-types.md` for guidance on extracting information for each diagram type
3. Generate diagrams from scratch following the documented schema

The schema documentation contains all structural patterns, sizing conventions, and best practices needed to create valid Excalidraw diagrams without reading these large template files.

## Available Templates

| Template                                         | Size  | Diagram Type       |
| ------------------------------------------------ | ----- | ------------------ |
| `flowchart-template.excalidraw`                  | 16KB  | Process flows      |
| `relationship-template.excalidraw`               | 9KB   | Entity connections |
| `mindmap-template.excalidraw`                    | 32KB  | Concept hierarchies|
| `data-flow-diagram-template.excalidraw`          | 10KB  | Data movement      |
| `business-flow-swimlane-template.excalidraw`     | 10KB  | Cross-functional   |
| `class-diagram-template.excalidraw`              | 12KB  | OOP design         |
| `sequence-diagram-template.excalidraw`           | 15KB  | Interaction flow   |
| `er-diagram-template.excalidraw`                 | 14KB  | Database schema    |

## For Users

You can open any of these `.excalidraw` files in:
- [Excalidraw web app](https://excalidraw.com) (Open → drag and drop)
- VS Code Excalidraw extension
- Obsidian Excalidraw plugin

Use them as starting points or reference examples for your own diagrams.
