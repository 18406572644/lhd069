import type Database from 'better-sqlite3'
import type { Migration } from '../types'

const migration: Migration = {
  version: '20240101000002',
  name: 'add_materials_is_pinned',

  up(db: Database.Database): void {
    const columns = db
      .prepare("PRAGMA table_info(materials)")
      .all() as { name: string }[]
    const columnNames = columns.map((c) => c.name)

    if (!columnNames.includes('is_pinned')) {
      db.prepare("ALTER TABLE materials ADD COLUMN is_pinned BOOLEAN DEFAULT 0").run()
    }
  },

  down(db: Database.Database): void {
    const columns = db
      .prepare("PRAGMA table_info(materials)")
      .all() as { name: string }[]
    const columnNames = columns.map((c) => c.name)

    if (columnNames.includes('is_pinned')) {
      const tempCols = columnNames.filter((c) => c !== 'is_pinned')
      const colList = tempCols.join(', ')
      const placeholders = tempCols.map(() => '?').join(', ')

      const transaction = db.transaction(() => {
        db.exec(
          `CREATE TABLE materials_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT DEFAULT '',
            price REAL DEFAULT 0,
            is_swappable BOOLEAN DEFAULT 1,
            is_active BOOLEAN DEFAULT 1,
            view_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
          )`
        )
        const selectStmt = db.prepare(`SELECT ${colList} FROM materials`)
        const insertStmt = db.prepare(
          `INSERT INTO materials_new (${colList}) VALUES (${placeholders})`
        )
        const rows = selectStmt.all() as Record<string, unknown>[]
        for (const row of rows) {
          insertStmt.run(...tempCols.map((c) => row[c]))
        }
        db.exec('DROP TABLE materials')
        db.exec('ALTER TABLE materials_new RENAME TO materials')
      })

      transaction()
    }
  },
}

export default migration
