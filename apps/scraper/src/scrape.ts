import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import crypto from 'node:crypto';
import Tesseract from 'tesseract.js';
import { pickYears, slugOf, todayKey } from './util.js';
import { saveToWayback, saveToArchiveToday } from './proof.js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const SCREENSHOTONE_ACCESS_KEY = process.env.SCREENSHOTONE_ACCESS_KEY || '';

if (!SCREENSHOTONE_ACCESS_KEY) {
  console.error('Missing SCREENSHOTONE_ACCESS_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SCREENSHOTONE_API_URL = 'https://api.screenshotone.com/take';

// Helper function to take a screenshot with ScreenshotOne
async function takeScreenshotWithRetry(
  params: URLSearchParams,
  screenshotType: string,
  maxRetries: number = 2
): Promise<Buffer | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`    Retrying ${screenshotType} (attempt ${attempt + 1})...`);
      }

      const response = await fetch(
        `${SCREENSHOTONE_API_URL}?${params.toString()}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(30000) // 30 second timeout
        }
      );

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        console.log(`    ${screenshotType} captured (${buffer.length} bytes)`);
        return buffer;
      } else {
        // Handle specific error codes
        if (response.status === 401) {
          console.error(`    AUTHENTICATION ERROR: ScreenshotOne access key is invalid`);
          console.error(`    Please check your SCREENSHOTONE_ACCESS_KEY environment variable`);
          return null;
        } else if (response.status === 429) {
          console.error(`    RATE LIMIT: Too many requests to ScreenshotOne`);
          if (attempt < maxRetries) {
            console.log(`    Waiting 10 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } else if (response.status === 402) {
          console.error(`    PAYMENT REQUIRED: ScreenshotOne account limit reached`);
          return null;
        } else if (attempt < maxRetries) {
          const errorBody = await response.text();
          console.log(`    ${screenshotType} failed with status ${response.status}: ${errorBody}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error: any) {
      if (attempt < maxRetries) {
        console.log(`    ${screenshotType} error: ${error.message}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`    ${screenshotType} failed after ${maxRetries + 1} attempts: ${error.message}`);
      }
    }
  }
  return null;
}

