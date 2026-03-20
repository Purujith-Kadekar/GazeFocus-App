#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const sourceDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '..', '..', 'PRISMA');
const outputDir = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(__dirname, 'sql');

const TABLE_ORDER = [
  'User',
  'Account',
  'Session',
  'VerificationToken',
  'Folder',
  'LibraryItem',
  'Playlist',
  'Video',
  'UserSettings',
  'SiteSettings',
  'Notification',
  'Todo',
  'Note',
  'VideoProgress',
  'PlaylistMark',
  '_prisma_migrations',
];

const KNOWN_TABLES = new Set(TABLE_ORDER);
const TABLE_COLUMN_ALLOWLIST = {
  User: [
    'id',
    'name',
    'email',
    'emailVerified',
    'image',
    'passwordHash',
    'currentStreak',
    'longestStreak',
    'lastLoginDate',
    'lastActiveDate',
    'weeklyVideosWatched',
    'lastWeeklyReset',
    'deletionScheduledAt',
    'isBlocked',
    'createdAt',
    'updatedAt',
  ],
  Account: [
    'id',
    'userId',
    'type',
    'provider',
    'providerAccountId',
    'refresh_token',
    'access_token',
    'expires_at',
    'token_type',
    'scope',
    'id_token',
    'session_state',
  ],
  Session: ['id', 'sessionToken', 'userId', 'expires'],
  VerificationToken: ['identifier', 'token', 'expires'],
  Folder: ['id', 'userId', 'parentId', 'title', 'description', 'position', 'createdAt', 'updatedAt'],
  LibraryItem: ['id', 'userId', 'folderId', 'type', 'externalId', 'title', 'metadata', 'position', 'createdAt', 'updatedAt'],
  Note: ['id', 'userId', 'youtubeId', 'videoId', 'timestampSeconds', 'content', 'isImportant', 'createdAt', 'updatedAt'],
  VideoProgress: ['id', 'userId', 'youtubeId', 'videoId', 'playlistId', 'secondsWatched', 'durationSeconds', 'completed', 'completedAt', 'updatedAt', 'createdAt'],
  PlaylistMark: ['id', 'userId', 'youtubeId', 'playlistId', 'finished', 'finishedAt'],
  Playlist: ['id', 'youtubeId', 'title', 'description', 'thumbnail', 'channelId', 'channelName', 'totalDuration', 'userId', 'scheduledAt', 'createdAt', 'updatedAt'],
  Video: ['id', 'youtubeId', 'title', 'description', 'thumbnail', 'duration', 'position', 'userId', 'playlistId', 'scheduledAt', 'createdAt', 'updatedAt'],
  UserSettings: ['id', 'eyeTrackingEnabled', 'sensitivityMode', 'inactivityTimeout', 'soundAlerts', 'theme', 'autoPlayNext', 'defaultPlaybackSpeed', 'eyeTrackingThreshold', 'onboardingCompleted', 'weeklyGoal', 'userId', 'createdAt', 'updatedAt'],
  SiteSettings: ['id', 'signupEnabled', 'updatedAt'],
  Notification: ['id', 'userId', 'title', 'message', 'read', 'global', 'createdAt'],
  Todo: ['id', 'userId', 'text', 'completed', 'type', 'reminderAt', 'createdAt', 'updatedAt'],
  _prisma_migrations: ['id', 'checksum', 'finished_at', 'migration_name', 'logs', 'rolled_back_at', 'started_at', 'applied_steps_count'],
};

