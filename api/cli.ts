import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MigrationManager } from './migrations/MigrationManager'
import migrations from './migrations'
import seeders from './seeders'

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

const manager = new MigrationManager(db)

function printStatus(): void {
  const status = manager.getMigrationStatus(migrations)
  console.log('\n=== Migration Status ===\n')
  for (const { migration, status: s, record } of status) {
    const icon = s === 'executed' ? '✓' : '○'
    const time = record?.executed_at || ''
    const batch = record ? ` [batch:${record.batch}]` : ''
    console.log(`  ${icon} ${migration.version} ${migration.name} ${time}${batch}`)
  }
  const executed = status.filter((s) => s.status === 'executed').length
  const pending = status.filter((s) => s.status === 'pending').length
  console.log(`\n  Executed: ${executed} | Pending: ${pending} | Total: ${status.length}\n`)
}

function printHelp(): void {
  console.log(`
Database Migration CLI

Usage:
  node --loader tsx api/cli.ts <command> [options]

Commands:
  status              Show migration status
  migrate             Run all pending migrations
  rollback [steps]    Rollback last batch(s), default 1 step
  rollback:all        Rollback all migrations
  reset               Rollback all, migrate all, re-seed
  seed                Run seeders
  make <name>         Create a new migration file template (name: snake_case)
  help                Show this help message

Examples:
  node --loader tsx api/cli.ts status
  node --loader tsx api/cli.ts migrate
  node --loader tsx api/cli.ts rollback 2
  node --loader tsx api/cli.ts reset
`)
}

function makeMigration(name: string): void {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14)

  const safeName = name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-z0-9_]/gi, '_')
    .toLowerCase()

  const filename = `${timestamp}_${safeName}.ts`
  const filepath = path.join(__dirname, 'migrations', 'files', filename)

  const template = `import type Database from 'better-sqlite3'
import type { Migration } from '../types'

const migration: Migration = {
  version: '${timestamp}',
  name: '${safeName}',

  up(db: Database.Database): void {
    // TODO: Write migration up logic
  },

  down(db: Database.Database): void {
    // TODO: Write migration down logic (reverse of up)
  },
}

export default migration
`

  fs.writeFileSync(filepath, template, 'utf8')
  console.log(`\n  Created: ${path.relative(process.cwd(), filepath)}\n`)

  const indexPath = path.join(__dirname, 'migrations', 'index.ts')
  let indexContent = fs.readFileSync(indexPath, 'utf8')
  const importName = safeName.replace(/(^|_)([a-z])/g, (_m, p1, p2) =>
    p1 === '_' ? p2.toUpperCase() : p2
  )
  const newImport = `import ${importName} from './files/${timestamp}_${safeName}'`
  const newItem = `  ${importName},`

  if (!indexContent.includes(newImport)) {
    const lastImport = indexContent.match(/import .* from '\.\/files\/.*'/)
    if (lastImport) {
      indexContent = indexContent.replace(
        lastImport[0],
        `${lastImport[0]}\n${newImport}`
      )
    }

    const arrMatch = indexContent.match(/const migrations: Migration\[\] = \[([\s\S]*?)\]/)
    if (arrMatch && arrMatch[1]) {
      const items = arrMatch[1].trim()
      indexContent = indexContent.replace(
        arrMatch[0],
        `const migrations: Migration[] = [\n${items}\n${newItem}\n]`
      )
    }

    fs.writeFileSync(indexPath, indexContent, 'utf8')
    console.log(`  Updated: ${path.relative(process.cwd(), indexPath)}\n`)
  }
}

const args = process.argv.slice(2)
const command = args[0] || 'help'

try {
  switch (command) {
    case 'status':
      printStatus()
      break

    case 'migrate': {
      printStatus()
      const result = manager.migrate(migrations)
      if (result.executed === 0) {
        console.log('  Nothing to migrate.\n')
      } else {
        console.log(`  Migrated ${result.executed} migration(s) in batch ${result.batch}:\n`)
        for (const m of result.migrations) {
          console.log(`    - ${m}`)
        }
        console.log('')
      }
      break
    }

    case 'rollback': {
      const steps = parseInt(args[1] || '1', 10)
      printStatus()
      const result = manager.rollback(migrations, steps)
      if (result.rolledBack === 0) {
        console.log('  Nothing to rollback.\n')
      } else {
        console.log(`  Rolled back ${result.rolledBack} migration(s):\n`)
        for (const m of result.migrations) {
          console.log(`    - ${m}`)
        }
        console.log('')
      }
      break
    }

    case 'rollback:all': {
      printStatus()
      const result = manager.rollbackAll(migrations)
      if (result.rolledBack === 0) {
        console.log('  Nothing to rollback.\n')
      } else {
        console.log(`  Rolled back ${result.rolledBack} migration(s):\n`)
        for (const m of result.migrations) {
          console.log(`    - ${m}`)
        }
        console.log('')
      }
      break
    }

    case 'reset': {
      printStatus()
      const result = manager.reset(migrations, seeders)
      console.log(
        `  Reset complete: rolled back ${result.rolledBack}, migrated ${result.executed}, seeded ${result.seeded}\n`
      )
      break
    }

    case 'seed': {
      const count = manager.runSeeders(seeders)
      console.log(`  Ran ${count} seeder(s)\n`)
      break
    }

    case 'make': {
      const name = args[1]
      if (!name) {
        console.error('  Error: migration name required\n')
        process.exit(1)
      }
      makeMigration(name)
      break
    }

    case 'help':
    case '--help':
    case '-h':
    default:
      printHelp()
      break
  }
} catch (error) {
  console.error('\n  Error:', error instanceof Error ? error.message : String(error), '\n')
  process.exit(1)
}
