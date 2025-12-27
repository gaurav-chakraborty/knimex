/**
 * Debug utilities for production troubleshooting
 */

export const DEBUG_MODE = process.env.NODE_ENV === 'development' || 
                         process.env.NEXT_PUBLIC_DEBUG === 'true';

export class DebugLogger {
  private static logs: string[] = [];
  
  static log(category: string, message: string, data?: any) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${category}] ${message}`;
    
    console.log(logEntry, data || '');
    this.logs.push(logEntry);
    
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }
  
  static exportLogs() {
    return this.logs.join('\n');
  }
}

export function debugFileUpload(file: File) {
  DebugLogger.log('FILE_UPLOAD', 'File selected', {
    name: file.name,
    size: file.size,
    type: file.type
  });
}