const TABLE_DB_COLUMNS = {
  User: ['id', 'name', 'email', 'emailVerified', 'image', 'passwordHash', 'currentStreak', 'longestStreak', 'lastLoginDate', 'lastActiveDate', 'weeklyVideosWatched', 'lastWeeklyReset', 'deletionScheduledAt', 'isBlocked', 'createdAt', 'updatedAt'],
  Account: ['id', 'userId', 'type', 'provider', 'providerAccountId', 'refresh_token', 'access_token', 'expires_at', 'token_type', 'scope', 'id_token', 'session_state'],
  Session: ['id', 'sessionToken', 'userId', 'expires'],
  VerificationToken: ['identifier', 'token', 'expires'],
  Folder: ['id', 'userId', 'parentId', 'title', 'description', 'position', 'createdAt', 'updatedAt'],
  LibraryItem: ['id', 'userId', 'folderId', 'type', 'externalId', 'title', 'metadata', 'position', 'createdAt', 'updatedAt'],
  Playlist: ['id', 'youtubeId', 'title', 'description', 'thumbnail', 'channelId', 'channelName', 'totalDuration', 'userId', 'scheduledAt', 'createdAt', 'updatedAt'],
  Video: ['id', 'youtubeId', 'title', 'description', 'thumbnail', 'duration', 'position', 'userId', 'playlistId', 'scheduledAt', 'createdAt', 'updatedAt'],
  UserSettings: ['id', 'eyeTrackingEnabled', 'sensitivityMode', 'inactivityTimeout', 'soundAlerts', 'theme', 'autoPlayNext', 'defaultPlaybackSpeed', 'eyeTrackingThreshold', 'onboardingCompleted', 'weeklyGoal', 'userId', 'createdAt', 'updatedAt'],
  SiteSettings: ['id', 'signupEnabled', 'updatedAt'],
  Notification: ['id', 'userId', 'title', 'message', 'read', 'global', 'createdAt'],
  Todo: ['id', 'userId', 'text', 'completed', 'type', 'reminderAt', 'createdAt', 'updatedAt'],
  Note: ['id', 'userId', 'youtubeId', 'timestampSeconds', 'content', 'isImportant', 'createdAt', 'updatedAt'],
  VideoProgress: ['id', 'userId', 'youtubeId', 'secondsWatched', 'durationSeconds', 'completed', 'completedAt', 'updatedAt', 'createdAt'],
  PlaylistMark: ['id', 'userId', 'youtubeId', 'finished', 'finishedAt'],
  _prisma_migrations: ['id', 'checksum', 'finished_at', 'migration_name', 'logs', 'rolled_back_at', 'started_at', 'applied_steps_count'],
};

const tableRows = new Map();
const tableColumns = new Map();
const tablesObservedInSnapshots = new Set();
const filesScanned = [];

