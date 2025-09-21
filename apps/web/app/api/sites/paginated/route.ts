import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ items: [], hasMore: false }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category') || 'all'; // 'fresh' | 'shame' | 'all'

  const offset = page * limit;
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from('sites')
    .select(`
      *,
      posts (
        id,
        author,
        content,
        timestamp
      )
    `, { count: 'exact' });

  // Filter based on category
  if (category === 'fresh') {
    query = query
      .eq('status', 'stale')
      .gte('verified_at', today)
      .order('brand_weight', { ascending: false });
  } else if (category === 'shame') {
    query = query
      .eq('status', 'stale')
      .or(`verified_at.is.null,verified_at.lt.${today}`)
      .order('years_outdated', { ascending: false });
  } else {
    query = query
      .eq('status', 'stale')
      .order('knowledge_rank', { ascending: false });
  }

  // Add pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching paginated sites:', error);
    return NextResponse.json({ items: [], hasMore: false }, {
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
    zoomYearCoordinates: site.zoom_year_x ? {
      x: site.zoom_year_x,
      y: site.zoom_year_y,
      width: site.zoom_year_width,
      height: site.zoom_year_height
    } : undefined,
    posts: site.posts || []
  }));

  const hasMore = count ? (offset + limit) < count : false;

  return NextResponse.json({
    items: transformed,
    hasMore,
    total: count || 0,
    page,
    limit
  }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}