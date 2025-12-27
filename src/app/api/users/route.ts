import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { desc, asc, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') ?? 'desc';

    // Validate and sanitize limit
    let limit = limitParam ? parseInt(limitParam) : 50;
    if (isNaN(limit) || limit < 1) {
      limit = 50;
    }
    if (limit > 100) {
      limit = 100;
    }

    // Validate and sanitize offset
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam)) : 0;

    // Validate sortBy parameter
    const validSortFields = ['createdAt', 'name', 'email'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Validate sortOrder parameter
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Build filter
    const filter = (search && search.trim() !== '') 
      ? or(
          like(user.name, `%${search.trim()}%`),
          like(user.email, `%${search.trim()}%`)
        )
      : undefined;

    // Build sorting
    let orderByClause;
    if (sortDirection === 'asc') {
      if (sortField === 'createdAt') orderByClause = asc(user.createdAt);
      else if (sortField === 'name') orderByClause = asc(user.name);
      else if (sortField === 'email') orderByClause = asc(user.email);
    } else {
      if (sortField === 'createdAt') orderByClause = desc(user.createdAt);
      else if (sortField === 'name') orderByClause = desc(user.name);
      else if (sortField === 'email') orderByClause = desc(user.email);
    }

    // Execute query
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
      .orderBy(orderByClause || desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Format timestamps as ISO strings
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      image: u.image,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date(u.createdAt).toISOString(),
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : new Date(u.updatedAt).toISOString(),
    }));

    return NextResponse.json(formattedUsers, { status: 200 });

  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}