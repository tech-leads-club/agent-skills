# Diagram Types — Complete Syntax Reference

Load this file when you need detailed syntax for a specific diagram type beyond what the quick examples in SKILL.md provide.

## Table of Contents

1. Flowchart (line ~20)
2. Sequence Diagram (line ~120)
3. Class Diagram (line ~220)
4. State Diagram (line ~310)
5. ERD (line ~380)
6. Gantt Chart (line ~440)
7. Pie Chart (line ~490)
8. Mindmap (line ~520)
9. Timeline (line ~560)
10. Git Graph (line ~600)
11. Sankey (line ~650)
12. XY Chart (line ~690)
13. Quadrant Chart (line ~730)
14. Block Diagram (line ~770)
15. User Journey (line ~820)
16. Requirement Diagram (line ~860)
17. Packet Diagram (line ~900)
18. Kanban (line ~930)

---

## 1. Flowchart

**Keyword:** `flowchart` or `graph`
**Directions:** `TD` (top-down), `LR` (left-right), `BT`, `RL`

### Node Shapes

```
A[Rectangle]           %% Standard process
B(Rounded)             %% Alternate process
C([Stadium])           %% Terminal/start-end
D{Diamond}             %% Decision
E{{Hexagon}}           %% Preparation
F[/Parallelogram/]     %% Input/Output
G[\Reverse parallel\]  %% Manual operation
H[(Database)]          %% Data store
I((Circle))            %% Connector
J>Asymmetric]          %% Flag/signal
K[[Subroutine]]        %% Predefined process
L(((Double Circle)))   %% Multiple documents
M[/Trapezoid\]         %% Manual input
N[\Inverse trapezoid/] %% Display
```

### Edge Types

```
A --> B                %% Arrow
A --- B                %% Line (no arrow)
A -.- B                %% Dotted line
A -.-> B               %% Dotted arrow
A ==> B                %% Thick arrow
A ~~~ B                %% Invisible link (spacing)
A --text--> B          %% Arrow with text
A -->|text| B          %% Arrow with text (alternate)
A <--> B               %% Bidirectional
A o--o B               %% Circle endpoints
A x--x B               %% Cross endpoints
```

### Subgraphs

```mermaid
flowchart TD
    subgraph Backend["Backend Services"]
        direction LR
        API[API Server]
        Worker[Background Worker]
    end

    subgraph Storage["Data Layer"]
        DB[(PostgreSQL)]
        Cache[(Redis)]
    end

    API --> DB
    API --> Cache
    Worker --> DB
```

### Styling

```mermaid
flowchart LR
    A[Success]:::success --> B[Warning]:::warning --> C[Error]:::error

    classDef success fill:#10b981,stroke:#059669,color:#fff
    classDef warning fill:#f59e0b,stroke:#d97706,color:#000
    classDef error fill:#ef4444,stroke:#dc2626,color:#fff
```

### Click Events

```
click A "https://example.com" "Tooltip text" _blank
click B callback "Tooltip"
```

---

## 2. Sequence Diagram

**Keyword:** `sequenceDiagram`

### Participant Types

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend App
    participant API as REST API
    participant DB as Database
```

### Message Types

```
A->>B: Solid arrow (synchronous request)
A-->>B: Dotted arrow (asynchronous response)
A-)B: Open arrow (async message, fire-and-forget)
A--)B: Dotted open arrow (async response)
A-xB: Cross arrow (lost message)
A--xB: Dotted cross arrow
```

### Activation Boxes

```
A->>+B: Request    %% Activate B
B-->>-A: Response  %% Deactivate B
```

### Control Flow

```mermaid
sequenceDiagram
    participant A
    participant B
    participant C

    alt Condition is true
        A->>B: Path 1
    else Condition is false
        A->>C: Path 2
    end

    opt Optional step
        B->>C: Optional call
    end

    loop Every 5 seconds
        A->>B: Health check
    end

    par Parallel execution
        A->>B: Task 1
    and
        A->>C: Task 2
    end

    critical Critical section
        A->>B: Important operation
    option Failure case
        A->>C: Fallback
    end

    break When error occurs
        A->>B: Error notification
    end
```

### Notes

```
Note right of A: Single participant note
Note over A,B: Note spanning participants
Note left of B: Left-side note
```

### Numbering

```
autonumber    %% Add at the top to auto-number messages
```

### Boxes (Grouping)

```mermaid
sequenceDiagram
    box Purple Internal Services
        participant API
        participant Worker
    end
    box Grey External
        participant Payment
    end

    API->>Worker: Process
    Worker->>Payment: Charge
```

---

## 3. Class Diagram

**Keyword:** `classDiagram`

### Class Definition

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        #String species
        -String dna
        +makeSound()* void
        +move(distance int) void
        #reproduce() Animal
        -mutate() void
    }
```

**Visibility modifiers:** `+` public, `-` private, `#` protected, `~` package

### Relationships

```
A <|-- B       %% Inheritance (B extends A)
A *-- B        %% Composition (A owns B, lifecycle bound)
A o-- B        %% Aggregation (A has B, independent lifecycle)
A --> B        %% Association (A uses B)
A ..> B        %% Dependency (A depends on B)
A ..|> B       %% Realization (B implements A)
A -- B         %% Link (solid)
A .. B         %% Link (dashed)
```

