import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  expiredCount: number;
  expiredListings: { id: string; title: string; owner_id: string }[];
  notifiedOwners: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for configuration
    let daysThreshold = 90; // Default: expire listings older than 90 days
    let dryRun = false;
    
    try {
      const body = await req.json();
      daysThreshold = body.daysThreshold || 90;
      dryRun = body.dryRun || false;
    } catch {
      // Use defaults if no body provided
    }

    console.log(`Starting stale listings cleanup (threshold: ${daysThreshold} days, dryRun: ${dryRun})`);

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    // Find stale active listings that haven't been bumped recently
    const { data: staleListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, owner_id, last_bumped_at, created_at')
      .eq('status', 'active')
      .or(`last_bumped_at.lt.${cutoffDate.toISOString()},last_bumped_at.is.null`)
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) {
      console.error('Error fetching stale listings:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${staleListings?.length || 0} stale listings`);

    const result: CleanupResult = {
      expiredCount: 0,
      expiredListings: [],
      notifiedOwners: [],
    };

    if (!staleListings || staleListings.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No stale listings found',
        result,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (dryRun) {
      // Just return what would be expired
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        message: `Would expire ${staleListings.length} listings`,
        listings: staleListings.map(l => ({ id: l.id, title: l.title })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Expire the stale listings
    const listingIds = staleListings.map(l => l.id);
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .in('id', listingIds);

    if (updateError) {
      console.error('Error expiring listings:', updateError);
      throw updateError;
    }

    result.expiredCount = staleListings.length;
    result.expiredListings = staleListings.map(l => ({
      id: l.id,
      title: l.title,
      owner_id: l.owner_id,
    }));

    // Get unique owners for notification
    const uniqueOwners = [...new Set(staleListings.map(l => l.owner_id))];
    result.notifiedOwners = uniqueOwners;

    console.log(`Expired ${result.expiredCount} stale listings`);

    return new Response(JSON.stringify({
      success: true,
      message: `Expired ${result.expiredCount} stale listings`,
      result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
