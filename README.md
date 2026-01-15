# Community Time Bank

A full-stack web application built with Next.js, Tailwind CSS, and Supabase that enables communities to exchange skills and earn time credits.

## Features

- **User Authentication**: Secure email/password signup and login with Supabase Auth
- **Skill Management**: Users can offer skills in categories like teaching, repairs, cleaning, and caregiving
- **Task System**: Post requests for help with credit-based compensation (1 hour = 1 credit)
- **Credit System**: Automatic credit transfer upon task completion with confirmation
- **User Profiles**: Customizable profiles with bio and contribution tracking
- **Badges & Recognition**: Earn badges for community contributions (helper, popular, trusted, consistent)
- **Public Dashboard**: View community impact metrics and top contributors
- **Mobile Responsive**: Fully responsive design optimized for all devices

## Tech Stack

- **Frontend**: Next.js 16 with React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **Security**: Row Level Security (RLS) policies on all tables
- **UI Components**: shadcn/ui components
- **Charts**: Recharts for community impact visualization

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier available)

### Environment Setup

1. Clone this repository
2. Copy `.env.example` to `.env.local`
3. Add your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project or use existing one
   - Copy your project URL and anon key
   - Paste into `.env.local`

### Database Setup

1. In the Supabase dashboard, go to SQL Editor
2. Run the migration script: `scripts/001_create_tables.sql`
3. Wait for all tables and policies to be created

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── app/
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles with design tokens
│   ├── auth/                    # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── sign-up-success/
│   ├── protected/               # Authenticated routes
│   │   ├── dashboard/           # User dashboard
│   │   ├── offer-skill/         # Create skill offering
│   │   ├── request-help/        # Create help request
│   │   ├── explore/             # Browse community skills
│   │   ├── skills/              # Manage user skills
│   │   ├── tasks/               # Manage user tasks
│   │   ├── profile/             # User profile and badges
│   │   └── task/[id]/           # Task detail and actions
│   ├── community/
│   │   └── [userId]/            # Public user profiles
│   └── community-impact/        # Public impact dashboard
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── navigation.tsx           # Main navigation bar
│   ├── credit-balance.tsx       # Credit display component
│   └── recent-tasks.tsx         # Recent tasks widget
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── proxy.ts             # Middleware for auth
│   └── utils.ts                 # Utility functions
├── proxy.ts                     # Middleware entry point
├── scripts/
│   └── 001_create_tables.sql    # Database schema
└── public/                      # Static assets
```

## Key Features Explained

### Authentication Flow
- Users sign up with email/password
- Confirmation email sent automatically
- After email confirmation, session is established
- Protected routes redirect to login if not authenticated
- Automatic session refresh via middleware

### Credit System
1. User A offers a skill and completes work for User B
2. User A marks task as complete
3. System creates task_completion record with "pending" status
4. User B (requester) confirms task completion
5. Automatic credit transfer: +credits to User A, -credits to User B
6. Credits recorded in ledger for tracking

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only view/edit their own data (except public profile views)
- Task completion records can only be accessed by involved parties
- Impact dashboard visible to everyone (public data only)

### Badges System
Currently supports:
- **Helper**: For completing tasks
- **Popular**: For highly requested skills
- **Trusted**: For reliable community members
- **Consistent**: For regular contributors

Badges can be awarded manually by admins or automatically via triggers.

## Deployment to Vercel

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (set to your production domain)
5. Deploy!

## Database Tables

- **profiles**: User profile information
- **skills**: Skills offered by users
- **tasks**: Help requests posted by users
- **task_completions**: Record of completed exchanges
- **credits**: Ledger of all credit transactions
- **badges**: User achievements and recognition

All tables have RLS policies for security and use `auth.users` as the single source of truth.

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Security Considerations

- All user data is protected by RLS policies
- Passwords are hashed by Supabase Auth
- Sessions managed via secure HTTP-only cookies
- Sensitive operations use server-side Supabase client
- Email confirmation required before data operations
- No sensitive data stored in client-side state

## Future Enhancements

- Ratings and reviews for community members
- In-app messaging between users
- Advanced search and filtering
- Recurring tasks and subscriptions
- Payment integration for premium features
- Community verification badges
- Reporting and dispute resolution system

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with details
3. Contact support via email

---

Built with ❤️ for strengthening communities through skill sharing.
