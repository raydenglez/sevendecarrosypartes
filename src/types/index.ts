export type ListingType = 'vehicle' | 'part' | 'service';
export type ListingStatus = 'active' | 'sold' | 'inactive' | 'expired' | 'draft' | 'pending_review' | 'rejected';
export type ReportReason = 'spam' | 'inappropriate' | 'scam' | 'misleading' | 'counterfeit' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
export type ModerationAction = 'approved' | 'rejected' | 'flagged' | 'pending';
export type UserType = 'user' | 'pro_seller' | 'service_provider';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other';
export type TransmissionType = 'automatic' | 'manual' | 'cvt';
export type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export interface Location {
  lat: number;
  lng: number;
  city: string;
  state?: string;
  country?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: Location;
  avatarUrl?: string;
  type: UserType;
  ratingAvg: number;
  totalReviews: number;
  memberSince: string;
  isVerified: boolean;
  badges: string[];
}

export interface VehicleAttributes {
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin?: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  engine?: string;
  color?: string;
  bodyType?: string;
}

export interface PartAttributes {
  category: string;
  compatibilityTags: string[];
  condition: Condition;
  serialNumber?: string;
}

export interface ServiceAttributes {
  serviceCategory: string;
  priceStructure?: string;
  availability?: string[];
}

export interface Listing {
  id: string;
  ownerId: string;
  owner?: User;
  type: ListingType;
  status: ListingStatus;
  title: string;
  description: string;
  price: number;
  location: Location;
  distance?: number;
  images: string[];
  features?: string[];
  isPremium?: boolean;
  isSponsored?: boolean;
  sponsoredUntil?: string;
  isNegotiable?: boolean;
  createdAt: string;
  updatedAt: string;
  vehicleAttributes?: VehicleAttributes;
  partAttributes?: PartAttributes;
  serviceAttributes?: ServiceAttributes;
}

export interface Review {
  id: string;
  listingId: string;
  reviewerId: string;
  reviewer?: User;
  ratingOverall: number;
  ratingBreakdown?: {
    communication: number;
    accuracy: number;
    serviceQuality?: number;
  };
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  listingId: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  listing: Listing;
  otherUser: User;
  lastMessage: ChatMessage;
  unreadCount: number;
}
