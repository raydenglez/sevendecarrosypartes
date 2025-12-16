import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  conversationId?: string;
  tag?: string;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Web Push implementation using crypto
async function sendWebPush(subscription: PushSubscription, payload: PushPayload): Promise<boolean> {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('VAPID keys not configured');
    return false;
  }

  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    // Create JWT for VAPID
    const header = { alg: 'ES256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      aud: audience,
      exp: now + 12 * 60 * 60,
      sub: 'mailto:noreply@carnexo.app',
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    // Import the private key
    const privateKeyBuffer = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    
    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    
    const signatureInput = new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`);
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      signatureInput
    );
    
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const jwt = `${encodedHeader}.${encodedClaims}.${encodedSignature}`;
    
    // Send the push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: JSON.stringify(payload),
    });
    
    if (response.status === 201 || response.status === 200) {
      console.log('Web push notification sent successfully');
      return true;
    } else {
      console.error('Web push notification failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error sending web push notification:', error);
    return false;
  }
}

// Send push notification via Firebase Cloud Messaging (Android)
async function sendFCM(deviceToken: string, payload: PushPayload): Promise<boolean> {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  
  if (!fcmServerKey) {
    console.error('FCM_SERVER_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: deviceToken,
        notification: {
          title: payload.title,
          body: payload.body,
          click_action: 'FCM_PLUGIN_ACTIVITY',
          sound: 'default',
        },
        data: {
          conversationId: payload.conversationId,
          url: payload.url,
        },
        priority: 'high',
      }),
    });

    const result = await response.json();
    
    if (result.success === 1) {
      console.log('FCM notification sent successfully');
      return true;
    } else {
      console.error('FCM notification failed:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return false;
  }
}

// Send push notification via Apple Push Notification service (iOS)
async function sendAPNs(deviceToken: string, payload: PushPayload): Promise<boolean> {
  const apnsKeyId = Deno.env.get('APNS_KEY_ID');
  const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
  const apnsKey = Deno.env.get('APNS_KEY');
  const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID') || 'app.lovable.carnexo';

  if (!apnsKeyId || !apnsTeamId || !apnsKey) {
    console.error('APNs credentials not configured');
    return false;
  }

  try {
    // Create JWT for APNs authentication
    const header = { alg: 'ES256', kid: apnsKeyId };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: apnsTeamId,
      iat: now,
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    // Import the private key (PEM format without headers)
    const pemKey = apnsKey.replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');
    const privateKeyBuffer = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
    
    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    
    const signatureInput = new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`);
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      signatureInput
    );
    
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const jwt = `${encodedHeader}.${encodedClaims}.${encodedSignature}`;

    // APNs payload
    const apnsPayload = {
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: 'default',
        badge: 1,
      },
      conversationId: payload.conversationId,
      url: payload.url,
    };

    // Send to APNs (production)
    const apnsHost = 'api.push.apple.com';
    const response = await fetch(`https://${apnsHost}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': apnsBundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': '0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apnsPayload),
    });

    if (response.status === 200) {
      console.log('APNs notification sent successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.error('APNs notification failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('Error sending APNs notification:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, conversationId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push notification to user ${userId}`);

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for user');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: PushPayload = {
      title: title || 'New Message',
      body: body || 'You have a new message',
      conversationId,
      url: conversationId ? `/chat/${conversationId}` : '/messages',
      tag: `conversation-${conversationId}`,
    };

    let successCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      let success = false;
      
      switch (sub.platform) {
        case 'web':
          success = await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
          );
          break;
        
        case 'android':
          if (sub.device_token) {
            success = await sendFCM(sub.device_token, payload);
          }
          break;
        
        case 'ios':
          if (sub.device_token) {
            success = await sendAPNs(sub.device_token, payload);
          }
          break;
        
        default:
          console.log(`Unknown platform: ${sub.platform}`);
      }
      
      if (success) {
        successCount++;
      } else {
        failedEndpoints.push(sub.endpoint);
      }
    }

    // Clean up failed subscriptions (they may be expired)
    if (failedEndpoints.length > 0) {
      console.log(`Cleaning up ${failedEndpoints.length} failed subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints);
    }

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} notifications`,
        failed: failedEndpoints.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
