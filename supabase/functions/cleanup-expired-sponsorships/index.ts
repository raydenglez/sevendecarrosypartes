import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting cleanup of expired sponsorships...');

    // Find and update expired sponsored listings
    const now = new Date().toISOString();
    
    const { data: expiredListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title')
      .eq('is_sponsored', true)
      .not('sponsored_until', 'is', null)
      .lt('sponsored_until', now);

    if (fetchError) {
      console.error('Error fetching expired listings:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredListings?.length || 0} expired sponsorships`);

    if (expiredListings && expiredListings.length > 0) {
      const expiredIds = expiredListings.map(l => l.id);
      
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          is_sponsored: false,
          sponsored_at: null,
          sponsored_by: null,
          sponsored_until: null,
        })
        .in('id', expiredIds);

      if (updateError) {
        console.error('Error updating expired listings:', updateError);
        throw updateError;
      }

      console.log(`Successfully removed sponsorship from ${expiredIds.length} listings:`, 
        expiredListings.map(l => l.title).join(', '));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired_count: expiredListings?.length || 0,
        expired_listings: expiredListings?.map(l => l.title) || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
