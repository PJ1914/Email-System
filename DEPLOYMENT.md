# Deployment Guide - AI Communication Platform

## Prerequisites

- Domain name (for production)
- Hosting service accounts (Heroku, Vercel, Railway, etc.)
- Production Firebase project
- Production AWS account with SES
- Production Gemini API key

## Backend Deployment Options

### Option 1: Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku App**
```bash
cd backend
heroku create your-app-name-backend
```

4. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_CLIENT_EMAIL=your-email
heroku config:set FIREBASE_PRIVATE_KEY="your-key"
heroku config:set AWS_REGION=us-east-1
heroku config:set AWS_ACCESS_KEY_ID=your-key
heroku config:set AWS_SECRET_ACCESS_KEY=your-secret
heroku config:set AWS_SES_FROM_EMAIL=your-email
heroku config:set GEMINI_API_KEY=your-key
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
```

5. **Add Procfile**
Create `Procfile` in backend root:
```
web: node dist/index.js
```

6. **Deploy**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Option 2: Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login and Initialize**
```bash
railway login
cd backend
railway init
```

3. **Set Environment Variables**
Go to Railway dashboard and add all environment variables from `.env`

4. **Deploy**
```bash
railway up
```

### Option 3: AWS EC2

1. **Launch EC2 Instance** (Ubuntu)

2. **Connect via SSH**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Clone and Setup**
```bash
git clone your-repo-url
cd backend
npm install
npm run build
```

5. **Install PM2**
```bash
sudo npm install -g pm2
```

6. **Create .env file**
```bash
nano .env
# Add all environment variables
```

7. **Start with PM2**
```bash
pm2 start dist/index.js --name ai-platform-backend
pm2 save
pm2 startup
```

8. **Configure Nginx**
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

9. **Restart Nginx**
```bash
sudo systemctl restart nginx
```

## Frontend Deployment Options

### Option 1: Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
cd frontend
vercel
```

4. **Set Environment Variables**
Go to Vercel Dashboard > Project > Settings > Environment Variables
Add all VITE_ variables

5. **Redeploy**
```bash
vercel --prod
```

### Option 2: Netlify

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Build**
```bash
cd frontend
npm run build
```

4. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

5. **Set Environment Variables**
Go to Netlify Dashboard > Site Settings > Environment Variables
Add all VITE_ variables

### Option 3: Firebase Hosting

1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Login**
```bash
firebase login
```

3. **Initialize**
```bash
cd frontend
firebase init hosting
```

4. **Build**
```bash
npm run build
```

5. **Deploy**
```bash
firebase deploy --only hosting
```

## Environment Variables Setup

### Backend Production (.env)
```env
PORT=5000
NODE_ENV=production

FIREBASE_PROJECT_ID=prod-project-id
FIREBASE_CLIENT_EMAIL=prod-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=prod-access-key
AWS_SECRET_ACCESS_KEY=prod-secret-key
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

GEMINI_API_KEY=prod-gemini-key

CORS_ORIGIN=https://yourdomain.com
```

### Frontend Production (.env.production)
```env
VITE_API_URL=https://api.yourdomain.com/api

VITE_FIREBASE_API_KEY=prod-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=prod-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=prod-project-id
VITE_FIREBASE_STORAGE_BUCKET=prod-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=prod-sender-id
VITE_FIREBASE_APP_ID=prod-app-id
```

## Post-Deployment Checklist

### Security
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up firewall rules
- [ ] Configure CORS properly
- [ ] Rotate API keys regularly
- [ ] Set up monitoring and alerts
- [ ] Enable rate limiting
- [ ] Add helmet.js to backend
- [ ] Sanitize user inputs

### Performance
- [ ] Enable compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Minify CSS/JS
- [ ] Enable Gzip compression

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Set up logging (CloudWatch, LogRocket)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Configure backup strategy

### Database
- [ ] Set up Firestore indexes
- [ ] Configure security rules
- [ ] Enable backups
- [ ] Set up data retention policies

### Email
- [ ] Verify production email in AWS SES
- [ ] Request SES production access (remove sandbox)
- [ ] Set up bounce/complaint handling
- [ ] Configure SPF/DKIM records

## SSL Certificate Setup

### Using Let's Encrypt (Certbot)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Database Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /emails/{emailId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.from;
    }
  }
}
```

## Scaling Considerations

### Backend
- Use load balancer for multiple instances
- Implement Redis for caching
- Use message queues for email processing
- Containerize with Docker
- Deploy with Kubernetes for auto-scaling

### Frontend
- Use CDN for global distribution
- Implement code splitting
- Use lazy loading for routes
- Optimize bundle size
- Enable service workers for offline support

## Backup Strategy

### Database
```bash
# Firestore backup (scheduled daily)
gcloud firestore export gs://your-backup-bucket
```

### Code
- Use Git version control
- Tag releases
- Maintain separate branches (dev, staging, production)

## Monitoring Tools

- **Backend**: PM2, New Relic, DataDog
- **Frontend**: Google Analytics, Sentry, LogRocket
- **Infrastructure**: CloudWatch, Grafana, Prometheus
- **Uptime**: Pingdom, UptimeRobot

## Rollback Plan

1. Keep previous version tagged in Git
2. Maintain database backup before major updates
3. Use blue-green deployment
4. Test rollback procedure in staging

## Support & Maintenance

- Monitor error logs daily
- Review performance metrics weekly
- Update dependencies monthly
- Security audit quarterly
- Backup verification monthly

## Cost Optimization

- Use AWS SES wisely (monitor sending limits)
- Optimize Gemini API calls (cache results)
- Use Firestore efficiently (batch reads/writes)
- Monitor bandwidth usage
- Set up billing alerts

## License

MIT
