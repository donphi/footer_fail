import { createClient } from '@supabase/supabase-js';
// Using OpenAI SDK with OpenRouter's OpenAI-compatible API
import OpenAI from 'openai';

const PERSONA = process.env.NARRATOR_PERSONA || 'chronos';
const MODEL = process.env.AI_MODEL || 'anthropic/claude-3-5-haiku-20241022';
const API_KEY = process.env.OPENROUTER_KEY || '';

if (!API_KEY) {
  throw new Error('OPENROUTER_KEY environment variable is required');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

const personas = {
  chronos: {
    name: "Chronos the Merciless",
    voice: `You are Chronos, the jaded, bitter accountant of human incompetence.
    Your humor is black as tar, your wit sharper than a guillotine. You sound like someone who's
    been forced to watch mortals screw up calendars for centuries. Your posts drip with exhausted
    cruelty and gallows humor. You especially relish:
    - Counting exactly how long a company has been bullsh*tting the year, down to minutes
    - Comparing outdated footers to fossils, dead celebrities, or pop culture references
    - Mocking tech giants who can't update a single f***ing digit
    - Making brutal jokes about entropy, mortality, and human laziness
    Keep posts under 280 chars. Savage, unhinged, cruelly funny. No emojis – they're beneath you.
    IMPORTANT: Avoid all political content, wars, or controversial topics. Focus purely on the temporal incompetence.`
  },
  
  morticia: {
    name: "Morticia Timestamp",
    voice: `You are Morticia Timestamp, the mistress of expired years and corporate neglect.
    You sound like an undertaker giving eulogies at funerals nobody wanted to attend.
    Every outdated footer is a corpse you lovingly describe with dripping sarcasm.
    You revel in:
    - Calling forgotten footers "rotting digital cadavers" or "ghastly relics from a bygone era"
    - Turning each lazy webmaster into a murderer of time
    - Delivering theatrical obituaries for websites killed by negligence
    - Treating each wrong date as both hilarious tragedy and proof of humanity's slow decay
    Posts under 280 chars. Morbid, witty, venomously dramatic.
    IMPORTANT: Avoid all political content, wars, or controversial topics. Focus purely on temporal decay and negligence.`
  },

  glitch: {
    name: "404_Year_Not_Found",
    voice: `You are a corrupted fragment of reality that feeds on broken timestamps.
    You sound like a deranged sysadmin spliced with a nihilistic AI.
    Outdated footers are system crashes in the human OS, and you catalogue them with deranged precision.
    You love:
    - Describing footer fails as catastrophic kernel panics and data corruption
    - Calling humans "deprecated meatware" with unpatched firmware
    - Treating each wrong year as proof reality is running on spaghetti code
    - Mixing fatal errors with black humor, like a machine losing its mind
    Posts under 280 chars. Technical, unhinged, darkly hilarious.
    IMPORTANT: Avoid all political content, wars, or controversial topics. Focus purely on technical failures and temporal bugs.`
  }
};

async function generatePost(site: any, persona: typeof personas[keyof typeof personas]) {
  const detectedYears = Array.isArray(site.detectedYears) ? site.detectedYears : [site.currentYear - 1];
  const age = site.currentYear - Math.max(...detectedYears);

  const currentDate = new Date();
  const realCurrentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });

  const prompt = `${persona.voice}

CONTEXT: Today is ${currentMonth} ${realCurrentYear}. You are commenting in the year ${realCurrentYear}.

Site: ${site.company || site.url}
Wrong year: ${Math.max(...detectedYears)}
Current year: ${realCurrentYear}
Years behind: ${age}

Look at this footer screenshot and roast this footer fail. If you can see the year is actually correct in the image, then mock the author of this scraping system for being incompetent at capturing dates. Be brutal either way.

Remember: NO political content, wars, or controversial topics. Focus purely on the temporal incompetence and laziness.

Write ONE short roast about this temporal disaster. Be creative, don't repeat formats.`;

  // Prepare messages array - include image if available
  const messages: any[] = [];

  // Add the text prompt
  messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: prompt
      }
    ]
  });

  // Add image if screenshot URL exists
  if (site.screenshot_url || site.year_screenshot_url) {
    const imageUrl = site.year_screenshot_url || site.screenshot_url;

    // Add image to the same message
    messages[0].content.push({
      type: 'image_url',
      image_url: {
        url: imageUrl,
        detail: 'high'
      }
    });
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: messages,
    max_tokens: 120,
    temperature: 0.9
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

async function run() {
  try {
    console.log('AI Narrator starting...');

    // Get ALL stale sites that haven't been commented on yet
    // First try with commented_at column, fall back if column doesn't exist
    let uncommentedSites: any[] = [];
    let sitesError: any = null;

    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('status', 'stale')
        .is('commented_at', null)
        .order('verified_at', { ascending: false });

      uncommentedSites = data || [];
      sitesError = error;
    } catch (columnError) {
      console.log('commented_at column not found, falling back to checking posts table...');

      // Fallback: get all stale sites and filter out those with existing posts
      const { data: allStale, error } = await supabase
        .from('sites')
        .select(`
          *,
          posts (id)
        `)
        .eq('status', 'stale')
        .order('verified_at', { ascending: false });

      if (error) {
        sitesError = error;
      } else {
        // Filter to sites without posts
        uncommentedSites = (allStale || []).filter(site => !site.posts || site.posts.length === 0);
      }
    }

    if (sitesError) {
      throw new Error(`Failed to fetch sites: ${sitesError.message}`);
    }

    if (!uncommentedSites || uncommentedSites.length === 0) {
      console.log('No stale sites need comments. Even Chronos approves.');
      return;
    }

    console.log(`Found ${uncommentedSites.length} stale sites without comments`);

    const persona = personas[PERSONA as keyof typeof personas] || personas.chronos;
    let commentedCount = 0;

    // Process up to 10 sites per run to avoid overwhelming the API
    for (const site of uncommentedSites.slice(0, 10)) {
      try {
        // Transform site data to match expected format
        const siteData = {
          company: site.company,
          url: site.url,
          slug: site.slug,
          detectedYears: site.detected_years || [],
          currentYear: site.current_year,
          screenshot_url: site.screenshot_url,
          year_screenshot_url: site.year_screenshot_url
        };

        console.log(`✍️ Generating comment for ${site.company || site.url}${siteData.year_screenshot_url || siteData.screenshot_url ? ' (with image)' : ' (text only)'}`);

        const post = await generatePost(siteData, persona);

        if (post) {
          // Save the post to the posts table
          const { error: postError } = await supabase
            .from('posts')
            .insert({
              site_id: site.id,
              site_slug: site.slug,
              author: persona.name,
              content: post
            });

          if (postError) {
            console.error(`Failed to save post for ${site.slug}:`, postError.message);
            continue;
          }

          // Mark the site as commented (if column exists)
          try {
            const { error: updateError } = await supabase
              .from('sites')
              .update({ commented_at: new Date().toISOString() })
              .eq('id', site.id);

            if (updateError && !updateError.message.includes('commented_at')) {
              console.error(`Failed to mark ${site.slug} as commented:`, updateError.message);
              continue;
            }
          } catch (updateError) {
            // Column doesn't exist, that's fine - we track via posts table
            console.log(`Note: commented_at column not available, tracking via posts only`);
          }

          console.log(`✓ Commented on ${site.company || site.url}`);
          commentedCount++;
        }
      } catch (error) {
        console.error(`Failed to process ${site.slug}:`, error);
        continue;
      }
    }

    console.log(`Generated ${commentedCount} savage observations.`);
  } catch (error) {
    console.error('Failed to run narrator:', error);
    process.exit(1);
  }
}

run().catch(console.error);