import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { like, or, desc, sql, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Admin authorization check
    const currentUser = session.user;
    const isAdmin = currentUser.email.toLowerCase().includes('admin');
    
    // Check if user is the first user (additional admin check)
    let isFirstUser = false;
    if (!isAdmin) {
      const firstUser = await db.select({ id: user.id })
        .from(user)
        .orderBy(user.createdAt)
        .limit(1);
      
      if (firstUser.length > 0 && firstUser[0].id === currentUser.id) {
        isFirstUser = true;
      }
    }

    if (!isAdmin && !isFirstUser) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    // Build search filter
    const filter = search ? or(
      like(user.name, `%${search}%`),
      like(user.email, `%${search}%`)
    ) : undefined;

    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(user)
      .where(filter);
    const total = totalResult[0].count;

    // Execute query with pagination and ordering
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }).from(user)
      .where(filter)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      users,
      total,
    }, { status: 200 });

  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}