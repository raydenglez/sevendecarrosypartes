import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { SettingsItem } from '@/components/SettingsItem';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { currentUser, userStats, mockListings } from '@/data/mockData';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate('/');
  };
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate('/');
  };

  // Use real user data if available, fallback to mock
  const displayUser = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatarUrl: user.user_metadata?.avatar_url || currentUser.avatarUrl,
    location: currentUser.location,
    memberSince: new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  } : currentUser;

  const userListings = mockListings.filter(l => l.ownerId === currentUser.id);
  const vehicleCount = userListings.filter(l => l.type === 'vehicle').length;
  const partsCount = userListings.filter(l => l.type === 'part').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
              src={displayUser.avatarUrl}
              alt={displayUser.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-card"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-blue">
              <Edit className="w-4 h-4 text-secondary-foreground" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-4">{displayUser.name}</h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4" />
            <span>{displayUser.location.city}, {displayUser.location.state}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Member since {displayUser.memberSince}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button variant="carnexoSecondary" size="sm" className="px-6">
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
          value={userStats.published}
          icon={<FileText className="w-3 h-3" />}
        />
        <StatCard
          label="Favorites"
          value={userStats.favorites}
          icon={<Heart className="w-3 h-3 text-primary fill-primary" />}
        />
        <StatCard
          label="Rating"
          value={userStats.rating}
          suffix="/ 5.0"
          icon={<Star className="w-3 h-3 text-warning fill-warning" />}
        />
      </div>

      {/* My Listings */}
      <section className="px-4 mt-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">My Listings</h2>
          <button className="text-sm font-medium text-primary">View all</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Vehicles Card */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
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
                  {vehicleCount} ACTIVE
                </span>
              </div>
              <p className="text-foreground font-semibold">Vehicles</p>
            </div>
          </div>

          {/* Parts Card */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
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
                  {partsCount} SOLD
                </span>
              </div>
              <p className="text-foreground font-semibold">Parts</p>
            </div>
          </div>

          {/* Services Card - Full Width */}
          <div className="relative col-span-2 h-28 rounded-2xl overflow-hidden group">
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
          />
          <SettingsItem
            icon={<Shield className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/20"
            label="Security & Privacy"
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
          <SettingsItem
            icon={<Bell className="w-5 h-5 text-warning" />}
            iconBg="bg-warning/20"
            label="Notifications"
            description="Search alerts and messages"
            badge
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
    </div>
  );
}
