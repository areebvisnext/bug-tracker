# ManageBug — Bug Tracking System

A project management-focused bug tracking system with role-based access control. Built as part of the Visnext Test Task.

## Features

- **Role-based access** — three distinct user roles with different permissions
- **Bug & feature tracking** — create, assign, and track bugs and feature requests with status updates
- **Screenshot uploads** — QAs can attach screenshots to bugs
- **Email notifications** — automated emails when users are added to a project or assigned a bug
- **Project membership** — developers are scoped to their assigned projects

## User Roles

**Manager** - Creates projects, assigns team members, views all bugs across their projects
**QA** - Creates bugs in assigned projects, uploads screenshots, manages bug details
**Developer** - Updates the status of bugs assigned to them

## Tech Stack

- **Frontend** — Next.js (App Router)
- **Backend** — FastAPI (Python)
- **Auth & Database** — Supabase
- **Email** — fastapi-mail (SMTP)

## Project Structure

```
├── frontend/        # Next.js app
└── backend/         # FastAPI app
```

## To run the project locally

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
MAIL_FROM=your_email@example.com
MAIL_PORT=587
MAIL_SERVER=smtp.example.com
```

```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## API

Interactive API docs are available at `http://127.0.0.1:8000/docs` when the backend is running.

## Deployed:

The projects is deployed on this url: `https://bug-tracker-nljuzyvm9-areeb-s-projects4.vercel.app`
