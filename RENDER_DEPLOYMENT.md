# 🚀 Render Deployment Guide for ArtistBlend

This guide will help you deploy your ArtistBlend application to Render.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **Spotify Developer Account**: For API credentials
3. **Render Account**: Sign up at [render.com](https://render.com)
4. **MongoDB Atlas Account**: For production database

## 🎯 Deployment Strategy

- **Backend**: Render Web Service (Go)
- **Frontend**: Render Static Site (React)
- **Database**: MongoDB Atlas (free tier)

## 🛠️ Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Create a database user with read/write permissions
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## 🚂 Step 2: Deploy Backend to Render

### 2.1 Create Backend Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `artist-blend-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Go`
   - **Build Command**: `go build -o main .`
   - **Start Command**: `./main`
   - **Instance Type**: Free

### 2.2 Set Environment Variables
Add these environment variables in Render dashboard:

```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-backend-service.onrender.com/callback
FRONTEND_URL=https://your-frontend-service.onrender.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artist_blend
PORT=10000
GIN_MODE=release
```

### 2.3 Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Note your backend URL (e.g., `https://artist-blend-backend.onrender.com`)

## ⚡ Step 3: Deploy Frontend to Render

### 3.1 Create Frontend Static Site
1. In Render Dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure the site:
   - **Name**: `artist-blend-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 3.2 Set Environment Variables
Add this environment variable:

```bash
VITE_API_URL=https://your-backend-service.onrender.com
```

### 3.3 Deploy
1. Click "Create Static Site"
2. Render will build and deploy your frontend
3. Note your frontend URL (e.g., `https://artist-blend-frontend.onrender.com`)

## 🎵 Step 4: Update Spotify App Configuration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click "Edit Settings"
4. Add this redirect URI:
   - `https://your-backend-service.onrender.com/callback`
5. Save changes

## 🔄 Step 5: Update Environment Variables

### Backend (Render)
Update the `FRONTEND_URL` in Render to match your frontend URL:
```bash
FRONTEND_URL=https://your-frontend-service.onrender.com
```

### Frontend (Render)
Update the `VITE_API_URL` in Render to match your backend URL:
```bash
VITE_API_URL=https://your-backend-service.onrender.com
```

## 🧪 Step 6: Test Your Deployment

1. Visit your frontend URL
2. Try to log in with Spotify
3. Create a playlist
4. Check if everything works correctly

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `FRONTEND_URL` in backend matches your frontend domain
2. **Spotify Login Issues**: Verify redirect URI in Spotify dashboard
3. **Database Connection**: Check MongoDB Atlas connection string
4. **Build Failures**: Check Render build logs
5. **Cold Start**: Free tier services sleep after 15 minutes of inactivity

### Useful Commands:

```bash
# Check Render logs
# Go to your service dashboard → Logs tab

# Test backend health
curl https://your-backend-service.onrender.com/api/health

# Check if services are running
# Go to Render dashboard → Services
```

## 💰 Cost Breakdown

- **Backend**: Free tier (750 hours/month), then $7/month
- **Frontend**: Free tier (unlimited)
- **MongoDB Atlas**: Free tier (512MB storage)

**Total**: $0/month (free tier) or $7/month (if you exceed backend free tier)

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Render provides HTTPS by default
3. **CORS**: Properly configured for production domains
4. **Spotify Scopes**: Only request necessary permissions

## 📈 Monitoring

- **Render**: Built-in metrics and logs
- **MongoDB Atlas**: Database monitoring
- **Custom Domains**: Available on paid plans

## 🚀 Next Steps

1. Set up custom domains (paid feature)
2. Configure auto-deploy from GitHub
3. Set up monitoring and alerts
4. Consider upgrading to paid tiers for better performance

## 📝 Important Notes

- **Free Tier Limitations**: Services sleep after 15 minutes of inactivity
- **Build Time**: Free tier has limited build minutes
- **Custom Domains**: Available on paid plans only
- **SSL**: Automatically provided by Render

---

**Your ArtistBlend app should now be live on Render! 🎉**

## 🔗 Quick Links

- [Render Dashboard](https://dashboard.render.com)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
