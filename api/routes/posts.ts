import { Router, type Response } from 'express'
import db, {
  addPoints,
  POST_CATEGORIES,
  REPORT_REASONS,
  COMMUNITY_BADGE_DEFINITIONS,
} from '../database.js'
import {
  authMiddleware,
  optionalAuth,
  type AuthRequest,
} from '../middleware/auth.js'

const router = Router()

function getHotScore(post: any): number {
  const now = Date.now()
  const createdAt = new Date(post.created_at).getTime()
  const hoursDiff = (now - createdAt) / (1000 * 60 * 60)
  const gravity = 1.8
  return (
    (post.like_count * 4 + post.comment_count * 3 + post.favorite_count * 2 + post.share_count) /
    Math.pow(hoursDiff + 2, gravity)
  )
}

router.get('/categories', (_req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    data: POST_CATEGORIES,
  })
})

router.get('/badges', (_req: AuthRequest, res: Response): void => {
  const badges = db
    .prepare('SELECT * FROM community_badges ORDER BY id')
    .all()
  res.json({
    success: true,
    data: badges,
  })
})

router.get('/report-reasons', (_req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    data: REPORT_REASONS,
  })
})

router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const category = req.query.category as string
    const keyword = req.query.keyword as string
    const sort = (req.query.sort as string) || 'latest'
    const userId = parseInt(req.query.userId as string) || 0
    const offset = (page - 1) * pageSize

    let whereClause = 'WHERE p.status = ?'
    const params: any[] = ['published']

    if (category) {
      whereClause += ' AND p.category = ?'
      params.push(category)
    }

    if (keyword) {
      whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    if (userId > 0) {
      whereClause += ' AND p.user_id = ?'
      params.push(userId)
    }

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM posts p ${whereClause}`)
      .get(...params) as { total: number }

    let orderBy = 'ORDER BY p.created_at DESC'
    if (sort === 'hot') {
      orderBy = 'ORDER BY p.like_count DESC, p.comment_count DESC, p.created_at DESC'
    } else if (sort === 'essence') {
      whereClause += ' AND p.is_essence = 1'
      orderBy = 'ORDER BY p.created_at DESC'
    } else if (sort === 'most_viewed') {
      orderBy = 'ORDER BY p.view_count DESC'
    }

    const posts = db
      .prepare(
        `SELECT p.*, u.username, u.avatar, u.credit_score 
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         ${whereClause} 
         ${orderBy} 
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as any[]

    const postIds = posts.map((p) => p.id)
    let imagesMap: Record<number, any[]> = {}
    let tagsMap: Record<number, any[]> = {}
    let userLikeMap: Record<number, boolean> = {}
    let userFavoriteMap: Record<number, boolean> = {}

    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',')
      const images = db
        .prepare(`SELECT * FROM post_images WHERE post_id IN (${placeholders}) ORDER BY sort_order`)
        .all(...postIds) as any[]
      images.forEach((img) => {
        if (!imagesMap[img.post_id]) imagesMap[img.post_id] = []
        imagesMap[img.post_id].push(img)
      })

      const tags = db
        .prepare(
          `SELECT pt.post_id, t.id, t.name FROM post_tags pt 
           JOIN tags t ON pt.tag_id = t.id 
           WHERE pt.post_id IN (${placeholders})`
        )
        .all(...postIds) as any[]
      tags.forEach((tag) => {
        if (!tagsMap[tag.post_id]) tagsMap[tag.post_id] = []
        tagsMap[tag.post_id].push(tag)
      })

      if (req.user) {
        const likes = db
          .prepare(
            `SELECT post_id FROM post_likes WHERE post_id IN (${placeholders}) AND user_id = ?`
          )
          .all(...postIds, req.user.id) as any[]
        likes.forEach((like) => {
          userLikeMap[like.post_id] = true
        })

        const favorites = db
          .prepare(
            `SELECT post_id FROM post_favorites WHERE post_id IN (${placeholders}) AND user_id = ?`
          )
          .all(...postIds, req.user.id) as any[]
        favorites.forEach((fav) => {
          userFavoriteMap[fav.post_id] = true
        })
      }
    }

    const items = posts.map((p) => ({
      ...p,
      images: imagesMap[p.id] || [],
      tags: tagsMap[p.id] || [],
      is_liked: userLikeMap[p.id] || false,
      is_favorited: userFavoriteMap[p.id] || false,
    }))

    res.json({
      success: true,
      data: {
        items,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize),
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取帖子列表失败' })
  }
})

