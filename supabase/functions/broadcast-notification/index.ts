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
  tag?: string;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  platform: string;
  device_token: string | null;
}

// Web Push implementation
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
    
    const header = { alg: 'ES256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      aud: audience,
      exp: now + 12 * 60 * 60,
      sub: 'mailto:noreply@carnetworx.app',
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
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
    
    return response.status === 201 || response.status === 200;
  } catch (error) {
    console.error('Error sending web push:', error);
    return false;
  }
}

// FCM access token generation
async function getFCMAccessToken(): Promise<string | null> {
  const clientEmail = Deno.env.get('FCM_CLIENT_EMAIL');
  const privateKey = Deno.env.get('FCM_PRIVATE_KEY');
  
  if (!clientEmail || !privateKey) {
    console.log('FCM service account credentials not configured');
    return null;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claims = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const pemKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\\n/g, '')
      .replace(/\s/g, '');
    const privateKeyBuffer = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
    
    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureInput = new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`);
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      signatureInput
    );
    
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const jwt = `${encodedHeader}.${encodedClaims}.${encodedSignature}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token || null;
  } catch (error) {
    console.error('Error generating FCM access token:', error);
    return null;
  }
}

// Send FCM notification (Android)
async function sendFCM(deviceToken: string, payload: PushPayload): Promise<boolean> {
  const projectId = Deno.env.get('FCM_PROJECT_ID');
  
  if (!projectId) {
    console.log('FCM_PROJECT_ID not configured');
    return false;
  }

  const accessToken = await getFCMAccessToken();
  if (!accessToken) return false;

  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: deviceToken,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            android: {
              priority: 'high',
              notification: {
                click_action: 'FCM_PLUGIN_ACTIVITY',
                sound: 'default',
              },
            },
            data: {
              url: payload.url || '/',
            },
          },
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return false;
  }
}

// Send APNs notification (iOS)
async function sendAPNs(deviceToken: string, payload: PushPayload): Promise<boolean> {
  const apnsKeyId = Deno.env.get('APNS_KEY_ID');
  const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
  const apnsKey = Deno.env.get('APNS_KEY');
  const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID') || 'app.lovable.carnetworx';

  if (!apnsKeyId || !apnsTeamId || !apnsKey) {
    console.log('APNs credentials not configured');
    return false;
  }

  try {
    const header = { alg: 'ES256', kid: apnsKeyId };
    const now = Math.floor(Date.now() / 1000);
    const claims = { iss: apnsTeamId, iat: now };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
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

    const apnsPayload = {
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: 'default',
        badge: 1,
      },
      url: payload.url,
    };

    const response = await fetch(`https://api.push.apple.com/3/device/${deviceToken}`, {
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

    return response.status === 200;
  } catch (error) {
    console.error('Error sending APNs notification:', error);
    return false;
  }
}

// Process subscriptions
async function sendNotifications(
  supabaseUrl: string,
  supabaseServiceKey: string,
  subscriptions: PushSubscription[],
  payload: PushPayload,
  broadcastId: string
): Promise<{ sent: number; failed: number }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let sent = 0;
  let failed = 0;
  const failedEndpoints: string[] = [];

  console.log(`Processing ${subscriptions.length} subscriptions for broadcast ${broadcastId}`);

  for (const sub of subscriptions) {
    let success = false;

    switch (sub.platform) {
      case 'web':
        success = await sendWebPush(sub, payload);
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
      sent++;
    } else {
      failed++;
      failedEndpoints.push(sub.endpoint);
    }

    // Update progress every 50 notifications
    if ((sent + failed) % 50 === 0) {
      await supabase
        .from('broadcast_notifications')
        .update({ sent_count: sent, failed_count: failed })
        .eq('id', broadcastId);
    }
  }

  // Clean up failed subscriptions
  if (failedEndpoints.length > 0) {
    console.log(`Cleaning up ${failedEndpoints.length} failed subscriptions`);
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', failedEndpoints);
  }

  return { sent, failed };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user: caller }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !caller) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: caller.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('User is not an admin:', caller.id);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, body, targetAudience, broadcastId } = await req.json();

    if (!title || !body || !broadcastId) {
      return new Response(
        JSON.stringify({ error: 'title, body, and broadcastId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting broadcast ${broadcastId} to ${targetAudience}`);

    // Update broadcast status to sending
    await supabase
      .from('broadcast_notifications')
      .update({ status: 'sending' })
      .eq('id', broadcastId);

    // Build subscription query based on target audience
    let subscriptions: PushSubscription[] = [];

    if (targetAudience === 'all') {
      const { data, error } = await supabase.from('push_subscriptions').select('*');
      if (!error && data) {
        subscriptions = data as PushSubscription[];
      }
    } else {
      // Get target user IDs based on audience
      let targetQuery = supabase.from('profiles').select('id');
      
      if (targetAudience === 'sellers') {
        targetQuery = targetQuery.eq('user_type', 'dealer');
      } else if (targetAudience === 'buyers') {
        targetQuery = targetQuery.eq('user_type', 'individual');
      } else if (targetAudience === 'verified_users') {
        targetQuery = targetQuery.eq('is_verified', true);
      }

      const { data: targetUsers, error: usersError } = await targetQuery;
      
      if (!usersError && targetUsers && targetUsers.length > 0) {
        const userIds = targetUsers.map(u => u.id);
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', userIds);
        
        if (!error && data) {
          subscriptions = data as PushSubscription[];
        }
      }
    }

    if (subscriptions.length === 0) {
      await supabase
        .from('broadcast_notifications')
        .update({ 
          status: 'completed', 
          sent_count: 0, 
          failed_count: 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', broadcastId);

      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: PushPayload = {
      title,
      body,
      url: '/',
      tag: `broadcast-${broadcastId}`,
    };

    // Process notifications in background
    const processNotifications = async () => {
      try {
        const result = await sendNotifications(supabaseUrl, supabaseServiceKey, subscriptions, payload, broadcastId);
        
        // Update final status
        const supabaseForUpdate = createClient(supabaseUrl, supabaseServiceKey);
        await supabaseForUpdate
          .from('broadcast_notifications')
          .update({
            status: 'completed',
            sent_count: result.sent,
            failed_count: result.failed,
            completed_at: new Date().toISOString()
          })
          .eq('id', broadcastId);

        console.log(`Broadcast ${broadcastId} completed: ${result.sent} sent, ${result.failed} failed`);
      } catch (err) {
        console.error('Error processing notifications:', err);
        const supabaseForUpdate = createClient(supabaseUrl, supabaseServiceKey);
        await supabaseForUpdate
          .from('broadcast_notifications')
          .update({ status: 'failed' })
          .eq('id', broadcastId);
      }
    };

    // Use waitUntil for background processing
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(processNotifications());
    } else {
      // Fallback: run inline (will delay response)
      await processNotifications();
    }

    return new Response(
      JSON.stringify({ 
        message: 'Broadcast started',
        totalSubscriptions: subscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in broadcast-notification:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
