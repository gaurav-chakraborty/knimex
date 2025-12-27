import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';

const VALID_EVENT_TYPES = [
  'page_view',
  'file_upload',
  'file_download',
  'metadata_edit',
  'social_share',
  'feedback_submit',
  'error'
] as const;

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const text = await request.text();
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Request body is empty',
          code: 'EMPTY_BODY' 
        },
        { status: 400 }
      );
    }

    // Parse JSON safely
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON' 
        },
        { status: 400 }
      );
    }

    const { userId, eventType, eventData, ipAddress, userAgent, referrer } = body;

    // Validate required field
    if (!eventType) {
      return NextResponse.json(
        { 
          error: 'Event type is required',
          code: 'MISSING_EVENT_TYPE' 
        },
        { status: 400 }
      );
    }

    // Validate eventType is one of the allowed values
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        { 
          error: 'Invalid event type',
          code: 'INVALID_EVENT_TYPE' 
        },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData = {
      userId: userId || null,
      eventType,
      eventData: eventData || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      referrer: referrer || null,
      createdAt: new Date().toISOString()
    };

    // Insert to Turso
    const newEvent = await db.insert(analyticsEvents)
      .values(insertData)
      .returning();

    // Proactively log to Supabase if connection is available
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Map data to Supabase table structure
      await supabase.from('analytics_events').insert([{
        user_id: insertData.userId,
        event_type: insertData.eventType,
        event_data: insertData.eventData,
        ip_address: insertData.ipAddress,
        user_agent: insertData.userAgent,
        referrer: insertData.referrer,
        created_at: insertData.createdAt
      }]);
    } catch (supabaseError) {
      console.error('Supabase analytics logging failed:', supabaseError);
    }

    return NextResponse.json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}