import type Database from 'better-sqlite3'
import type { Migration } from '../types'

const migration: Migration = {
  version: '00000000000000',
  name: 'initial_schema',

  up(db: Database.Database): void {
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

      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT DEFAULT 'published',
        is_essence BOOLEAN DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        favorite_count INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS post_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS post_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(post_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS post_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(post_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS post_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        like_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'published',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS post_comment_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment_id INTEGER NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(comment_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS post_shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        share_type TEXT DEFAULT 'link',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS post_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(post_id, tag_id)
      );

      CREATE TABLE IF NOT EXISTS post_related_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(post_id, material_id)
      );

      CREATE TABLE IF NOT EXISTS post_related_works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(post_id, work_id)
      );

      CREATE TABLE IF NOT EXISTS post_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS community_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        requirement_type TEXT NOT NULL,
        requirement_value INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_community_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER NOT NULL REFERENCES community_badges(id) ON DELETE CASCADE,
        awarded_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, badge_id)
      );
    `)

    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
      CREATE INDEX IF NOT EXISTS idx_tags_use_count ON tags(use_count DESC);
      CREATE INDEX IF NOT EXISTS idx_material_tags_material ON material_tags(material_id);
      CREATE INDEX IF NOT EXISTS idx_material_tags_tag ON material_tags(tag_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_browse_history_unique ON browse_history(user_id, target_type, target_id);
      CREATE INDEX IF NOT EXISTS idx_browse_history_user_time ON browse_history(user_id, viewed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_browse_history_type ON browse_history(user_id, target_type, viewed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_points_accounts_user ON points_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_points_records_user ON points_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_points_records_type ON points_records(user_id, type);
      CREATE INDEX IF NOT EXISTS idx_points_records_created ON points_records(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_check_in_user_date ON check_in_records(user_id, check_in_date DESC);
      CREATE INDEX IF NOT EXISTS idx_check_in_consecutive ON check_in_records(user_id, consecutive_days DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      CREATE INDEX IF NOT EXISTS idx_posts_essence ON posts(is_essence DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_hot ON posts(like_count DESC, comment_count DESC, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_post_images_post ON post_images(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_favorites_post ON post_favorites(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_favorites_user ON post_favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_tags_post ON post_tags(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);
      CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status);
      CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_community_badges(user_id);
    `)
  },

  down(db: Database.Database): void {
    db.pragma('foreign_keys = OFF')
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'"
      )
      .all() as { name: string }[]
    for (const { name } of tables) {
      db.prepare(`DROP TABLE IF EXISTS "${name}"`).run()
    }
    db.pragma('foreign_keys = ON')
  },
}

export default migration
