# Replit Deployment Guide - Musical Note Generator

This guide explains how to deploy your Musical Note Generator application using Replit's native deployment feature.

## Current Setup

Your app is already configured for Replit deployment. The key configuration is in the `.replit` file:

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

## How to Deploy

### 1. Deploy Your App

1. Click the **"Deploy"** button in the top-right corner of your Replit workspace
2. Or go to the Deployments tab in the left sidebar
3. Click **"Deploy"** to start the deployment process

### 2. Configure Deployment Settings (if prompted)

- **Deployment Type**: Autoscale (recommended for web apps)
- **Build Command**: `npm run build` (already configured)
- **Run Command**: `npm run start` (already configured)

### 3. Wait for Deployment

Replit will:
1. Build your application using Vite
2. Bundle the server with esbuild
3. Deploy to Replit's infrastructure
4. Provision an SSL certificate automatically

### 4. Get Your Live URL

After successful deployment, your app will be available at:
- `https://your-repl-name.your-username.repl.co`
- Or a custom `.replit.app` domain

## Custom Domain (Optional)

To add a custom domain:

1. Go to the Deployments tab
2. Click on your active deployment
3. Click **"Add Custom Domain"**
4. Enter your domain name
5. Follow the DNS configuration instructions
6. Wait for SSL certificate provisioning

## Build Scripts

Your `package.json` has these scripts configured:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

- **dev**: Development server with hot reload
- **build**: Production build (frontend + backend)
- **start**: Production server

## Testing Before Deployment

1. **Test locally**: Click the Run button or use `npm run dev`
2. **Test production build**:
   ```bash
   npm run build
   npm run start
   ```
3. Verify everything works at `http://localhost:5000`

## Deployment Workflow

### Recommended Workflow

1. Make changes to your code
2. Test locally with `npm run dev`
3. Click **Deploy** when ready
4. Verify your live URL

### Automatic Redeployment

To redeploy after changes:
1. Make your changes
2. Click **Deploy** again
3. Replit will rebuild and deploy the new version

## Monitoring

- View deployment status in the Deployments tab
- Check logs in the Console tab
- Monitor traffic and health in the Deployments dashboard

## Rollback

If you need to rollback:
1. Go to Deployments tab
2. View deployment history
3. Redeploy a previous version if needed

Or use Replit's checkpoint system to restore your code to a previous state.

## Environment Variables

Environment variables are already configured in `.replit`:

```toml
[env]
PORT = "5000"
```

To add secrets (API keys, etc.):
1. Open the Secrets tab (lock icon)
2. Add your secret key-value pairs
3. Redeploy for changes to take effect

## Troubleshooting

### App Not Starting

1. Check the Console for error messages
2. Verify `npm run build` completes successfully
3. Ensure all dependencies are installed

### 404 Errors on Routes

The app is configured as a single-page application (SPA). All routes are handled by the Express server which serves the React app.

### Port Issues

The app must run on port 5000. This is already configured in:
- `.replit` file: `PORT = "5000"`
- `server/index.ts`: Reads from `process.env.PORT`

## Previous Firebase Setup (Disabled)

This app was previously configured for Firebase hosting. Those configuration files have been disabled but preserved:
- `firebase.json.disabled` - Firebase hosting config
- `.firebaserc.disabled` - Firebase project settings
- `functions/` - Firebase Cloud Functions (kept for reference)

To restore Firebase deployment, rename these files back to their original names.

---

**Ready to deploy?** Click the **Deploy** button in Replit!

Your Musical Note Generator will be live in minutes! 🎵
