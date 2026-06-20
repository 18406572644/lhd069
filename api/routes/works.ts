import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const tag = req.query.tag as string
    const offset = (page - 1) * pageSize

    let whereClause = ''
    const params: any[] = []

    if (tag) {
      whereClause += ' WHERE w.tags LIKE ?'
      params.push(`%${tag}%`)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM works w ${whereClause}`).get(...params) as { total: number }

    const works = db.prepare(
      `SELECT w.*, u.username, u.avatar FROM works w JOIN users u ON w.user_id = u.id ${whereClause} ORDER BY w.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    const workIds = works.map(w => w.id)
    let imagesMap: Record<number, any[]> = {}

    if (workIds.length > 0) {
      const placeholders = workIds.map(() => '?').join(',')
      const images = db.prepare(`SELECT * FROM work_images WHERE work_id IN (${placeholders}) ORDER BY sort_order`).all(...workIds) as any[]
      images.forEach(img => {
        if (!imagesMap[img.work_id]) imagesMap[img.work_id] = []
        imagesMap[img.work_id].push(img)
      })
    }

    const items = works.map(w => ({
      ...w,
      images: imagesMap[w.id] || []
    }))

    res.json({
      success: true,
      data: {
        items,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取作品列表失败' })
  }
})

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const work = db.prepare(
      'SELECT w.*, u.username, u.avatar, u.credit_score FROM works w JOIN users u ON w.user_id = u.id WHERE w.id = ?'
    ).get(id) as any

    if (!work) {
      res.status(404).json({ success: false, error: '作品不存在' })
      return
    }

    const images = db.prepare('SELECT * FROM work_images WHERE work_id = ? ORDER BY sort_order').all(id)
    const comments = db.prepare(
      'SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.work_id = ? ORDER BY c.created_at DESC'
    ).all(id)

    res.json({ success: true, data: { ...work, images, comments } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取作品详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, tags, images } = req.body
    if (!title) {
      res.status(400).json({ success: false, error: '标题不能为空' })
      return
    }

    const result = db.prepare(
      'INSERT INTO works (user_id, title, description, tags) VALUES (?, ?, ?, ?)'
    ).run(req.user!.id, title, description || '', tags || '')

    const workId = Number(result.lastInsertRowid)

    if (Array.isArray(images)) {
      const insertImage = db.prepare('INSERT INTO work_images (work_id, url, sort_order) VALUES (?, ?, ?)')
      images.forEach((img: { url: string }, i: number) => {
        insertImage.run(workId, img.url, i)
      })
    }

    const work = db.prepare('SELECT * FROM works WHERE id = ?').get(workId)
    res.status(201).json({ success: true, data: work })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建作品失败' })
  }
})

router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { content } = req.body

    if (!content) {
      res.status(400).json({ success: false, error: '评论内容不能为空' })
      return
    }

    const work = db.prepare('SELECT * FROM works WHERE id = ?').get(id) as any
    if (!work) {
      res.status(404).json({ success: false, error: '作品不存在' })
      return
    }

    const result = db.prepare(
      'INSERT INTO comments (work_id, user_id, content) VALUES (?, ?, ?)'
    ).run(id, req.user!.id, content)

    res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加评论失败' })
  }
})

export default router
