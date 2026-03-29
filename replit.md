# MedNote AI

## Overview

MedNote AI is an AI-powered physician assistant web application designed for medical scribing and case management. The application enables healthcare providers to record patient encounters, automatically transcribe audio using AI, generate structured medical notes (HPI, ROS, Assessment, Plan, etc.), and manage patient cases with export capabilities. Built as a responsive mobile-first web app with a premium UI, it targets iOS and Android browsers with a focus on HIPAA-compliant practices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming via CSS variables
- **Animations**: Framer Motion for fluid transitions
- **Build Tool**: Vite for development and production builds

The frontend follows a mobile-first design pattern with a constrained max-width (max-w-md) container to simulate a native mobile app experience. Key UI patterns include:
- Bottom navigation bar for primary navigation
- Card-based case listings
- Audio recording interface with real-time visualization
- Premium subscription flow with Stripe integration planned

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **File Uploads**: Multer for handling audio and image uploads

The server architecture separates concerns into:
- `server/routes.ts` - API endpoint definitions
- `server/storage.ts` - Database abstraction layer using repository pattern
- `server/services/` - External service integrations (OpenAI, Gemini, Resend)

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

Key database tables:
- `users` - User accounts with authentication credentials
- `cases` - Medical case records with patient demographics, transcriptions, and AI-generated notes

### AI Integration Services
- **Audio Transcription**: Google Gemini API (gemini-2.5-flash) for multilingual audio transcription
- **Medical Note Generation**: OpenAI GPT API for generating structured medical summaries from transcriptions
- **Output Format**: Structured JSON with CC, HPI, ROS, Physical Exam, Assessment, DDx with ICD-10 codes, Treatment Plan

### Build and Deployment
- **Development**: Vite dev server with HMR for frontend, tsx for backend hot-reloading
- **Production Build**: Custom build script using esbuild for server bundling, Vite for client
- **Output**: Single `dist/` directory with server bundle and static assets

## External Dependencies

### AI Services
- **Google Gemini API**: Audio transcription service accessed via `@google/genai` SDK. Requires `AI_INTEGRATIONS_GEMINI_API_KEY` and `AI_INTEGRATIONS_GEMINI_BASE_URL` environment variables.
- **OpenAI API**: Medical summary generation via `openai` SDK. Requires `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables.

### Email Service
- **Resend**: Email delivery for case summaries. Uses Replit Connectors for credential management.

### Database
- **PostgreSQL**: Primary data store. Requires `DATABASE_URL` environment variable with connection string.

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Payment Processing
- **Apple IAP via RevenueCat**: Subscription billing ($15/month or $99/year) through the App Store
- **RevenueCat Capacitor SDK**: `@revenuecat/purchases-capacitor` initialized in App.tsx on login with user ID as `appUserID`
- **Entitlement**: `pro` — linked to both `mednote.monthly` and `mednote.yearly` products in RevenueCat dashboard
- **Webhook**: `POST /api/webhooks/revenuecat` updates subscription records in DB on purchase/renewal/cancellation
- **Client**: `client/src/lib/iap.ts` wraps RevenueCat SDK; subscription page shows real App Store prices on native iOS
- New users get 1 free case token; after that a Pro subscription is required
- RevenueCat iOS API Key: stored in `iap.ts` (public key, safe for client)

### Authentication
- **Replit Auth**: OAuth-based authentication supporting Sign in with Apple (required for iOS App Store)
- **Device Binding**: Each Bearer token is bound to the device that created it via the `device_sessions` table. The server validates the `X-Device-ID` request header on every authenticated API call — mismatched device = immediate 401 with `reason: "device_mismatch"`. The client reads the hardware UUID on iOS (`@capacitor/device`) or generates a stable UUID in localStorage on web.

### iOS App (Capacitor)
- **Framework**: Capacitor for wrapping the web app as a native iOS app
- **Bundle ID**: `com.mednote.ai`
- **iOS Project**: Located in `ios/` folder
- **Setup Guide**: See `IOS_SETUP.md` for App Store submission instructions
- **Build Commands**:
  - `npm run build` - Build web assets
  - `npx cap sync ios` - Sync web assets to iOS project
- **Required Capabilities**: Sign in with Apple, Microphone, Camera