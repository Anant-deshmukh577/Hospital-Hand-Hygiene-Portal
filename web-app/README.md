# Hand Hygiene Compliance System - Frontend

A React web app for tracking and managing hand hygiene compliance in healthcare settings. Built with React 19, Vite, and modern tooling.

## Tech Stack

**Core:**
- React 19.2.0 - Latest version with performance improvements
- Vite 7.2.4 - Fast build tool and dev server
- React Router DOM 7.12.0 - Client-side routing

**State Management:**
- Zustand 5.0.10 - Lightweight global state
- TanStack React Query 5.90.19 - Server state and caching
- Axios 1.13.2 - HTTP client

**UI & Styling:**
- Lucide React 0.562.0 - Modern icons
- React Icons 5.5.0 - Additional icon sets
- Recharts 3.7.0 - Charts and data visualization
- clsx 2.1.1 - className utilities

**Forms:**
- React Hook Form 7.71.1 - Form handling
- React Hot Toast 2.6.0 - Toast notifications

**Auth:**
- Firebase 12.8.0 - Authentication and real-time features

**Dev Tools:**
- ESLint 9.39.1 - Linting
- Vite Plugin React 5.1.1 - Fast refresh

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Backend server running at `https://hospital-hand-hygiene-portal-backend.onrender.com`

## Getting Started

