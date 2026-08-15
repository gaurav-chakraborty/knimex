import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { jobApplications } from '@/db/schema';
import { auth } from '@/lib/auth';
import { createJobApplicationSchema, formError } from '@/lib/public-submissions';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const parsed = createJobApplicationSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(formError('Please provide a complete job application.', parsed.error.flatten().fieldErrors), { status: 400 });
    }

    const [application] = await db.insert(jobApplications).values({
      userId: session?.user?.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      portfolioUrl: parsed.data.portfolioUrl || null,
      resumeUrl: parsed.data.resumeUrl || null,
      coverLetter: parsed.data.coverLetter,
      status: 'new',
    }).returning();

    return NextResponse.json({ success: true, application: { id: application.id, status: application.status, createdAt: application.createdAt } }, { status: 201 });
  } catch (error) {
    console.error('POST job application error:', error);
    return NextResponse.json({ error: 'Job application submission is temporarily unavailable.', code: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