// Take ONE screenshot at 2x scale and handle zoom with Sharp
async function runScreenshotOneCapture(url: string): Promise<{
  footerScreenshot: Buffer | null,
  yearLocation?: { year: number, bbox: { x0: number, y0: number, x1: number, y1: number } },
  zoomScreenshot?: Buffer | null,
  zoomYearCoordinates?: { x: number, y: number, width: number, height: number }
}> {
  console.log('    Taking high-resolution screenshot with ScreenshotOne...');

  // Take ONE high-resolution full page screenshot at 2x
  const screenshotParams = new URLSearchParams({
    access_key: SCREENSHOTONE_ACCESS_KEY,
    url: url,
    viewport_width: '1920',
    viewport_height: '1080',
    full_page: 'true',
    full_page_algorithm: 'by_sections',
    full_page_scroll: 'true',
    full_page_scroll_delay: '400',
    device_scale_factor: '2',
    block_cookie_banners: 'true',
    block_ads: 'true',
    block_chats: 'true',
    cache: 'false',
    format: 'png',
    delay: '3',
    wait_until: 'networkidle2',
    timeout: '60'
  });

  const fullPageBuffer = await takeScreenshotWithRetry(
    screenshotParams,
    'High-res screenshot (2x)'
  );

  if (!fullPageBuffer) {
    return { footerScreenshot: null };
  }

  console.log(`    Full page captured (${fullPageBuffer.length} bytes)`);

  // Extract footer region (bottom 25% of page)
  console.log('    Extracting footer region for OCR...');
  let footerRegion: Buffer | null = null;
  let footerOffset = { top: 0, left: 0 };
  
  try {
    const metadata = await sharp(fullPageBuffer).metadata();
    if (metadata.width && metadata.height) {
      const footerHeight = Math.floor(metadata.height * 0.25);
      footerOffset.top = metadata.height - footerHeight;
      
      console.log(`    Footer region: ${metadata.width}x${footerHeight} from y=${footerOffset.top}`);
      
      footerRegion = await sharp(fullPageBuffer)
        .extract({
          left: 0,
          top: footerOffset.top,
          width: metadata.width,
          height: footerHeight
        })
        .toBuffer();
    }
  } catch (err) {
    console.error('    Could not extract footer:', err);
    return { footerScreenshot: fullPageBuffer, yearLocation: undefined, zoomScreenshot: null };
  }

  // Run OCR ONLY on footer - NO FALLBACK
  console.log('    Running OCR on FOOTER ONLY...');
  const ocrResult = await extractYearsFromOCR(footerRegion!);
  
  // If no year in footer, we're done - no zoom
  if (!ocrResult.yearLocation) {
    console.log('    No year found in footer - no zoom will be created');
    const footerBuffer = await sharp(fullPageBuffer)
      .resize(1920, null, { fit: 'inside', withoutEnlargement: false })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    return {
      footerScreenshot: footerBuffer,
      yearLocation: undefined,
      zoomScreenshot: null,
      zoomYearCoordinates: undefined
    };
  }

  // Create zoom from the year found IN THE FOOTER
  let zoomBuffer = null;
  let zoomYearCoordinates = undefined;
  const bbox = ocrResult.yearLocation.bbox;

  // Adjust coordinates back to full page space
  const adjustedBbox = {
    x0: bbox.x0,
    y0: bbox.y0 + footerOffset.top,
    x1: bbox.x1,
    y1: bbox.y1 + footerOffset.top
  };

  console.log(`    Year ${ocrResult.yearLocation.year} found IN FOOTER`);
  console.log(`    Creating zoom from footer location...`);

  try {
    const metadata = await sharp(fullPageBuffer).metadata();
    if (metadata.width && metadata.height) {
      // Center on year and extract
      const yearCenterX = (adjustedBbox.x0 + adjustedBbox.x1) / 2;
      const yearCenterY = (adjustedBbox.y0 + adjustedBbox.y1) / 2;

      const extractWidth = 1920;
      const extractHeight = 1080;

      let extractLeft = Math.round(yearCenterX - extractWidth / 2);
      let extractTop = Math.round(yearCenterY - extractHeight / 2);

      // Bounds checking
      extractLeft = Math.max(0, Math.min(extractLeft, metadata.width - extractWidth));
      extractTop = Math.max(0, Math.min(extractTop, metadata.height - extractHeight));

      const finalWidth = Math.min(extractWidth, metadata.width - extractLeft);
      const finalHeight = Math.min(extractHeight, metadata.height - extractTop);

      // Calculate the year's position in the zoomed image
      // First calculate the year's position relative to the extracted region
      const yearXInExtract = adjustedBbox.x0 - extractLeft;
      const yearYInExtract = adjustedBbox.y0 - extractTop;
      const yearWidthInExtract = adjustedBbox.x1 - adjustedBbox.x0;
      const yearHeightInExtract = adjustedBbox.y1 - adjustedBbox.y0;

      // Then scale these coordinates to the final 1920x1080 zoom image
      // Since we're using 'cover' fit, we need to calculate the scale factor
      const scaleX = 1920 / finalWidth;
      const scaleY = 1080 / finalHeight;
      const scale = Math.max(scaleX, scaleY); // 'cover' uses the larger scale

      // Calculate the offset due to 'center' positioning
      const scaledWidth = finalWidth * scale;
      const scaledHeight = finalHeight * scale;
      const offsetX = (1920 - scaledWidth) / 2;
      const offsetY = (1080 - scaledHeight) / 2;

      // Calculate final coordinates in the zoomed image
      zoomYearCoordinates = {
        x: Math.round(yearXInExtract * scale + offsetX),
        y: Math.round(yearYInExtract * scale + offsetY),
        width: Math.round(yearWidthInExtract * scale),
        height: Math.round(yearHeightInExtract * scale)
      };

      console.log(`    Year coordinates in zoom: x=${zoomYearCoordinates.x}, y=${zoomYearCoordinates.y}, width=${zoomYearCoordinates.width}, height=${zoomYearCoordinates.height}`);

      const extractedRegion = await sharp(fullPageBuffer)
        .extract({
          left: extractLeft,
          top: extractTop,
          width: finalWidth,
          height: finalHeight
        })
        .toBuffer();

      zoomBuffer = await sharp(extractedRegion)
        .resize(1920, 1080, { fit: 'cover', position: 'center' })
        .sharpen({ sigma: 0.8 })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();

      console.log(`    Zoom created from footer year: ${zoomBuffer.length} bytes`);
    }
  } catch (err) {
    console.error('    Zoom creation failed:', err);
  }

  // Downscale full page for storage
  const footerBuffer = await sharp(fullPageBuffer)
    .resize(1920, null, { fit: 'inside', withoutEnlargement: false })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  return {
    footerScreenshot: footerBuffer,
    yearLocation: ocrResult.yearLocation,
    zoomScreenshot: zoomBuffer,
    zoomYearCoordinates: zoomYearCoordinates
  };
}

