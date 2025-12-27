import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const getRandomDateInPast30Days = (index: number) => {
        const daysAgo = Math.floor((30 / 5) * index);
        return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    };

    const sampleUsers = [
        {
            id: 'user_adm1n2024x9z',
            name: 'Admin User',
            email: 'admin@example.com',
            emailVerified: true,
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
            createdAt: getRandomDateInPast30Days(0),
            updatedAt: getRandomDateInPast30Days(0),
        },
        {
            id: 'user_j0hnd03xyz789',
            name: 'John Doe',
            email: 'john.doe@example.com',
            emailVerified: true,
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
            createdAt: getRandomDateInPast30Days(1),
            updatedAt: getRandomDateInPast30Days(1),
        },
        {
            id: 'user_j4n3sm1th456',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            emailVerified: false,
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
            createdAt: getRandomDateInPast30Days(2),
            updatedAt: getRandomDateInPast30Days(2),
        },
        {
            id: 'user_m1ch43lbr0wn',
            name: 'Michael Brown',
            email: 'michael.brown@example.com',
            emailVerified: true,
            image: null,
            createdAt: getRandomDateInPast30Days(3),
            updatedAt: getRandomDateInPast30Days(3),
        },
        {
            id: 'user_s4r4hj0hns0n',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            emailVerified: false,
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            createdAt: getRandomDateInPast30Days(4),
            updatedAt: getRandomDateInPast30Days(4),
        },
    ];

    await db.insert(user).values(sampleUsers);
    
    console.log('✅ User seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});