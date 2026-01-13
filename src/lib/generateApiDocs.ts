export function generateApiDocs(): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `# CarNetworx API Documentation
Generated: ${date}

---

## 1. App Overview

**CarNetworx** is a modern automotive marketplace for buying and selling vehicles, parts, and automotive services.

**App Name:** CarNetworx  
**Tagline:** Your Automotive Marketplace

### Core User Flows
1. **Browse Listings** - View vehicles, parts, and services with location-based sorting
2. **Search & Filter** - Filter by type, price, distance, make/model
3. **View Listing Details** - Full listing info with image gallery, specs, seller info
4. **Messaging** - Real-time chat with sellers (text, images, voice messages)
5. **Create Listings** - Post vehicles/parts/services with VIN scanning
6. **User Profiles** - Ratings, reviews, badges, verification status
7. **Favorites** - Save listings for later
8. **Map View** - Browse listings on an interactive map
9. **Push Notifications** - New messages, listing updates

**Supported Languages:** English, Spanish, Portuguese

---

## 2. Database Connection

\`\`\`
API URL: https://nqagezwcpdqkoalewnge.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYWdlendjcGRxa29hbGV3bmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzkwMzMsImV4cCI6MjA4MTA1NTAzM30.JOQSnpEgZRtyMMG1UKJFjU5dyeBlCjd1NEbq-2SAiVM
\`\`\`

---

## 3. Database Schema

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| \`profiles\` | User profiles | id, full_name, username, email, phone, avatar_url, user_type, is_verified, rating_avg, rating_count, location_city, location_state, location_lat, location_lng, bio, business_category, is_banned, pinned_badges, language |
| \`listings\` | All marketplace listings | id, owner_id, type, status, title, description, price, is_negotiable, is_premium, is_sponsored, images[], location_city, location_state, location_lat, location_lng, created_at, expires_at |
| \`vehicle_attributes\` | Vehicle-specific data | listing_id, make, model, year, mileage, vin, fuel_type, transmission, color, condition |
| \`part_attributes\` | Part-specific data | listing_id, part_category, compatible_makes[], compatible_models[], compatible_years, condition, brand |
| \`service_attributes\` | Service-specific data | listing_id, service_category, price_structure, availability[] |
| \`conversations\` | Chat conversations | id, listing_id, seller_id, buyer_id, last_message_at |
| \`messages\` | Chat messages | id, conversation_id, sender_id, content, message_type, media_url, media_duration, status |
| \`reviews\` | Seller reviews | id, listing_id, reviewer_id, rating, communication_rating, accuracy_rating, service_rating, comment |
| \`favorites\` | Saved listings | id, user_id, listing_id |
| \`user_badges\` | Achievement badges | id, user_id, badge_type, badge_name, badge_description, earned_at |
| \`push_subscriptions\` | Push notification tokens | id, user_id, device_token, platform, endpoint |
| \`verification_requests\` | ID verification requests | id, user_id, id_photo_url, selfie_with_id_url, status |
| \`reports\` | Flagged listings | id, reporter_id, listing_id, reason, description, status |

### Enums

- **listing_type:** vehicle, part, service
- **listing_status:** active, sold, expired, draft, pending_review, rejected
- **user_type:** individual, dealer, service_provider
- **vehicle_condition:** new, like_new, good, fair, poor
- **service_category:** maintenance, bodywork, car_wash, tires, electrical, other
- **message_type:** text, image, voice
- **message_status:** sent, delivered, read
- **report_reason:** spam, inappropriate, scam, misleading, counterfeit, other

### Views

- **public_profiles** - Safe public view of profiles (excludes sensitive data like email, phone)
- **public_vehicle_attributes** - Vehicle attributes without VIN

---

## 4. Edge Functions API

**Base URL:** \`https://nqagezwcpdqkoalewnge.supabase.co/functions/v1\`

**Authentication:** Protected endpoints require \`Authorization: Bearer <user_jwt_token>\` header.

---

### 4.1 Send Push Notification

\`\`\`
POST /send-push-notification
Authorization: Required

Request Body:
{
  "userId": "uuid",
  "conversationId": "uuid",
  "title": "string",
  "body": "string"
}

Response:
{
  "message": "Sent X notifications",
  "failed": 0
}
\`\`\`

---

### 4.2 Get VAPID Key

\`\`\`
GET /get-vapid-key
Authorization: Not required

Response:
{
  "vapidPublicKey": "string"
}
\`\`\`

---

### 4.3 Delete Account

\`\`\`
POST /delete-account
Authorization: Required

Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
\`\`\`

---

### 4.4 Moderate Listing (Admin)

\`\`\`
POST /moderate-listing
Authorization: Required (admin/moderator)

Request Body:
{
  "listingId": "uuid"
}

Response:
{
  "is_flagged": boolean,
  "confidence_score": number,
  "flags": ["potential_scam", ...],
  "recommendation": "approve" | "review" | "reject",
  "explanation": "string"
}
\`\`\`

---

### 4.5 Broadcast Notification (Admin)

\`\`\`
POST /broadcast-notification
Authorization: Required (admin)

Request Body:
{
  "title": "string",
  "body": "string",
  "targetAudience": "all" | "sellers" | "buyers" | "verified_users",
  "broadcastId": "uuid"
}

Response:
{
  "message": "Processing started",
  "subscriptionCount": number
}
\`\`\`

---

### 4.6 Send Ban Notification

\`\`\`
POST /send-ban-notification
Authorization: Required (admin)

Request Body:
{
  "email": "string",
  "userName": "string",
  "action": "ban" | "unban",
  "reason": "string"
}
\`\`\`

---

### 4.7 Send Takedown Notification

\`\`\`
POST /send-takedown-notification
Authorization: Required (admin/moderator)

Request Body:
{
  "userEmail": "string",
  "userName": "string",
  "listingTitle": "string",
  "reason": "string"
}
\`\`\`

---

## 5. Realtime Subscriptions

\`\`\`javascript
// Messages - for live chat
supabase.channel('messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handler)
  .subscribe()

// Conversations - for message list updates
supabase.channel('conversations')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, handler)
  .subscribe()

// User badges - for celebration modals
supabase.channel('user_badges')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_badges' }, handler)
  .subscribe()
\`\`\`

---

## 6. Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| \`listings\` | Listing images | Public read, authenticated upload |
| \`avatars\` | User profile photos | Public read, authenticated upload |
| \`chat-media\` | Chat images/voice | Authenticated only |
| \`verification-documents\` | ID verification photos | Private (admin only) |

---

## 7. Authentication Flow

\`\`\`javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email, password,
  options: { data: { full_name: name } }
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()
\`\`\`

---

## 8. Key Queries

\`\`\`javascript
// Fetch active listings with owner info
const { data } = await supabase
  .from('listings')
  .select(\`
    *,
    profiles:owner_id(full_name, avatar_url, is_verified),
    vehicle_attributes(*),
    part_attributes(*),
    service_attributes(*)
  \`)
  .eq('status', 'active')
  .order('created_at', { ascending: false })

// Fetch user's conversations
const { data } = await supabase
  .from('conversations')
  .select(\`
    *,
    listing:listings(id, title, images),
    messages(content, created_at, sender_id)
  \`)
  .or(\`buyer_id.eq.\${userId},seller_id.eq.\${userId}\`)
  .order('last_message_at', { ascending: false })

// Fetch messages for a conversation
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true })
\`\`\`

---

## 9. Push Notifications (Native)

For native iOS/Android, register device tokens:

\`\`\`javascript
await supabase.from('push_subscriptions').upsert({
  user_id: userId,
  device_token: token,
  platform: 'android' | 'ios',
  endpoint: \`native-\${platform}-\${token}\`,
  p256dh: 'native',
  auth: 'native'
}, { onConflict: 'endpoint' })
\`\`\`

---

## 10. Badge Types

### Seller Badges
- first_listing, five_listings, ten_listings, twenty_five_listings, fifty_listings
- first_vehicle_sold, five_vehicles_sold, ten_vehicles_sold
- first_part_sold, ten_parts_sold
- ten_total_sold, twenty_five_sold, fifty_sold, hundred_sold

### Review Badges
- first_review, five_reviews, ten_reviews, twenty_five_reviews, fifty_reviews

### Engagement Badges
- lightning_responder, quick_responder, speed_demon, always_online
- first_conversation, social_butterfly, networking_pro, community_pillar
- chatty, super_communicator, chat_legend

### Profile Badges
- profile_complete

### Loyalty Badges
- one_week, one_month, three_months, six_months, one_year

---

*Documentation generated by CarNetworx Admin Dashboard*
`;
}

export function getApiDocsFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `carnetworx-api-docs-${date}.md`;
}
