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

⚠️ **CRITICAL**: You MUST add Firebase Admin SDK credentials or the share feature will fail!

1. In Vercel project settings, go to "Environment Variables"
2. Add the following variables:

### Firebase Client Configuration (Public)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

### Firebase Admin SDK (Private - Server-Side Only) 🔐
**⚠️ WITHOUT THESE, THE SHARE FEATURE WILL NOT WORK!**

```
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**How to get Firebase Admin credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click gear icon ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will be downloaded containing `client_email` and `private_key`
7. Copy those values to Vercel environment variables

**Important Notes:**
- The private key must include the quotes and `\n` characters
- Format: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`
- Select all environments: Production, Preview, Development

### Other Variables
```
RAZORPAY_KEY_ID=your_razorpay_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_secret
ADMIN_EMAILS=your_email@example.com
```

3. Click "Save" for each variable

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

### Share Feature Fails with "Application error: a server-side exception has occurred"

**Cause**: Firebase Admin SDK credentials missing or incorrect

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these variables are set:
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. Check Vercel Runtime Logs for error message:
   - `❌ Firebase Admin credentials not found!`
4. Redeploy after adding variables

### Build Fails

1. Check the build logs in Vercel dashboard
2. Make sure all environment variables are set correctly
3. Verify that the build works locally: `npm run build`

### Environment Variables Not Working

1. Make sure all variables start with `NEXT_PUBLIC_` for client-side access
2. **IMPORTANT**: After adding environment variables, you MUST redeploy
3. Check the Vercel logs for any errors

### Firebase Connection Issues

1. Verify Firebase project settings in Firebase Console
2. Check that Vercel domain is added to authorized domains in Firebase
3. Go to Firebase Console → Authentication → Settings → Authorized domains
4. Add your Vercel domain (e.g., `tradeidea-app.vercel.app`)

### How to Check Logs in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Click on "Deployments"
4. Click on latest deployment
5. Click "Runtime Logs" tab
6. Look for error messages with `[Share Page]` prefix

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
