# Icon Libraries

Read this file when the user requests diagrams with service icons (AWS, GCP, Azure, Kubernetes, etc.) or asks for professional architecture diagrams.

## How It Works

Excalidraw supports icon libraries (`.excalidrawlib` files) that provide professional, standardized icons. This skill can use pre-split icon libraries to create polished architecture diagrams.

## Checking for Available Libraries

```
Look for: libraries/<library-name>/reference.md
```

If `reference.md` exists, the library is ready. It contains a lookup table of all available icon names.

If no libraries are set up, offer two options:

1. Create the diagram using basic shapes (rectangles, ellipses) with labels — still functional, just less visually polished
2. Guide the user through library setup (see below)

## Using Icons (Python Scripts — Recommended)

The repository includes Python scripts that handle icon integration without consuming AI context tokens:

### Adding icons to a diagram

```bash
python scripts/add-icon-to-diagram.py \
  <diagram-path> <icon-name> <x> <y> \
  [--label "Text"] [--library-path PATH]
```

The `--label` flag adds a text label below the icon. Edit via `.excalidraw.edit` is enabled by default; pass `--no-use-edit-suffix` to disable.

**Examples:**

```bash
# Add EC2 icon at position (400, 300) with label
python scripts/add-icon-to-diagram.py diagram.excalidraw EC2 400 300 --label "Web Server"

# Add icon from a different library
python scripts/add-icon-to-diagram.py diagram.excalidraw Compute-Engine 500 200 \
  --library-path libraries/gcp-icons --label "API Server"
```

### Adding connecting arrows

```bash
python scripts/add-arrow.py \
  <diagram-path> <from-x> <from-y> <to-x> <to-y> \
  [--label "Text"] [--style solid|dashed|dotted] [--color HEX]
```

**Examples:**

```bash
# Simple arrow
python scripts/add-arrow.py diagram.excalidraw 300 250 500 300

# Arrow with label and custom style
python scripts/add-arrow.py diagram.excalidraw 400 350 600 400 \
  --label "HTTPS" --style dashed --color "#7950f2"
```

### Complete workflow

```bash
# 1. Create base diagram with title and structure
#    (Create .excalidraw file with basic elements: title text, region rectangles)

# 2. Check icon availability
#    Read: libraries/aws-architecture-icons/reference.md

# 3. Add icons with labels
python scripts/add-icon-to-diagram.py my-diagram.excalidraw "Internet-gateway" 200 150 --label "Internet Gateway"
python scripts/add-icon-to-diagram.py my-diagram.excalidraw VPC 250 250
python scripts/add-icon-to-diagram.py my-diagram.excalidraw ELB 350 300 --label "Load Balancer"
python scripts/add-icon-to-diagram.py my-diagram.excalidraw EC2 450 350 --label "Web Server"
python scripts/add-icon-to-diagram.py my-diagram.excalidraw RDS 550 400 --label "Database"

# 4. Add connecting arrows
python scripts/add-arrow.py my-diagram.excalidraw 250 200 300 250 --label "traffic"
python scripts/add-arrow.py my-diagram.excalidraw 300 300 400 300
python scripts/add-arrow.py my-diagram.excalidraw 500 380 600 400 --label "SQL" --style dashed
```

**Why use scripts:**

- ✅ No token consumption — icon JSON data (200-1000 lines each) never enters AI context
- ✅ Accurate coordinates — calculations handled deterministically
- ✅ Automatic ID management — no risk of collision
- ✅ Fast and reusable — works with any Excalidraw library

## Setting Up a Library

Guide the user through these steps:

### Step 1: Create library directory

```bash
mkdir -p skills/excalidraw-studio/libraries/<library-name>
```

### Step 2: Download library

- Visit: <https://libraries.excalidraw.com/>
- Search for the desired icon set (e.g., "AWS Architecture Icons")
- Click download to get the `.excalidrawlib` file
- Place it in the directory from Step 1

### Step 3: Run splitter script

```bash
python skills/excalidraw-studio/scripts/split-excalidraw-library.py \
  skills/excalidraw-studio/libraries/<library-name>/
```

### Step 4: Verify

After running the script, this structure should exist:

```
libraries/<library-name>/
  <library-name>.excalidrawlib  (original)
  reference.md                  (generated — icon lookup table)
  icons/                        (generated — individual icon files)
    API-Gateway.json
    EC2.json
    Lambda.json
    S3.json
    ...
```

## Manual Icon Integration (Fallback)

Only use this if Python scripts are unavailable. This approach is token-expensive and error-prone.

1. Read `libraries/<library-name>/reference.md` to find icon names
2. Read individual icon JSON files from `icons/` (200-1000 lines each)
3. Extract elements array, calculate bounding box, apply coordinate offset
4. Generate new unique IDs, update groupIds references
5. Copy transformed elements into the diagram

**Challenges:**

- ⚠️ High token consumption (200-1000 lines per icon)
- ⚠️ Complex coordinate transformation
- ⚠️ Risk of ID collision
- ⚠️ Time-consuming for many icons

## Supported Libraries

This workflow works with any valid `.excalidrawlib` file from <https://libraries.excalidraw.com/>. Common categories:

- Cloud service icons (AWS, GCP, Azure)
- Kubernetes / infrastructure icons
- UI / Material icons
- Network diagram icons

Availability and naming vary; verify on the site before recommending to users.
