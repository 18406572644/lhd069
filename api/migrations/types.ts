import type Database from 'better-sqlite3'

export interface Migration {
  readonly version: string
  readonly name: string
  up(db: Database.Database): void
  down(db: Database.Database): void
}

export interface MigrationRecord {
  id: number
  version: string
  name: string
  executed_at: string
  batch: number
}

export interface Seeder {
  readonly name: string
  run(db: Database.Database): void
}

export type MigrationDirection = 'up' | 'down'
