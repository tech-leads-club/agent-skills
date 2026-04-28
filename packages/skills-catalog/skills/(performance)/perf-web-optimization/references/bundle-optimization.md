# Bundle Size Optimization

## Table of Contents
- [Analysis Tools](#analysis-tools)
- [Heavy Dependencies](#heavy-dependencies)
- [Code Splitting](#code-splitting)
- [Tree Shaking](#tree-shaking)

---

## Analysis Tools

```bash
# Webpack - generates interactive treemap
npx webpack-bundle-analyzer dist/stats.json

# Generate stats file first
webpack --profile --json > dist/stats.json

# Vite
npx vite-bundle-visualizer

# Source map explorer
npx source-map-explorer dist/**/*.js

# Check package size before adding
npx bundlephobia lodash
```

---

## Heavy Dependencies

### moment → date-fns/dayjs

```javascript
// Before: moment (67KB)
import moment from 'moment';
moment(date).format('YYYY-MM-DD');

// After: date-fns (tree-shakeable, ~2KB per function)
import { format } from 'date-fns';
format(date, 'yyyy-MM-dd');

// After: dayjs (2KB total, moment-compatible API)
import dayjs from 'dayjs';
dayjs(date).format('YYYY-MM-DD');
```

### lodash → cherry-pick or native

```javascript
// Before: entire lodash (72KB)
import _ from 'lodash';
_.uniq(array);
_.debounce(fn, 300);

// After: cherry-pick (2KB each)
import uniq from 'lodash/uniq';
import debounce from 'lodash/debounce';

// After: native alternatives
[...new Set(array)]; // uniq
// debounce - use custom or lodash-es/debounce
```

### Other common swaps

| Heavy | Light Alternative |
|-------|-------------------|
| `axios` (13KB) | `fetch` (native) or `ky` (3KB) |
| `uuid` (4KB) | `crypto.randomUUID()` (native) |
| `classnames` (1KB) | template literals |

---

## Code Splitting

### React.lazy

```javascript
import { lazy, Suspense } from 'react';

const Chart = lazy(() => import('./Chart'));
const AdminPanel = lazy(() => import('./AdminPanel'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      {showChart && <Chart />}
      {isAdmin && <AdminPanel />}
    </Suspense>
  );
}
```

### Next.js dynamic

```javascript
import dynamic from 'next/dynamic';

// Client-only component
const Map = dynamic(() => import('./Map'), { ssr: false });

// With loading state
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton height={300} />
});
```

### Route-based splitting (automatic in most frameworks)

```javascript
// Next.js - each page is a separate chunk
// pages/dashboard.js → chunks/pages/dashboard.js
// pages/admin.js → chunks/pages/admin.js

// React Router with lazy
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
```

### Manual chunks (Vite/Rollup)

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts', 'd3'],
        }
      }
    }
  }
};
```

---

## Tree Shaking

### Enable in webpack

```javascript
// webpack.config.js
module.exports = {
  mode: 'production', // enables tree shaking
  optimization: {
    usedExports: true,
    sideEffects: true,
  }
};
```

### Mark package as side-effect free

```json
// package.json
{
  "sideEffects": false
}

// Or specify files with side effects
{
  "sideEffects": ["*.css", "*.scss"]
}
```

### Write tree-shakeable exports

```javascript
// Bad: default export of object
export default { foo, bar, baz };

// Good: named exports
export { foo, bar, baz };
```
