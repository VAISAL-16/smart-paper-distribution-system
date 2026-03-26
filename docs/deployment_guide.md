# Deployment Guide

This project is best deployed for academic/portfolio use with:

- Frontend: `Vercel`
- Backend API: `Render`
- Database: `MongoDB Atlas`

## 1. MongoDB Atlas

1. Create a free cluster in MongoDB Atlas.
2. Create a database user.
3. Add your IP or use `0.0.0.0/0` for demo access.
4. Copy the connection string and use it as `MONGO_URL`.

Example:

```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/smart_exam_db
```

## 2. Render Backend Deployment

This repo includes [`render.yaml`](/render.yaml), so Render can read the service settings automatically.

### Render setup

1. Sign in to Render.
2. Create a new `Web Service` from your GitHub repo.
3. Select this repository.
4. Confirm the `Root Directory` is `server`.
5. Use:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add the required environment variables.

### Required backend environment variables

```env
NODE_ENV=production
PORT=5000
MONGO_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=8h
GOOGLE_CLIENT_ID=your_google_client_id
CORS_ORIGIN=https://your-vercel-domain.vercel.app
USE_STATIC_OTP=false
OTP_TTL_MINUTES=5
RESET_TOKEN_TTL_MINUTES=10
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_default_template_id
EMAILJS_LOGIN_TEMPLATE_ID=your_login_template_id
EMAILJS_FORGOT_TEMPLATE_ID=your_forgot_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_PRIVATE_KEY=your_emailjs_private_key
```

After deployment, note your Render API URL, for example:

```text
https://smart-paper-distribution-api.onrender.com
```

## 3. Vercel Frontend Deployment

This repo includes [`vercel.json`](/vercel.json) for SPA rewrites.

### Vercel setup

1. Sign in to Vercel.
2. Import the GitHub repository.
3. Keep the project root as the repository root.
4. Add the frontend environment variables below.
5. Deploy.

### Required frontend environment variables

```env
VITE_API_URL=https://your-render-api.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SESSION_TTL_MS=28800000
```

## 4. Final Wiring

After both are deployed:

1. Copy your Vercel frontend URL.
2. Set that value in Render as `CORS_ORIGIN`.
3. Redeploy the Render service.
4. Test:
   - login OTP
   - forgot password OTP
   - admin pages
   - paper setter pages
   - invigilator pages

## 5. Recommended Demo Safety

For public demo deployment:

- Keep only demo accounts and demo data.
- Never commit real `.env` files.
- Use strong `JWT_SECRET`.
- Use MongoDB Atlas credentials created only for this project.
- Keep `USE_STATIC_OTP=false` for realistic OTP generation.

## 6. Health Check

After backend deployment, verify:

```text
GET https://your-render-api.onrender.com/health
```

It should return a healthy JSON response.
