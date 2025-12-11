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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { SettingsItem } from '@/components/SettingsItem';
import { BottomNav } from '@/components/BottomNav';
import { currentUser, userStats, mockListings } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function Profile() {
  const userListings = mockListings.filter(l => l.ownerId === currentUser.id);
  const vehicleCount = userListings.filter(l => l.type === 'vehicle').length;
  const partsCount = userListings.filter(l => l.type === 'part').length;
  const serviceCount = userListings.filter(l => l.type === 'service').length;

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
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-card"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-blue">
              <Edit className="w-4 h-4 text-secondary-foreground" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-4">{currentUser.name}</h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4" />
            <span>{currentUser.location.city}, {currentUser.location.state}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Member since {currentUser.memberSince}
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
