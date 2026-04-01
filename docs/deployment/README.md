# Deployment Guide

## 📦 Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🗄️ Database Setup
### Step 1: Run Migrations
`npm run migrate:deploy`

### Step 2: Enable RLS
Ensure RLS is enabled for `orders`, `quotations`, `order_pricing`, and `quotation_pricing`.

## 🚢 Vercel Deployment
1. Link project: `vercel link`
2. Configure env: `vercel env add ...`
3. Deploy: `vercel --prod`

## 📊 Monitoring
Alerts configured for high error rates (>5%) and slow API response (>1000ms).
