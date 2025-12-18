import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TakedownNotificationRequest {
  ownerEmail: string;
  ownerName: string;
  listingTitle: string;
  reason: string;
  reportReason: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ownerEmail, ownerName, listingTitle, reason, reportReason }: TakedownNotificationRequest = await req.json();

    console.log(`Sending takedown notification to ${ownerEmail} for listing: ${listingTitle}`);

    if (!ownerEmail) {
      throw new Error("Owner email is required");
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #DC2626; margin-bottom: 24px;">Listing Removed</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hello ${ownerName || "User"},
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We're writing to inform you that your listing has been removed from CarNexo following a review.
        </p>
        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Listing title:</p>
          <p style="color: #111827; font-weight: 600; margin: 0;">${listingTitle}</p>
        </div>
        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin: 24px 0;">
          <p style="color: #991B1B; font-weight: 600; margin: 0 0 8px 0;">Report reason:</p>
          <p style="color: #7F1D1D; margin: 0;">${reportReason}</p>
          ${reason ? `
            <p style="color: #991B1B; font-weight: 600; margin: 16px 0 8px 0;">Moderator notes:</p>
            <p style="color: #7F1D1D; margin: 0;">${reason}</p>
          ` : ""}
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you believe this was a mistake, you can:
        </p>
        <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
          <li>Review our community guidelines</li>
          <li>Contact our support team to appeal this decision</li>
          <li>Create a new listing that complies with our policies</li>
        </ul>
        <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">
          Best regards,<br>
          The CarNexo Team
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "CarNexo <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: `Your listing "${listingTitle}" has been removed`,
      html,
    });

    console.log("Takedown notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending takedown notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
