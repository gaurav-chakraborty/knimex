import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feedbackSubmissions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await request.json();
    const { name, email, type, message } = body;

    // Validate required fields
    if (!name || !email || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate type (map to category)
    const validCategories = ['review', 'feature', 'partnership', 'bug', 'support', 'praise'];
    if (!validCategories.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Insert feedback
    const [feedback] = await db.insert(feedbackSubmissions).values({
      userId: session?.user?.id,
      email,
      subject: name,
      category: type,
      message,
      status: 'new',
      createdAt: now
    }).returning();

    return NextResponse.json(
      { 
        success: true,
        feedback,
        message: 'Feedback submitted successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}