router.get('/hot', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10))

    const posts = db
      .prepare(
        `SELECT p.*, u.username, u.avatar 
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.status = ? 
         ORDER BY p.created_at DESC 
         LIMIT ?`
      )
      .all('published', 100) as any[]

    const postsWithScore = posts
      .map((p) => ({ ...p, hot_score: getHotScore(p) }))
      .sort((a, b) => b.hot_score - a.hot_score)
      .slice(0, limit)

    const postIds = postsWithScore.map((p) => p.id)
    let imagesMap: Record<number, any[]> = {}

    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',')
      const images = db
        .prepare(`SELECT * FROM post_images WHERE post_id IN (${placeholders}) ORDER BY sort_order`)
        .all(...postIds) as any[]
      images.forEach((img) => {
        if (!imagesMap[img.post_id]) imagesMap[img.post_id] = []
        imagesMap[img.post_id].push(img)
      })
    }

    const items = postsWithScore.map((p) => ({
      ...p,
      images: imagesMap[p.id] || [],
    }))

    res.json({
      success: true,
      data: items,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取热门帖子失败' })
  }
})

router.get('/essence', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10))

    const posts = db
      .prepare(
        `SELECT p.*, u.username, u.avatar 
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.status = ? AND p.is_essence = 1 
         ORDER BY p.created_at DESC 
         LIMIT ?`
      )
      .all('published', limit) as any[]

    const postIds = posts.map((p) => p.id)
    let imagesMap: Record<number, any[]> = {}

    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',')
      const images = db
        .prepare(`SELECT * FROM post_images WHERE post_id IN (${placeholders}) ORDER BY sort_order`)
        .all(...postIds) as any[]
      images.forEach((img) => {
        if (!imagesMap[img.post_id]) imagesMap[img.post_id] = []
        imagesMap[img.post_id].push(img)
      })
    }

    const items = posts.map((p) => ({
      ...p,
      images: imagesMap[p.id] || [],
    }))

    res.json({
      success: true,
      data: items,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取精华帖子失败' })
  }
})

