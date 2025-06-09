# i-ContainerHub@LTA

A digital marketplace platform for optimizing container logistics through street-turn operations.

## Overview

i-ContainerHub@LTA is a SaaS platform that connects trucking companies and shipping lines to facilitate efficient container reuse, reducing empty container movements and environmental impact.

## Key Features

- **Street-Turn Optimization**: Match import containers with export bookings
- **Real-time Notifications**: Instant updates on request status
- **Role-based Access**: Separate interfaces for Dispatchers and Carrier Admins
- **Cost & CO2 Tracking**: Measure environmental and economic benefits

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + Shadcn/ui
- **Language**: TypeScript
- **Deployment**: Vercel

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials.

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Authentication routes
│   ├── (main)/         # Main application routes
│   └── api/            # API routes
├── components/         # React components
│   ├── ui/            # Shadcn/ui components
│   ├── common/        # Shared components
│   ├── auth/          # Authentication components
│   └── features/      # Feature-specific components
├── lib/               # Utilities and configurations
├── hooks/             # Custom React hooks
└── middleware.ts      # Route protection
```

## License

Private project for LTA logistics optimization. 