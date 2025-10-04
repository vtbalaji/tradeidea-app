# TradeIdea - Deployment Guide

This guide will help you deploy your TradeIdea application to Vercel with automatic deployments from GitHub.

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Git installed on your machine

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `tradeidea-app` (or any name you prefer)
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

Run these commands in your terminal:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/tradeidea-app.git

# Or if using SSH:
git remote add origin git@github.com:YOUR_USERNAME/tradeidea-app.git

# Verify the remote was added
git remote -v
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Push Your Code to GitHub

### Option 1: Using the Deployment Script (Recommended)

```bash
# Make sure you're in the project directory
./scripts/deploy.sh "Initial commit - TradeIdea app"
```

### Option 2: Manual Git Commands

```bash
# Add all files
git add .

# Create a commit
git commit -m "Initial commit - TradeIdea app

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push -u origin main
```

## Step 4: Connect Vercel to GitHub

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Select your GitHub repository (`tradeidea-app`)
5. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or `myportfolio-web` if it's in a subdirectory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

## Step 5: Add Environment Variables to Vercel

You need to add your Firebase configuration to Vercel:

1. In Vercel project settings, go to "Environment Variables"
2. Add the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

You can find these values in your local `.env.local` file.

3. Click "Save"

## Step 6: Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 2-3 minutes)
3. Once deployed, Vercel will give you a URL like: `https://tradeidea-app.vercel.app`

## Automatic Deployments

Once connected, Vercel will automatically deploy your app whenever you push to GitHub:

- **Main branch** → Production deployment
- **Other branches** → Preview deployments

### Quick Deploy

Use the deployment script for quick commits and deployments:

```bash
./scripts/deploy.sh "Add new feature"
./scripts/deploy.sh "Fix bug in portfolio page"
./scripts/deploy.sh "Update UI styling"
```

## Troubleshooting

### Build Fails

1. Check the build logs in Vercel dashboard
2. Make sure all environment variables are set correctly
3. Verify that the build works locally: `npm run build`

### Environment Variables Not Working

1. Make sure all variables start with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding environment variables
3. Check the Vercel logs for any errors

### Firebase Connection Issues

1. Verify Firebase project settings in Firebase Console
2. Check that Vercel domain is added to authorized domains in Firebase
3. Go to Firebase Console → Authentication → Settings → Authorized domains
4. Add your Vercel domain (e.g., `tradeidea-app.vercel.app`)

## Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel project settings → Domains
2. Add your domain name
3. Update your DNS records as instructed by Vercel
4. Add the custom domain to Firebase authorized domains

## Monitoring

- **Vercel Dashboard**: Monitor deployments, analytics, and logs
- **GitHub Actions** (optional): You can add GitHub Actions for additional CI/CD

## Commands Reference

```bash
# Deploy with commit message
./scripts/deploy.sh "your message here"

# Check git status
git status

# View deployment history
git log --oneline

# Rollback to previous commit (if needed)
git revert HEAD
git push origin main
```

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Firebase Docs: https://firebase.google.com/docs

---

**Note**: After each push to GitHub, Vercel will automatically build and deploy your changes. You can monitor the deployment progress in your Vercel dashboard.
