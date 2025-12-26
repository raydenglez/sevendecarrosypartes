import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  scannedCount: number;
  orphanedCount: number;
  removedCount: number;
  orphanedFiles: string[];
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
    let dryRun = false;
    let limit = 1000; // Limit files to scan per run
    
    try {
      const body = await req.json();
      dryRun = body.dryRun || false;
      limit = body.limit || 1000;
    } catch {
      // Use defaults if no body provided
    }

    console.log(`Starting orphaned images cleanup (dryRun: ${dryRun}, limit: ${limit})`);

    // Get all listings and their images
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('images');

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      throw listingsError;
    }

    // Build a set of all referenced image paths
    const referencedImages = new Set<string>();
    for (const listing of listings || []) {
      if (listing.images && Array.isArray(listing.images)) {
        for (const imageUrl of listing.images) {
          // Extract the file path from the URL
          const urlParts = imageUrl.split('/storage/v1/object/public/listings/');
          if (urlParts.length > 1) {
            referencedImages.add(urlParts[1]);
          }
        }
      }
    }

    console.log(`Found ${referencedImages.size} referenced images`);

    // List files in the listings bucket
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('listings')
      .list('', {
        limit,
        offset: 0,
      });

    if (storageError) {
      console.error('Error listing storage files:', storageError);
      throw storageError;
    }

    const result: CleanupResult = {
      scannedCount: 0,
      orphanedCount: 0,
      removedCount: 0,
      orphanedFiles: [],
    };

    // Recursively scan folders and find orphaned files
    const orphanedFiles: string[] = [];
    const foldersToScan = storageFiles?.filter(f => f.id === null) || [];
    const topLevelFiles = storageFiles?.filter(f => f.id !== null) || [];

    // Check top-level files
    for (const file of topLevelFiles) {
      result.scannedCount++;
      if (!referencedImages.has(file.name)) {
        orphanedFiles.push(file.name);
      }
    }

    // Scan subfolders (usually organized by user ID or listing ID)
    for (const folder of foldersToScan) {
      const { data: folderFiles } = await supabase.storage
        .from('listings')
        .list(folder.name, { limit: 500 });

      for (const file of folderFiles || []) {
        if (file.id !== null) {
          result.scannedCount++;
          const fullPath = `${folder.name}/${file.name}`;
          if (!referencedImages.has(fullPath)) {
            orphanedFiles.push(fullPath);
          }
        }
      }
    }

    result.orphanedCount = orphanedFiles.length;
    result.orphanedFiles = orphanedFiles.slice(0, 100); // Limit response size

    console.log(`Scanned ${result.scannedCount} files, found ${result.orphanedCount} orphaned`);

    if (dryRun || orphanedFiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        dryRun,
        message: dryRun 
          ? `Would remove ${result.orphanedCount} orphaned files`
          : 'No orphaned files found',
        result,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remove orphaned files in batches
    const batchSize = 100;
    for (let i = 0; i < orphanedFiles.length; i += batchSize) {
      const batch = orphanedFiles.slice(i, i + batchSize);
      const { error: removeError } = await supabase.storage
        .from('listings')
        .remove(batch);

      if (removeError) {
        console.error('Error removing batch:', removeError);
      } else {
        result.removedCount += batch.length;
      }
    }

    console.log(`Removed ${result.removedCount} orphaned files`);

    return new Response(JSON.stringify({
      success: true,
      message: `Removed ${result.removedCount} orphaned files`,
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