// Extract footer region (bottom 30% of page)
async function extractFooterRegion(screenshot: Buffer): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(screenshot).metadata();
    
    if (!metadata.width || !metadata.height) return null;

    // Extract bottom 30% of the page (where footers typically are)
    const footerHeight = Math.floor(metadata.height * 0.3);
    const footerTop = metadata.height - footerHeight;

    console.log(`    Extracting footer region: ${metadata.width}x${footerHeight} from y=${footerTop}`);

    const footerBuffer = await sharp(screenshot)
      .extract({
        left: 0,
        top: footerTop,
        width: metadata.width,
        height: footerHeight
      })
      .toBuffer();

    return footerBuffer;
  } catch (err) {
    console.error('    Could not extract footer region:', err);
    return null;
  }
}

// Create intelligent zoom centered on year with context
async function createIntelligentYearZoom(
  screenshot: Buffer,
  yearLocation: { year: number, bbox: { x0: number, y0: number, x1: number, y1: number } }
): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(screenshot).metadata();
    
    if (!metadata.width || !metadata.height) return null;

    const bbox = yearLocation.bbox;
    
    // Calculate intelligent zoom region
    // Goal: Show the year with enough context to understand it's a copyright
    const yearWidth = bbox.x1 - bbox.x0;
    const yearHeight = bbox.y1 - bbox.y0;
    
    // Dynamic padding based on year size (larger padding for smaller text)
    const horizontalPadding = Math.max(300, yearWidth * 5); // At least 300px or 5x year width
    const verticalPadding = Math.max(150, yearHeight * 4); // At least 150px or 4x year height
    
    // Calculate crop region centered on year
    const centerX = (bbox.x0 + bbox.x1) / 2;
    const centerY = (bbox.y0 + bbox.y1) / 2;
    
    // Ideal crop dimensions (16:9 aspect ratio for display)
    const cropWidth = Math.min(1920, yearWidth + horizontalPadding);
    const cropHeight = Math.min(1080, Math.floor(cropWidth * 9 / 16));
    
    // Calculate crop position (centered on year)
    let cropLeft = Math.floor(centerX - cropWidth / 2);
    let cropTop = Math.floor(centerY - cropHeight / 2);
    
    // Ensure we don't exceed image boundaries
    cropLeft = Math.max(0, Math.min(cropLeft, metadata.width - cropWidth));
    cropTop = Math.max(0, Math.min(cropTop, metadata.height - cropHeight));
    
    // If year is near bottom, bias the crop to show more content above
    if (bbox.y1 > metadata.height * 0.8) {
      cropTop = Math.max(0, Math.floor(bbox.y0 - cropHeight * 0.8));
    }
    
    console.log(`    Smart zoom: ${cropWidth}x${cropHeight} at (${cropLeft},${cropTop})`);
    console.log(`    Year "${yearLocation.year}" centered in frame`);

    // Extract and enhance the zoomed region
    const zoomBuffer = await sharp(screenshot)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: Math.min(cropWidth, metadata.width - cropLeft),
        height: Math.min(cropHeight, metadata.height - cropTop)
      })
      .resize(1920, 1080, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
        position: 'center'
      })
      .sharpen({ sigma: 1, m1: 0.5, m2: 0.3 }) // Enhance text clarity
      .toBuffer();

    // Optional: Add a subtle highlight around the year region
    const highlightBuffer = await addYearHighlight(zoomBuffer, {
      // Recalculate year position in the cropped image
      x: (bbox.x0 - cropLeft) * (1920 / cropWidth),
      y: (bbox.y0 - cropTop) * (1080 / cropHeight),
      width: yearWidth * (1920 / cropWidth),
      height: yearHeight * (1080 / cropHeight)
    });

    return highlightBuffer || zoomBuffer;
  } catch (err) {
    console.error('    Could not create intelligent zoom:', err);
    return null;
  }
}

