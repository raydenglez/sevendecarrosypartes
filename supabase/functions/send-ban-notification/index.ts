import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BanNotificationRequest {
  email: string;
  userName: string;
  action: "ban" | "unban";
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, action, reason }: BanNotificationRequest = await req.json();

    console.log(`Sending ${action} notification to ${email}`);

    if (!email) {
      throw new Error("Email is required");
    }

    const isBan = action === "ban";
    const subject = isBan
      ? "Your CarNexo Account Has Been Suspended"
      : "Your CarNexo Account Has Been Restored";

    const html = isBan
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #DC2626; margin-bottom: 24px;">Account Suspended</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hello ${userName || "User"},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We're writing to inform you that your CarNexo account has been suspended due to a violation of our community guidelines.
          </p>
          ${reason ? `
            <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin: 24px 0;">
              <p style="color: #991B1B; font-weight: 600; margin: 0 0 8px 0;">Reason for suspension:</p>
              <p style="color: #7F1D1D; margin: 0;">${reason}</p>
            </div>
          ` : ""}
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            While your account is suspended, you will not be able to:
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>Access your account</li>
            <li>Create or manage listings</li>
            <li>Send or receive messages</li>
          </ul>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            If you believe this was a mistake, please contact our support team.
          </p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">
            Best regards,<br>
            The CarNexo Team
          </p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669; margin-bottom: 24px;">Account Restored</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hello ${userName || "User"},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Great news! Your CarNexo account has been restored and you can now access all features again.
          </p>
          <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 16px; margin: 24px 0;">
            <p style="color: #065F46; margin: 0;">
              You can now log in to your account and continue using CarNexo to browse, list, and connect with buyers and sellers.
            </p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Please ensure you follow our community guidelines to avoid future suspensions.
          </p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">
            Welcome back!<br>
            The CarNexo Team
          </p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "CarNexo <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending ban notification:", error);
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
