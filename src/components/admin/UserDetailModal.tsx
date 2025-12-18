import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  ShieldCheck,
  Car,
  Star,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Ban,
  CheckCircle,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  user_type: string;
  is_verified: boolean;
  is_banned?: boolean;
  banned_at?: string | null;
  banned_reason?: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  location_city?: string | null;
  location_state?: string | null;
  phone?: string | null;
  listing_count?: number;
  roles?: string[];
}

interface UserDetailModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBanUser: (userId: string, reason: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
  currentUserId?: string;
}

export function UserDetailModal({
  user,
  open,
  onOpenChange,
  onBanUser,
  onUnbanUser,
  currentUserId,
}: UserDetailModalProps) {
  const [banReason, setBanReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBanForm, setShowBanForm] = useState(false);

  if (!user) return null;

  const isAdmin = user.roles?.includes('admin');
  const isModerator = user.roles?.includes('moderator');
  const isCurrentUser = user.id === currentUserId;

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const handleBan = async () => {
    if (!banReason.trim()) return;
    setIsLoading(true);
    try {
      await onBanUser(user.id, banReason);
      setBanReason('');
      setShowBanForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async () => {
    setIsLoading(true);
    try {
      await onUnbanUser(user.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">
                  {user.full_name || 'Unknown User'}
                </h3>
                {user.is_banned && (
                  <Badge variant="destructive" className="text-xs">
                    <Ban className="h-3 w-3 mr-1" />
                    Banned
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {isAdmin && (
                  <Badge variant="default" className="bg-primary text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                {isModerator && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Moderator
                  </Badge>
                )}
                {user.is_verified && (
                  <Badge variant="outline" className="text-blue-500 border-blue-500 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* User Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{user.email || 'No email'}</span>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}

            {(user.location_city || user.location_state) && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[user.location_city, user.location_state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {format(new Date(user.created_at), 'MMMM d, yyyy')}</span>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Car className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="font-semibold">{user.listing_count || 0}</div>
              <div className="text-xs text-muted-foreground">Listings</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
              <div className="font-semibold">{user.rating_avg?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="font-semibold">{user.rating_count || 0}</div>
              <div className="text-xs text-muted-foreground">Reviews</div>
            </div>
          </div>

          {/* Ban Info */}
          {user.is_banned && user.banned_reason && (
            <>
              <Separator />
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                  <Ban className="h-4 w-4" />
                  Ban Reason
                </div>
                <p className="text-sm text-muted-foreground">{user.banned_reason}</p>
                {user.banned_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Banned on {format(new Date(user.banned_at), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Ban Actions */}
          {!isAdmin && !isCurrentUser && (
            <>
              <Separator />
              {user.is_banned ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleUnban}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Unban User
                </Button>
              ) : showBanForm ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="ban-reason">Ban Reason</Label>
                    <Textarea
                      id="ban-reason"
                      placeholder="Enter the reason for banning this user..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowBanForm(false);
                        setBanReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleBan}
                      disabled={isLoading || !banReason.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Ban className="h-4 w-4 mr-2" />
                      )}
                      Confirm Ban
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowBanForm(true)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