// Optional: Add subtle highlight to show where the year was detected
async function addYearHighlight(
  image: Buffer,
  yearRegion: { x: number, y: number, width: number, height: number }
): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    
    // Create a subtle red border around the year
    const highlight = Buffer.from(
      `<svg width="1920" height="1080">
        <rect 
          x="${Math.floor(yearRegion.x - 5)}" 
          y="${Math.floor(yearRegion.y - 5)}" 
          width="${Math.floor(yearRegion.width + 10)}" 
          height="${Math.floor(yearRegion.height + 10)}"
          stroke="red" 
          stroke-width="2" 
          fill="none" 
          stroke-opacity="0.5"
          rx="3"
        />
      </svg>`
    );

    // Composite the highlight over the image
    return await sharp(image)
      .composite([{ input: highlight, top: 0, left: 0 }])
      .toBuffer();
  } catch (err) {
    console.log('    Could not add year highlight:', err);
    return null;
  }
}

// Enhanced OCR function with better year detection
async function extractYearsFromOCR(buffer: Buffer): Promise<{
  years: number[],
  yearLocation?: { year: number, bbox: { x0: number, y0: number, x1: number, y1: number } }
}> {
  console.log('    Running OCR on screenshot...');
  try {
    const sharp = (await import('sharp')).default;
    
    // Preprocess for better OCR accuracy
    const preprocessed = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
    
    const base64 = preprocessed.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    // Suppress console warnings
    const originalWarn = console.warn;
    console.warn = () => {};
    
    const { data } = await Tesseract.recognize(
      dataUrl,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            process.stdout.write(`\r    OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.warn = originalWarn;
    console.log(''); // New line after progress

    const currentYear = new Date().getUTCFullYear();
    const validYears = pickYears(data.text, currentYear);
    
    if (validYears.length === 0) {
      console.log('    No valid years found in screenshot');
      return { years: [] };
    }
    
    console.log(`    OCR found visible years: ${validYears.join(', ')}`);

    // Find the most recent year's location (likely the copyright year)
    let yearLocation = undefined;
    if (data.words) {
      const targetYear = Math.max(...validYears);
      
      // Look for the year, preferring instances near copyright symbols
      let bestMatch = null;
      let bestScore = -1;
      
      for (const word of data.words) {
        if (word.text && word.text.includes(targetYear.toString()) && word.bbox) {
          let score = 0;
          
          // Higher score for years at bottom of page
          const metadata = await sharp(buffer).metadata();
          if (metadata.height && word.bbox.y0 > metadata.height * 0.7) {
            score += 50; // Bonus for being in footer region
          }
          
          // Check nearby words for copyright indicators
          const nearbyWords = data.words.filter(w => {
            if (!w.bbox) return false;
            const distance = Math.abs(w.bbox.x0 - word.bbox.x0);
            return distance < 200; // Within 200px horizontally
          });
          
          for (const nearby of nearbyWords) {
            if (nearby.text) {
              const lowerText = nearby.text.toLowerCase();
              if (lowerText.includes('©') || 
                  lowerText.includes('copyright') || 
                  lowerText.includes('(c)') ||
                  lowerText.includes('rights')) {
                score += 100; // Strong indicator
              }
            }
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = word;
          }
        }
      }
      
      if (bestMatch && bestMatch.bbox) {
        yearLocation = {
          year: targetYear,
          bbox: bestMatch.bbox
        };
        console.log(`    Found year ${targetYear} at coordinates: x=${bestMatch.bbox.x0}, y=${bestMatch.bbox.y0}`);
        if (bestScore > 50) {
          console.log(`    High confidence: likely copyright year (score: ${bestScore})`);
        }
      }
    }

    return { years: validYears, yearLocation };
  } catch (err) {
    console.error('    OCR error:', err);
    return { years: [] };
  }
}

async function createFooterZoom(screenshot: Buffer): Promise<Buffer | undefined> {
  try {
    const metadata = await sharp(screenshot).metadata();
    if (!metadata.width || !metadata.height) return undefined;
    
    const footerHeight = Math.floor(metadata.height * 0.25);
    const footerZoom = await sharp(screenshot)
      .extract({
        left: 0,
        top: metadata.height - footerHeight,
        width: metadata.width,
        height: footerHeight
      })
      .resize(1280, null, { fit: 'inside' })
      .toBuffer();
    
    return footerZoom;
  } catch (err) {
    console.error('    Error creating footer zoom:', err);
    return undefined;
  }
}

async function createYearCloseup(
  screenshot: Buffer,
  yearLocation?: { year: number, bbox: { x0: number, y0: number, x1: number, y1: number } }
): Promise<Buffer | undefined> {
  try {
    const metadata = await sharp(screenshot).metadata();
    if (!metadata.width || !metadata.height) return undefined;

    let cropWidth, cropHeight, left, top;

    if (yearLocation && yearLocation.bbox) {
      // We have exact coordinates - zoom in precisely on the year
      const bbox = yearLocation.bbox;
      console.log(`    Creating precise closeup for year ${yearLocation.year} at exact location`);

      // Calculate center of the year text
      const centerX = (bbox.x0 + bbox.x1) / 2;
      const centerY = (bbox.y0 + bbox.y1) / 2;

      // Create a zoom area around the year (400x200 pixels around the year)
      cropWidth = 400;
      cropHeight = 200;
      left = Math.max(0, Math.floor(centerX - cropWidth / 2));
      top = Math.max(0, Math.floor(centerY - cropHeight / 2));

      // Ensure we don't exceed image boundaries
      if (left + cropWidth > metadata.width) {
        left = metadata.width - cropWidth;
      }
      if (top + cropHeight > metadata.height) {
        top = metadata.height - cropHeight;
      }

      console.log(`    Zooming to exact region: ${left},${top} (${cropWidth}x${cropHeight})`);
    } else {
      // Fallback to general footer area if no exact location
      console.log(`    No exact location, using general footer area`);
      cropWidth = Math.floor(metadata.width * 0.6);
      cropHeight = Math.floor(metadata.height * 0.3);
      left = Math.floor((metadata.width - cropWidth) / 2);
      top = metadata.height - cropHeight;
    }

    const closeup = await sharp(screenshot)
      .extract({
        left: Math.max(0, left),
        top: Math.max(0, top),
        width: Math.min(cropWidth, metadata.width),
        height: Math.min(cropHeight, metadata.height)
      })
      .resize(1920, 1080, {
        fit: 'contain', // Keep the year visible with padding
        background: { r: 245, g: 245, b: 245 }, // Light gray background
        withoutEnlargement: false // Allow enlargement for better zoom
      })
      .sharpen() // Add sharpening for better text clarity
      .toBuffer();

    return closeup;
  } catch (err) {
    console.error('    Error creating year closeup:', err);
    return undefined;
  }
}

async function uploadScreenshot(buffer: Buffer, filename: string, forceAspectRatio: boolean = true): Promise<string> {
  let optimized: Buffer;

  if (forceAspectRatio) {
    // For display in cards - force 16:9 ratio
    optimized = await sharp(buffer)
      .resize(1920, 1080, {
        fit: 'cover',
        position: 'bottom' // Focus on bottom where footer is
      })
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();
  } else {
    // For full page screenshots - maintain aspect ratio, just ensure good width
    optimized = await sharp(buffer)
      .resize(1920, null, {
        fit: 'inside',
        withoutEnlargement: false
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  }

  const { error } = await supabase.storage
    .from('screenshots')
    .upload(filename, optimized, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('screenshots')
    .getPublicUrl(filename);

  return publicUrl;
}

function cleanUrl(url: string): string {
  return url.trim().replace(/\s+/g, '').replace(/^(?!https?:\/\/)/, 'https://');
}


async function scanSinglePage(url: string): Promise<{
  years: number[],
  yearLocation?: { year: number, bbox: { x0: number, y0: number, x1: number, y1: number } },
  footerScreenshot: Buffer | null,
  zoomScreenshot: Buffer | null,
  zoomYearCoordinates?: { x: number, y: number, width: number, height: number }
}> {
  try {
    console.log(`  Scanning: ${url}`);

    const result = await runScreenshotOneCapture(url);

    if (!result.footerScreenshot) {
      console.log('    No screenshot captured');
      return {
        years: [],
        footerScreenshot: null,
        zoomScreenshot: null,
        zoomYearCoordinates: undefined
      };
    }

    // Return years from the OCR that already happened
    const years = result.yearLocation ? [result.yearLocation.year] : [];

    return {
      years: years,
      yearLocation: result.yearLocation,
      footerScreenshot: result.footerScreenshot,
      zoomScreenshot: result.zoomScreenshot || null,
      zoomYearCoordinates: result.zoomYearCoordinates
    };

  } catch (err) {
    console.error(`    Error scanning ${url}:`, err);
    return {
      years: [],
      footerScreenshot: null,
      zoomScreenshot: null,
      zoomYearCoordinates: undefined
    };
  }
}

async function processUrl(url: string): Promise<void> {
  const urlObj = new URL(url);
  const domain = urlObj.host.replace(/^www\./, '');
  const slug = urlObj.host.replace(/\./g, '-');
  const currentYear = new Date().getUTCFullYear();
  
  console.log(`\nProcessing ${url}...`);

  const result = await scanSinglePage(url);
  const detectedYears = result.years;
  let status: 'ok' | 'stale' | 'future' | 'inconclusive';
  
  if (detectedYears.length === 0) {
    status = 'inconclusive';
    console.log('  No visible years found - marking as inconclusive');
  } else {
    const maxYear = Math.max(...detectedYears);
    status = 
      maxYear < currentYear ? 'stale' :
      maxYear === currentYear ? 'ok' : 'future';
    console.log(`  Visible years: ${detectedYears.join(', ')}`);
  }
  
  console.log(`  Status: ${status}`);
  
  let screenshotUrl: string | undefined;
  let screenshotHash: string | undefined;
  let yearScreenshotUrl: string | undefined;
  let yearScreenshotHash: string | undefined;
  let footerScreenshotUrl: string | undefined;
  let footerScreenshotHash: string | undefined;
  let proofIA: string | undefined;
  let proofAT: string | undefined;

  if (status !== 'inconclusive' && result.footerScreenshot) {
    // Upload footer screenshot (main screenshot for display, 16:9 for cards)
    const footerFilename = `${slug}_${todayKey()}.jpg`;
    screenshotUrl = await uploadScreenshot(result.footerScreenshot, footerFilename, true); // Force 16:9
    screenshotHash = crypto.createHash('sha256').update(result.footerScreenshot).digest('hex');
    console.log('  Footer screenshot uploaded (main display)');

    // Store the footer screenshot info
    footerScreenshotUrl = screenshotUrl;
    footerScreenshotHash = screenshotHash;

    // Upload zoom screenshot if available (only if year was found)
    if (result.zoomScreenshot) {
      const zoomFilename = `${slug}_zoom_${todayKey()}.jpg`;
      yearScreenshotUrl = await uploadScreenshot(result.zoomScreenshot, zoomFilename, true); // Force 16:9
      yearScreenshotHash = crypto.createHash('sha256').update(result.zoomScreenshot).digest('hex');
      console.log('  Year zoom screenshot uploaded (precise)');
    }

    if (status === 'stale') {
      console.log('  Capturing archive proof...');
      proofIA = await saveToWayback(url);
      proofAT = await saveToArchiveToday(url);

      if (proofIA) console.log(`  Wayback Machine: ${proofIA}`);
      if (proofAT) console.log(`  Archive.today: ${proofAT}`);
    }
  }
  
  const now = new Date().toISOString();
  const timestampFields: any = {
    last_checked_at: now
  };
  
  if (status === 'ok') {
    timestampFields.last_correct_at = now;
  } else if (status === 'stale') {
    timestampFields.last_incorrect_at = now;
    timestampFields.verified_at = now;
    
    const { data: existingSite } = await supabase
      .from('sites')
      .select('first_incorrect_at')
      .eq('slug', slug)
      .single();
    
    if (!existingSite?.first_incorrect_at) {
      timestampFields.first_incorrect_at = now;
    }
  }
  
  const siteData = {
    url: url,
    slug,
    detected_years: detectedYears,
    current_year: currentYear,
    status,
    screenshot_url: screenshotUrl,
    screenshot_hash: screenshotHash,
    footer_screenshot_url: footerScreenshotUrl,
    footer_screenshot_hash: footerScreenshotHash,
    year_screenshot_url: yearScreenshotUrl,
    year_screenshot_hash: yearScreenshotHash,
    zoom_year_x: result.zoomYearCoordinates?.x,
    zoom_year_y: result.zoomYearCoordinates?.y,
    zoom_year_width: result.zoomYearCoordinates?.width,
    zoom_year_height: result.zoomYearCoordinates?.height,
    ...timestampFields,
    ...(status === 'stale' && {
      proof_internet_archive: proofIA,
      proof_archive_today: proofAT
    })
  };
  
  const { error } = await supabase
    .from('sites')
    .upsert(siteData, { onConflict: 'slug' });
  
  if (error) throw error;
  console.log('  ✓ Saved to database');
}

async function validateScreenshotOneToken(): Promise<boolean> {
  console.log('Validating ScreenshotOne access key...');
  try {
    const testParams = new URLSearchParams({
      access_key: SCREENSHOTONE_ACCESS_KEY,
      url: 'https://example.com',
      viewport_width: '1280',
      format: 'png'
    });

    const response = await fetch(
      `${SCREENSHOTONE_API_URL}?${testParams.toString()}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      }
    );

    if (response.status === 401) {
      console.error('❌ SCREENSHOTONE ACCESS KEY INVALID');
      console.error('Please check your SCREENSHOTONE_ACCESS_KEY in .env file');
      return false;
    } else if (response.status === 402) {
      console.error('❌ SCREENSHOTONE ACCOUNT LIMIT REACHED');
      console.error('Your ScreenshotOne account has reached its usage limit');
      return false;
    } else if (response.ok) {
      console.log('✅ ScreenshotOne access key validated successfully');
      return true;
    } else {
      console.error(`❌ ScreenshotOne validation failed with status: ${response.status}`);
      const errorBody = await response.text();
      console.error(`Error: ${errorBody}`);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to connect to ScreenshotOne:', error.message);
    return false;
  }
}

async function run() {
  console.log('ScreenshotOne-powered Year Detection Scraper starting...');

  // Validate token before starting
  const isValidToken = await validateScreenshotOneToken();
  if (!isValidToken) {
    console.error('\nExiting due to ScreenshotOne authentication failure');
    console.error('Please ensure:');
    console.error('1. Your SCREENSHOTONE_ACCESS_KEY is correct');
    console.error('2. Your account has remaining credits');
    console.error('3. The access key has not expired');
    process.exit(1);
  }
  
  const fs = await import('fs/promises');
  const targetsFile = process.env.TARGETS || '/workspace/apps/scraper/seeds/targets.csv';
  const csvContent = await fs.readFile(targetsFile, 'utf8');

  const validUrls = csvContent.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(url => {
      try {
        const cleaned = cleanUrl(url);
        new URL(cleaned);
        return cleaned;
      } catch {
        console.log(`  Invalid URL skipped: ${url}`);
        return null;
      }
    })
    .filter(Boolean) as string[];

  console.log(`Found ${validUrls.length} valid URLs in targets file`);

  // Fisher-Yates shuffle for proper randomization
  function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const sample = shuffle(validUrls); // Process all sites in random order
  console.log(`Processing all ${sample.length} sites in RANDOM order\n`);

  for (const url of sample) {
    try {
      await processUrl(url);
    } catch (err) {
      console.error(`Failed to process ${url}:`, err);
    }
  }

  console.log('\nScraper complete!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});