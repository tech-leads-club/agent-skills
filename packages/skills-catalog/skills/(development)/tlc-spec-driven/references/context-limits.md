# Context Limits

## File Size Limits

| File      | Max Tokens | ~Words | Warning At |
| --------- | ---------- | ------ | ---------- |
| spec.md   | 5,000      | 3,000  | 4,000      |
| design.md | 8,000      | 4,800  | 6,400      |
| tasks.md  | 10,000     | 6,000  | 8,000      |

## Context Zones

🟢 **Healthy** (<40k total): Silent
🟡 **Moderate** (40-60k): Discrete footer note
🔴 **Critical** (>60k): Active warning, suggest optimization

## Monitoring

Display context status in footer when >40k:

```
📊 Context: 52k tokens (moderate)
  - tasks.md: 11k (ok)
  - design.md: 6k (ok)
  - Total: 52k / 200k (26%)
```

## Principles

**Target:** <40k tokens loaded (20% of window)
**Reserve:** 160k+ tokens for work, reasoning, outputs
