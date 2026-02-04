---
name: perf-lighthouse
description: "Run Lighthouse audits locally via CLI or Node API, parse and interpret reports, set performance budgets. Use when measuring site performance, understanding Lighthouse scores, setting up budgets, or integrating audits into CI. Triggers on: lighthouse, run lighthouse, lighthouse score, performance audit, performance budget."
---

# Lighthouse Audits

## CLI Quick Start

```bash
# Install
npm install -g lighthouse

# Basic audit
lighthouse https://example.com

# Mobile performance only (faster)
lighthouse https://example.com --preset=perf --form-factor=mobile

# Output JSON for parsing
lighthouse https://example.com --output=json --output-path=./report.json

# Output HTML report
lighthouse https://example.com --output=html --output-path=./report.html
```

## Common Flags

```bash
--preset=perf           # Performance only (skip accessibility, SEO, etc.)
--form-factor=mobile    # Mobile device emulation (default)
--form-factor=desktop   # Desktop
--throttling-method=devtools  # More accurate throttling
--only-categories=performance,accessibility  # Specific categories
--chrome-flags="--headless"   # Headless Chrome
```

## Performance Budgets

Create `budget.json`:

```json
[
  {
    "resourceSizes": [
      { "resourceType": "script", "budget": 200 },
      { "resourceType": "image", "budget": 300 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "total", "budget": 500 }
    ],
    "resourceCounts": [
      { "resourceType": "third-party", "budget": 5 }
    ],
    "timings": [
      { "metric": "interactive", "budget": 3000 },
      { "metric": "first-contentful-paint", "budget": 1500 },
      { "metric": "largest-contentful-paint", "budget": 2500 }
    ]
  }
]
```

Run with budget:

```bash
lighthouse https://example.com --budget-path=./budget.json
```

## Node API

```javascript
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function runAudit(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

  const result = await lighthouse(url, {
    port: chrome.port,
    onlyCategories: ['performance'],
    formFactor: 'mobile',
    throttling: {
      cpuSlowdownMultiplier: 4,
    },
  });

  await chrome.kill();

  const { performance } = result.lhr.categories;
  const { 'largest-contentful-paint': lcp } = result.lhr.audits;

  return {
    score: Math.round(performance.score * 100),
    lcp: lcp.numericValue,
  };
}
```

## GitHub Actions

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build site
        run: npm ci && npm run build

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/about
          budgetPath: ./budget.json
          uploadArtifacts: true
          temporaryPublicStorage: true
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

## Lighthouse CI (LHCI)

For full CI integration with historical tracking:

```bash
# Install
npm install -g @lhci/cli

# Initialize config
lhci wizard
```

Creates `lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/about'],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // or 'lhci' for self-hosted
    },
  },
};
```

Run:

```bash
lhci autorun
```

## Parse JSON Report

```javascript
import fs from 'fs';

const report = JSON.parse(fs.readFileSync('./report.json'));

// Overall scores (0-1, multiply by 100 for percentage)
const scores = {
  performance: report.categories.performance.score,
  accessibility: report.categories.accessibility.score,
  seo: report.categories.seo.score,
};

// Core Web Vitals
const vitals = {
  lcp: report.audits['largest-contentful-paint'].numericValue,
  cls: report.audits['cumulative-layout-shift'].numericValue,
  fcp: report.audits['first-contentful-paint'].numericValue,
  tbt: report.audits['total-blocking-time'].numericValue,
};

// Failed audits
const failed = Object.values(report.audits)
  .filter(a => a.score !== null && a.score < 0.9)
  .map(a => ({ id: a.id, score: a.score, title: a.title }));
```

## Compare Builds

```bash
# Save baseline
lighthouse https://prod.example.com --output=json --output-path=baseline.json

# Run on PR
lighthouse https://preview.example.com --output=json --output-path=pr.json

# Compare (custom script)
node compare-reports.js baseline.json pr.json
```

Simple comparison script:

```javascript
const baseline = JSON.parse(fs.readFileSync(process.argv[2]));
const pr = JSON.parse(fs.readFileSync(process.argv[3]));

const metrics = ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'];

metrics.forEach(metric => {
  const base = baseline.audits[metric].numericValue;
  const current = pr.audits[metric].numericValue;
  const diff = ((current - base) / base * 100).toFixed(1);
  const emoji = current <= base ? '✅' : '❌';
  console.log(`${emoji} ${metric}: ${diff}% (${base.toFixed(0)} → ${current.toFixed(0)})`);
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Inconsistent scores | Run multiple times (`--number-of-runs=3`), use median |
| Chrome not found | Set `CHROME_PATH` env var |
| Timeouts | Increase with `--max-wait-for-load=60000` |
| Auth required | Use `--extra-headers` or puppeteer script |
