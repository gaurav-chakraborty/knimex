import { user } from '@/db/schema';

export const adminUserFields = {
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image,
  role: user.role,
  plan: user.plan,
  subscriptionStatus: user.subscriptionStatus,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};
