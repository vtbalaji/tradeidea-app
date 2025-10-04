# Vercel Deployment Troubleshooting

## Issue: Seeing "Get started by editing app/page.tsx"

This usually means one of these problems:

### 1. **Root Directory Not Set Correctly** (Most Common)

When importing from GitHub, Vercel needs to know which directory to build.

**Fix in Vercel:**
1. Go to your project settings in Vercel
2. Click **Settings** → **General**
3. Under "Root Directory", click **Edit**
4. Leave it as `./` (current directory) OR if you pushed the parent folder, set it to `myportfolio-web`
5. Click **Save**
6. **Redeploy** from the Deployments tab

### 2. **Environment Variables Not Set**

**Check if env vars are set:**
1. Go to Settings → Environment Variables
2. Verify ALL these are present:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

3. Make sure they're set for **Production**, **Preview**, AND **Development**
4. **Redeploy** after adding them

### 3. **Build Command Issues**

**Verify Build Settings:**
1. Go to Settings → General
2. Check these settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (or leave auto-detected)
   - **Output Directory**: `.next` (or leave auto-detected)
   - **Install Command**: `npm install` (or leave auto-detected)

### 4. **Check Build Logs**

1. Go to **Deployments** tab
2. Click on your latest deployment
3. Click **View Function Logs** or **Build Logs**
4. Look for errors like:
   - "Module not found"
   - "Firebase error"
   - "Environment variable not defined"

### 5. **Firebase Authorized Domains**

Add your Vercel domain to Firebase:

1. Go to Firebase Console → Authentication → Settings
2. Scroll to **Authorized domains**
3. Add your Vercel domains:
   - `your-project-name.vercel.app`
   - `your-project-name-git-main-your-username.vercel.app`
   - Any custom domains

### 6. **Try a Fresh Deployment**

Sometimes Vercel cache causes issues:

1. Go to **Deployments** tab
2. Click the three dots ⋯ on latest deployment
3. Click **Redeploy**
4. Check **"Use existing Build Cache"** is UNCHECKED
5. Click **Redeploy**

### 7. **Verify Your Git Repository**

Make sure you pushed the right files:

```bash
# Check what's in your repo
git ls-files | grep -E "app/|package.json"

# You should see:
# app/page.tsx
# app/layout.tsx
# package.json
# etc.
```

### 8. **Quick Test - Add a Simple API Route**

Create a test endpoint to verify deployment:

1. Create `app/api/test/route.ts`:
```typescript
export async function GET() {
  return Response.json({
    message: 'API is working!',
    env: {
      hasFirebaseKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasFirebaseProject: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    }
  });
}
```

2. Deploy and visit: `https://your-app.vercel.app/api/test`
3. Check if environment variables are detected

## Still Not Working?

### Check Vercel Runtime Logs:

1. Go to your deployment
2. Click **Functions** tab
3. Click **View Function Logs**
4. Look for runtime errors

### Common Error Messages:

**"Failed to load Firebase config"**
- Environment variables not set correctly
- Check they start with `NEXT_PUBLIC_`

**"Authentication domain not authorized"**
- Add Vercel domain to Firebase authorized domains

**"Module not found"**
- Dependencies missing from package.json
- Try clearing build cache and redeploying

## Need More Help?

1. Check Vercel build logs for specific errors
2. Check browser console (F12) for JavaScript errors
3. Ensure `.env.local` values match what you put in Vercel
4. Try deploying a simpler version first to isolate the issue
