import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find conversations older than 24 hours with no messages
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Get all conversations older than 24 hours
    const { data: oldConversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .lt('created_at', twentyFourHoursAgo)

    if (fetchError) {
      console.error('Error fetching old conversations:', fetchError)
      throw fetchError
    }

    if (!oldConversations || oldConversations.length === 0) {
      console.log('No old conversations found')
      return new Response(
        JSON.stringify({ deleted: 0, message: 'No old conversations to clean up' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check which conversations have no messages
    const conversationIds = oldConversations.map(c => c.id)
    const emptyConversationIds: string[] = []

    for (const convId of conversationIds) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convId)

      if (count === 0) {
        emptyConversationIds.push(convId)
      }
    }

    if (emptyConversationIds.length === 0) {
      console.log('No empty conversations to delete')
      return new Response(
        JSON.stringify({ deleted: 0, message: 'No empty conversations to clean up' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete empty conversations
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .in('id', emptyConversationIds)

    if (deleteError) {
      console.error('Error deleting empty conversations:', deleteError)
      throw deleteError
    }

    console.log(`Deleted ${emptyConversationIds.length} empty conversations`)

    return new Response(
      JSON.stringify({ 
        deleted: emptyConversationIds.length, 
        message: `Cleaned up ${emptyConversationIds.length} empty conversations` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Cleanup error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
