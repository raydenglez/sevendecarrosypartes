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

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  target_audience: 'all' | 'sellers' | 'buyers' | 'verified_users';
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

// Process a single scheduled notification
async function processScheduledNotification(
  supabaseUrl: string,
  supabaseServiceKey: string,
  notification: ScheduledNotification
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log(`Processing scheduled notification: ${notification.id}`);
  
  // Update status to sending
  await supabase
    .from('broadcast_notifications')
    .update({ status: 'sending' } as any)
    .eq('id', notification.id);

  // Get subscriptions based on target audience
  let subscriptions: PushSubscription[] = [];

  if (notification.target_audience === 'all') {
    const { data, error } = await supabase.from('push_subscriptions').select('*');
    if (!error && data) {
      subscriptions = data as PushSubscription[];
    }
  } else {
    let targetQuery = supabase.from('profiles').select('id');
    
    if (notification.target_audience === 'sellers') {
      targetQuery = targetQuery.eq('user_type', 'dealer');
    } else if (notification.target_audience === 'buyers') {
      targetQuery = targetQuery.eq('user_type', 'individual');
    } else if (notification.target_audience === 'verified_users') {
      targetQuery = targetQuery.eq('is_verified', true);
    }

    const { data: targetUsers, error: usersError } = await targetQuery;
    
    if (!usersError && targetUsers && targetUsers.length > 0) {
      const userIds = (targetUsers as { id: string }[]).map(u => u.id);
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
      } as any)
      .eq('id', notification.id);
    console.log(`No subscriptions found for notification ${notification.id}`);
    return;
  }

  const payload: PushPayload = {
    title: notification.title,
    body: notification.body,
    url: '/',
    tag: `broadcast-${notification.id}`,
  };

  let sent = 0;
  let failed = 0;
  const failedEndpoints: string[] = [];

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
    }

    if (success) {
      sent++;
    } else {
      failed++;
      failedEndpoints.push(sub.endpoint);
    }
  }

  // Clean up failed subscriptions
  if (failedEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', failedEndpoints);
  }

  // Update final status
  await supabase
    .from('broadcast_notifications')
    .update({
      status: 'completed',
      sent_count: sent,
      failed_count: failed,
      completed_at: new Date().toISOString()
    } as any)
    .eq('id', notification.id);

  console.log(`Notification ${notification.id} completed: ${sent} sent, ${failed} failed`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for scheduled notifications...');

    // Find scheduled notifications that are due
    const { data: scheduledNotifications, error } = await supabase
      .from('broadcast_notifications')
      .select('id, title, body, target_audience')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching scheduled notifications:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('No scheduled notifications due');
      return new Response(
        JSON.stringify({ message: 'No scheduled notifications due', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${scheduledNotifications.length} scheduled notifications to process`);

    // Process each notification
    for (const notification of scheduledNotifications) {
      await processScheduledNotification(supabaseUrl, supabaseServiceKey, notification as ScheduledNotification);
    }

    return new Response(
      JSON.stringify({ message: 'Scheduled notifications processed', processed: scheduledNotifications.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
