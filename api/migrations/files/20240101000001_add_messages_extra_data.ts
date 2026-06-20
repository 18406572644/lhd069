import type Database from 'better-sqlite3'
import type { Migration } from '../types'

const migration: Migration = {
  version: '20240101000001',
  name: 'add_messages_extra_data',

  up(db: Database.Database): void {
    const columns = db
      .prepare("PRAGMA table_info(messages)")
      .all() as { name: string }[]
    const columnNames = columns.map((c) => c.name)

    if (!columnNames.includes('extra_data')) {
      db.prepare("ALTER TABLE messages ADD COLUMN extra_data TEXT DEFAULT ''").run()
    }
  },

  down(db: Database.Database): void {
    const columns = db
      .prepare("PRAGMA table_info(messages)")
      .all() as { name: string }[]
    const columnNames = columns.map((c) => c.name)

    if (columnNames.includes('extra_data')) {
      const tempCols = columnNames.filter((c) => c !== 'extra_data')
      const colList = tempCols.join(', ')
      const placeholders = tempCols.map(() => '?').join(', ')

      const transaction = db.transaction(() => {
        db.exec(
          `CREATE TABLE messages_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT DEFAULT '',
            is_read BOOLEAN DEFAULT 0,
            related_id TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
          )`
        )
        const selectStmt = db.prepare(`SELECT ${colList} FROM messages`)
        const insertStmt = db.prepare(
          `INSERT INTO messages_new (${colList}) VALUES (${placeholders})`
        )
        const rows = selectStmt.all() as Record<string, unknown>[]
        for (const row of rows) {
          insertStmt.run(...tempCols.map((c) => row[c]))
        }
        db.exec('DROP TABLE messages')
        db.exec('ALTER TABLE messages_new RENAME TO messages')
      })

      transaction()
    }
  },
}

export default migration