router.get('/experts', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10))

    const experts = db
      .prepare(
        `SELECT u.id, u.username, u.avatar, u.bio, u.credit_score,
                COUNT(p.id) as post_count,
                SUM(p.like_count) as total_likes,
                SUM(p.is_essence) as essence_count,
                GROUP_CONCAT(DISTINCT b.name) as badges
         FROM users u
         LEFT JOIN posts p ON u.id = p.user_id AND p.status = 'published'
         LEFT JOIN user_community_badges ub ON u.id = ub.user_id
         LEFT JOIN community_badges b ON ub.badge_id = b.id
         GROUP BY u.id
         HAVING post_count > 0
         ORDER BY post_count DESC, total_likes DESC
         LIMIT ?`
      )
      .all(limit) as any[]

    const items = experts.map((e) => ({
      ...e,
      badges: e.badges ? e.badges.split(',') : [],
    }))

    res.json({
      success: true,
      data: items,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取社区达人失败' })
  }
})

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const post = db
      .prepare(
        `SELECT p.*, u.username, u.avatar, u.credit_score, u.bio as user_bio
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.id = ?`
      )
      .get(id) as any

    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(id)
    post.view_count += 1

    const images = db
      .prepare('SELECT * FROM post_images WHERE post_id = ? ORDER BY sort_order')
      .all(id)

    const tags = db
      .prepare(
        `SELECT t.id, t.name FROM post_tags pt 
         JOIN tags t ON pt.tag_id = t.id 
         WHERE pt.post_id = ?`
      )
      .all(id)

    const relatedMaterials = db
      .prepare(
        `SELECT m.id, m.title, m.price, mi.url as cover_image 
         FROM post_related_materials prm 
         JOIN materials m ON prm.material_id = m.id 
         LEFT JOIN material_images mi ON m.id = mi.material_id AND mi.sort_order = 0
         WHERE prm.post_id = ?`
      )
      .all(id)

    const relatedWorks = db
      .prepare(
        `SELECT w.id, w.title, wi.url as cover_image 
         FROM post_related_works prw 
         JOIN works w ON prw.work_id = w.id 
         LEFT JOIN work_images wi ON w.id = wi.work_id AND wi.sort_order = 0
         WHERE prw.post_id = ?`
      )
      .all(id)

    let isLiked = false
    let isFavorited = false

    if (req.user) {
      const like = db
        .prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?')
        .get(id, req.user.id)
      isLiked = !!like

      const favorite = db
        .prepare('SELECT id FROM post_favorites WHERE post_id = ? AND user_id = ?')
        .get(id, req.user.id)
      isFavorited = !!favorite
    }

    const userBadges = db
      .prepare(
        `SELECT b.* FROM user_community_badges ub 
         JOIN community_badges b ON ub.badge_id = b.id 
         WHERE ub.user_id = ?`
      )
      .all(post.user_id)

    res.json({
      success: true,
      data: {
        ...post,
        images,
        tags,
        related_materials: relatedMaterials,
        related_works: relatedWorks,
        is_liked: isLiked,
        is_favorited: isFavorited,
        user_badges: userBadges,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取帖子详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, images, tags, relatedMaterialIds, relatedWorkIds } = req.body

    if (!title || !content || !category) {
      res.status(400).json({ success: false, error: '标题、内容和分类不能为空' })
      return
    }

    const validCategory = POST_CATEGORIES.find((c) => c.value === category)
    if (!validCategory) {
      res.status(400).json({ success: false, error: '无效的分类' })
      return
    }

    const tx = db.transaction(() => {
      const result = db
        .prepare(
          'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)'
        )
        .run(req.user!.id, title, content, category)

      const postId = Number(result.lastInsertRowid)

      if (Array.isArray(images) && images.length > 0) {
        const insertImage = db.prepare(
          'INSERT INTO post_images (post_id, url, sort_order) VALUES (?, ?, ?)'
        )
        images.forEach((img: { url: string }, i: number) => {
          insertImage.run(postId, img.url, i)
        })
      }

      if (Array.isArray(tags) && tags.length > 0) {
        const insertTag = db.prepare(
          'INSERT OR IGNORE INTO tags (name, use_count) VALUES (?, 1)'
        )
        const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?')
        const insertPostTag = db.prepare(
          'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)'
        )
        const updateTagCount = db.prepare(
          'UPDATE tags SET use_count = use_count + 1 WHERE id = ?'
        )

        tags.forEach((tagName: string) => {
          insertTag.run(tagName)
          const tagRow = getTagId.get(tagName) as { id: number }
          insertPostTag.run(postId, tagRow.id)
          updateTagCount.run(tagRow.id)
        })
      }

      if (Array.isArray(relatedMaterialIds) && relatedMaterialIds.length > 0) {
        const insertRelatedMaterial = db.prepare(
          'INSERT OR IGNORE INTO post_related_materials (post_id, material_id) VALUES (?, ?)'
        )
        relatedMaterialIds.forEach((materialId: number) => {
          insertRelatedMaterial.run(postId, materialId)
        })
      }

      if (Array.isArray(relatedWorkIds) && relatedWorkIds.length > 0) {
        const insertRelatedWork = db.prepare(
          'INSERT OR IGNORE INTO post_related_works (post_id, work_id) VALUES (?, ?)'
        )
        relatedWorkIds.forEach((workId: number) => {
          insertRelatedWork.run(postId, workId)
        })
      }

      addPoints(req.user!.id, 25, 'publish_post', `发布帖子「${title}」+25积分`, String(postId))

      return postId
    })

    const postId = tx()
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId)

    res.status(201).json({ success: true, data: post })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '创建帖子失败' })
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { title, content, category, images, tags, relatedMaterialIds, relatedWorkIds } = req.body

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    if (post.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权修改此帖子' })
      return
    }

    const tx = db.transaction(() => {
      if (title || content || category) {
        const updates: string[] = []
        const params: any[] = []

        if (title) {
          updates.push('title = ?')
          params.push(title)
        }
        if (content) {
          updates.push('content = ?')
          params.push(content)
        }
        if (category) {
          const validCategory = POST_CATEGORIES.find((c) => c.value === category)
          if (!validCategory) {
            throw new Error('无效的分类')
          }
          updates.push('category = ?')
          params.push(category)
        }
        updates.push('updated_at = datetime(\'now\')')
        params.push(id)

        db.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).run(...params)
      }

      if (images !== undefined) {
        db.prepare('DELETE FROM post_images WHERE post_id = ?').run(id)
        if (Array.isArray(images) && images.length > 0) {
          const insertImage = db.prepare(
            'INSERT INTO post_images (post_id, url, sort_order) VALUES (?, ?, ?)'
          )
          images.forEach((img: { url: string }, i: number) => {
            insertImage.run(id, img.url, i)
          })
        }
      }

      if (tags !== undefined) {
        const oldTags = db
          .prepare('SELECT tag_id FROM post_tags WHERE post_id = ?')
          .all(id) as { tag_id: number }[]
        const decrementTagCount = db.prepare(
          'UPDATE tags SET use_count = use_count - 1 WHERE id = ?'
        )
        oldTags.forEach((t) => decrementTagCount.run(t.tag_id))

        db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(id)

        if (Array.isArray(tags) && tags.length > 0) {
          const insertTag = db.prepare(
            'INSERT OR IGNORE INTO tags (name, use_count) VALUES (?, 0)'
          )
          const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?')
          const insertPostTag = db.prepare(
            'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)'
          )
          const incrementTagCount = db.prepare(
            'UPDATE tags SET use_count = use_count + 1 WHERE id = ?'
          )

          tags.forEach((tagName: string) => {
            insertTag.run(tagName)
            const tagRow = getTagId.get(tagName) as { id: number }
            insertPostTag.run(id, tagRow.id)
            incrementTagCount.run(tagRow.id)
          })
        }
      }

      if (relatedMaterialIds !== undefined) {
        db.prepare('DELETE FROM post_related_materials WHERE post_id = ?').run(id)
        if (Array.isArray(relatedMaterialIds) && relatedMaterialIds.length > 0) {
          const insertRelatedMaterial = db.prepare(
            'INSERT OR IGNORE INTO post_related_materials (post_id, material_id) VALUES (?, ?)'
          )
          relatedMaterialIds.forEach((materialId: number) => {
            insertRelatedMaterial.run(id, materialId)
          })
        }
      }

      if (relatedWorkIds !== undefined) {
        db.prepare('DELETE FROM post_related_works WHERE post_id = ?').run(id)
        if (Array.isArray(relatedWorkIds) && relatedWorkIds.length > 0) {
          const insertRelatedWork = db.prepare(
            'INSERT OR IGNORE INTO post_related_works (post_id, work_id) VALUES (?, ?)'
          )
          relatedWorkIds.forEach((workId: number) => {
            insertRelatedWork.run(id, workId)
          })
        }
      }
    })

    tx()

    const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
    res.json({ success: true, data: updatedPost })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ success: false, error: error.message || '更新帖子失败' })
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any

    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    if (post.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权删除此帖子' })
      return
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(id)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '删除帖子失败' })
  }
})

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user!.id

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    const existingLike = db
      .prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?')
      .get(id, userId)

    if (existingLike) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(id, userId)
      db.prepare('UPDATE posts SET like_count = like_count - 1 WHERE id = ?').run(id)
      res.json({ success: true, data: { liked: false, like_count: post.like_count - 1 } })
    } else {
      db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(id, userId)
      db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(id)
      addPoints(post.user_id, 1, 'post_like', '帖子被点赞+1积分', String(id))
      res.json({ success: true, data: { liked: true, like_count: post.like_count + 1 } })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '操作失败' })
  }
})

