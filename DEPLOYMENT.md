# Deployment Guide

## Vercel Deployment (Recommended)

### Step 1: Prepare Repository
```bash
# Ensure all code is committed
git add .
git commit -m "Community Time Bank app"
git push origin main
```

### Step 2: Connect to Vercel
1. Visit [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository
3. Click "Import"

### Step 3: Configure Environment Variables
In the Vercel dashboard, add these environment variables:

**Production:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://yourdomain.com/auth/callback
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Deploy
Click "Deploy" and Vercel will automatically:
- Build your Next.js app
- Run optimizations
- Deploy to global CDN
- Enable automatic deployments on git push

## Database Setup (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and keys
3. Go to SQL Editor in Supabase dashboard
4. Copy and run `scripts/001_create_tables.sql`
5. Verify all tables created successfully

## Post-Deployment Checklist

- [ ] Email confirmation working
- [ ] User registration flowing correctly
- [ ] Skills can be created and viewed
- [ ] Tasks can be posted and accepted
- [ ] Credit transfers working properly
- [ ] Community dashboard loading
- [ ] Top contributors displaying correctly
- [ ] User profiles accessible
- [ ] Mobile responsive on all pages
- [ ] Authentication redirects working

## Monitoring

- Check Vercel Analytics for performance
- Monitor Supabase usage in dashboard
- Set up error tracking (Sentry optional)
- Monitor database query performance

## Troubleshooting

### Users can't login after signup
- Verify email confirmation is working
- Check NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL is correct
- Confirm Supabase auth settings

### Credit transfers not working
- Verify RLS policies on credits table
- Check task_completions table has proper policies
- Ensure user is authenticated before operations

### Features not showing up
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Verify environment variables in Vercel

---

For detailed help, refer to Supabase and Vercel documentation.
