#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const CONFLICT_COLUMNS = {
  User: ['id'],
  Account: ['provider', 'providerAccountId'],
  Session: ['sessionToken'],
  VerificationToken: ['token'],
  Folder: ['id'],
  LibraryItem: ['userId', 'type', 'externalId'],
  Playlist: ['youtubeId'],
  Video: ['userId', 'youtubeId'],
  UserSettings: ['userId'],
  SiteSettings: ['id'],
  Notification: ['id'],
  Todo: ['id'],
  Note: ['id'],
  VideoProgress: ['userId', 'youtubeId'],
  PlaylistMark: ['userId', 'youtubeId'],
  _prisma_migrations: ['id'],
};

const NON_UPDATABLE_COLUMNS = new Set(['id', 'createdAt']);

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;

  for (let index = 0; index < sql.length; index++) {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === "'" && inSingleQuote && next === "'") {
      current += "''";
      index++;
      continue;
    }

    if (char === "'") {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === ';' && !inSingleQuote) {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) {
    statements.push(tail);
  }

  return statements;
}

function parseInsert(statement) {
  const insertRegex = /^INSERT\s+INTO\s+public\."([^"]+)"\s*\(([^)]+)\)\s*VALUES\s*\(([^]*?)\)$/i;
  const match = statement.match(insertRegex);
  if (!match) return null;

  const table = match[1];
  const columns = match[2]
    .split(',')
    .map((column) => column.trim().replace(/^"|"$/g, ''));

  return { table, columns };
}

function buildUpsertStatement(statement) {
  const parsed = parseInsert(statement);
  if (!parsed) return statement;

  const { table, columns } = parsed;
  const conflictColumns = CONFLICT_COLUMNS[table];
  if (!conflictColumns || conflictColumns.some((column) => !columns.includes(column))) {
    return statement;
  }

  const updateColumns = columns.filter(
    (column) => !conflictColumns.includes(column) && !NON_UPDATABLE_COLUMNS.has(column)
  );

  const quotedConflictColumns = conflictColumns.map((column) => `"${column}"`).join(', ');

  if (!updateColumns.length) {
    return `${statement} ON CONFLICT (${quotedConflictColumns}) DO NOTHING`;
  }

  const updateAssignments = updateColumns.map((column) => {
    if (table === 'User' && (column === 'currentStreak' || column === 'longestStreak')) {
      return `"${column}" = GREATEST(COALESCE(public."${table}"."${column}", 0), COALESCE(EXCLUDED."${column}", 0))`;
    }
    return `"${column}" = COALESCE(EXCLUDED."${column}", public."${table}"."${column}")`;
  });

  return `${statement} ON CONFLICT (${quotedConflictColumns}) DO UPDATE SET ${updateAssignments.join(', ')}`;
}

function isDestructiveStatement(statement) {
  const normalized = statement.trim().toUpperCase();
  return normalized.startsWith('TRUNCATE ') || normalized.startsWith('DELETE ');
}

async function importMigration() {
  try {
    console.log('Starting non-destructive import (no TRUNCATE)...');

    const sqlFile = path.resolve(__dirname, 'sql', 'snapshot-migration.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    const statements = splitSqlStatements(sql)
      .map((statement) => statement.trim())
      .filter((statement) => statement && !statement.startsWith('--'));

    const destructive = statements.filter((statement) => isDestructiveStatement(statement));
    if (destructive.length > 0) {
      const preview = destructive.slice(0, 3).join('\n');
      throw new Error(
        `Blocked destructive SQL. Found ${destructive.length} disallowed statement(s). Remove TRUNCATE/DELETE before import.\n${preview}`
      );
    }

    console.log(`Found ${statements.length} SQL statements to execute`);

    let applied = 0;
    let skipped = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.toLowerCase().startsWith('begin') || stmt.toLowerCase().startsWith('commit') ||
          stmt.toLowerCase().startsWith('truncate')) {
        continue; // Skip transaction control and truncate statements
      }

      const query = buildUpsertStatement(stmt);

      try {
        await prisma.$executeRawUnsafe(query + ';');
        applied++;
      } catch (err) {
        if (err.meta && err.meta.code === '23505') {
          skipped++;
          console.warn(`  Skipping duplicate in statement ${i + 1}`);
        } else {
          console.error(`  Error in statement ${i + 1}:`, err.message);
          throw err;
        }
      }
    }

    console.log(`✅ Migration imported successfully! Applied: ${applied}, Skipped duplicates: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importMigration();
