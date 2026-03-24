# Quick Start Guide - AI Communication Automation Platform

## Prerequisites

Before you begin, ensure you have the following:

1. Node.js (v18 or higher)
2. npm or yarn
3. Firebase account
4. AWS account with SES configured
5. Google Gemini API key

## Step-by-Step Setup

### 1. Backend Configuration

#### Install Dependencies
```bash
cd backend
npm install
```

#### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Go to Project Settings > Service Accounts
6. Generate new private key (downloads JSON file)
7. Extract the following from the JSON:
   - `project_id`
   - `client_email`
   - `private_key`

#### AWS SES Setup
1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Verify your sender email address
3. Create IAM user with SES permissions
4. Generate access key and secret

#### Gemini AI Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy the key

#### Configure Environment
Create `.env` file in backend directory:

```env
PORT=5000
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_SES_FROM_EMAIL=verified@yourdomain.com

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Start Backend
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 2. Frontend Configuration

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Firebase Web Config
1. In Firebase Console, go to Project Settings
2. Scroll to "Your apps" section
3. Click "Web" to add web app
4. Copy the config object

#### Configure Environment
Create `.env` file in frontend directory:

```env
VITE_API_URL=http://localhost:5000/api

VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### Start Frontend
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Testing the Application

#### Create Admin User (First Registration)

**⚠️ IMPORTANT: The first user to register automatically becomes Admin!**

1. Open `http://localhost:5173`
2. Click "Sign up" or go to `/register`
3. Register with your admin credentials
4. **You are now Admin** (first user gets admin role automatically)
5. Login and verify admin access

**Creating Additional Users:**

**Option A: Self-Registration (becomes User)**
- Users visit `/register` and sign up
- They automatically get "user" role
- Admin assigns emails to them later

**Option B: Admin Creates Users with Specific Roles**
```bash
# Admin can create Managers or Users via API
curl -X POST http://localhost:5000/api/auth/users/create \
  -H "Authorization: Bearer <admin-firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com",
    "password": "password123",
    "displayName": "Team Manager",
    "role": "manager"
  }'
```

📖 **See [RBAC_GUIDE.md](RBAC_GUIDE.md) for complete role documentation**

#### Test Full Workflow
1. Login as admin
2. Go to Email Management
3. Create a new email account
4. Assign it to your user
5. Go to Compose and send a test message
6. Check Inbox for the message
7. View AI Dashboard for analytics
8. Enable Auto Mode in Settings

## Project Structure

```
YantraYugam_Hack/
├── backend/
│   ├── src/
│   │   ├── config/              # Firebase, AWS, Gemini config
│   │   ├── controllers/         # API controllers
│   │   ├── middleware/          # Auth & validation
│   │   ├── models/              # Database models
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   │   ├── trae/            # TRAE system
│   │   │   │   └── agents/      # AI agents
│   │   │   ├── aiService.ts     # Gemini integration
│   │   │   ├── authService.ts   # Authentication
│   │   │   ├── emailService.ts  # Email management
│   │   │   ├── messageService.ts # Messaging
│   │   │   └── sesService.ts    # AWS SES
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Logger, error handler
│   │   ├── app.ts               # Express app
│   │   └── index.ts             # Entry point
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/          # UI components
    │   ├── config/              # Constants & Firebase
    │   ├── context/             # Auth context
    │   ├── lib/                 # Axios instance
    │   ├── pages/               # Page components
    │   ├── types/               # TypeScript types
    │   ├── App.tsx              # Main app
    │   └── main.tsx             # Entry point
    ├── package.json
    └── .env
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/auto-mode` - Toggle auto-reply

### Emails (Admin)
- `POST /api/emails/create` - Create email
- `POST /api/emails/assign` - Assign to users
- `GET /api/emails` - List emails
- `PUT /api/emails/:id` - Update email
- `DELETE /api/emails/:id` - Delete email

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/inbox` - Get inbox
- `GET /api/messages/:id` - Get message

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change PORT in .env to different value (e.g., 5001)
```

**Firebase authentication error:**
```bash
# Verify FIREBASE_PRIVATE_KEY is properly escaped
# Ensure quotes around the entire key value
```

**AWS SES errors:**
```bash
# Verify email is verified in SES console
# Check IAM permissions for SES
```

**Gemini API errors:**
```bash
# Verify API key is valid
# Check quota limits in Google AI Studio
```

### Frontend Issues

**CORS errors:**
```bash
# Ensure backend CORS_ORIGIN matches frontend URL
# Default: http://localhost:5173
```

**Firebase initialization error:**
```bash
# Verify all Firebase config values in .env
# Ensure no extra quotes or whitespace
```

**Build errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

## Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ folder to hosting service
```

## Features Overview

1. **AI-Powered Processing**: Gemini AI analyzes emails for summary, tasks, priority
2. **Auto-Reply**: Automatically generate and send professional replies
3. **Task Extraction**: AI extracts actionable items from emails
4. **Priority Detection**: Automatically categorize message urgency
5. **Role-Based Access**: Admin, Manager, User roles with permissions
6. **Real-time Updates**: Firestore integration for live data
7. **Analytics Dashboard**: Track AI performance and metrics

## Support

For issues or questions:
1. Check console logs for errors
2. Verify all environment variables
3. Ensure services (Firebase, AWS, Gemini) are configured
4. Check network requests in browser DevTools

## Next Steps

1. Customize email templates
2. Add more AI agents
3. Implement email polling/webhooks
4. Add user management for admins
5. Enhance analytics with more metrics
6. Add email threading
7. Implement search functionality
8. Add file attachments support

## License

MIT
