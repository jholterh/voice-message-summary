import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, words } = await req.json();
    
    if (!text) {
      throw new Error('No text provided for summarization');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting text summarization...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are a helpful assistant that analyzes voice message transcriptions with timestamp awareness. Provide structured analysis with clear sections. Be concise and actionable.

${words && words.length > 0 ? 'You have access to word-level timestamps from the transcription. Use these to identify when each topic is discussed and include timestamps in MM:SS format for each topic.' : 'Estimate timestamps based on the flow of conversation.'}`
          },
          { 
            role: 'user', 
            content: `Analyze this voice message and provide a structured response. YOU MUST use these EXACT section headers with double asterisks:

**Topics:**
[List 2-5 main topics with timestamps in format: "- Topic Name [MM:SS]". Keep each topic name to 2-4 words max]

**Summary:**
[Write 2-4 sentences capturing the main points, include key details like times, dates, names]

**To-Dos:**
[CRITICAL: Only list action items that the MESSAGE RECIPIENT needs to do. DO NOT include actions the sender will do themselves. If the sender says "I will do X", that is NOT a to-do. Only include tasks where the sender is asking/expecting the recipient to do something. If no recipient tasks exist, write "- No action items"]

**Suggested Response:**
[Write 1-3 sentences as a natural reply in first person, matching the tone of the message]

IMPORTANT: You MUST include all four section headers exactly as shown above. Each topic MUST have a timestamp in [MM:SS] format.

Example format:
**Topics:**
- Housing situation [0:05]
- Lease renewal [0:32]
- Moving plans [1:15]

**Summary:**
The landlord decided not to renew the lease. The tenant needs to find a new place by December 31st and is working with Carsten to find options.

**To-Dos:**
- Let me know if you need help with the apartment search
- Share any places you find that look good

**Suggested Response:**
Thanks for letting me know. That's frustrating, but I'm glad Carsten is helping you look for something new.

${words && words.length > 0 ? `
Word-level timestamps (first 100 words as reference):
${words.slice(0, 100).map((w: any) => `"${w.word}" at ${Math.floor(w.start / 60)}:${Math.floor(w.start % 60).toString().padStart(2, '0')}`).join(', ')}...

Use these timestamps to accurately place each topic.` : ''}

Now analyze this transcription:
${text}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limits exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate summary');
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;

    if (!summary) {
      throw new Error('No summary generated');
    }

    console.log('Summarization completed successfully');

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Summarization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to summarize text';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
