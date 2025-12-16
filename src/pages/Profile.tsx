import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Settings,
  MapPin,
  Edit,
  Share2,
  Car,
  Wrench,
  Star,
  Heart,
  FileText,
  User,
  Shield,
  Globe,
  Bell,
  HelpCircle,
  LogOut,
  Loader2,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { SettingsItem } from '@/components/SettingsItem';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ImageCropModal } from '@/components/ImageCropModal';
import { EditProfileModal } from '@/components/EditProfileModal';
import { NotificationToggle } from '@/components/NotificationToggle';
import { PersonalInfoSheet } from '@/components/PersonalInfoSheet';
import { SecurityPrivacySheet } from '@/components/SecurityPrivacySheet';

interface ProfileData {
  name: string;
  avatarUrl: string;
  phone: string;
  location: { city: string; state: string };
  memberSince: string;
  ratingAvg: number;
}

interface UserStats {
  published: number;
  favorites: number;
  rating: number;
  vehicleCount: number;
  partsCount: number;
  servicesCount: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<UserStats>({
    published: 0,
    favorites: 0,
    rating: 0,
    vehicleCount: 0,
    partsCount: 0,
    servicesCount: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create object URL and open crop modal
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageSrc(imageUrl);
    setCropModalOpen(true);
    
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setUploading(true);

    try {
      const fileName = `${user.id}/avatar.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Get public URL with cache buster
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatarUrl: urlWithCacheBuster } : null);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clean up object URL
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
        setSelectedImageSrc(null);
      }
    }
  };

  const handleCropModalClose = () => {
    setCropModalOpen(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
    }
  };

  useEffect(() => {
    async function fetchProfileData() {
      if (!user) {
        setDataLoading(false);
        return;
      }

      try {
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setProfileData({
            name: profile.full_name || user.email?.split('@')[0] || 'User',
            avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            phone: profile.phone || '',
            location: {
              city: profile.location_city || 'Unknown',
              state: profile.location_state || '',
            },
            memberSince: new Date(profile.created_at || user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            ratingAvg: profile.rating_avg || 0,
          });
        }

        // Fetch listings count by type
        const { data: listings } = await supabase
          .from('listings')
          .select('type')
          .eq('owner_id', user.id);

        const vehicleCount = listings?.filter(l => l.type === 'vehicle').length || 0;
        const partsCount = listings?.filter(l => l.type === 'part').length || 0;
        const servicesCount = listings?.filter(l => l.type === 'service').length || 0;

        // Fetch favorites count
        const { count: favoritesCount } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          published: listings?.length || 0,
          favorites: favoritesCount || 0,
          rating: profile?.rating_avg || 0,
          vehicleCount,
          partsCount,
          servicesCount,
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchProfileData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate('/');
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show sign-in prompt for guests
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="px-4 pt-4 safe-top">
          <h1 className="text-xl font-bold text-foreground">My Profile</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground mb-6 max-w-[280px]">
            Create an account to save favorites, publish listings, and message sellers
          </p>
          <Button variant="carnexo" size="lg" onClick={() => navigate('/auth')}>
            Sign In or Create Account
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="relative px-4 pt-4 pb-6 safe-top">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold text-foreground">My Profile</h1>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center mt-6">
          <div className="relative">
            <img
              src={profileData?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={profileData?.name || 'User'}
              className="w-24 h-24 rounded-full object-cover border-4 border-card"
            />
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-blue cursor-pointer hover:bg-secondary/80 transition-colors">
              {uploading ? (
                <Loader2 className="w-4 h-4 text-secondary-foreground animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-secondary-foreground" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-4">{profileData?.name || 'User'}</h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4" />
            <span>{profileData?.location.city}{profileData?.location.state ? `, ${profileData.location.state}` : ''}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Member since {profileData?.memberSince || 'Unknown'}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button variant="carnexoSecondary" size="sm" className="px-6" onClick={() => setEditModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="carnexoOutline" size="sm" className="px-6">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-3 animate-fade-in">
        <StatCard
          label="Published"
          value={stats.published}
          icon={<FileText className="w-3 h-3" />}
        />
        <StatCard
          label="Favorites"
          value={stats.favorites}
          icon={<Heart className="w-3 h-3 text-primary fill-primary" />}
        />
        <StatCard
          label="Rating"
          value={stats.rating.toFixed(1)}
          suffix="/ 5.0"
          icon={<Star className="w-3 h-3 text-warning fill-warning" />}
        />
      </div>

      {/* My Listings */}
      <section className="px-4 mt-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">My Listings</h2>
          <button className="text-sm font-medium text-primary" onClick={() => navigate('/my-listings')}>View all</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Vehicles Card */}
          <div 
            className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => navigate('/my-listings?type=vehicle')}
          >
            <img
              src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop"
              alt="Vehicles"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-foreground" />
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-success/90 text-success-foreground">
                  {stats.vehicleCount} ACTIVE
                </span>
              </div>
              <p className="text-foreground font-semibold">Vehicles</p>
            </div>
          </div>

          {/* Parts Card */}
          <div 
            className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => navigate('/my-listings?type=part')}
          >
            <img
              src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop"
              alt="Parts"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-4 h-4 text-foreground" />
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary/90 text-secondary-foreground">
                  {stats.partsCount} LISTED
                </span>
              </div>
              <p className="text-foreground font-semibold">Parts</p>
            </div>
          </div>

          {/* Services Card - Full Width */}
          <div 
            className="relative col-span-2 h-28 rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => navigate('/my-listings?type=service')}
          >
            <img
              src="https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=300&fit=crop"
              alt="Services"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
            <div className="absolute bottom-3 left-3">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4 text-foreground" />
                <span className="carnexo-badge-service">SERVICES</span>
              </div>
              <p className="text-foreground font-semibold">Services Offered</p>
              <p className="text-xs text-muted-foreground">Appointment and inquiry management</p>
            </div>
          </div>
        </div>
      </section>

      {/* Account Settings */}
      <section className="px-4 mt-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h2 className="text-lg font-bold text-foreground mb-3">Account</h2>
        <div className="bg-card rounded-2xl overflow-hidden">
          <SettingsItem
            icon={<User className="w-5 h-5 text-secondary" />}
            iconBg="bg-secondary/20"
            label="Personal Information"
            description="Email, phone and address"
            onClick={() => setPersonalInfoOpen(true)}
          />
          <SettingsItem
            icon={<Shield className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/20"
            label="Security & Privacy"
            description="Password and privacy settings"
            onClick={() => setSecurityOpen(true)}
          />
        </div>
      </section>

      {/* Application Settings */}
      <section className="px-4 mt-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h2 className="text-lg font-bold text-foreground mb-3">Application Settings</h2>
        <div className="bg-card rounded-2xl overflow-hidden">
          <SettingsItem
            icon={<Globe className="w-5 h-5 text-success" />}
            iconBg="bg-success/20"
            label="Language"
            description="English, Spanish, Portuguese"
            value="English"
          />
          <div className="px-4">
            <NotificationToggle />
          </div>
          <SettingsItem
            icon={<Bell className="w-5 h-5 text-warning" />}
            iconBg="bg-warning/20"
            label="Notification Settings"
            description="Search alerts and preferences"
          />
          <SettingsItem
            icon={<HelpCircle className="w-5 h-5 text-muted-foreground" />}
            iconBg="bg-muted"
            label="Help Center"
          />
        </div>
      </section>

      {/* Logout */}
      <div className="px-4 mt-6 mb-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <Button 
          variant="ghost" 
          className="w-full text-primary hover:text-primary hover:bg-primary/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          CarNexo v2.4.0 (Build 2045)
        </p>
      </div>

      <BottomNav />

      {selectedImageSrc && (
        <ImageCropModal
          open={cropModalOpen}
          onClose={handleCropModalClose}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCropComplete}
        />
      )}

      {user && profileData && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          userId={user.id}
          initialData={{
            fullName: profileData.name,
            phone: profileData.phone,
            locationCity: profileData.location.city === 'Unknown' ? '' : profileData.location.city,
            locationState: profileData.location.state,
          }}
          onProfileUpdated={(data) => {
            setProfileData(prev => prev ? {
              ...prev,
              name: data.fullName,
              phone: data.phone || '',
              location: {
                city: data.locationCity || 'Unknown',
                state: data.locationState || '',
              },
            } : null);
          }}
        />
      )}

      {user && profileData && (
        <PersonalInfoSheet
          open={personalInfoOpen}
          onClose={() => setPersonalInfoOpen(false)}
          profileData={{
            email: user.email || '',
            phone: profileData.phone,
            city: profileData.location.city === 'Unknown' ? '' : profileData.location.city,
            state: profileData.location.state,
          }}
          onUpdate={(data) => {
            setProfileData(prev => prev ? {
              ...prev,
              phone: data.phone,
              location: {
                city: data.city || 'Unknown',
                state: data.state || '',
              },
            } : null);
          }}
        />
      )}

      {user && (
        <SecurityPrivacySheet
          open={securityOpen}
          onClose={() => setSecurityOpen(false)}
        />
      )}
    </div>
  );
}
