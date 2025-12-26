import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  deletedCount: number;
  deletedDrafts: { id: string; title: string }[];
  imagesRemoved: number;
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
    let daysThreshold = 30; // Default: delete drafts older than 30 days
    let dryRun = false;
    
    try {
      const body = await req.json();
      daysThreshold = body.daysThreshold || 30;
      dryRun = body.dryRun || false;
    } catch {
      // Use defaults if no body provided
    }

    console.log(`Starting abandoned drafts cleanup (threshold: ${daysThreshold} days, dryRun: ${dryRun})`);

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    // Find old drafts
    const { data: oldDrafts, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, images')
      .eq('status', 'draft')
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) {
      console.error('Error fetching old drafts:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${oldDrafts?.length || 0} abandoned drafts`);

    const result: CleanupResult = {
      deletedCount: 0,
      deletedDrafts: [],
      imagesRemoved: 0,
    };

    if (!oldDrafts || oldDrafts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No abandoned drafts found',
        result,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (dryRun) {
      // Just return what would be deleted
      const totalImages = oldDrafts.reduce((sum, draft) => sum + (draft.images?.length || 0), 0);
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        message: `Would delete ${oldDrafts.length} drafts and ${totalImages} images`,
        drafts: oldDrafts.map(d => ({ id: d.id, title: d.title })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Collect all images to delete
    const imagesToDelete: string[] = [];
    for (const draft of oldDrafts) {
      if (draft.images && draft.images.length > 0) {
        for (const imageUrl of draft.images) {
          // Extract the file path from the URL
          const urlParts = imageUrl.split('/storage/v1/object/public/listings/');
          if (urlParts.length > 1) {
            imagesToDelete.push(urlParts[1]);
          }
        }
      }
    }

    // Delete images from storage
    if (imagesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('listings')
        .remove(imagesToDelete);

      if (storageError) {
        console.error('Error removing images:', storageError);
        // Continue with deletion even if image removal fails
      } else {
        result.imagesRemoved = imagesToDelete.length;
        console.log(`Removed ${imagesToDelete.length} images from storage`);
      }
    }

    // Delete related attributes first (due to foreign key constraints)
    const draftIds = oldDrafts.map(d => d.id);
    
    await supabase.from('vehicle_attributes').delete().in('listing_id', draftIds);
    await supabase.from('part_attributes').delete().in('listing_id', draftIds);
    await supabase.from('service_attributes').delete().in('listing_id', draftIds);

    // Delete the drafts
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .in('id', draftIds);

    if (deleteError) {
      console.error('Error deleting drafts:', deleteError);
      throw deleteError;
    }

    result.deletedCount = oldDrafts.length;
    result.deletedDrafts = oldDrafts.map(d => ({ id: d.id, title: d.title }));

    console.log(`Deleted ${result.deletedCount} abandoned drafts`);

    return new Response(JSON.stringify({
      success: true,
      message: `Deleted ${result.deletedCount} abandoned drafts and ${result.imagesRemoved} images`,
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
