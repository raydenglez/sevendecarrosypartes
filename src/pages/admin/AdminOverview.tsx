import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Car, 
  Flag, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Clock,
  History as HistoryIcon
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingReviews: number;
  pendingReports: number;
  flaggedToday: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalListings: 0,
    activeListings: 0,
    pendingReviews: 0,
    pendingReports: 0,
    flaggedToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch listing counts
        const { count: totalListings } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true });

        const { count: activeListings } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { count: pendingReviews } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_review');

        // Fetch pending reports
        const { count: pendingReports } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch flagged listings today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: flaggedToday } = await supabase
          .from('ai_moderation_results')
          .select('*', { count: 'exact', head: true })
          .eq('is_flagged', true)
          .gte('created_at', today.toISOString());

        setStats({
          totalUsers: userCount || 0,
          totalListings: totalListings || 0,
          activeListings: activeListings || 0,
          pendingReviews: pendingReviews || 0,
          pendingReports: pendingReports || 0,
          flaggedToday: flaggedToday || 0,
        });

        // Fetch recent moderation activity
        const { data: recentModerations } = await supabase
          .from('moderation_logs')
          .select(`
            id,
            action,
            reason,
            created_at,
            listings(title)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentActivity(recentModerations || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Total Listings', value: stats.totalListings, icon: Car, color: 'text-green-500' },
    { label: 'Active Listings', value: stats.activeListings, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Pending Review', value: stats.pendingReviews, icon: Shield, color: 'text-yellow-500' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'text-red-500' },
    { label: 'Flagged Today', value: stats.flaggedToday, icon: AlertTriangle, color: 'text-orange-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20 lg:pb-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm md:text-base text-muted-foreground">Monitor your marketplace activity and moderation status</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <div className="text-2xl md:text-3xl font-bold">
                  {loading ? '...' : stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {/* Pending Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Requires Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.pendingReviews > 0 && (
                <a
                  href="/admin/moderation"
                  className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg hover:bg-yellow-500/20 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-500" />
                    <span>Listings pending review</span>
                  </span>
                  <span className="font-bold text-yellow-500">{stats.pendingReviews}</span>
                </a>
              )}
              {stats.pendingReports > 0 && (
                <a
                  href="/admin/reports"
                  className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-500" />
                    <span>Reports pending review</span>
                  </span>
                  <span className="font-bold text-red-500">{stats.pendingReports}</span>
                </a>
              )}
              {stats.pendingReviews === 0 && stats.pendingReports === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  All caught up! No pending items.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5" />
                Recent Moderation Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className={`font-medium ${
                          activity.action === 'approved' ? 'text-green-500' :
                          activity.action === 'rejected' ? 'text-red-500' :
                          'text-yellow-500'
                        }`}>
                          {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {activity.listings?.title || 'Unknown listing'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No recent moderation activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
