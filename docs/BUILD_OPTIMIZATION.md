# Build Optimization Guide

Guide for optimizing GetSoloDesk build performance and output.

## Current Optimizations

### Code Splitting

The application uses automatic and manual code splitting:

**Vendor Chunk** (~259KB, 83KB gzipped)
- React, React DOM, React Router
- Core dependencies used throughout the app
- Cached separately for better long-term caching

**Supabase Chunk** (~170KB, 45KB gzipped)
- Supabase client library
- Database and auth functionality
- Updated only when Supabase client version changes

**Icons Chunk** (~52KB, 12KB gzipped)
- Lucide React icons
- React Icons
- Shared icon dependencies

**App Chunk** (~158KB, 40KB gzipped)
- Core application logic
- Shared components
- Context providers

**Route-based Chunks**
- Each major route is lazy-loaded
- Time Tracker: ~37KB (8.8KB gzipped)
- Settings: ~32KB (7.7KB gzipped)
- Templates: ~30KB (10KB gzipped)
- Jobs: ~25KB (6.3KB gzipped)
- Email Marketing: ~22KB (5KB gzipped)

### Build Configuration

```typescript
// vite.config.ts
build: {
  target: 'es2020',               // Modern browsers
  sourcemap: false,               // No source maps in prod
  cssCodeSplit: true,             // Split CSS by route
  minify: 'esbuild',             // Fast minification
  assetsInlineLimit: 4096,       // Inline small assets (<4KB)
  chunkSizeWarningLimit: 1000,   // Warn for large chunks
}
```

## Optimization Checklist

### Pre-Build
- [ ] Run `npm audit` to check for dependency issues
- [ ] Remove unused dependencies
- [ ] Update dependencies to latest stable versions
- [ ] Check for duplicate dependencies

### Build Process
- [ ] `npm run typecheck` passes without errors
- [ ] `npm run build` completes successfully
- [ ] No chunk size warnings
- [ ] Review bundle analysis

### Post-Build
- [ ] Check dist/ directory size
- [ ] Verify gzipped sizes are reasonable
- [ ] Test production build locally (`npm run preview`)
- [ ] Check for console errors

## Bundle Analysis

To analyze your bundle:

```bash
# Install vite-plugin-visualizer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts plugins
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  sitemap(...),
  visualizer({ open: true })
]

# Run build
npm run build
```

This will generate `stats.html` showing bundle composition.

## Performance Targets

### Build Performance
- Total build time: < 30 seconds
- Type check: < 20 seconds
- Bundle generation: < 10 seconds

### Output Size
- Initial JS load: < 300KB gzipped
- CSS: < 20KB gzipped
- Total page weight: < 500KB gzipped

### Loading Performance
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s

## Optimization Strategies

### 1. Lazy Loading

All private routes are already lazy-loaded:
```typescript
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
```

**Benefits**:
- Smaller initial bundle
- Faster initial load
- Code loaded on-demand

### 2. Code Splitting

Automatic code splitting by route and manual chunking for vendors.

**What's Included**:
- ✅ Vendor chunk (React, Router)
- ✅ Supabase chunk
- ✅ Icons chunk
- ✅ Route-based chunks

### 3. Asset Optimization

```typescript
assetsInlineLimit: 4096  // Inline assets < 4KB
```

**Benefits**:
- Fewer HTTP requests
- Faster loading for small assets
- Base64 encoding for inline assets

### 4. CSS Code Splitting

```typescript
cssCodeSplit: true
```

**Benefits**:
- CSS loaded per route
- Smaller initial CSS bundle
- Better caching

### 5. Tree Shaking

ESBuild automatically removes unused code.

**Best Practices**:
- Use ES6 imports
- Avoid `import *`
- Import specific components: `import { Button } from 'lib'`

### 6. Minification

```typescript
minify: 'esbuild'  // Fast and effective
```

**Benefits**:
- Smaller file sizes
- Faster build times than Terser
- Good compression ratio

## Cache Strategy

### Static Assets
- Hashed filenames for cache busting
- 1-year cache with immutable flag (via Vercel)
- CDN caching on Vercel edge network

### HTML Files
- No caching (serve fresh always)
- Contains references to hashed assets

### API Responses
- No build-time optimization needed
- Runtime caching in services (10-15s TTL)

## Reducing Bundle Size

### 1. Analyze Dependencies

```bash
# Check what's taking space
npm ls --depth=0

# Find duplicate dependencies
npm dedupe
```

### 2. Replace Heavy Dependencies

**Consider alternatives**:
- `moment.js` → `date-fns` (already using native)
- Full Lodash → specific imports
- Full icon libraries → tree-shakeable imports

### 3. Dynamic Imports

For heavy features used occasionally:
```typescript
const HeavyFeature = lazy(() => import('./HeavyFeature'));
```

### 4. Remove Dead Code

- Use TypeScript strict mode
- Enable ESLint unused vars rule
- Remove commented code
- Delete unused files

## Build Performance

### Speed Up Builds

1. **Use SSD**: Store project on SSD
2. **More RAM**: 8GB+ recommended
3. **Fewer Plugins**: Only essential Vite plugins
4. **Parallel Processing**: Vite does this by default

### CI/CD Optimization

1. **Cache node_modules**
```yaml
# GitHub Actions example
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

2. **Cache Vite build**
```yaml
- uses: actions/cache@v3
  with:
    path: .vite
    key: ${{ runner.os }}-vite-${{ hashFiles('vite.config.ts') }}
```

## Monitoring Build Size

### Set Up Alerts

Monitor bundle size over time:
- Use Bundlephobia to check dependency sizes
- Set up size-limit in CI/CD
- Track bundle size in PR comments

### Size Budget

Set size budgets in `package.json`:
```json
{
  "size-limit": [
    {
      "path": "dist/assets/app-*.js",
      "limit": "200 KB"
    },
    {
      "path": "dist/assets/vendor-*.js",
      "limit": "300 KB"
    }
  ]
}
```

## Production Checklist

- [ ] Build completes without errors
- [ ] No console warnings about chunk size
- [ ] Vendor chunk < 300KB gzipped
- [ ] App chunk < 150KB gzipped
- [ ] Route chunks < 50KB gzipped each
- [ ] CSS < 20KB gzipped
- [ ] Test production build locally
- [ ] Verify lazy loading works
- [ ] Check network tab in DevTools

## Troubleshooting

### Large Bundle Size

**Problem**: Vendor chunk too large
**Solution**: 
- Check for duplicate dependencies
- Consider code splitting larger libs
- Use dynamic imports

### Slow Build Times

**Problem**: Build takes > 30 seconds
**Solution**:
- Clear node_modules and reinstall
- Update to latest Vite version
- Check for slow plugins

### Chunk Load Errors

**Problem**: Dynamic imports fail in production
**Solution**:
- Check network for 404s
- Verify base URL configuration
- Check Vercel routing rules

## Resources

- [Vite Build Optimizations](https://vitejs.dev/guide/build.html)
- [Web.dev Performance](https://web.dev/performance/)
- [Bundlephobia](https://bundlephobia.com/) - Check package sizes
- [Bundle Buddy](https://bundle-buddy.com/) - Analyze webpack bundles

---

**Last Updated**: 2026-02-17
**Maintained By**: GetSoloDesk Team

