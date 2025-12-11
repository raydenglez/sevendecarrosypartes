-- Create enum types
CREATE TYPE public.listing_type AS ENUM ('vehicle', 'part', 'service');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'expired', 'draft');
CREATE TYPE public.user_type AS ENUM ('individual', 'dealer', 'service_provider');
CREATE TYPE public.vehicle_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');
CREATE TYPE public.service_category AS ENUM ('maintenance', 'bodywork', 'car_wash', 'tires', 'electrical', 'other');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  user_type public.user_type DEFAULT 'individual',
  is_verified BOOLEAN DEFAULT false,
  rating_avg NUMERIC(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  location_city TEXT,
  location_state TEXT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.listing_type NOT NULL,
  status public.listing_status DEFAULT 'active',
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  is_negotiable BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  location_city TEXT,
  location_state TEXT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicle-specific attributes
CREATE TABLE public.vehicle_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE UNIQUE,
  make TEXT,
  model TEXT,
  year INTEGER,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  color TEXT,
  vin TEXT,
  condition public.vehicle_condition
);

-- Part-specific attributes
CREATE TABLE public.part_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE UNIQUE,
  part_category TEXT,
  compatible_makes TEXT[],
  compatible_models TEXT[],
  compatible_years INT4RANGE,
  condition public.vehicle_condition,
  brand TEXT
);

-- Service-specific attributes
CREATE TABLE public.service_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE UNIQUE,
  service_category public.service_category,
  price_structure TEXT,
  availability TEXT[]
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(listing_id, reviewer_id)
);

-- Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- LISTINGS POLICIES (Public read, authenticated write)
CREATE POLICY "Listings are viewable by everyone" ON public.listings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = owner_id);

-- VEHICLE ATTRIBUTES POLICIES
CREATE POLICY "Vehicle attrs viewable by everyone" ON public.vehicle_attributes
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage vehicle attrs" ON public.vehicle_attributes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND owner_id = auth.uid())
  );

-- PART ATTRIBUTES POLICIES
CREATE POLICY "Part attrs viewable by everyone" ON public.part_attributes
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage part attrs" ON public.part_attributes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND owner_id = auth.uid())
  );

-- SERVICE ATTRIBUTES POLICIES
CREATE POLICY "Service attrs viewable by everyone" ON public.service_attributes
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage service attrs" ON public.service_attributes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND owner_id = auth.uid())
  );

-- REVIEWS POLICIES
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- FAVORITES POLICIES
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_listings_owner ON public.listings(owner_id);
CREATE INDEX idx_listings_type ON public.listings(type);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_location ON public.listings(location_lat, location_lng);
CREATE INDEX idx_reviews_listing ON public.reviews(listing_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);