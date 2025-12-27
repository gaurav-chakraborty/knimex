import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feedbackSubmissions, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_STATUSES = ['new', 'reviewed', 'resolved'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Admin check
    const isAdmin = session.user.email?.toLowerCase().includes('admin');
    
    // Check if user is first user in database
    let isFirstUser = false;
    if (!isAdmin) {
      const firstUser = await db.select().from(user).limit(1);
      isFirstUser = firstUser.length > 0 && firstUser[0].id === session.user.id;
    }

    if (!isAdmin && !isFirstUser) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status presence
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status. Must be: new, reviewed, or resolved', 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Check if feedback submission exists
    const existing = await db
      .select()
      .from(feedbackSubmissions)
      .where(eq(feedbackSubmissions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Feedback submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update feedback submission
    const updated = await db
      .update(feedbackSubmissions)
      .set({
        status
      })
      .where(eq(feedbackSubmissions.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Feedback submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
