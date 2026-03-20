#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const reportPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, 'sql', 'snapshot-migration-report.json');

function isSafeIdentifier(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Point it to Supabase before running this script.');
  }

  if (!fs.existsSync(reportPath)) {
    throw new Error(`Report file not found: ${reportPath}`);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const tables = Array.isArray(report.tables) ? report.tables : [];
  const prisma = new PrismaClient();
  const mismatches = [];

  try {
    for (const item of tables) {
      const table = item.table;
      const expected = Number(item.rowCount || 0);

      if (!isSafeIdentifier(table)) {
        throw new Error(`Unsafe table name in report: ${table}`);
      }

      const result = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS count FROM public."${table}"`
      );

      const actual = Number(result?.[0]?.count ?? 0);
      if (actual !== expected) {
        mismatches.push({ table, expected, actual });
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  if (mismatches.length) {
    console.error('Row count mismatches found:');
    for (const mismatch of mismatches) {
      console.error(`- ${mismatch.table}: expected=${mismatch.expected}, actual=${mismatch.actual}`);
    }
    process.exit(1);
  }

  console.log(`Validation passed for ${tables.length} table(s).`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