router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user!.id

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    const existingFav = db
      .prepare('SELECT id FROM post_favorites WHERE post_id = ? AND user_id = ?')
      .get(id, userId)

    if (existingFav) {
      db.prepare('DELETE FROM post_favorites WHERE post_id = ? AND user_id = ?').run(id, userId)
      db.prepare('UPDATE posts SET favorite_count = favorite_count - 1 WHERE id = ?').run(id)
      res.json({ success: true, data: { favorited: false, favorite_count: post.favorite_count - 1 } })
    } else {
      db.prepare('INSERT INTO post_favorites (post_id, user_id) VALUES (?, ?)').run(id, userId)
      db.prepare('UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = ?').run(id)
      res.json({ success: true, data: { favorited: true, favorite_count: post.favorite_count + 1 } })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '操作失败' })
  }
})

router.post('/:id/share', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { share_type } = req.body

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    db.prepare('INSERT INTO post_shares (post_id, user_id, share_type) VALUES (?, ?, ?)').run(
      id,
      req.user!.id,
      share_type || 'link'
    )
    db.prepare('UPDATE posts SET share_count = share_count + 1 WHERE id = ?').run(id)

    res.json({ success: true, data: { share_count: post.share_count + 1 } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '操作失败' })
  }
})

router.get('/:id/comments', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20))
    const offset = (page - 1) * pageSize

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id)
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    const countRow = db
      .prepare(
        `SELECT COUNT(*) as total FROM post_comments 
         WHERE post_id = ? AND parent_id IS NULL AND status = ?`
      )
      .get(id, 'published') as { total: number }

    const comments = db
      .prepare(
        `SELECT c.*, u.username, u.avatar 
         FROM post_comments c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.post_id = ? AND c.parent_id IS NULL AND c.status = ? 
         ORDER BY c.created_at DESC 
         LIMIT ? OFFSET ?`
      )
      .all(id, 'published', pageSize, offset) as any[]

    const commentIds = comments.map((c) => c.id)
    let repliesMap: Record<number, any[]> = {}
    let userLikeMap: Record<number, boolean> = {}

    if (commentIds.length > 0) {
      const placeholders = commentIds.map(() => '?').join(',')
      const replies = db
        .prepare(
          `SELECT c.*, u.username, u.avatar 
           FROM post_comments c 
           JOIN users u ON c.user_id = u.id 
           WHERE c.parent_id IN (${placeholders}) AND c.status = ? 
           ORDER BY c.created_at ASC`
        )
        .all(...commentIds, 'published') as any[]
      replies.forEach((reply) => {
        if (!repliesMap[reply.parent_id]) repliesMap[reply.parent_id] = []
        repliesMap[reply.parent_id].push(reply)
      })

      if (req.user) {
        const likes = db
          .prepare(
            `SELECT comment_id FROM post_comment_likes 
             WHERE comment_id IN (${placeholders}) AND user_id = ?`
          )
          .all(...commentIds, req.user.id) as any[]
        likes.forEach((like) => {
          userLikeMap[like.comment_id] = true
        })
      }
    }

    const items = comments.map((c) => ({
      ...c,
      replies: repliesMap[c.id] || [],
      is_liked: userLikeMap[c.id] || false,
    }))

    res.json({
      success: true,
      data: {
        items,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize),
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取评论失败' })
  }
})