Navigate to the frontend folder and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=https://hospital-hand-hygiene-portal-backend.onrender.com/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build
npm run preview  # Preview production build locally
npm run lint     # Check code quality
```

## Project Structure

```
frontend/
├── public/                      # Static files
│   └── assets/
│       ├── icons/              # App icons
│       └── images/             # Images
│           ├── badges/         # Achievement badge images
│           └── who-moments/    # WHO 5 Moments images
├── src/
│   ├── components/             # React components
│   │   ├── admin/             # Admin-only components
│   │   │   ├── AddUserForm.jsx
│   │   │   ├── PendingRewardsApproval.jsx
│   │   │   ├── ReportGenerator.jsx
│   │   │   ├── RewardManagement.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── WardManagement.jsx
│   │   ├── auth/              # Auth components
│   │   │   ├── AdminLoginForm.jsx
│   │   │   ├── AuditorLoginForm.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── common/            # Reusable UI components
│   │   │   ├── Alert.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Checkbox.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Radio.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Textarea.jsx
│   │   ├── dashboard/         # Dashboard widgets
│   │   │   ├── ComplianceRate.jsx
│   │   │   ├── QuickActions.jsx
│   │   │   ├── RecentActivities.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── WeeklyChart.jsx
│   │   ├── leaderboard/       # Leaderboard components
│   │   │   ├── DepartmentRanking.jsx
│   │   │   ├── LeaderboardFilters.jsx
│   │   │   ├── LeaderboardTable.jsx
│   │   │   ├── RankCard.jsx
│   │   │   └── TopPerformers.jsx
│   │   ├── observation/       # Observation entry
│   │   │   ├── ActionSelector.jsx
│   │   │   ├── GloveSelector.jsx
│   │   │   ├── HygieneStatusSelector.jsx
│   │   │   ├── ObservationCard.jsx
│   │   │   ├── ObservationForm.jsx
│   │   │   ├── ObservationHistory.jsx
│   │   │   ├── RiskFactors.jsx
│   │   │   ├── SessionHeader.jsx
│   │   │   └── WHOMomentSelector.jsx
│   │   ├── profile/           # User profile
│   │   │   ├── AchievementBadges.jsx
│   │   │   ├── ActivityHistory.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   ├── ProfileCard.jsx
│   │   │   └── ProfileForm.jsx
│   │   └── rewards/           # Rewards
│   │       ├── PointsHistory.jsx
│   │       └── RewardCard.jsx
│   ├── config/                # Configuration
│   │   └── firebase.js        # Firebase setup
│   ├── context/               # React Context
│   │   ├── AuthContext.jsx    # Auth state
│   │   ├── NotificationContext.jsx  # Toasts
│   │   └── ThemeContext.jsx   # Theme (light/dark)
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useClickOutside.js
│   │   ├── useDebounce.js
│   │   ├── useLeaderboard.js
│   │   ├── useLocalStorage.js
│   │   ├── useObservation.js
│   │   ├── useProfile.js
│   │   └── useRewards.js
│   ├── pages/                 # Page components
│   │   ├── admin/             # Admin pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageRewards.jsx
│   │   │   ├── ManageUsers.jsx
│   │   │   ├── ManageWards.jsx
│   │   │   └── ViewReports.jsx
│   │   ├── auditor/           # Auditor pages
│   │   │   └── AuditorDashboard.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── AuditorLogin.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Landing.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Login.jsx
│   │   ├── NotFound.jsx
│   │   ├── ObservationEntry.jsx
│   │   ├── ObservationHistory.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   │   ├── Reports.jsx
│   │   ├── Rewards.jsx
│   │   └── Settings.jsx
│   ├── services/              # API layer
│   │   ├── api.js             # Axios instance
│   │   ├── authService.js     # Auth APIs
│   │   ├── healthService.js   # Health checks
│   │   ├── leaderboardService.js
│   │   ├── observationService.js
│   │   ├── reportService.js
│   │   ├── rewardService.js
│   │   ├── sessionService.js
│   │   ├── userService.js
│   │   └── wardService.js
│   ├── stores/                # Zustand stores
│   │   ├── leaderboardStore.js
│   │   ├── observationStore.js
│   │   ├── rewardStore.js
│   │   └── uiStore.js
│   ├── styles/                # Styles
│   │   ├── components/        # Component styles
│   │   ├── global.css         # Global CSS
│   │   └── index.css          # Root styles
│   ├── utils/                 # Utilities
│   │   ├── constants.js       # App constants
│   │   ├── dateFormatter.js   # Date helpers
│   │   ├── helpers.js         # General helpers
│   │   ├── requestCache.js    # Request caching
│   │   ├── scoreCalculator.js # Points calculation
│   │   └── validators.js      # Form validation
│   ├── App.jsx                # Root component
│   ├── main.jsx               # Entry point
│   └── routes.jsx             # Routes
├── .env                       # Environment vars
├── .gitignore                # Git ignore
├── eslint.config.js          # ESLint config
├── index.html                # HTML template
├── package.json              # Dependencies
├── README.md                 # This file
└── vite.config.js            # Vite config
```

## Features

### Authentication & Authorization

Role-based access with separate login flows for Staff, Auditor, and Admin. Protected routes automatically redirect unauthorized users. Firebase handles authentication, with JWT tokens for API calls.

### Staff Features

Staff members get a personal dashboard showing their stats, observation history, points, and rewards. They can view their leaderboard ranking, manage their profile, and track achievement badges.

### Auditor Features

Auditors can create and manage observation sessions, record hand hygiene observations in real-time, track WHO 5 Moments compliance, and monitor staff performance.

### Admin Features

Admins have full control: user management (create, edit, deactivate, change roles), ward management, reward catalog configuration, pending reward approvals with rejection and automatic refunds, comprehensive reporting and analytics, plus system-wide statistics.

## Component Architecture

### Context Providers

- **AuthContext** - Authentication state and user data
- **ThemeContext** - Light/dark mode switching
- **NotificationContext** - Toast notifications

### Custom Hooks

We've built several custom hooks to make development easier:

- **useAuth** - Access auth state and methods
- **useDebounce** - Debounce input values
- **useClickOutside** - Detect outside clicks
- **useLocalStorage** - Persist state locally
- **useLeaderboard** - Leaderboard data fetching
- **useObservation** - Observation operations
- **useProfile** - Profile data management
- **useRewards** - Reward operations

### State Management

We use Zustand stores for global UI state, leaderboard data, observations, and rewards. React Query handles server state caching and synchronization. The Context API manages authentication and theme.

## API Integration

All API communication goes through a centralized service layer. The base URL is set via `VITE_API_URL` in your `.env` file. JWT tokens are stored in localStorage and automatically injected into requests. We have built-in error handling, retry logic with exponential backoff, and request caching to prevent duplicate calls.

### Available Services

- `authService` - Login, register, logout, password reset
- `userService` - User CRUD operations
- `observationService` - Observation entry and history
- `sessionService` - Session management
- `rewardService` - Claiming and history
- `leaderboardService` - Rankings and stats
- `reportService` - Analytics and reports
- `wardService` - Ward management
- `healthService` - Backend health checks

## Security

JWT-based authentication with protected routes and role validation. Tokens refresh automatically. We handle passwords securely, protect against XSS, rely on backend CSRF protection, and implement rate limiting with retry logic.

## Data Visualization

Charts are built with Recharts and include line charts for weekly compliance trends, bar charts for department comparisons, pie charts for observation distribution, and area charts for points history. All charts are responsive and accessible.

## Performance Optimizations

We've optimized performance with code splitting using React Router lazy loading, request caching to prevent duplicate API calls, debounced inputs for search and filters, React Query caching with a 5-minute stale time, Vite's fast HMR for instant feedback during development, and production build optimization with tree-shaking.

## Deployment

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Preview Locally

```bash
npm run preview
```

### Production Environment Variables

Make sure these are set in your production environment:
- `VITE_API_URL` - Your backend API URL
- All Firebase configuration variables

### Where to Deploy

You can deploy the built app to:
- **Vercel** - Great for Vite apps, recommended
- **Netlify** - Easy drag-and-drop deployment
- **AWS S3 + CloudFront** - Scalable static hosting
- **Firebase Hosting** - Integrates well with Firebase Auth
- **GitHub Pages** - Free for public repos

### Deploying to Vercel

Install the CLI:
```bash
npm install -g vercel
```

Deploy:
```bash
vercel
```

Then set your environment variables in the Vercel dashboard and configure these build settings:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Testing

### Manual Testing Checklist

- Test all user flows (Staff, Auditor, Admin)
- Verify authentication and authorization
- Check responsive design on mobile and desktop
- Test form validations
- Verify API error handling

### Test Credentials

After seeding the backend database:
- **Admin**: admin@aiims.edu / Admin@123
- **Auditor**: auditor@aiims.edu / Auditor@123
- **Staff**: sarah@aiims.edu / Staff@123

## Troubleshooting

### Rate Limit Errors (429)

The backend has rate limiting enabled. If you hit the limit, wait a minute and try again. The app has automatic retry logic built in.

### Can't Connect to Backend

Make sure the backend is running on port 5000. Check that `VITE_API_URL` in your `.env` file is correct. Verify the proxy configuration in `vite.config.js`.

### Firebase Auth Errors

Double-check your Firebase configuration in `.env`. Make sure the auth methods you need are enabled in the Firebase console. Verify your Firebase project is active.

### Build Errors

Try clearing node_modules and reinstalling:
```bash
rm -rf node_modules && npm install
```

Clear Vite's cache:
```bash
rm -rf node_modules/.vite
```

Make sure you're using Node.js v18 or higher.

### Hot Reload Not Working

Restart the dev server, check for syntax errors in your code, and clear your browser cache.

## Code Style

We follow React best practices: functional components with hooks, small and focused components, meaningful naming, comments for complex logic, and ESLint for code quality checks.

## Contributing

If you're contributing to this project:
1. Follow the existing code structure
2. Keep your code clean and readable
3. Test your changes thoroughly
4. Update docs if you add new features
5. Follow component naming conventions

## License

This project is proprietary and confidential.

## Support

Need help?
- Check the User Manual (USER_MANUAL.md)
- Review the backend README for API docs
- Contact the development team

## Version History

**v1.0.0** - Initial release
- Staff, Auditor, and Admin roles
- Hand hygiene observation tracking
- Points and rewards system
- Leaderboard and analytics
- Comprehensive reporting

---

**Built with ❤️ for healthcare professionals**