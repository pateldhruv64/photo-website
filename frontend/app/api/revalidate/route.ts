import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 * On-demand revalidation endpoint.
 * Called by backend after admin creates/updates/deletes content.
 * Requires REVALIDATE_SECRET token for security.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;

    // Verify secret token
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid revalidation token.' },
        { status: 401 }
      );
    }

    // Revalidate homepage and all category pages
    revalidatePath('/', 'page');
    revalidatePath('/[category]', 'page');

    // SEO payload cache tag — isse layout ke meta tags, robots.txt,
    // sitemap.xml aur image-sitemap.xml sab ek saath refresh ho jaate hain.
    revalidateTag('seo');
    revalidatePath('/sitemap.xml');
    revalidatePath('/image-sitemap.xml');
    revalidatePath('/robots.txt');

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed.' },
      { status: 500 }
    );
  }
}
