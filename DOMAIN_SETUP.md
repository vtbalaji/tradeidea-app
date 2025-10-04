# Custom Domain Setup - tradeidea.co.in

## Step 1: Add Domain to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Domains**
3. Add these domains:
   - `tradeidea.co.in`
   - `www.tradeidea.co.in` (optional)

4. Vercel will show you DNS records to configure

## Step 2: Configure DNS Records

Go to your domain registrar (where you bought tradeidea.co.in) and add these DNS records:

### For Root Domain (tradeidea.co.in):

**Option A: Using A Record (Recommended)**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Option B: Using CNAME (if your registrar allows)**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

### For www Subdomain (www.tradeidea.co.in):

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

## Step 3: Add Domains to Firebase

**IMPORTANT:** Add your custom domain to Firebase authorized domains:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: **smartfarm-c04cc**
3. Go to **Authentication** → **Settings**
4. Scroll to **Authorized domains**
5. Click **Add domain** and add:
   - `tradeidea.co.in`
   - `www.tradeidea.co.in`
   - `tradeidea-app.vercel.app` (your Vercel domain)

## Step 4: Update Environment Variables (Optional)

If you have any environment variables that reference the domain, update them in Vercel.

## Step 5: SSL Certificate

Vercel automatically provisions SSL certificates. This may take a few minutes after DNS propagation.

## Verification Steps:

### Check DNS Propagation (Wait 5-60 minutes):
```bash
# Check if DNS is propagated
dig tradeidea.co.in
nslookup tradeidea.co.in
```

Or use online tools:
- https://www.whatsmydns.net/#A/tradeidea.co.in
- https://dnschecker.org/

### Test Your Domain:

1. Visit `https://tradeidea.co.in`
2. Check if it redirects to your app
3. Test login functionality
4. Verify Firebase authentication works

## Troubleshooting:

### Domain not working after 1 hour:
- Double-check DNS records match exactly what Vercel shows
- Check with your domain registrar support
- Verify you're using the correct nameservers

### SSL Certificate Error:
- Wait for DNS to fully propagate (can take up to 48 hours)
- SSL cert is auto-provisioned by Vercel once DNS is correct

### Firebase Authentication Not Working:
- Make sure `tradeidea.co.in` is in Firebase authorized domains
- Clear browser cache and cookies
- Try in incognito mode

### Redirects to Vercel Domain:
- In Vercel Settings → Domains, set `tradeidea.co.in` as the primary domain
- Remove or redirect `tradeidea-app.vercel.app` if needed

## DNS Records Reference:

Your DNS should look like this:

```
tradeidea.co.in.        A       76.76.21.21
www.tradeidea.co.in.    CNAME   cname.vercel-dns.com.
```

## Common Domain Registrars:

- **GoDaddy**: DNS Management → DNS Records
- **Namecheap**: Domain List → Manage → Advanced DNS
- **Google Domains**: My domains → DNS
- **Cloudflare**: DNS settings
- **HostGator/BigRock**: cPanel → Zone Editor

## Support:

- Vercel Domains Docs: https://vercel.com/docs/concepts/projects/domains
- Firebase Auth Domains: https://firebase.google.com/docs/auth/web/redirect-best-practices

---

**Note:** DNS propagation can take anywhere from 5 minutes to 48 hours. Be patient!
