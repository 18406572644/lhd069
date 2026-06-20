import type Database from 'better-sqlite3'
import type { Seeder } from '../migrations/types'
import { COMMUNITY_BADGE_DEFINITIONS } from '../constants'
import bcryptjs from 'bcryptjs'

const seeder: Seeder = {
  name: 'initial_seed',

  run(db: Database.Database): void {
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

    const insertBadge = db.prepare(
      'INSERT INTO community_badges (name, description, icon, requirement_type, requirement_value) VALUES (?, ?, ?, ?, ?)'
    )
    for (const badge of COMMUNITY_BADGE_DEFINITIONS) {
      insertBadge.run(badge.name, badge.description, badge.icon, badge.requirement_type, badge.requirement_value)
    }

    const insertPost = db.prepare(
      'INSERT INTO posts (user_id, title, content, category, is_essence, like_count, comment_count, view_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertPostImage = db.prepare(
      'INSERT INTO post_images (post_id, url, sort_order) VALUES (?, ?, ?)'
    )
    const insertPostTag = db.prepare(
      'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)'
    )
    const insertPostComment = db.prepare(
      'INSERT INTO post_comments (post_id, user_id, content, like_count) VALUES (?, ?, ?, ?)'
    )
    const insertPostLike = db.prepare(
      'INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)'
    )

    const p1 = insertPost.run(
      u1.lastInsertRowid,
      '法式刺绣入门教程：从基础针法到精美作品',
      '大家好，我是小王，今天给大家分享一个法式刺绣的入门教程。\n\n首先，我们需要准备的材料有：\n1. 刺绣绷架\n2. 刺绣布（推荐亚麻布）\n3. 刺绣针\n4. DMC刺绣线\n5. 剪刀\n\n基础针法包括：\n- 平针绣\n- 回针绣\n- 缎面绣\n- 法式结粒绣\n\n后续我会逐步详细讲解每种针法的技巧，敬请关注！',
      'tutorial',
      1,
      128,
      32,
      520
    )
    insertPostImage.run(p1.lastInsertRowid, '/uploads/sample-embroidery.jpg', 0)
    insertPostTag.run(p1.lastInsertRowid, tagIds['刺绣'])
    insertPostTag.run(p1.lastInsertRowid, tagIds['新手'])

    const p2 = insertPost.run(
      u2.lastInsertRowid,
      '【材料测评】市面上常见刺绣线品牌对比',
      '作为一个材料供应商，我接触过很多品牌的刺绣线，今天给大家做一个客观的测评。\n\n1. DMC（法国）\n优点：颜色丰富，色牢度高，不易起毛\n缺点：价格偏高\n\n2. 国产某品牌\n优点：价格实惠，容易购买\n缺点：部分颜色有色差\n\n3. 德国Anchor\n优点：线质顺滑，光泽感好\n缺点：国内不易购买\n\n总结：新手入门推荐DMC基础色号，性价比高。',
      'review',
      1,
      95,
      45,
      380
    )

    const p3 = insertPost.run(
      u1.lastInsertRowid,
      '手工打卡Day15：今日完成小鹿胸针',
      '坚持手工打卡第15天！\n\n今天完成了一个小鹿胸针，使用了法式刺绣的立体绣法，搭配进口金属丝线，成品非常精致。\n\n耗时约3小时，虽然有点累但是很有成就感！\n\n明天准备做一个小狐狸系列，敬请期待~',
      'diary',
      0,
      67,
      23,
      210
    )
    insertPostImage.run(p3.lastInsertRowid, '/uploads/sample-embroidery.jpg', 0)

    const p4 = insertPost.run(
      u3.lastInsertRowid,
      '求助：新手学刺绣应该从哪里开始？',
      '各位手工大神好！我是刚接触手工的新手小张，最近迷上了刺绣，但是不知道从哪里开始。\n\n想请教大家：\n1. 新手应该买什么样的工具套装？\n2. 有没有推荐的入门教程？\n3. 刚开始练习应该绣什么图案比较合适？\n\n希望大家能给我一些建议，谢谢！',
      'qa',
      0,
      45,
      56,
      180
    )

    const p5 = insertPost.run(
      u2.lastInsertRowid,
      '干花相框制作全流程分享',
      '最近做了几个干花相框，收到了很多朋友的喜欢，今天把制作过程分享给大家。\n\n材料准备：\n- 干花材（玫瑰、雏菊、满天星等）\n- 相框\n- 热熔胶\n- 镊子\n\n制作步骤：\n1. 先设计好花材的摆放位置\n2. 用镊子小心夹起花材，背面涂上热熔胶\n3. 按照设计好的位置粘贴\n4. 全部贴好后合上相框\n\n注意事项：\n- 胶不要涂太多，否则会溢出来影响美观\n- 可以先摆好位置拍张照，再逐个粘贴\n\n希望对大家有帮助！',
      'tutorial',
      1,
      156,
      41,
      680
    )
    insertPostImage.run(p5.lastInsertRowid, '/uploads/sample-frame.jpg', 0)
    insertPostTag.run(p5.lastInsertRowid, tagIds['干花'])
    insertPostTag.run(p5.lastInsertRowid, tagIds['DIY'])

    insertPostComment.run(p4.lastInsertRowid, u1.lastInsertRowid, '新手入门推荐先买基础套装，不要买太好的线，先练手。我刚入门的时候用的是DMC的36色套装，足够用了。', 12)
    insertPostComment.run(p4.lastInsertRowid, u2.lastInsertRowid, '教程的话推荐B站搜"法式刺绣入门"，有很多免费的优质教程。图案从简单的花朵、叶子开始练习比较好。', 18)
    insertPostComment.run(p1.lastInsertRowid, u3.lastInsertRowid, '太实用了！正好想学刺绣，收藏了~', 8)
    insertPostComment.run(p1.lastInsertRowid, u2.lastInsertRowid, '小王老师讲得很清楚，期待后续的针法详解！', 5)

    insertPostLike.run(p1.lastInsertRowid, u2.lastInsertRowid)
    insertPostLike.run(p1.lastInsertRowid, u3.lastInsertRowid)
    insertPostLike.run(p5.lastInsertRowid, u1.lastInsertRowid)
    insertPostLike.run(p5.lastInsertRowid, u3.lastInsertRowid)
    insertPostLike.run(p4.lastInsertRowid, u1.lastInsertRowid)

    const insertUserBadge = db.prepare(
      'INSERT OR IGNORE INTO user_community_badges (user_id, badge_id) VALUES (?, ?)'
    )
    insertUserBadge.run(u1.lastInsertRowid, 1)
    insertUserBadge.run(u1.lastInsertRowid, 2)
  },
}

export default seeder
