import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { 
  Search,
  Shield,
  ShieldCheck,
  Loader2,
  Car,
  Star,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
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

export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          const { count: listingCount } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', profile.id);

          return {
            ...profile,
            roles: roles?.map(r => r.role) || [],
            listing_count: listingCount || 0,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleModeratorRole = async (userId: string, currentlyModerator: boolean) => {
    if (!user) return;
    setActionLoading(userId);

    try {
      if (currentlyModerator) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'moderator');

        if (error) throw error;
        toast.success('Moderator role removed');
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'moderator' });

        if (error) throw error;
        toast.success('Moderator role assigned');
      }

      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            roles: currentlyModerator
              ? u.roles?.filter(r => r !== 'moderator')
              : [...(u.roles || []), 'moderator']
          };
        }
        return u;
      }));
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      // Find the user to get their email
      const targetUser = users.find(u => u.id === userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: reason,
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            is_banned: true,
            banned_at: new Date().toISOString(),
            banned_reason: reason,
          };
        }
        return u;
      }));

      // Update selected user if modal is open
      setSelectedUser(prev => {
        if (prev?.id === userId) {
          return {
            ...prev,
            is_banned: true,
            banned_at: new Date().toISOString(),
            banned_reason: reason,
          };
        }
        return prev;
      });

      // Send email notification
      if (targetUser?.email) {
        supabase.functions.invoke('send-ban-notification', {
          body: {
            email: targetUser.email,
            userName: targetUser.full_name,
            action: 'ban',
            reason,
          },
        }).then(({ error: emailError }) => {
          if (emailError) {
            console.error('Failed to send ban notification email:', emailError);
          } else {
            console.log('Ban notification email sent');
          }
        });
      }

      toast.success('User has been banned');
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      // Find the user to get their email
      const targetUser = users.find(u => u.id === userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null,
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            is_banned: false,
            banned_at: null,
            banned_reason: null,
          };
        }
        return u;
      }));

      // Update selected user if modal is open
      setSelectedUser(prev => {
        if (prev?.id === userId) {
          return {
            ...prev,
            is_banned: false,
            banned_at: null,
            banned_reason: null,
          };
        }
        return prev;
      });

      // Send email notification
      if (targetUser?.email) {
        supabase.functions.invoke('send-ban-notification', {
          body: {
            email: targetUser.email,
            userName: targetUser.full_name,
            action: 'unban',
          },
        }).then(({ error: emailError }) => {
          if (emailError) {
            console.error('Failed to send unban notification email:', emailError);
          } else {
            console.log('Unban notification email sent');
          }
        });
      }

      toast.success('User has been unbanned');
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  const handleUserClick = (profile: UserProfile) => {
    setSelectedUser(profile);
    setModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">User Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage user accounts and roles
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((profile) => {
              const isAdmin = profile.roles?.includes('admin');
              const isModerator = profile.roles?.includes('moderator');
              
              return (
                <Card 
                  key={profile.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleUserClick(profile)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(profile.full_name, profile.email)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                          <h3 className="font-medium truncate text-sm md:text-base">
                            {profile.full_name || profile.email || 'Unknown User'}
                          </h3>
                          {profile.is_banned && (
                            <Badge variant="destructive" className="text-[10px] md:text-xs px-1.5 py-0">
                              <Ban className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                              Banned
                            </Badge>
                          )}
                          {isAdmin && (
                            <Badge variant="default" className="bg-primary text-[10px] md:text-xs px-1.5 py-0">
                              <ShieldCheck className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                              Admin
                            </Badge>
                          )}
                          {isModerator && (
                            <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 py-0">
                              <Shield className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                              Mod
                            </Badge>
                          )}
                          {profile.is_verified && (
                            <Badge variant="outline" className="text-blue-500 border-blue-500 text-[10px] md:text-xs px-1.5 py-0 hidden sm:flex">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {profile.username ? `@${profile.username}` : profile.email}
                        </p>
                        <div className="flex items-center gap-2 md:gap-4 mt-1 text-[10px] md:text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {profile.listing_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {profile.rating_avg?.toFixed(1) || '0.0'}
                          </span>
                          <span className="hidden sm:inline">
                            {format(new Date(profile.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {!isAdmin && profile.id !== user?.id && (
                        <Button
                          variant={isModerator ? 'outline' : 'secondary'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleModeratorRole(profile.id, isModerator);
                          }}
                          disabled={actionLoading === profile.id}
                        >
                          {actionLoading === profile.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isModerator ? (
                            <>
                              <Shield className="h-4 w-4 mr-1" />
                              Remove Mod
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-1" />
                              Make Mod
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredUsers.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Users Found</h2>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try a different search term' : 'No users registered yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <UserDetailModal
        user={selectedUser}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
        currentUserId={user?.id}
      />
    </AdminLayout>
  );
}
