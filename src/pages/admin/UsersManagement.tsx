import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search,
  Shield,
  ShieldCheck,
  Loader2,
  Car,
  MessageSquare,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  user_type: string;
  is_verified: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  listing_count?: number;
  roles?: string[];
}

export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        // Remove moderator role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'moderator');

        if (error) throw error;
        toast.success('Moderator role removed');
      } else {
        // Add moderator role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'moderator' });

        if (error) throw error;
        toast.success('Moderator role assigned');
      }

      // Refresh user data
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

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            View and manage user accounts and roles
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
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
                <Card key={profile.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(profile.full_name, profile.email)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">
                            {profile.full_name || profile.email || 'Unknown User'}
                          </h3>
                          {isAdmin && (
                            <Badge variant="default" className="bg-primary">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {isModerator && (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              Moderator
                            </Badge>
                          )}
                          {profile.is_verified && (
                            <Badge variant="outline" className="text-blue-500 border-blue-500">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.email}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {profile.listing_count} listings
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {profile.rating_avg?.toFixed(1) || '0.0'} ({profile.rating_count})
                          </span>
                          <span>
                            Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {!isAdmin && profile.id !== user?.id && (
                        <Button
                          variant={isModerator ? 'outline' : 'secondary'}
                          size="sm"
                          onClick={() => toggleModeratorRole(profile.id, isModerator)}
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
    </AdminLayout>
  );
}
