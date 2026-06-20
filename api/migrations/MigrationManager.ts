import type Database from 'better-sqlite3'
import type { Migration, MigrationRecord, Seeder } from './types'

export class MigrationManager {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
    this.ensureMigrationTable()
  }

  private ensureMigrationTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        executed_at TEXT DEFAULT (datetime('now')),
        batch INTEGER NOT NULL DEFAULT 0
      );
    `)
  }

  private getExecutedMigrations(): MigrationRecord[] {
    return this.db
      .prepare('SELECT * FROM migrations ORDER BY version ASC')
      .all() as MigrationRecord[]
  }

  private getLatestBatch(): number {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(batch), 0) as max_batch FROM migrations')
      .get() as { max_batch: number }
    return row.max_batch
  }

  private recordMigration(version: string, name: string, batch: number): void {
    this.db
      .prepare('INSERT INTO migrations (version, name, batch) VALUES (?, ?, ?)')
      .run(version, name, batch)
  }

  private unrecordMigration(version: string): void {
    this.db.prepare('DELETE FROM migrations WHERE version = ?').run(version)
  }

  private sortMigrations(migrations: Migration[]): Migration[] {
    return [...migrations].sort((a, b) => a.version.localeCompare(b.version))
  }

  getPendingMigrations(allMigrations: Migration[]): Migration[] {
    const executed = new Set(
      this.getExecutedMigrations().map((m) => m.version)
    )
    return this.sortMigrations(
      allMigrations.filter((m) => !executed.has(m.version))
    )
  }

  getMigrationStatus(allMigrations: Migration[]): Array<{
    migration: Migration
    status: 'pending' | 'executed'
    record?: MigrationRecord
  }> {
    const executedRecords = this.getExecutedMigrations()
    const executedMap = new Map(
      executedRecords.map((r) => [r.version, r])
    )
    const sorted = this.sortMigrations(allMigrations)

    return sorted.map((migration) => {
      const record = executedMap.get(migration.version)
      return {
        migration,
        status: record ? 'executed' : 'pending',
        record,
      }
    })
  }

  migrate(allMigrations: Migration[]): {
    executed: number
    migrations: string[]
    batch: number
  } {
    const pending = this.getPendingMigrations(allMigrations)

    if (pending.length === 0) {
      return { executed: 0, migrations: [], batch: 0 }
    }

    const newBatch = this.getLatestBatch() + 1
    const executedList: string[] = []

    const transaction = this.db.transaction(() => {
      for (const migration of pending) {
        migration.up(this.db)
        this.recordMigration(migration.version, migration.name, newBatch)
        executedList.push(`${migration.version}_${migration.name}`)
      }
    })

    transaction()

    return {
      executed: pending.length,
      migrations: executedList,
      batch: newBatch,
    }
  }

  rollback(allMigrations: Migration[], steps: number = 1): {
    rolledBack: number
    migrations: string[]
  } {
    const executedRecords = this.getExecutedMigrations()
    if (executedRecords.length === 0) {
      return { rolledBack: 0, migrations: [] }
    }

    const allSorted = this.sortMigrations(allMigrations)
    const migrationMap = new Map(allSorted.map((m) => [m.version, m]))

    const batchGroups = new Map<number, MigrationRecord[]>()
    for (const record of executedRecords) {
      if (!batchGroups.has(record.batch)) {
        batchGroups.set(record.batch, [])
      }
      batchGroups.get(record.batch)!.push(record)
    }

    const batches = [...batchGroups.keys()].sort((a, b) => b - a)
    const batchesToRollback = batches.slice(0, Math.min(steps, batches.length))

    const rolledBackList: string[] = []

    const transaction = this.db.transaction(() => {
      for (const batch of batchesToRollback) {
        const records = batchGroups.get(batch)!
        const sortedRecords = [...records].sort((a, b) =>
          b.version.localeCompare(a.version)
        )

        for (const record of sortedRecords) {
          const migration = migrationMap.get(record.version)
          if (!migration) {
            throw new Error(
              `Migration file not found for version ${record.version}`
            )
          }
          migration.down(this.db)
          this.unrecordMigration(record.version)
          rolledBackList.push(`${record.version}_${record.name}`)
        }
      }
    })

    transaction()

    return {
      rolledBack: rolledBackList.length,
      migrations: rolledBackList,
    }
  }

  rollbackAll(allMigrations: Migration[]): {
    rolledBack: number
    migrations: string[]
  } {
    const totalBatches = this.getLatestBatch()
    return this.rollback(allMigrations, totalBatches)
  }

  reset(allMigrations: Migration[], seeders: Seeder[] = []): {
    rolledBack: number
    executed: number
    seeded: number
  } {
    const rollbackResult = this.rollbackAll(allMigrations)
    const migrateResult = this.migrate(allMigrations)
    const seeded = this.runSeeders(seeders)

    return {
      rolledBack: rollbackResult.rolledBack,
      executed: migrateResult.executed,
      seeded,
    }
  }

  runSeeders(seeders: Seeder[]): number {
    if (seeders.length === 0) return 0

    let count = 0
    const transaction = this.db.transaction(() => {
      for (const seeder of seeders) {
        seeder.run(this.db)
        count++
      }
    })
    transaction()

    return count
  }
}
