// Supabase Edge Function: gemini-proxy
//
// Holds the Gemini API key server-side and relays generateContent requests
// for the frontend. The frontend never sees GEMINI_API_KEY — see
// frontend-new/src/lib/gemini.js for the three call sites this replaces
// (journal entry analysis, weekly summary, chat).
//
// Deploy with:
//   supabase functions deploy gemini-proxy
//   supabase secrets set GEMINI_API_KEY=your_real_key
//
// By default Supabase verifies the caller's JWT before invoking this
// function, so only signed-in app users can reach it.

const GEMINI_MODEL = 'gemini-2.0-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { payload } = await req.json();
    if (!payload || typeof payload !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing "payload".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await geminiResponse.text();
    return new Response(body, {
      status: geminiResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
