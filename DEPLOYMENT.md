# 🚀 Deployment Guide for ArtistBlend

This guide will help you deploy your ArtistBlend application to production.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **Spotify Developer Account**: For API credentials
3. **Railway Account**: For backend deployment (free tier available)
4. **Vercel Account**: For frontend deployment (free tier available)

## 🎯 Deployment Strategy

- **Backend**: Railway (Go + MongoDB)
- **Frontend**: Vercel (React)
- **Database**: MongoDB Atlas (free tier)

## 🛠️ Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Create a database user
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Connect to Railway
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `artist-blend` repository

### 2.2 Configure Backend Service
1. Railway will detect the `backend/` folder
2. Go to the backend service settings
3. Set these environment variables:

```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-backend-domain.railway.app/callback
FRONTEND_URL=https://your-frontend-domain.vercel.app
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artist_blend
PORT=8000
GIN_MODE=release
```

### 2.3 Deploy
1. Railway will automatically build and deploy
2. Note your backend URL (e.g., `https://artist-blend-backend.railway.app`)

## ⚡ Step 3: Deploy Frontend to Vercel

### 3.1 Connect to Vercel
1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your `artist-blend` repository

### 3.2 Configure Frontend
1. Set **Root Directory** to `frontend`
2. Set **Build Command** to `npm run build`
3. Set **Output Directory** to `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend-domain.railway.app`

### 3.3 Deploy
1. Click "Deploy"
2. Note your frontend URL (e.g., `https://artist-blend.vercel.app`)

## 🎵 Step 4: Update Spotify App Configuration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click "Edit Settings"
4. Add these redirect URIs:
   - `https://your-backend-domain.railway.app/callback`
5. Save changes

## 🔄 Step 5: Update Environment Variables

### Backend (Railway)
Update the `FRONTEND_URL` in Railway to match your Vercel URL:
```bash
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend (Vercel)
Update the `VITE_API_URL` in Vercel to match your Railway URL:
```bash
VITE_API_URL=https://your-backend-domain.railway.app
```

## 🧪 Step 6: Test Your Deployment

1. Visit your frontend URL
2. Try to log in with Spotify
3. Create a playlist
4. Check if everything works correctly

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `FRONTEND_URL` in backend matches your Vercel domain
2. **Spotify Login Issues**: Verify redirect URI in Spotify dashboard
3. **Database Connection**: Check MongoDB Atlas connection string
4. **Build Failures**: Check Railway logs for Go build errors

### Useful Commands:

```bash
# Check Railway logs
railway logs

# Check Vercel deployment status
vercel logs

# Test backend health
curl https://your-backend-domain.railway.app/api/health
```

## 💰 Cost Breakdown

- **Railway**: Free tier (500 hours/month), then $5/month
- **Vercel**: Free tier (unlimited for personal projects)
- **MongoDB Atlas**: Free tier (512MB storage)

**Total**: $0/month (free tier) or $5/month (if you exceed Railway free tier)

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Both Railway and Vercel provide HTTPS by default
3. **CORS**: Properly configured for production domains
4. **Spotify Scopes**: Only request necessary permissions

## 📈 Monitoring

- **Railway**: Built-in metrics and logs
- **Vercel**: Analytics and performance monitoring
- **MongoDB Atlas**: Database monitoring

## 🚀 Next Steps

1. Set up custom domains (optional)
2. Configure CI/CD for automatic deployments
3. Set up monitoring and alerts
4. Consider upgrading to paid tiers for better performance

---

**Your ArtistBlend app should now be live and accessible to users worldwide! 🎉**
