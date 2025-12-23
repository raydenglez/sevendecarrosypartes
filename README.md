# CarNetworx

A modern automotive marketplace PWA for buying and selling vehicles, parts, and services.

![CarNetworx](public/og-image.png)

## Features

### Marketplace
- **Vehicle Listings** - Buy and sell cars with detailed specs (make, model, year, mileage, VIN)
- **Auto Parts** - List and find compatible parts with brand and condition info
- **Services** - Connect with mechanics, car washes, body shops, and more
- **Location-Based Search** - Find listings near you with distance calculations
- **Interactive Map View** - Browse listings on an interactive Mapbox-powered map

### User Experience
- **Progressive Web App (PWA)** - Install on mobile for native-like experience
- **Real-time Messaging** - Chat with buyers/sellers with typing indicators
- **Voice Messages** - Send and receive voice recordings
- **Push Notifications** - Get notified of new messages and listing updates
- **Multi-language Support** - English, Spanish, and Portuguese

### Seller Tools
- **VIN Scanner** - Auto-fill vehicle details by scanning VIN barcodes
- **Image Cropping** - Crop and optimize listing photos
- **Draft Listings** - Save listings as drafts before publishing
- **Listing Management** - Edit, mark as sold, or delete listings

### Trust & Safety
- **User Verification** - Verified seller badges
- **Reviews & Ratings** - Rate sellers on communication, accuracy, and service
- **Report System** - Flag inappropriate listings
- **Admin Moderation** - AI-assisted content moderation queue

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack Query, React Context
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Maps**: Mapbox GL JS
- **Animations**: Framer Motion
- **i18n**: react-i18next
- **Mobile**: Capacitor (iOS/Android builds)

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd carnetworx

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

The app requires these environment variables (automatically configured in Lovable):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

For Mapbox functionality, add `MAPBOX_ACCESS_TOKEN` to your secrets.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   └── ...             # Feature-specific components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Route components
│   └── admin/          # Admin dashboard pages
├── locales/            # i18n translation files
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client & types
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
└── assets/             # Static assets

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Mobile Apps (Capacitor)

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

## Deployment

### Via Lovable
Click **Publish** in the Lovable editor to deploy instantly.

### Custom Hosting
The production build (`npm run build`) outputs to `dist/` and can be deployed to any static hosting:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Links

- [Live App](https://carnetworx.app)
- [Documentation](https://docs.lovable.dev)
- [Report Issues](https://github.com/your-org/carnetworx/issues)
