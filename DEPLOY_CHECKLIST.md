# Deployment Checklist

## Local Verification

Before deploying, run these commands to verify the production build locally:

```bash
# 1. Clean install dependencies
npm ci

# 2. Run production build
npm run build

# Expected output:
# - Exit code 0 (success)
# - dist/ folder created with:
#   - index.html
#   - assets/ (JS and CSS bundles)
#   - manifest.webmanifest
#   - sw.js (service worker)
#   - workbox-*.js
#   - PWA icons (192, 512, maskable)

# 3. Preview production build locally
npm run preview

# Opens http://localhost:4173
# Test the following:
# - App loads without errors
# - Import sample .md files from sample notes/
# - Library shows imported cards
# - Review session works (flip card, rate)
# - Check DevTools:
#   - Application → Manifest (should show FlashFiles manifest)
#   - Application → Service Workers (should show registered SW)
#   - Application → IndexedDB (FlashFilesDB should appear after import)

# 4. Run tests (optional but recommended)
npm run test:e2e          # E2E tests
npm run a11y-check        # Accessibility smoke tests
npm run lint              # Code linting
```

## Production Checklist

Verify before deploying:

- [ ] `npm run build` completes without errors
- [ ] `dist/` contains manifest.webmanifest and service worker files
- [ ] Local preview (`npm run preview`) works correctly
- [ ] Import/Library/Review functionality works with IndexedDB persistence
- [ ] PWA manifest is discoverable in DevTools
- [ ] Service worker registers successfully
- [ ] All tests pass (if running `npm run test:e2e`)

## Deployment Methods

### Option 1: Vercel (Recommended - One-Click Deploy) 🚀

Vercel provides HTTPS out of the box, which is required for PWA installability.

**Steps:**

1. **Push to Git repository**
   ```bash
   # Initialize git if not already done
   git init
   git add .
   git commit -m "production ready build"
   
   # Push to GitHub, GitLab, or Bitbucket
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel auto-detects the configuration from `vercel.json`
   - Configuration should show:
     - **Framework Preset**: Other
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`
   - Click "Deploy"

3. **Verify deployment**
   - Visit your deployed URL (e.g., `your-app.vercel.app`)
   - Test PWA installation:
     - Desktop Chrome: Look for install icon in address bar
     - Mobile: "Add to Home Screen" option in browser menu
   - Test offline functionality:
     - Install the PWA
     - Turn off network
     - App should still load and work with cached data

**Environment Variables**: None required for this app (all data stored locally in IndexedDB)

**Automatic Updates**: Vercel automatically rebuilds and deploys when you push to your main branch.

### Option 2: Manual Static Hosting

For other static hosts (Netlify, Cloudflare Pages, GitHub Pages, etc.):

```bash
# Build the app
npm run build

# The dist/ folder contains your deployable static files
# Upload dist/ contents to your hosting provider

# Important: Configure your host to:
# 1. Serve dist/index.html for all routes (SPA routing)
# 2. Serve over HTTPS (required for PWA)
# 3. Set proper cache headers:
#    - Long cache for /assets/* (immutable)
#    - No cache for sw.js and manifest.webmanifest
```

### Option 3: Docker Container (Advanced)

```dockerfile
# Example Dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Post-Deployment Verification

After deploying, verify:

1. **PWA Installability**
   - Open in Chrome/Edge
   - Look for install prompt or icon in address bar
   - Install and verify app launches standalone

2. **Offline Functionality**
   - Install PWA
   - Disconnect network
   - App should load and work with existing data

3. **Data Persistence**
   - Import cards
   - Close browser completely
   - Reopen → cards should persist

4. **Service Worker Updates**
   - Make a change and redeploy
   - Reload the app
   - Should see update notification (if configured)

## Troubleshooting

**PWA not installable:**
- Ensure site is served over HTTPS (Vercel provides this automatically)
- Check DevTools → Console for manifest/service worker errors
- Verify manifest.webmanifest is accessible at `/manifest.webmanifest`

**Service Worker not registering:**
- Check browser console for registration errors
- Ensure `sw.js` is accessible at root
- Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

**Data not persisting:**
- Check if IndexedDB is enabled in browser
- Private/Incognito mode may restrict IndexedDB
- Check DevTools → Application → IndexedDB for FlashFilesDB

**Build fails:**
- Run `npm ci` to clean install dependencies
- Check Node.js version (requires v20+)
- Review build output for specific errors

## Performance Tips

- **First Deploy**: May take 2-3 minutes as Vercel builds and deploys
- **Subsequent Deploys**: Usually under 1 minute
- **Cold Start**: First visit may be slower; subsequent visits use cached assets
- **Service Worker**: After first visit, app loads instantly from cache

## Updating the App

```bash
# Make your changes
git add .
git commit -m "your changes"
git push

# Vercel automatically rebuilds and deploys
# Users will see update notification on next visit
```

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **PWA Testing**: https://web.dev/pwa-checklist/