### Multiplicity

```
A "1" --> "*" B : has
A "1" --> "0..1" B : may have
A "0..*" --> "1..*" B : relates
```

### Annotations

```mermaid
classDiagram
    class Shape {
        <<interface>>
        +area() double
        +perimeter() double
    }

    class Color {
        <<enumeration>>
        RED
        GREEN
        BLUE
    }

    class Singleton {
        <<abstract>>
    }

    class UserService {
        <<service>>
    }
```

### Namespace

```mermaid
classDiagram
    namespace Domain {
        class User
        class Order
    }
    namespace Infrastructure {
        class UserRepository
        class OrderRepository
    }
```

---

## 4. State Diagram

**Keyword:** `stateDiagram-v2`

### Basic Syntax

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Start
    Processing --> Done : Complete
    Processing --> Error : Failure
    Error --> Idle : Reset
    Done --> [*]
```

### Composite States

```mermaid
stateDiagram-v2
    [*] --> Active

    state Active {
        [*] --> Running
        Running --> Paused : Pause
        Paused --> Running : Resume
    }

    Active --> Terminated : Kill
    Terminated --> [*]
```

### Forks and Joins

```mermaid
stateDiagram-v2
    state fork_state <<fork>>
    state join_state <<join>>

    [*] --> fork_state
    fork_state --> TaskA
    fork_state --> TaskB
    TaskA --> join_state
    TaskB --> join_state
    join_state --> Done
    Done --> [*]
```

### Choice

```mermaid
stateDiagram-v2
    state check <<choice>>

    [*] --> check
    check --> Approved : if valid
    check --> Rejected : if invalid
```

### Notes

```
note right of StateName
    Multi-line note
    explaining the state
end note
```

---

## 5. Entity Relationship Diagram

**Keyword:** `erDiagram`

### Relationship Types

```
A ||--|| B : "exactly one to exactly one"
A ||--o{ B : "one to zero or more"
A ||--|{ B : "one to one or more"
A }o--o{ B : "zero or more to zero or more"
A |o--o| B : "zero or one to zero or one"
```

### Cardinality Symbols

| Symbol | Meaning      |
| ------ | ------------ |
| `\|\|` | Exactly one  |
| `o\|`  | Zero or one  |
| `}o`   | Zero or more |
| `}\|`  | One or more  |

### Attribute Types

```mermaid
erDiagram
    PRODUCT {
        uuid id PK "Unique identifier"
        string name "Product display name"
        decimal price "Price in cents"
        text description
        datetime created_at
        int stock_count
        boolean active
        string sku UK "Stock keeping unit"
        uuid category_id FK "Reference to category"
    }
```

**Key markers:** `PK` (primary key), `FK` (foreign key), `UK` (unique key)

---

## 6. Gantt Chart

**Keyword:** `gantt`

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Planning
        Requirements    :done, req, 2025-01-01, 14d
        Design          :active, des, after req, 10d

    section Development
        Backend         :dev1, after des, 21d
        Frontend        :dev2, after des, 18d

    section Testing
        Integration     :test, after dev1, 7d
        UAT             :uat, after test, 5d

    section Release
        Deployment      :milestone, deploy, after uat, 0d
```

**Task states:** `done`, `active`, `crit` (critical path)
**Duration:** `7d` (days), `5h` (hours), or specific end date
**Dependencies:** `after taskId` or comma-separated `after task1 task2`

---

## 7. Pie Chart

**Keyword:** `pie`

```mermaid
pie showData
    title Technology Stack
    "TypeScript" : 45
    "Python" : 25
    "Go" : 15
    "Rust" : 10
    "Other" : 5
```

`showData` is optional — adds percentages to labels.

---

## 8. Mindmap

**Keyword:** `mindmap`

```mermaid
mindmap
    root((System Design))
        Scalability
            Horizontal
                Load Balancers
                Sharding
            Vertical
                More CPU
                More RAM
        Reliability
            Redundancy
            Failover
            Backups
        Performance
            Caching
                CDN
                Redis
            Optimization
                Indexing
                Query tuning
```

**Node shapes:**

- `((Circle))` — root/emphasis
- `(Rounded)` — default
- `[Square]` — structured
- `)Cloud(` — cloud shape
- `))Bang((` — explosion/emphasis

---

## 9. Timeline

**Keyword:** `timeline`

```mermaid
timeline
    title Product Roadmap 2025
    section Q1
        January : MVP Launch
                : Core API complete
        February : Beta program
        March : Public launch
    section Q2
        April : Mobile app
        May : International expansion
        June : Enterprise features
```

---

## 10. Git Graph

**Keyword:** `gitGraph`

```mermaid
gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature A"
    commit id: "Feature B"
    branch feature/auth
    checkout feature/auth
    commit id: "Add login"
    commit id: "Add OAuth"
    checkout develop
    merge feature/auth id: "Merge auth"
    checkout main
    merge develop id: "Release v1.0" tag: "v1.0"
    commit id: "Hotfix" type: HIGHLIGHT
```

