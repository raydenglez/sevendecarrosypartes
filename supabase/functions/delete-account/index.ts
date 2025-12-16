import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token for auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client for user authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get user's listings to delete their images
    const { data: listings } = await supabaseAdmin
      .from("listings")
      .select("id, images")
      .eq("owner_id", userId);

    console.log(`Found ${listings?.length || 0} listings to delete`);

    // Step 2: Delete listing images from storage
    if (listings && listings.length > 0) {
      for (const listing of listings) {
        if (listing.images && listing.images.length > 0) {
          const imagePaths = listing.images
            .map((url: string) => {
              // Extract path from URL
              const match = url.match(/listings\/(.+?)(\?|$)/);
              return match ? match[1] : null;
            })
            .filter(Boolean);
          
          if (imagePaths.length > 0) {
            const { error: storageError } = await supabaseAdmin.storage
              .from("listings")
              .remove(imagePaths);
            
            if (storageError) {
              console.warn(`Failed to delete some listing images:`, storageError);
            }
          }
        }
      }
    }

    // Step 3: Delete user's avatar from storage
    const avatarPath = `${userId}/avatar.jpg`;
    await supabaseAdmin.storage.from("avatars").remove([avatarPath]);
    console.log("Deleted user avatar");

    // Step 4: Delete related data in correct order (respecting foreign keys)
    
    // Delete messages (user's sent messages)
    const { error: messagesError } = await supabaseAdmin
      .from("messages")
      .delete()
      .eq("sender_id", userId);
    if (messagesError) console.warn("Error deleting messages:", messagesError);
    else console.log("Deleted user messages");

    // Delete conversations where user is buyer or seller
    const { error: convError } = await supabaseAdmin
      .from("conversations")
      .delete()
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    if (convError) console.warn("Error deleting conversations:", convError);
    else console.log("Deleted user conversations");

    // Delete reviews by user
    const { error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("reviewer_id", userId);
    if (reviewsError) console.warn("Error deleting reviews:", reviewsError);
    else console.log("Deleted user reviews");

    // Delete favorites
    const { error: favoritesError } = await supabaseAdmin
      .from("favorites")
      .delete()
      .eq("user_id", userId);
    if (favoritesError) console.warn("Error deleting favorites:", favoritesError);
    else console.log("Deleted user favorites");

    // Delete push subscriptions
    const { error: pushError } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);
    if (pushError) console.warn("Error deleting push subscriptions:", pushError);
    else console.log("Deleted push subscriptions");

    // Delete vehicle attributes for user's listings
    if (listings && listings.length > 0) {
      const listingIds = listings.map(l => l.id);
      
      await supabaseAdmin
        .from("vehicle_attributes")
        .delete()
        .in("listing_id", listingIds);
      
      await supabaseAdmin
        .from("part_attributes")
        .delete()
        .in("listing_id", listingIds);
      
      await supabaseAdmin
        .from("service_attributes")
        .delete()
        .in("listing_id", listingIds);
      
      // Delete reviews on user's listings
      await supabaseAdmin
        .from("reviews")
        .delete()
        .in("listing_id", listingIds);
      
      console.log("Deleted listing attributes and reviews");
    }

    // Delete listings
    const { error: listingsError } = await supabaseAdmin
      .from("listings")
      .delete()
      .eq("owner_id", userId);
    if (listingsError) console.warn("Error deleting listings:", listingsError);
    else console.log("Deleted user listings");

    // Delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (rolesError) console.warn("Error deleting user roles:", rolesError);
    else console.log("Deleted user roles");

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) console.warn("Error deleting profile:", profileError);
    else console.log("Deleted user profile");

    // Step 5: Delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error("Failed to delete auth user:", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in delete-account function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
