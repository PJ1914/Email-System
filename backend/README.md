# AI Communication Automation Platform - Backend

Production-ready backend for AI-powered email automation using TRAE (Task-Routing Agent Engine) architecture.

## Features

- Firebase Authentication & Firestore
- AWS SES Email Integration
- Gemini AI-powered agents
- Role-based access control (Admin, Manager, User)
- Auto-reply system
- Task extraction and prioritization
- Multi-agent orchestration

## Setup

### Prerequisites

- Node.js 18+
- Firebase project
- AWS account with SES configured
- Google Gemini API key

### Installation

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SES_FROM_EMAIL`
- `GEMINI_API_KEY`

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/auto-mode` - Toggle auto-reply mode

### Emails
- `POST /api/emails/create` - Create email (Admin only)
- `POST /api/emails/assign` - Assign email to users
- `GET /api/emails` - Get all emails
- `GET /api/emails/:id` - Get email by ID
- `PUT /api/emails/:id` - Update email
- `DELETE /api/emails/:id` - Delete email

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/inbox` - Get user inbox
- `GET /api/messages/:emailId/inbox` - Get email inbox
- `GET /api/messages/:id` - Get message by ID
- `DELETE /api/messages/:id` - Delete message

## Architecture

### TRAE Agent System

1. **SummarizerAgent** - Generates concise summaries
2. **TaskExtractorAgent** - Extracts actionable tasks
3. **PriorityAgent** - Determines message priority
4. **DeadlineAgent** - Detects deadlines
5. **IntentAgent** - Identifies sender intent
6. **ReplyAgent** - Generates professional replies

### Workflow

```
Message → Summary → Tasks → Priority → Deadline → Intent → Auto-Reply (if enabled)
```

## User Roles

- **Admin**: Full system access, create emails, manage all users
- **Manager**: Assign emails, manage team
- **User**: Use assigned emails, enable auto-mode

## License

MIT
