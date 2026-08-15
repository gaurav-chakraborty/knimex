import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { enquiries } from '@/db/schema';
import { auth } from '@/lib/auth';
import { createEnquirySchema, formError } from '@/lib/public-submissions';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const parsed = createEnquirySchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(formError('Please provide a valid enquiry.', parsed.error.flatten().fieldErrors), { status: 400 });
    }

    const [enquiry] = await db.insert(enquiries).values({
      userId: session?.user?.id,
      name: parsed.data.name,
      email: parsed.data.email,
      type: parsed.data.type,
      message: parsed.data.message,
      status: 'new',
    }).returning();

    return NextResponse.json({ success: true, enquiry: { id: enquiry.id, status: enquiry.status, createdAt: enquiry.createdAt } }, { status: 201 });
  } catch (error) {
    console.error('POST enquiry error:', error);
    return NextResponse.json({ error: 'Enquiry submission is temporarily unavailable.', code: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
