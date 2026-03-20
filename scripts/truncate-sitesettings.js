const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
prisma.$executeRawUnsafe('TRUNCATE TABLE public."SiteSettings"')
  .then(() => { console.log('✅ SiteSettings truncated'); process.exit(0); })
  .catch(e => { console.error('Error:', e.message); process.exit(1); });
