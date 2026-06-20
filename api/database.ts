import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MigrationManager } from './migrations/MigrationManager'
import migrations from './migrations'
import seeders from './seeders'
import {
  POINTS_LEVELS,
  POINTS_RULES,
  POST_CATEGORIES,
  REPORT_REASONS,
  COMMUNITY_BADGE_DEFINITIONS,
} from './constants'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
const uploadsDir = path.join(__dirname, 'uploads')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const dbPath = path.join(dataDir, 'app.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function bootstrapMigrationSystem(): void {
  const migrationManager = new MigrationManager(db)

  const tableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    )
    .get()

  if (!tableExists) {
    migrationManager.migrate(migrations)
    return
  }

  const migrationRecord = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
    )
    .get()

  if (!migrationRecord) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        executed_at TEXT DEFAULT (datetime('now')),
        batch INTEGER NOT NULL DEFAULT 0
      );
    `)
  }

  const initialVersion = '00000000000000'
  const hasInitial = db
    .prepare('SELECT COUNT(*) as count FROM migrations WHERE version = ?')
    .get(initialVersion) as { count: number }

  if (hasInitial.count === 0) {
    db.prepare(
      'INSERT INTO migrations (version, name, batch) VALUES (?, ?, ?)'
    ).run(initialVersion, 'initial_schema', 1)
  }

  migrationManager.migrate(migrations)
}

bootstrapMigrationSystem()

const manager = new MigrationManager(db)
manager.runSeeders(seeders)

function getLevelByPoints(totalEarned: number): string {
  let level = POINTS_LEVELS[0].name
  for (const l of POINTS_LEVELS) {
    if (totalEarned >= l.minPoints) {
      level = l.name
    }
  }
  return level
}

function ensurePointsAccount(userId: number): void {
  const existing = db.prepare('SELECT id FROM points_accounts WHERE user_id = ?').get(userId)
  if (!existing) {
    db.prepare('INSERT INTO points_accounts (user_id, balance, total_earned, total_spent, level) VALUES (?, 0, 0, 0, ?)').run(userId, POINTS_LEVELS[0].name)
  }
}

function addPoints(userId: number, amount: number, source: string, description: string, relatedId: string = ''): void {
  ensurePointsAccount(userId)
  const account = db.prepare('SELECT * FROM points_accounts WHERE user_id = ?').get(userId) as any
  const newBalance = account.balance + amount
  const newTotalEarned = account.total_earned + (amount > 0 ? amount : 0)
  const newTotalSpent = account.total_spent + (amount < 0 ? Math.abs(amount) : 0)
  const newLevel = getLevelByPoints(newTotalEarned)

  db.prepare(
    'UPDATE points_accounts SET balance = ?, total_earned = ?, total_spent = ?, level = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
  ).run(newBalance, newTotalEarned, newTotalSpent, newLevel, userId)

  db.prepare(
    'INSERT INTO points_records (user_id, type, amount, balance_after, source, description, related_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, amount > 0 ? 'earn' : 'spend', amount, newBalance, source, description, relatedId)
}

export default db
export {
  MigrationManager,
  migrations,
  seeders,
  POINTS_LEVELS,
  POINTS_RULES,
  POST_CATEGORIES,
  REPORT_REASONS,
  COMMUNITY_BADGE_DEFINITIONS,
  getLevelByPoints,
  ensurePointsAccount,
  addPoints,
}