router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { content, parent_id } = req.body

    if (!content) {
      res.status(400).json({ success: false, error: '评论内容不能为空' })
      return
    }

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    if (parent_id) {
      const parent = db.prepare('SELECT id FROM post_comments WHERE id = ?').get(parent_id)
      if (!parent) {
        res.status(404).json({ success: false, error: '回复的评论不存在' })
        return
      }
    }

    const result = db
      .prepare(
        'INSERT INTO post_comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)'
      )
      .run(id, req.user!.id, parent_id || null, content)

    db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(id)
    addPoints(req.user!.id, 5, 'post_comment', `评论帖子+5积分`, String(id))

    const comment = db
      .prepare(
        `SELECT c.*, u.username, u.avatar 
         FROM post_comments c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.id = ?`
      )
      .get(Number(result.lastInsertRowid))

    res.status(201).json({ success: true, data: comment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '添加评论失败' })
  }
})

router.post(
  '/comments/:id/like',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id)
      const userId = req.user!.id

      const comment = db.prepare('SELECT * FROM post_comments WHERE id = ?').get(id) as any
      if (!comment) {
        res.status(404).json({ success: false, error: '评论不存在' })
        return
      }

      const existingLike = db
        .prepare('SELECT id FROM post_comment_likes WHERE comment_id = ? AND user_id = ?')
        .get(id, userId)

      if (existingLike) {
        db.prepare('DELETE FROM post_comment_likes WHERE comment_id = ? AND user_id = ?').run(id, userId)
        db.prepare('UPDATE post_comments SET like_count = like_count - 1 WHERE id = ?').run(id)
        res.json({ success: true, data: { liked: false, like_count: comment.like_count - 1 } })
      } else {
        db.prepare('INSERT INTO post_comment_likes (comment_id, user_id) VALUES (?, ?)').run(id, userId)
        db.prepare('UPDATE post_comments SET like_count = like_count + 1 WHERE id = ?').run(id)
        res.json({ success: true, data: { liked: true, like_count: comment.like_count + 1 } })
      }
    } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, error: '操作失败' })
    }
  }
)

