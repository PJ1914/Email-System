# AI Communication Automation Platform

Production-ready full-stack application for AI-powered email automation using TRAE (Task-Routing Agent Engine) architecture.

## Features

- AI-powered email processing with TRAE agent system
- Auto-reply generation using Gemini AI
- Task extraction and prioritization
- Multi-user support with role-based access
- Real-time email management
- Professional dark mode UI with peach accents
- Comprehensive analytics dashboard

## Role-Based Access Control (RBAC)

The platform uses a secure three-tier role system:

- **Admin**: Full system access, can create emails and manage users (first user becomes admin automatically)
- **Manager**: Can assign emails to users and coordinate teams
- **User**: Can use assigned emails and manage their own inbox

**Key Security Features:**
- ✅ First user to register automatically becomes Admin
- ✅ Public registration defaults to User role (cannot be manipulated)
- ✅ Only Admins can create users with specific roles via `/api/auth/users/create`
- ✅ Middleware protects all routes based on role
- ✅ Users can only access their assigned emails

📖 **See [RBAC_GUIDE.md](RBAC_GUIDE.md) for complete documentation**

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Firebase Authentication & Firestore
- AWS SES for email delivery
- Google Gemini AI for intelligent processing
- Winston logging

### Frontend
- React 18 + TypeScript
- Vite for fast development
- TailwindCSS for styling
- React Router for navigation
- Recharts for analytics
- Firebase SDK for authentication

## Project Structure

```
YantraYugam_Hack/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   │   └── trae/       # TRAE agent system
│   │   │       └── agents/ # Individual AI agents
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── config/         # Configuration
    │   ├── context/        # React context
    │   ├── lib/            # Libraries (axios)
    │   ├── pages/          # Page components
    │   └── types/          # TypeScript types
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase config
```

3. Start development server:
```bash
npm run dev
```

## TRAE Agent System

The TRAE (Task-Routing Agent Engine) consists of 6 specialized AI agents:

1. **SummarizerAgent** - Generates concise email summaries
2. **TaskExtractorAgent** - Extracts actionable tasks
3. **PriorityAgent** - Determines message priority (low/medium/high/urgent)
4. **DeadlineAgent** - Detects and extracts deadlines
5. **IntentAgent** - Identifies sender's intent
6. **ReplyAgent** - Generates professional auto-replies

### Workflow

```
Incoming Email → Summary → Task Extraction → Priority Detection → 
Deadline Detection → Intent Analysis → Auto-Reply (if enabled)
```

## User Roles

- **Admin**: Full system access, manage emails and users
- **Manager**: Assign emails, manage team members
- **User**: Use assigned emails, enable auto-reply mode

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/auto-mode` - Toggle auto-reply

### Emails
- `POST /api/emails/create` - Create email (Admin)
- `POST /api/emails/assign` - Assign to users
- `GET /api/emails` - List emails
- `GET /api/emails/:id` - Get email details
- `PUT /api/emails/:id` - Update email
- `DELETE /api/emails/:id` - Delete email

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/inbox` - Get user inbox
- `GET /api/messages/:emailId/inbox` - Get email inbox
- `GET /api/messages/:id` - Get message details
- `DELETE /api/messages/:id` - Delete message

## Pages

1. **Login / Register** - Authentication
2. **Dashboard** - Overview with stats
3. **Inbox** - View and manage messages
4. **Compose** - Send new messages
5. **AI Dashboard** - Analytics and agent performance
6. **Email Management** - Admin email configuration
7. **Settings** - User preferences and auto-mode

## Environment Variables

### Backend (.env)
```
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_FROM_EMAIL=
GEMINI_API_KEY=
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Production Build

### Backend
```bash
npm run build
npm start
```

### Frontend
```bash
npm run build
npm run preview
```

## License

MIT

## Author

Built for YantraYugam Hackathon
