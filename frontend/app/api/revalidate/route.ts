import { revalidatePath } from 'next/cache';
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