function decodeHtml(input) {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(input) {
  return input.replace(/<[^>]*>/g, '');
}

function normalizeCell(rawCellHtml) {
  if (!rawCellHtml) return null;
  const isNull = /<code[^>]*>\s*NULL\s*<\/code>/i.test(rawCellHtml);
  if (isNull) return null;

  const decoded = decodeHtml(stripTags(rawCellHtml)).trim();
  if (!decoded) return '';
  return decoded;
}

function sqlLiteral(value, column, rowIndex) {
  if (value === null || value === undefined) {
    if (column === 'createdAt' || column === 'updatedAt') {
      return 'CURRENT_TIMESTAMP';
    }
    if (column === 'videoId') {
      return `'video-placeholder-${rowIndex}'`;
    }
    return 'NULL';
  }
  const strVal = String(value).toLowerCase();
  if (strVal === 'true' || strVal === 'false') {
    return strVal;
  }
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

function inferTableName(html) {
  const selected = html.match(/data-active="true"[\s\S]*?<a[^>]*#table=([^&"\s]+)&/i);
  if (selected) return decodeURIComponent(selected[1]);

  const active = html.match(/#table=([^&"\s]+)&(?:amp;)?schema=/i);
  if (active) return decodeURIComponent(active[1]);

  return null;
}

function extractColumns(html) {
  const columns = [];
  const regex = /data-grid-header-id="([^"]+)"/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const col = match[1];
    if (col === '__ps_select') continue;
    if (!columns.includes(col)) columns.push(col);
  }

  return columns;
}

function filterColumnsForTable(table, columns) {
  const allowlist = TABLE_COLUMN_ALLOWLIST[table];
  if (!allowlist) return columns;
  return columns.filter((column) => allowlist.includes(column));
}

function normalizeRowToCurrentSchema(table, row) {
  const normalized = { ...row };

  if (table === 'Note' && !normalized.youtubeId && normalized.videoId) {
    normalized.youtubeId = normalized.videoId;
  }

  if (table === 'VideoProgress' && !normalized.youtubeId) {
    normalized.youtubeId = normalized.videoId || normalized.playlistId || null;
  }

  if (table === 'PlaylistMark' && !normalized.youtubeId) {
    normalized.youtubeId = normalized.playlistId || null;
  }

  if (table === 'SiteSettings' && !normalized.id) {
    normalized.id = 'global';
  }

  // Only delete videoId for tables that have youtubeId already set
  if (table !== 'Video') {
    delete normalized.videoId;
  }
  // Only delete playlistId for tables that don't need it (not Video)
  if (table !== 'Video') {
    delete normalized.playlistId;
  }
  return normalized;
}

function extractRows(html, columns) {
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];

  const body = tbodyMatch[1];
  const trRegex = /<tr\b[\s\S]*?<\/tr>/gi;
  const rows = [];
  let trMatch;

  while ((trMatch = trRegex.exec(body)) !== null) {
    const tr = trMatch[0];
    const row = {};

    for (const col of columns) {
      const cellRegex = new RegExp(`data-grid-column-id="${col}"[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
      const cellMatch = tr.match(cellRegex);
      row[col] = normalizeCell(cellMatch ? cellMatch[1] : null);
    }

    const hasData = Object.values(row).some((v) => v !== null && v !== '');
    if (hasData) rows.push(row);
  }

  return rows;
}

function rowKey(table, row, columns) {
  if (row.id) return `${table}::id::${row.id}`;
  if (table === 'VerificationToken') return `${table}::${row.identifier ?? ''}::${row.token ?? ''}`;
  if (table === 'Account') return `${table}::${row.provider ?? ''}::${row.providerAccountId ?? ''}`;
  if (table === 'VideoProgress') return `${table}::${row.userId ?? ''}::${row.youtubeId ?? ''}`;
  if (table === 'PlaylistMark') return `${table}::${row.userId ?? ''}::${row.youtubeId ?? ''}`;
  if (table === 'LibraryItem') return `${table}::${row.userId ?? ''}::${row.type ?? ''}::${row.externalId ?? ''}`;
  return `${table}::${columns.map((c) => row[c] ?? '').join('||')}`;
}

function parseSnapshot(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const table = inferTableName(html);
  if (!table || !KNOWN_TABLES.has(table)) return;
  tablesObservedInSnapshots.add(table);

  const columns = filterColumnsForTable(table, extractColumns(html));
  if (!columns.length) return;

  const rows = extractRows(html, columns);
  if (!rows.length) return;

  if (!tableRows.has(table)) tableRows.set(table, new Map());
  if (!tableColumns.has(table)) tableColumns.set(table, columns);

  const rowMap = tableRows.get(table);
  const currentColumns = tableColumns.get(table);
  if (currentColumns.length < columns.length) {
    tableColumns.set(table, columns);
  }

  for (const rawRow of rows) {
    const row = normalizeRowToCurrentSchema(table, rawRow);
    const key = rowKey(table, row, tableColumns.get(table));
    rowMap.set(key, row);
  }
}

function buildSql() {
  const statements = [];
  statements.push('-- Generated from Prisma Studio HTML snapshots');
  statements.push('BEGIN;');

  const discoveredTables = Array.from(tableRows.keys());
  const ordered = [
    ...TABLE_ORDER.filter((table) => discoveredTables.includes(table)),
    ...discoveredTables.filter((table) => !TABLE_ORDER.includes(table)).sort(),
  ];

  const REQUIRED_COLUMNS = {
    User: ['updatedAt'],
    Folder: ['updatedAt'],
    LibraryItem: ['updatedAt'],
    Note: ['updatedAt'],
    Playlist: ['updatedAt'],
    Video: ['updatedAt'],
    VideoProgress: ['videoId', 'updatedAt'],
    PlaylistMark: [],
    Account: [],
    Session: [],
    VerificationToken: [],
    Todo: ['updatedAt'],
    UserSettings: ['updatedAt'],
    SiteSettings: ['updatedAt'],
    Notification: [],
    _prisma_migrations: [],
  };

  for (const table of ordered) {
    const rows = Array.from(tableRows.get(table).values());
    let columns = tableColumns.get(table);
    const dbColumns = TABLE_DB_COLUMNS[table] || columns;
    columns = columns.filter((col) => dbColumns.includes(col));

    const required = REQUIRED_COLUMNS[table] || [];
    for (const col of required) {
      if (dbColumns.includes(col) && !columns.includes(col)) {
        columns = [...columns, col];
      }
    }

    statements.push(`\n-- ${table}: ${rows.length} row(s)`);

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const colList = columns.map((col) => `"${col}"`).join(', ');
      const values = columns.map((col) => sqlLiteral(row[col], col, rowIdx)).join(', ');
      statements.push(`INSERT INTO public."${table}" (${colList}) VALUES (${values});`);
    }
  }

  statements.push('\nCOMMIT;');
  return statements.join('\n');
}

function main() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((name) => /^Prisma Console.*\.html$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  for (const file of files) {
    const full = path.join(sourceDir, file);
    filesScanned.push(file);
    parseSnapshot(full);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sqlPath = path.join(outputDir, 'snapshot-migration.sql');
  const reportPath = path.join(outputDir, 'snapshot-migration-report.json');

  const sql = buildSql();
  fs.writeFileSync(sqlPath, sql, 'utf8');

  const report = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    filesScanned,
    tables: Array.from(new Set([...tablesObservedInSnapshots, ...tableRows.keys()]))
      .sort()
      .map((table) => ({
        table,
        columns: tableColumns.get(table) || TABLE_COLUMN_ALLOWLIST[table] || [],
        rowCount: tableRows.get(table)?.size || 0,
      })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Created SQL: ${sqlPath}`);
  console.log(`Created report: ${reportPath}`);
  console.log(`Tables extracted: ${report.tables.length}`);
}

main();
