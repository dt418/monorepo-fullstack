import { hash } from 'bcrypt';
import { prisma } from '../src/client';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create regular user
  const userPassword = await hash('user1234', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      passwordHash: userPassword,
      role: 'user',
    },
  });
  console.log('✅ Created regular user:', user.email);

  // Create sample tasks for user
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Complete project setup',
        description: 'Set up the full-stack monorepo with all packages',
        status: 'done',
        priority: 'high',
        userId: user.id,
      },
      {
        title: 'Implement authentication',
        description: 'Add JWT authentication with refresh tokens',
        status: 'in_progress',
        priority: 'high',
        userId: user.id,
      },
      {
        title: 'Add file upload feature',
        description: 'Implement drag-and-drop file upload with S3 support',
        status: 'todo',
        priority: 'medium',
        userId: user.id,
      },
      {
        title: 'Write documentation',
        description: 'Document all API endpoints and setup instructions',
        status: 'todo',
        priority: 'low',
        userId: user.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created', tasks.count, 'sample tasks');

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
