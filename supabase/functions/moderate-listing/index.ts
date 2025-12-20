import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId } = await req.json();
    
    if (!listingId) {
      return new Response(
        JSON.stringify({ error: 'listingId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch the listing with its attributes
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        id, title, description, price, type, images,
        location_city, location_state,
        vehicle_attributes(make, model, year, mileage),
        part_attributes(part_category, condition),
        service_attributes(service_category)
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      console.error('Listing not found:', listingError);
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Moderating listing:', listing.title);

    // Prepare context for AI analysis
    const vehicleInfo = listing.vehicle_attributes?.[0] 
      ? `Vehicle: ${listing.vehicle_attributes[0].year} ${listing.vehicle_attributes[0].make} ${listing.vehicle_attributes[0].model}, ${listing.vehicle_attributes[0].mileage?.toLocaleString()} miles`
      : '';

    const partInfo = listing.part_attributes?.[0]
      ? `Part: ${listing.part_attributes[0].part_category}, Condition: ${listing.part_attributes[0].condition}`
      : '';

    const serviceInfo = listing.service_attributes?.[0]
      ? `Service: ${listing.service_attributes[0].service_category}`
      : '';

    const listingContext = `
Listing Type: ${listing.type}
Title: ${listing.title}
Description: ${listing.description || 'No description'}
Price: $${listing.price?.toLocaleString() || 'Not specified'}
Location: ${listing.location_city || 'Unknown'}, ${listing.location_state || ''}
${vehicleInfo}
${partInfo}
${serviceInfo}
Number of Images: ${listing.images?.length || 0}
    `.trim();

    // Call Lovable AI for content moderation
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator for an automotive marketplace app called CarNetworx. Your job is to analyze listings and identify potentially problematic content.

Analyze the listing for these red flags:
1. SCAM indicators: Prices that are suspiciously low for the item (e.g., luxury car for $500), urgency language, requests to contact outside the platform
2. SPAM: Promotional content, unrelated products, repetitive postings, contact info in description (phone numbers, emails, social media handles)
3. INAPPROPRIATE content: Offensive language, harassment, illegal items
4. MISLEADING: False claims, clickbait titles, mismatched descriptions
5. COUNTERFEIT: Fake parts, knockoffs being sold as genuine

For vehicles: A price under $2,000 for a car less than 15 years old is suspicious. Very low mileage with very low price is suspicious.

Respond with a JSON object with this exact structure:
{
  "is_flagged": boolean,
  "confidence_score": number between 0 and 1,
  "flags": array of strings from ["potential_scam", "spam_content", "inappropriate_content", "misleading_info", "counterfeit_item", "suspicious_price", "no_images", "contact_in_description"],
  "recommendation": "approve" | "review" | "reject",
  "explanation": "brief explanation of findings"
}

Only flag content you have reasonable confidence is problematic. If the listing seems legitimate, set is_flagged to false and recommendation to "approve".`
          },
          {
            role: 'user',
            content: `Please analyze this listing:\n\n${listingContext}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Default to approve if AI fails
      return new Response(
        JSON.stringify({ 
          is_flagged: false, 
          confidence_score: 0,
          flags: [],
          recommendation: 'approve',
          explanation: 'AI moderation unavailable, auto-approved'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    let moderationResult;
    try {
      moderationResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      moderationResult = {
        is_flagged: false,
        confidence_score: 0,
        flags: [],
        recommendation: 'approve',
        explanation: 'Failed to parse AI response, auto-approved'
      };
    }

    console.log('AI moderation result:', moderationResult);

    // Store the moderation result
    const { error: insertError } = await supabase
      .from('ai_moderation_results')
      .insert({
        listing_id: listingId,
        is_flagged: moderationResult.is_flagged,
        confidence_score: moderationResult.confidence_score,
        flags: moderationResult.flags || [],
        recommendation: moderationResult.recommendation,
        explanation: moderationResult.explanation,
        raw_response: aiData
      });

    if (insertError) {
      console.error('Error storing moderation result:', insertError);
    }

    // Update listing status based on AI recommendation
    if (moderationResult.is_flagged && moderationResult.recommendation === 'reject') {
      await supabase
        .from('listings')
        .update({ status: 'rejected' })
        .eq('id', listingId);
    } else if (moderationResult.is_flagged && moderationResult.recommendation === 'review') {
      await supabase
        .from('listings')
        .update({ status: 'pending_review' })
        .eq('id', listingId);
    }
    // If recommendation is 'approve', leave status as is (active)

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