**Commit types:** `NORMAL`, `REVERSE`, `HIGHLIGHT`
**Options:** `branch order: 0` to control branch position

---

## 11. Sankey Diagram

**Keyword:** `sankey-beta`

```mermaid
sankey-beta

Traffic,Homepage,5000
Traffic,API,3000
Homepage,Signup,1500
Homepage,Browse,3500
API,Mobile,2000
API,Partners,1000
Signup,Active Users,1200
Signup,Churned,300
```

Format: `source,target,value` — one per line, comma-separated.

---

## 12. XY Chart

**Keyword:** `xychart-beta`

```mermaid
xychart-beta
    title "Monthly Revenue"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Revenue ($K)" 0 --> 100
    bar [30, 45, 60, 55, 70, 85]
    line [25, 40, 55, 50, 65, 80]
```

Supports `bar` and `line` series. Multiple series can be combined.

---

## 13. Quadrant Chart

**Keyword:** `quadrantChart`

```mermaid
quadrantChart
    title Feature Prioritization
    x-axis "Low Effort" --> "High Effort"
    y-axis "Low Impact" --> "High Impact"
    quadrant-1 "Quick Wins"
    quadrant-2 "Major Projects"
    quadrant-3 "Fill-ins"
    quadrant-4 "Thankless Tasks"
    Feature A: [0.8, 0.9]
    Feature B: [0.2, 0.7]
    Feature C: [0.6, 0.3]
    Feature D: [0.3, 0.2]
```

Coordinates are `[x, y]` with values between 0 and 1.

---

## 14. Block Diagram

**Keyword:** `block-beta`

```mermaid
block-beta
    columns 3

    space:1 Header["System Overview"]:1 space:1

    Frontend["React App"]:1 API["NestJS API"]:1 DB[("PostgreSQL")]:1

    Frontend --> API
    API --> DB
```

Use `columns N` to define grid. `space:N` for empty cells.
Blocks span cells with `:N` suffix.

---

## 15. User Journey

**Keyword:** `journey`

```mermaid
journey
    title User Checkout Experience
    section Browse
        Visit homepage: 5: Customer
        Search product: 4: Customer
        View details: 4: Customer
    section Purchase
        Add to cart: 5: Customer
        Enter payment: 2: Customer, Payment System
        Confirm order: 4: Customer, Order Service
    section Post-Purchase
        Receive confirmation: 5: Customer, Email Service
        Track delivery: 3: Customer
```

Format: `Task name: satisfaction(1-5): actor1, actor2`

---

## 16. Requirement Diagram

**Keyword:** `requirementDiagram`

```mermaid
requirementDiagram
    requirement high_availability {
        id: REQ-001
        text: System must achieve 99.9% uptime
        risk: high
        verifymethod: test
    }

    functionalRequirement auto_failover {
        id: REQ-002
        text: Automatic failover within 30 seconds
        risk: medium
        verifymethod: demonstration
    }

    element load_balancer {
        type: service
        docRef: arch-doc-001
    }

    high_availability - traces -> auto_failover
    auto_failover - satisfies -> load_balancer
```

**Relationship types:** `contains`, `copies`, `derives`, `satisfies`, `verifies`,
`refines`, `traces`

---

## 17. Packet Diagram

**Keyword:** `packet-beta`

```mermaid
packet-beta
    0-15: "Source Port"
    16-31: "Destination Port"
    32-63: "Sequence Number"
    64-95: "Acknowledgment Number"
    96-99: "Data Offset"
    100-105: "Reserved"
    106-111: "Flags"
    112-127: "Window Size"
    128-143: "Checksum"
    144-159: "Urgent Pointer"
```

Format: `start-end: "Label"` — bit ranges for protocol headers.

---

## 18. Kanban

**Keyword:** `kanban`

```mermaid
kanban
    column1["To Do"]
        task1["Design database schema"]
        task2["Write API specs"]
    column2["In Progress"]
        task3["Implement auth"]
    column3["Review"]
        task4["Code review: payments"]
    column4["Done"]
        task5["Setup CI/CD"]
```

---

## Global Configuration

Any diagram can be configured with frontmatter:

```mermaid
---
config:
  theme: base
  look: classic
  layout: dagre
  themeVariables:
    primaryColor: "#4f46e5"
    lineColor: "#94a3b8"
---
flowchart LR
    A --> B --> C
```

**Themes:** `default`, `forest`, `dark`, `neutral`, `base`
**Looks:** `classic`, `handDrawn`
**Layouts:** `dagre` (default), `elk` (advanced, needs integration)

## Directives (Inline Config)

**IMPORTANT:** The init directive MUST be on the very first line, before any diagram type declaration.

```
%%{init: {'theme': 'base', 'themeVariables': {
  'primaryColor': '#4f46e5', 'lineColor': '#94a3b8',
  'primaryTextColor': '#fff', 'primaryBorderColor': '#3730a3'
}}}%%
```

**Golden Rule:** Always include `'lineColor': '#94a3b8'` to replace the default harsh black lines with softer slate-colored lines. This single change dramatically improves diagram aesthetics.
