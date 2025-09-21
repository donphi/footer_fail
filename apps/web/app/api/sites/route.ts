import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!supabase) {
    return NextResponse.json([], { 
      headers: { 'Cache-Control': 'no-store' } 
    });
  }

  const { data, error } = await supabase
    .from('sites')
    .select(`
      *,
      posts (
        id,
        author,
        content,
        timestamp
      )
    `)
    .order('verified_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json([], { 
      status: 500,
      headers: { 'Cache-Control': 'no-store' } 
    });
  }

  // Transform to match existing interface
  const transformed = (data || []).map(site => ({
    url: site.url,
    slug: site.slug,
    company: site.company,
    industry: site.industry,
    country: site.country,
    detectedYears: site.detected_years || [],
    currentYear: site.current_year,
    status: site.status,
    firstIncorrectAt: site.first_incorrect_at,
    lastIncorrectAt: site.last_incorrect_at,
    lastCorrectAt: site.last_correct_at,
    correctedAt: site.corrected_at,
    verifiedAt: site.verified_at,
    lastCheckedAt: site.last_checked_at,
    commentedAt: site.commented_at,
    proof: {
      internetArchive: site.proof_internet_archive,
      archiveToday: site.proof_archive_today
    },
    screenshot: site.screenshot_url,
    screenshotZoom: site.year_screenshot_url,
    posts: site.posts || []
  }));

  return NextResponse.json(transformed, { 
    headers: { 'Cache-Control': 'no-store' } 
  });
}