import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

export async function ensureDbInitialized() {
  try {
    // Attempt to query the User table
    await prisma.user.findFirst();
  } catch (error) {
    console.log('⚠️ Database tables missing or uninitialized. Initializing schema & seed data...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      execSync('node prisma/seed.js', { stdio: 'inherit' });
      console.log('✅ Database successfully initialized and seeded!');
    } catch (initErr) {
      console.error('❌ Error auto-initializing database:', initErr);
    }
  }
}

export default prisma;
