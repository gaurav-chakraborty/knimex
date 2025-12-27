import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';

async function main() {
    const now = new Date();
    const getDateDaysAgo = (days: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    const userIds = [
        'user_abc123xyz',
        'user_def456uvw',
        'user_ghi789rst',
        'user_jkl012pqr',
        'user_mno345nop',
    ];

    const ipAddresses = [
        '192.168.1.100',
        '10.0.0.50',
        '172.16.0.25',
        '192.168.1.105',
        '10.0.0.75',
        '172.16.0.30',
    ];

    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];

    const referrers = [
        null,
        'https://google.com',
        'https://twitter.com',
        'https://facebook.com',
        'https://linkedin.com',
        null,
    ];

    const sampleEvents = [
        // Page View Events (10 total)
        {
            userId: null,
            eventType: 'page_view',
            eventData: { page: '/home', duration: 5400 },
            ipAddress: ipAddresses[0],
            userAgent: userAgents[0],
            referrer: null,
            createdAt: getDateDaysAgo(6),
        },
        {
            userId: userIds[0],
            eventType: 'page_view',
            eventData: { page: '/about', duration: 12300 },
            ipAddress: ipAddresses[1],
            userAgent: userAgents[1],
            referrer: referrers[1],
            createdAt: getDateDaysAgo(6),
        },
        {
            userId: userIds[1],
            eventType: 'page_view',
            eventData: { page: '/dashboard', duration: 28500 },
            ipAddress: ipAddresses[2],
            userAgent: userAgents[2],
            referrer: null,
            createdAt: getDateDaysAgo(5),
        },
        {
            userId: null,
            eventType: 'page_view',
            eventData: { page: '/pricing', duration: 8700 },
            ipAddress: ipAddresses[3],
            userAgent: userAgents[3],
            referrer: referrers[2],
            createdAt: getDateDaysAgo(5),
        },
        {
            userId: userIds[2],
            eventType: 'page_view',
            eventData: { page: '/docs', duration: 15200 },
            ipAddress: ipAddresses[4],
            userAgent: userAgents[4],
            referrer: referrers[3],
            createdAt: getDateDaysAgo(4),
        },
        {
            userId: null,
            eventType: 'page_view',
            eventData: { page: '/home', duration: 3200 },
            ipAddress: ipAddresses[5],
            userAgent: userAgents[0],
            referrer: null,
            createdAt: getDateDaysAgo(4),
        },
        {
            userId: userIds[3],
            eventType: 'page_view',
            eventData: { page: '/dashboard', duration: 22100 },
            ipAddress: ipAddresses[0],
            userAgent: userAgents[1],
            referrer: referrers[4],
            createdAt: getDateDaysAgo(3),
        },
        {
            userId: userIds[4],
            eventType: 'page_view',
            eventData: { page: '/about', duration: 9800 },
            ipAddress: ipAddresses[1],
            userAgent: userAgents[2],
            referrer: null,
            createdAt: getDateDaysAgo(3),
        },
        {
            userId: null,
            eventType: 'page_view',
            eventData: { page: '/pricing', duration: 6500 },
            ipAddress: ipAddresses[2],
            userAgent: userAgents[3],
            referrer: referrers[1],
            createdAt: getDateDaysAgo(2),
        },
        {
            userId: userIds[0],
            eventType: 'page_view',
            eventData: { page: '/docs', duration: 18900 },
            ipAddress: ipAddresses[3],
            userAgent: userAgents[4],
            referrer: referrers[2],
            createdAt: getDateDaysAgo(1),
        },

        // File Upload Events (5 total)
        {
            userId: userIds[1],
            eventType: 'file_upload',
            eventData: { filename: 'quarterly-report.pdf', size: 2458000, mimeType: 'application/pdf' },
            ipAddress: ipAddresses[4],
            userAgent: userAgents[0],
            referrer: null,
            createdAt: getDateDaysAgo(6),
        },
        {
            userId: userIds[2],
            eventType: 'file_upload',
            eventData: { filename: 'team-photo.jpg', size: 1234500, mimeType: 'image/jpeg' },
            ipAddress: ipAddresses[5],
            userAgent: userAgents[1],
            referrer: null,
            createdAt: getDateDaysAgo(5),
        },
        {
            userId: userIds[3],
            eventType: 'file_upload',
            eventData: { filename: 'sales-data.csv', size: 456700, mimeType: 'text/csv' },
            ipAddress: ipAddresses[0],
            userAgent: userAgents[2],
            referrer: null,
            createdAt: getDateDaysAgo(4),
        },
        {
            userId: userIds[4],
            eventType: 'file_upload',
            eventData: { filename: 'presentation.pptx', size: 4892300, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
            ipAddress: ipAddresses[1],
            userAgent: userAgents[3],
            referrer: null,
            createdAt: getDateDaysAgo(3),
        },
        {
            userId: userIds[0],
            eventType: 'file_upload',
            eventData: { filename: 'contract.pdf', size: 678900, mimeType: 'application/pdf' },
            ipAddress: ipAddresses[2],
            userAgent: userAgents[4],
            referrer: null,
            createdAt: getDateDaysAgo(1),
        },

        // File Download Events (4 total)
        {
            userId: userIds[1],
            eventType: 'file_download',
            eventData: { filename: 'user-manual.pdf', size: 3456700 },
            ipAddress: ipAddresses[3],
            userAgent: userAgents[0],
            referrer: null,
            createdAt: getDateDaysAgo(5),
        },
        {
            userId: null,
            eventType: 'file_download',
            eventData: { filename: 'sample-template.xlsx', size: 234500 },
            ipAddress: ipAddresses[4],
            userAgent: userAgents[1],
            referrer: referrers[1],
            createdAt: getDateDaysAgo(4),
        },
        {
            userId: userIds[2],
            eventType: 'file_download',
            eventData: { filename: 'brand-assets.zip', size: 12345600 },
            ipAddress: ipAddresses[5],
            userAgent: userAgents[2],
            referrer: null,
            createdAt: getDateDaysAgo(2),
        },
        {
            userId: userIds[3],
            eventType: 'file_download',
            eventData: { filename: 'invoice.pdf', size: 156800 },
            ipAddress: ipAddresses[0],
            userAgent: userAgents[3],
            referrer: null,
            createdAt: getDateDaysAgo(1),
        },

        // Metadata Edit Events (3 total)
        {
            userId: userIds[4],
            eventType: 'metadata_edit',
            eventData: { field: 'title', oldValue: 'Untitled Document', newValue: 'Q4 Financial Report' },
            ipAddress: ipAddresses[1],
            userAgent: userAgents[4],
            referrer: null,
            createdAt: getDateDaysAgo(5),
        },
        {
            userId: userIds[0],
            eventType: 'metadata_edit',
            eventData: { field: 'description', oldValue: '', newValue: 'Updated project description with new requirements' },
            ipAddress: ipAddresses[2],
            userAgent: userAgents[0],
            referrer: null,
            createdAt: getDateDaysAgo(3),
        },
        {
            userId: userIds[1],
            eventType: 'metadata_edit',
            eventData: { field: 'tags', oldValue: 'draft', newValue: 'draft, reviewed, approved' },
            ipAddress: ipAddresses[3],
            userAgent: userAgents[1],
            referrer: null,
            createdAt: getDateDaysAgo(2),
        },

        // Social Share Events (2 total)
        {
            userId: userIds[2],
            eventType: 'social_share',
            eventData: { platform: 'twitter', url: 'https://example.com/blog/new-feature-announcement' },
            ipAddress: ipAddresses[4],
            userAgent: userAgents[2],
            referrer: null,
            createdAt: getDateDaysAgo(4),
        },
        {
            userId: null,
            eventType: 'social_share',
            eventData: { platform: 'linkedin', url: 'https://example.com/case-studies/success-story' },
            ipAddress: ipAddresses[5],
            userAgent: userAgents[3],
            referrer: referrers[4],
            createdAt: getDateDaysAgo(2),
        },

        // Feedback Submit Event (1 total)
        {
            userId: userIds[3],
            eventType: 'feedback_submit',
            eventData: { type: 'feature', message: 'Would love to see dark mode support' },
            ipAddress: ipAddresses[0],
            userAgent: userAgents[4],
            referrer: null,
            createdAt: getDateDaysAgo(3),
        },
    ];

    await db.insert(analyticsEvents).values(sampleEvents);
    
    console.log('✅ Analytics events seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});