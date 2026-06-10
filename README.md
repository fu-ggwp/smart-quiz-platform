# Smart Quiz Platform

A web-based platform that helps teachers create classes, manage question banks and study sets, and lets learners practice and take exams with AI-assisted support.

## Tech Stack

- Backend: Node.js, Express.js
- Frontend: Next.js (React)
- Database: Supabase (PostgreSQL)
- Other: Swagger/OpenAPI for API docs

## Project Structure

```
smart-quiz-platform/
├── client/        # Next.js frontend
├── server/        # Express.js backend (feature-folder architecture)
├── docs/          # Documentation
├── plans/         # Planning documents
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- Supabase account/project

### Installation

```
git clone https://github.com/fu-ggwp/smart-quiz-platform.git
cd smart-quiz-platform
npm install
```

### Environment Variables

Create a .env file in server/ with your Supabase credentials:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=5000
```
### Running the project

# Backend

```
cd server
npm run dev
```

# Frontend

```
cd client
npm run dev
```

## API Documentation

Once the server is running, API docs are available at:

```
http://localhost:5000/api-docs
```

## Team

Developed by Group fu-ggwp — FPT University SWP391 project.

## License

This project is for educational purposes (FPT University coursework).