router.delete(
  '/comments/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id)
      const comment = db.prepare('SELECT * FROM post_comments WHERE id = ?').get(id) as any

      if (!comment) {
        res.status(404).json({ success: false, error: '评论不存在' })
        return
      }

      if (comment.user_id !== req.user!.id) {
        res.status(403).json({ success: false, error: '无权删除此评论' })
        return
      }

      db.prepare('UPDATE post_comments SET status = ? WHERE id = ?').run('deleted', id)
      db.prepare('UPDATE posts SET comment_count = comment_count - 1 WHERE id = ?').run(comment.post_id)

      res.json({ success: true, message: '删除成功' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, error: '删除评论失败' })
    }
  }
)

router.post('/:id/report', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { reason, description } = req.body

    if (!reason) {
      res.status(400).json({ success: false, error: '举报原因不能为空' })
      return
    }

    const validReason = REPORT_REASONS.find((r) => r.value === reason)
    if (!validReason) {
      res.status(400).json({ success: false, error: '无效的举报原因' })
      return
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id)
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    db.prepare(
      'INSERT INTO post_reports (post_id, reporter_id, reason, description) VALUES (?, ?, ?, ?)'
    ).run(id, req.user!.id, reason, description || '')

    res.json({ success: true, message: '举报提交成功，我们会尽快处理' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '举报失败' })
  }
})

router.post(
  '/comments/:id/report',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id)
      const { reason, description } = req.body

      if (!reason) {
        res.status(400).json({ success: false, error: '举报原因不能为空' })
        return
      }

      const validReason = REPORT_REASONS.find((r) => r.value === reason)
      if (!validReason) {
        res.status(400).json({ success: false, error: '无效的举报原因' })
        return
      }

      const comment = db.prepare('SELECT id FROM post_comments WHERE id = ?').get(id)
      if (!comment) {
        res.status(404).json({ success: false, error: '评论不存在' })
        return
      }

      db.prepare(
        'INSERT INTO post_reports (comment_id, reporter_id, reason, description) VALUES (?, ?, ?, ?)'
      ).run(id, req.user!.id, reason, description || '')

      res.json({ success: true, message: '举报提交成功，我们会尽快处理' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, error: '举报失败' })
    }
  }
)

router.get('/user/favorites', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const offset = (page - 1) * pageSize
    const userId = req.user!.id

    const countRow = db
      .prepare(
        `SELECT COUNT(*) as total FROM post_favorites pf 
         JOIN posts p ON pf.post_id = p.id 
         WHERE pf.user_id = ? AND p.status = ?`
      )
      .get(userId, 'published') as { total: number }

    const favorites = db
      .prepare(
        `SELECT p.*, u.username, u.avatar, pf.created_at as favorited_at
         FROM post_favorites pf 
         JOIN posts p ON pf.post_id = p.id 
         JOIN users u ON p.user_id = u.id 
         WHERE pf.user_id = ? AND p.status = ? 
         ORDER BY pf.created_at DESC 
         LIMIT ? OFFSET ?`
      )
      .all(userId, 'published', pageSize, offset) as any[]

    const postIds = favorites.map((p) => p.id)
    let imagesMap: Record<number, any[]> = {}

    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',')
      const images = db
        .prepare(`SELECT * FROM post_images WHERE post_id IN (${placeholders}) ORDER BY sort_order`)
        .all(...postIds) as any[]
      images.forEach((img) => {
        if (!imagesMap[img.post_id]) imagesMap[img.post_id] = []
        imagesMap[img.post_id].push(img)
      })
    }

    const items = favorites.map((p) => ({
      ...p,
      images: imagesMap[p.id] || [],
      is_favorited: true,
    }))

    res.json({
      success: true,
      data: {
        items,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize),
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取收藏列表失败' })
  }
})

router.get('/user/:id/badges', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id)

    const badges = db
      .prepare(
        `SELECT b.*, ub.awarded_at 
         FROM user_community_badges ub 
         JOIN community_badges b ON ub.badge_id = b.id 
         WHERE ub.user_id = ? 
         ORDER BY ub.awarded_at DESC`
      )
      .all(userId)

    res.json({
      success: true,
      data: badges,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取用户徽章失败' })
  }
})

export default router
