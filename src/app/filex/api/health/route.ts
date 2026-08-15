import { NextResponse } from 'next/server';
import os from 'node:os';

export async function GET() {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'FileX',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      system: {
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        platform: process.platform,
        arch: process.arch,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        },
        loadavg: os.loadavg(),
      }
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
