import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcryptjs from 'bcryptjs'

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

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    credit_score INTEGER DEFAULT 100,
    is_shop_owner BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS materials (
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
  );

  CREATE TABLE IF NOT EXISTS material_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS material_specs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wanted_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    budget_min REAL DEFAULT 0,
    budget_max REAL DEFAULT 0,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL REFERENCES users(id),
    responder_id INTEGER NOT NULL REFERENCES users(id),
    material_id INTEGER NOT NULL REFERENCES materials(id),
    offer_material_id INTEGER REFERENCES materials(id),
    type TEXT NOT NULL DEFAULT 'swap',
    status TEXT DEFAULT 'pending',
    message TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER NOT NULL REFERENCES trades(id),
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    reviewee_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS work_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT 0,
    related_id TEXT DEFAULT '',
    extra_data TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_materials_user ON materials(user_id);
  CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
  CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
  CREATE INDEX IF NOT EXISTS idx_wanted_user ON wanted_items(user_id);
  CREATE INDEX IF NOT EXISTS idx_wanted_status ON wanted_items(status);
  CREATE INDEX IF NOT EXISTS idx_trades_requester ON trades(requester_id);
  CREATE INDEX IF NOT EXISTS idx_trades_responder ON trades(responder_id);
  CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
  CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
  CREATE INDEX IF NOT EXISTS idx_works_user ON works(user_id);
  CREATE INDEX IF NOT EXISTS idx_comments_work ON comments(work_id);
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    use_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS material_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(material_id, tag_id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
  CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
  CREATE INDEX IF NOT EXISTS idx_tags_use_count ON tags(use_count DESC);
  CREATE INDEX IF NOT EXISTS idx_material_tags_material ON material_tags(material_id);
  CREATE INDEX IF NOT EXISTS idx_material_tags_tag ON material_tags(tag_id);

  CREATE TABLE IF NOT EXISTS browse_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    cover_image TEXT DEFAULT '',
    extra_data TEXT DEFAULT '',
    viewed_at TEXT DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_browse_history_unique ON browse_history(user_id, target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_browse_history_user_time ON browse_history(user_id, viewed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_browse_history_type ON browse_history(user_id, target_type, viewed_at DESC);

  CREATE TABLE IF NOT EXISTS points_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT '手工萌新',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS points_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT DEFAULT '',
    related_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS check_in_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_date TEXT NOT NULL,
    consecutive_days INTEGER NOT NULL DEFAULT 1,
    points_earned INTEGER NOT NULL,
    bonus_type TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, check_in_date)
  );

  CREATE INDEX IF NOT EXISTS idx_points_accounts_user ON points_accounts(user_id);
  CREATE INDEX IF NOT EXISTS idx_points_records_user ON points_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_points_records_type ON points_records(user_id, type);
  CREATE INDEX IF NOT EXISTS idx_points_records_created ON points_records(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_check_in_user_date ON check_in_records(user_id, check_in_date DESC);
  CREATE INDEX IF NOT EXISTS idx_check_in_consecutive ON check_in_records(user_id, consecutive_days DESC);
`)

function migrate() {
  const columns = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[]
  const columnNames = columns.map(c => c.name)
  
  if (!columnNames.includes('extra_data')) {
    db.prepare("ALTER TABLE messages ADD COLUMN extra_data TEXT DEFAULT ''").run()
  }
}

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const hash = bcryptjs.hashSync('123456', 10)

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, avatar, bio, credit_score, is_shop_owner) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  const u1 = insertUser.run('手工达人小王', 'wang@test.com', hash, '', '热爱手工制作，擅长编织和刺绣', 120, 1)
  const u2 = insertUser.run('创意工坊李姐', 'li@test.com', hash, '', '专业手工材料供应商，品质保证', 110, 1)
  const u3 = insertUser.run('手作新手小张', 'zhang@test.com', hash, '', '刚开始接触手工，希望多多学习', 95, 0)

  const insertMaterial = db.prepare(
    'INSERT INTO materials (user_id, title, category, description, price, is_swappable, is_active, view_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const m1 = insertMaterial.run(u1.lastInsertRowid, '进口亚麻布料 散尾款', '布料', '高品质进口亚麻布料，手感柔软，适合制作抱枕、桌布等家居用品。散尾款纹理自然，颜色为自然米色。尺寸150cm宽，按米出售。', 45.0, 1, 1, 32)
  const m2 = insertMaterial.run(u1.lastInsertRowid, '手工刺绣线套装 36色', '线材', '法国DMC刺绣线36色套装，含常用色号，每束8米。颜色鲜艳不易褪色，适合十字绣、法式刺绣等。', 68.0, 1, 1, 56)
  const m3 = insertMaterial.run(u2.lastInsertRowid, '天然干花材料包', '花艺', '精选天然干燥花材，包含玫瑰、雏菊、满天星等8种花材，适合花艺手作、相框装饰等。', 35.0, 1, 1, 28)
  const m4 = insertMaterial.run(u2.lastInsertRowid, '手工皮具工具套装', '皮具', '含菱钳、针、线、边油等基础皮具制作工具，适合入门玩家。品质优良，性价比高。', 128.0, 0, 1, 41)
  const m5 = insertMaterial.run(u1.lastInsertRowid, '复古纽扣收集盒', '配件', '收集了50+枚复古风格纽扣，包含木质、金属、树脂等材质，适合服装改造和手工装饰。', 25.0, 1, 1, 19)
  const m6 = insertMaterial.run(u3.lastInsertRowid, '毛线团混色套装', '线材', '闲置毛线团10个，混色搭配，适合编织小物件。全新未拆封。', 40.0, 1, 1, 15)
  const m7 = insertMaterial.run(u2.lastInsertRowid, '手工蜡烛制作套装', '蜡烛', '含大豆蜡、烛芯、精油和模具，可制作8-10支香薰蜡烛。附赠教程。', 58.0, 1, 1, 37)
  const m8 = insertMaterial.run(u3.lastInsertRowid, '闲置水彩颜料24色', '颜料', '买多了闲置的水彩颜料，品牌为温莎牛顿，24色固体水彩，使用过3-4次，9成新。', 55.0, 1, 1, 22)

  const insertMaterialImage = db.prepare(
    'INSERT INTO material_images (material_id, url, sort_order) VALUES (?, ?, ?)'
  )
  insertMaterialImage.run(m1.lastInsertRowid, '/uploads/sample-linen.jpg', 0)
  insertMaterialImage.run(m2.lastInsertRowid, '/uploads/sample-thread.jpg', 0)
  insertMaterialImage.run(m3.lastInsertRowid, '/uploads/sample-flowers.jpg', 0)
  insertMaterialImage.run(m4.lastInsertRowid, '/uploads/sample-leather.jpg', 0)
  insertMaterialImage.run(m5.lastInsertRowid, '/uploads/sample-buttons.jpg', 0)
  insertMaterialImage.run(m6.lastInsertRowid, '/uploads/sample-yarn.jpg', 0)
  insertMaterialImage.run(m7.lastInsertRowid, '/uploads/sample-candle.jpg', 0)
  insertMaterialImage.run(m8.lastInsertRowid, '/uploads/sample-watercolor.jpg', 0)

  const insertMaterialSpec = db.prepare(
    'INSERT INTO material_specs (material_id, key, value) VALUES (?, ?, ?)'
  )
  insertMaterialSpec.run(m1.lastInsertRowid, '材质', '进口亚麻')
  insertMaterialSpec.run(m1.lastInsertRowid, '宽度', '150cm')
  insertMaterialSpec.run(m2.lastInsertRowid, '品牌', 'DMC')
  insertMaterialSpec.run(m2.lastInsertRowid, '颜色数', '36色')
  insertMaterialSpec.run(m4.lastInsertRowid, '适用', '皮具入门')
  insertMaterialSpec.run(m7.lastInsertRowid, '蜡材', '大豆蜡')

  const insertWanted = db.prepare(
    'INSERT INTO wanted_items (user_id, title, category, description, budget_min, budget_max, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  insertWanted.run(u3.lastInsertRowid, '求购缝纫机', '工具', '想买一台家用缝纫机，新手入门级别即可，最好带教程。', 200, 500, 'open')
  insertWanted.run(u1.lastInsertRowid, '求购和田玉珠', '配件', '需要一批和田玉珠子做手串，8mm-10mm，白色或青白色。', 50, 150, 'open')
  insertWanted.run(u3.lastInsertRowid, '求购不织布', '布料', '需要各色不织布材料包，用于制作玩偶和挂件。', 20, 60, 'open')

  const insertTrade = db.prepare(
    'INSERT INTO trades (requester_id, responder_id, material_id, offer_material_id, type, status, message) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const t1 = insertTrade.run(u3.lastInsertRowid, u1.lastInsertRowid, m2.lastInsertRowid, m6.lastInsertRowid, 'swap', 'pending', '想用我的毛线团换你的刺绣线套装，可以吗？')
  const t2 = insertTrade.run(u3.lastInsertRowid, u2.lastInsertRowid, m3.lastInsertRowid, null, 'buy', 'accepted', '想购买你的干花材料包，请问还在吗？')

  const insertMessage = db.prepare(
    'INSERT INTO messages (user_id, type, title, content, is_read, related_id) VALUES (?, ?, ?, ?, ?, ?)'
  )
  insertMessage.run(u3.lastInsertRowid, 'trade', '收到新的交换请求', '手工达人小王想用毛线团换你的刺绣线套装', 0, String(t1.lastInsertRowid))
  insertMessage.run(u3.lastInsertRowid, 'trade', '交易请求已被接受', '你购买干花材料包的请求已被接受', 0, String(t2.lastInsertRowid))
  insertMessage.run(u1.lastInsertRowid, 'system', '欢迎加入手工材料互换平台', '在这里你可以发布闲置材料、寻找需要的材料、与其他手工爱好者交流。', 0, '')
  insertMessage.run(u2.lastInsertRowid, 'system', '欢迎加入手工材料互换平台', '在这里你可以发布闲置材料、寻找需要的材料、与其他手工爱好者交流。', 0, '')

  const insertWork = db.prepare(
    'INSERT INTO works (user_id, title, description, tags) VALUES (?, ?, ?, ?)'
  )
  const w1 = insertWork.run(u1.lastInsertRowid, '法式刺绣小鹿胸针', '用时两天完成的小鹿胸针，使用了法式刺绣的立体绣法，搭配进口金属丝线。', '刺绣,胸针,法式刺绣')
  const w2 = insertWork.run(u2.lastInsertRowid, '干花相框制作过程', '分享干花相框的制作过程，从选花到最终装框，全程记录。', '干花,相框,花艺')

  const insertWorkImage = db.prepare(
    'INSERT INTO work_images (work_id, url, sort_order) VALUES (?, ?, ?)'
  )
  insertWorkImage.run(w1.lastInsertRowid, '/uploads/sample-embroidery.jpg', 0)
  insertWorkImage.run(w2.lastInsertRowid, '/uploads/sample-frame.jpg', 0)

  const insertComment = db.prepare(
    'INSERT INTO comments (work_id, user_id, content) VALUES (?, ?, ?)'
  )
  insertComment.run(w1.lastInsertRowid, u2.lastInsertRowid, '太漂亮了！请问用的是什么绣线？')
  insertComment.run(w1.lastInsertRowid, u3.lastInsertRowid, '好厉害，想学！')

  const insertShop = db.prepare(
    'INSERT INTO shops (user_id, name, description, cover_image) VALUES (?, ?, ?, ?)'
  )
  insertShop.run(u1.lastInsertRowid, '小王的手工坊', '专注高品质手工材料，主营进口布料和刺绣用品', '/uploads/sample-shop.jpg')

  const insertTag = db.prepare(
    'INSERT OR IGNORE INTO tags (name, use_count) VALUES (?, ?)'
  )
  const insertMaterialTag = db.prepare(
    'INSERT OR IGNORE INTO material_tags (material_id, tag_id) VALUES (?, ?)'
  )
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?')

  const seedTags: { name: string; useCount: number }[] = [
    { name: '进口', useCount: 3 },
    { name: '刺绣', useCount: 4 },
    { name: '布艺', useCount: 3 },
    { name: '天然', useCount: 2 },
    { name: '新手', useCount: 2 },
    { name: '高品质', useCount: 3 },
    { name: '套装', useCount: 4 },
    { name: '散尾款', useCount: 1 },
    { name: '复古', useCount: 2 },
    { name: '闲置', useCount: 5 },
    { name: 'DIY', useCount: 4 },
    { name: '手工', useCount: 6 },
  ]

  const tagIds: Record<string, number> = {}
  for (const t of seedTags) {
    insertTag.run(t.name, t.useCount)
    const row = getTagId.get(t.name) as { id: number }
    tagIds[t.name] = row.id
  }

  const materialTagMap: Record<number, string[]> = {
    [Number(m1.lastInsertRowid)]: ['进口', '布艺', '散尾款', '高品质', '手工'],
    [Number(m2.lastInsertRowid)]: ['进口', '刺绣', '套装', '高品质'],
    [Number(m3.lastInsertRowid)]: ['天然', 'DIY', '手工'],
    [Number(m4.lastInsertRowid)]: ['新手', '套装', '手工'],
    [Number(m5.lastInsertRowid)]: ['复古', 'DIY', '手工'],
    [Number(m6.lastInsertRowid)]: ['闲置', '新手', 'DIY'],
    [Number(m7.lastInsertRowid)]: ['套装', 'DIY', '手工'],
    [Number(m8.lastInsertRowid)]: ['闲置', '高品质', '手工'],
  }

  for (const [materialId, tagNames] of Object.entries(materialTagMap)) {
    for (const tagName of tagNames) {
      insertMaterialTag.run(Number(materialId), tagIds[tagName])
    }
  }

  const insertPointsAccount = db.prepare(
    'INSERT INTO points_accounts (user_id, balance, total_earned, total_spent, level) VALUES (?, ?, ?, ?, ?)'
  )
  insertPointsAccount.run(u1.lastInsertRowid, 580, 580, 0, '手工达人')
  insertPointsAccount.run(u2.lastInsertRowid, 320, 320, 0, '手工萌新')
  insertPointsAccount.run(u3.lastInsertRowid, 80, 80, 0, '手工萌新')
}

migrate()
seed()

const POINTS_LEVELS = [
  { name: '手工萌新', minPoints: 0, icon: '🌱' },
  { name: '手工爱好者', minPoints: 200, icon: '🌿' },
  { name: '手工达人', minPoints: 500, icon: '🎨' },
  { name: '手工大师', minPoints: 1500, icon: '👑' },
  { name: '手工传奇', minPoints: 5000, icon: '💎' },
]

const POINTS_RULES: Record<string, number> = {
  check_in: 10,
  publish_material: 20,
  publish_wanted: 10,
  publish_work: 30,
  trade_complete: 50,
  review: 15,
  invite_friend: 100,
  check_in_7day_bonus: 50,
  check_in_30day_bonus: 200,
}

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
export { POINTS_LEVELS, POINTS_RULES, getLevelByPoints, ensurePointsAccount, addPoints }
