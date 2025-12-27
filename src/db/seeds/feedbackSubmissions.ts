import { db } from '@/db';
import { feedbackSubmissions } from '@/db/schema';

async function main() {
    const sampleFeedback = [
        {
            userId: null,
            email: 'sarah.j@example.com',
            subject: 'Great platform!',
            category: 'review',
            status: 'new',
            message: 'Great platform! Love the ease of use and clean interface.',
            createdAt: new Date('2024-12-28'),
        },
        {
            userId: 'user_abc123xyz',
            email: 'm.chen@company.com',
            subject: 'Very helpful tool',
            category: 'review',
            status: 'reviewed',
            message: 'Very helpful tool. Would be nice to have dark mode support.',
            createdAt: new Date('2024-12-25'),
        },
        {
            userId: 'user_def456uvw',
            email: 'emily.davis@mail.com',
            subject: 'Support feedback',
            category: 'review',
            status: 'resolved',
            message: 'Had some initial issues but support team was fantastic.',
            createdAt: new Date('2024-12-20'),
        },
        {
            userId: null,
            email: 'john.smith@tech.com',
            subject: 'API Request',
            category: 'feature',
            status: 'new',
            message: 'Would love to see API access for automation. This would save us hours.',
            createdAt: new Date('2025-01-05'),
        },
        {
            userId: 'user_ghi789rst',
            email: 'l.anderson@startup.io',
            subject: 'Bulk export',
            category: 'feature',
            status: 'reviewed',
            message: 'Bulk export functionality would be incredibly useful for our team.',
            createdAt: new Date('2025-01-02'),
        },
        {
            userId: null,
            email: 'd.wilson@example.org',
            subject: 'Collaboration features',
            category: 'feature',
            status: 'resolved',
            message: 'Real-time collaboration features would make this perfect.',
            createdAt: new Date('2024-12-30'),
        },
        {
            userId: 'user_jkl012opq',
            email: 'robert.t@enterprise.com',
            subject: 'Partnership inquiry',
            category: 'partnership',
            status: 'new',
            message: 'Interested in discussing integration partnership opportunities.',
            createdAt: new Date('2025-01-07'),
        },
        {
            userId: null,
            email: 'j.martinez@agency.com',
            subject: 'Reseller options',
            category: 'partnership',
            status: 'reviewed',
            message: 'Our agency would like to explore reseller partnership options.',
            createdAt: new Date('2025-01-04'),
        },
    ];

    await db.insert(feedbackSubmissions).values(sampleFeedback);
    
    console.log('✅ Feedback submissions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
