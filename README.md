<div align="center">

# 🚗 CarNetworx

**Your Automotive Marketplace**

A modern, full-featured Progressive Web App for buying and selling vehicles, auto parts, and automotive services — built with React, TypeScript, and Supabase.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](#)
[![Capacitor](https://img.shields.io/badge/Capacitor-Native-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)

[Live App](https://carnetworx.lovable.app) · [Report Bug](https://github.com/your-org/carnetworx/issues) · [Request Feature](https://github.com/your-org/carnetworx/issues)

</div>

---

## 📖 Overview

CarNetworx is a location-based automotive marketplace that connects buyers and sellers of vehicles, auto parts, and automotive services. It features real-time messaging, AI-powered moderation, a gamification badge system, and a full admin dashboard — all wrapped in a mobile-first PWA that can also be compiled as native iOS/Android apps via Capacitor.

---

## ✨ Features

### 🏪 Marketplace
- **Vehicle Listings** — Buy and sell cars with detailed specs (make, model, year, mileage, VIN, fuel type, transmission, color, condition)
- **Auto Parts** — List and find compatible parts with brand, category, compatible makes/models/years
- **Automotive Services** — Connect with mechanics, car washes, body shops, tire shops, electrical specialists
- **Location-Based Search** — Proximity sorting with distance radius filters (1/5/10/25+ miles)
- **Interactive Map View** — Browse listings on a Mapbox-powered map with business cards
- **Advanced Filters** — Filter by type, price range, distance, make/model, condition, and more
- **Sponsored Listings** — Admin-managed promoted listings with expiration dates

### 📱 User Experience
- **Progressive Web App** — Installable on any device for a native-like experience
- **Real-time Messaging** — Live chat with typing indicators and read receipts
- **Voice Messages** — Record and send voice messages with playback controls
- **Image Sharing** — Send images in chat conversations
- **Push Notifications** — Web push (VAPID) and native push (FCM/APNs) support
- **Multi-language Support** — English 🇺🇸, Spanish 🇪🇸, and Portuguese 🇧🇷
- **Dark Mode** — Full dark/light theme toggle
- **Pull to Refresh** — Native-feel content refresh
- **Skeleton Loading** — Smooth loading states throughout the app

### 🛠️ Seller Tools
- **VIN Scanner** — Auto-fill vehicle details by scanning VIN barcodes with camera
- **Image Cropping** — Crop and optimize listing photos before upload
- **Draft Listings** — Save listings as drafts and publish when ready
- **Listing Management** — Edit, mark as sold, bump, or delete listings
- **Profile Customization** — Bio, social links (Instagram, WhatsApp, website), business category
- **Shareable Profiles** — Public profile pages accessible via `/profile/:username`

### 🛡️ Trust & Safety
- **ID Verification** — Upload ID + selfie for verified seller badge
- **Reviews & Ratings** — Rate sellers on communication, accuracy, and service quality
- **Report System** — Flag inappropriate listings with categorized reasons
- **AI Moderation** — Automated content moderation with confidence scoring and flag detection
- **User Banning** — Admin can ban users with email notifications
- **Listing Takedowns** — Moderated removal with email notifications to owners

### 🏆 Gamification (Badge System)

<details>
<summary>View all badge categories</summary>

| Category | Badges |
|----------|--------|
| **Seller** | First Listing, 5/10/25/50 Listings, First Vehicle Sold, 5/10 Vehicles Sold, First Part Sold, 10 Parts Sold, 10/25/50/100 Total Sold |
| **Reviews** | First Review, 5/10/25/50 Reviews |
| **Engagement** | Lightning Responder, Quick Responder, Speed Demon, Always Online, First Conversation, Social Butterfly, Networking Pro, Community Pillar, Chatty, Super Communicator, Chat Legend |
| **Profile** | Profile Complete |
| **Loyalty** | 1 Week, 1 Month, 3 Months, 6 Months, 1 Year |

</details>

- Celebration modals with confetti on badge unlock
- Pin up to 3 badges on your profile
- Real-time badge tracking via Supabase Realtime

### 👨‍💼 Admin Dashboard
- **Moderation Queue** — Review pending listings with AI moderation results
- **User Management** — View/search all users, ban/unban, view detailed profiles
- **Reports Management** — Review and resolve flagged listing reports
- **Sponsored Listings** — Manage sponsored/promoted listings
- **Broadcast Notifications** — Send push notifications to targeted user segments (all, sellers, buyers, verified)
- **Notification Templates** — Save reusable notification templates
- **Scheduled Notifications** — Schedule notifications for future delivery
- **Moderation History** — Full audit log of moderation actions
- **Developer Tools** — Edge function logs, API documentation generator, database cleanup tools
- **Cleanup Dashboard** — Run maintenance tasks (stale listings, orphaned images, empty conversations, abandoned drafts)

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5.8, Vite 5 |
| **Styling** | Tailwind CSS 3, shadcn/ui, Framer Motion |
| **State** | TanStack React Query, React Context |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime) |
| **Maps** | Mapbox GL JS |
| **i18n** | react-i18next (EN, ES, PT) |
| **Mobile** | Capacitor 8 (iOS, Android) |
| **PWA** | vite-plugin-pwa, Web Push API |
| **Forms** | React Hook Form, Zod validation |
| **Charts** | Recharts |

---

## 🏗️ Architecture

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components (40+)
│   └── admin/           # Admin-specific components
├── contexts/            # React context providers
│   ├── FavoritesContext  # Favorites state management
│   └── LocationContext   # Geolocation management
├── hooks/               # Custom React hooks (25+)
│   ├── useAuth          # Authentication state
│   ├── useConversations # Chat conversations
│   ├── useMessages      # Chat messages with realtime
│   ├── useNearbyListings # Location-based listing queries
│   ├── usePushNotifications # Web push subscriptions
│   └── ...
├── pages/               # Route components
│   ├── admin/           # Admin dashboard (8 pages)
│   └── ...              # Public pages (15+)
├── locales/             # i18n translation files (EN, ES, PT)
├── integrations/        # Third-party integrations
│   └── supabase/        # Auto-generated client & types
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── assets/              # Static assets

supabase/
├── functions/           # 13 Edge Functions
└── migrations/          # Database migrations
```

### Database Schema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│    profiles      │    │    listings       │    │  vehicle_attributes │
│─────────────────│    │──────────────────│    │─────────────────────│
│ id (PK)         │◄───│ owner_id (FK)    │───►│ listing_id (FK)     │
│ full_name       │    │ type (enum)      │    │ make, model, year   │
│ username        │    │ status (enum)    │    │ mileage, vin        │
│ email, phone    │    │ title, price     │    │ fuel_type, color    │
│ avatar_url      │    │ images[]         │    │ transmission        │
│ user_type       │    │ location_*       │    │ condition           │
│ is_verified     │    │ is_sponsored     │    └─────────────────────┘
│ rating_avg/count│    │ expires_at       │
│ location_*      │    └──────────────────┘    ┌─────────────────────┐
│ bio, socials    │                            │  part_attributes    │
│ pinned_badges[] │    ┌──────────────────┐    │─────────────────────│
│ language        │    │  conversations   │    │ listing_id (FK)     │
│ is_banned       │    │──────────────────│    │ part_category       │
└─────────────────┘    │ listing_id (FK)  │    │ compatible_makes[]  │
                       │ seller_id (FK)   │    │ condition, brand    │
┌─────────────────┐    │ buyer_id (FK)    │    └─────────────────────┘
│   user_roles    │    │ last_message_at  │
│─────────────────│    └──────────────────┘    ┌─────────────────────┐
│ user_id (FK)    │                            │ service_attributes  │
│ role (enum)     │    ┌──────────────────┐    │─────────────────────│
│ admin/moderator │    │    messages      │    │ listing_id (FK)     │
│ /user           │    │──────────────────│    │ service_category    │
└─────────────────┘    │ conversation_id  │    │ price_structure     │
                       │ sender_id        │    │ availability[]      │
┌─────────────────┐    │ content          │    └─────────────────────┘
│  user_badges    │    │ message_type     │
│─────────────────│    │ media_url        │    ┌─────────────────────┐
│ user_id         │    │ status           │    │     reviews         │
│ badge_type      │    └──────────────────┘    │─────────────────────│
│ badge_name      │                            │ listing_id (FK)     │
│ earned_at       │    ┌──────────────────┐    │ reviewer_id (FK)    │
└─────────────────┘    │    favorites     │    │ rating (1-5)        │
                       │──────────────────│    │ communication_rating│
┌─────────────────┐    │ user_id (FK)     │    │ accuracy_rating     │
│    reports      │    │ listing_id (FK)  │    │ service_rating      │
│─────────────────│    └──────────────────┘    │ comment             │
│ reporter_id     │                            └─────────────────────┘
│ listing_id (FK) │    ┌──────────────────┐
│ reason (enum)   │    │ verification_    │
│ status          │    │ requests         │
│ reviewer_notes  │    │──────────────────│
└─────────────────┘    │ user_id          │
                       │ id_photo_url     │
                       │ selfie_with_id   │
                       │ status           │
                       └──────────────────┘
```

### Database Enums

| Enum | Values |
|------|--------|
| `listing_type` | vehicle, part, service |
| `listing_status` | active, sold, expired, draft, pending_review, rejected |
| `user_type` | individual, dealer, service_provider |
| `vehicle_condition` | new, like_new, good, fair, poor |
| `service_category` | maintenance, bodywork, car_wash, tires, electrical, other |
| `message_type` | text, image, voice |
| `message_status` | sent, delivered, read |
| `report_reason` | spam, inappropriate, scam, misleading, counterfeit, other |
| `report_status` | pending, reviewed, dismissed |
| `moderation_action` | approved, rejected, flagged, pending |
| `app_role` | admin, moderator, user |
| `broadcast_status` | pending, sending, completed, failed, scheduled |
| `broadcast_target` | all, sellers, buyers, verified_users |

### Security

- **Row-Level Security (RLS)** on all tables
- **Security Definer functions** (`has_role`, `get_user_roles`, `get_public_profile_by_username`) to prevent recursive RLS
- **Role-based access control** with separate `user_roles` table
- **Public views** (`public_profiles`, `public_vehicle_attributes`) to safely expose data without leaking sensitive fields (email, phone, VIN)

### Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `listings` | Listing images | Public read, authenticated upload |
| `avatars` | User profile photos | Public read, authenticated upload |
| `chat-media` | Chat images & voice messages | Authenticated only |
| `verification-documents` | ID verification photos | Private (admin only) |

---

## ⚡ Edge Functions

| Function | Auth | Description |
|----------|------|-------------|
| `send-push-notification` | ✅ JWT | Send push notification to a specific user |
| `get-vapid-key` | 🔓 Public | Return the VAPID public key for web push |
| `delete-account` | ✅ JWT | Permanently delete a user's account and data |
| `moderate-listing` | ✅ JWT | AI-powered content moderation for listings |
| `broadcast-notification` | ✅ JWT | Send push notifications to user segments |
| `send-ban-notification` | ✅ JWT | Email notification on user ban/unban |
| `send-takedown-notification` | ✅ JWT | Email notification on listing takedown |
| `process-scheduled-notifications` | 🔓 Cron | Process scheduled broadcast notifications |
| `cleanup-expired-sponsorships` | 🔓 Cron | Remove expired sponsored status from listings |
| `cleanup-stale-listings` | ✅ JWT | Clean up old expired/inactive listings |
| `cleanup-abandoned-drafts` | ✅ JWT | Remove old draft listings |
| `cleanup-empty-conversations` | ✅ JWT | Remove conversations with no messages |
| `cleanup-orphaned-images` | ✅ JWT | Delete storage images not referenced by listings |

---

## 🔄 Realtime Subscriptions

| Channel | Table | Events | Purpose |
|---------|-------|--------|---------|
| `messages` | `messages` | INSERT | Live chat messages |
| `conversations` | `conversations` | ALL | Conversation list updates |
| `user_badges` | `user_badges` | INSERT | Badge celebration modals |
| `typing:{conversationId}` | — | Broadcast | Typing indicators |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/) (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm, bun, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/carnetworx.git
cd carnetworx

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

#### Additional Secrets (configured in Supabase Edge Functions)

| Secret | Purpose |
|--------|---------|
| `MAPBOX_ACCESS_TOKEN` | Map rendering (Mapbox GL) |
| `RESEND_API_KEY` | Transactional emails (ban/takedown notifications) |
| `VAPID_PUBLIC_KEY` | Web push notifications (public key) |
| `VAPID_PRIVATE_KEY` | Web push notifications (private key) |

---

## 🌐 Authentication

CarNetworx uses Supabase Auth with email/password authentication:

```javascript
// Sign up — creates profile via database trigger
await supabase.auth.signUp({
  email, password,
  options: { data: { full_name: name } }
})

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Password reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://carnetworx.app/reset-password'
})
```

A `handle_new_user` database trigger automatically creates a `profiles` row on signup.

---

## 🌍 Internationalization

Supported languages with full UI translations:

| Language | Code | File |
|----------|------|------|
| 🇺🇸 English | `en` | `src/locales/en.json` |
| 🇪🇸 Spanish | `es` | `src/locales/es.json` |
| 🇧🇷 Portuguese | `pt` | `src/locales/pt.json` |

Language detection is automatic via `i18next-browser-languagedetector`, and users can manually set their preferred language in settings.

---

## 📱 Mobile Apps (Capacitor)

CarNetworx compiles to native iOS and Android apps via Capacitor 8:

```bash
# Build web assets
npm run build

# Sync with native projects
npx cap sync

# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio
npx cap open android
```

### Native Capabilities
- Haptic feedback (`@capacitor/haptics`)
- Push notifications (`@capacitor/push-notifications`)
- Local notifications (`@capacitor/local-notifications`)
- Keyboard management (`@capacitor/keyboard`)
- Status bar customization (`@capacitor/status-bar`)
- Splash screen (`@capacitor/splash-screen`)
- In-app browser (`@capacitor/browser`)

---

## 🚢 Deployment

### Via Lovable
Click **Publish** in the Lovable editor for instant deployment.

### Custom Hosting
The production build (`npm run build`) outputs to `dist/` and can be deployed to any static hosting:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

---

## 🎨 Brand & Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| 🟠 Primary Orange | `#FF6A00` | CTAs, primary actions, highlights |
| 🔵 Secondary Blue | `#1E4F9A` | Links, secondary elements |
| ⬜ Background | `#F5F7FA` | Page backgrounds (light mode) |
| ⬛ Dark Background | `#1A1A2E` | Page backgrounds (dark mode) |
| 🟢 Success | `#10B981` | Success states, verified badges |
| 🔴 Destructive | `#EF4444` | Errors, delete actions |

---

## 📜 Available Scripts

```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Semantic Tailwind CSS tokens (no hardcoded colors)
- Small, focused components
- React Query for server state

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<div align="center">

Built with ❤️ using [Lovable](https://lovable.dev)

</div>
