import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const category = req.query.category as string
    const status = req.query.status as string
    const offset = (page - 1) * pageSize

    let whereClause = ''
    const params: any[] = []

    if (category) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' w.category = ?'
      params.push(category)
    }
    if (status) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' w.status = ?'
      params.push(status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM wanted_items w ${whereClause}`).get(...params) as { total: number }

    const items = db.prepare(
      `SELECT w.*, u.username, u.avatar FROM wanted_items w JOIN users u ON w.user_id = u.id ${whereClause} ORDER BY w.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

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
    res.status(500).json({ success: false, error: '获取求购列表失败' })
  }
})

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const item = db.prepare(
      'SELECT w.*, u.username, u.avatar, u.credit_score FROM wanted_items w JOIN users u ON w.user_id = u.id WHERE w.id = ?'
    ).get(id) as any

    if (!item) {
      res.status(404).json({ success: false, error: '求购信息不存在' })
      return
    }

    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取求购详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, category, description, budget_min, budget_max } = req.body
    if (!title || !category) {
      res.status(400).json({ success: false, error: '标题和分类不能为空' })
      return
    }

    const result = db.prepare(
      'INSERT INTO wanted_items (user_id, title, category, description, budget_min, budget_max) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, title, category, description || '', budget_min || 0, budget_max || 0)

    const item = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(Number(result.lastInsertRowid))
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建求购信息失败' })
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const item = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(id) as any

    if (!item) {
      res.status(404).json({ success: false, error: '求购信息不存在' })
      return
    }
    if (item.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权修改此求购信息' })
      return
    }

    const { title, category, description, budget_min, budget_max } = req.body
    db.prepare(
      `UPDATE wanted_items SET title = ?, category = ?, description = ?, budget_min = ?, budget_max = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      title || item.title,
      category || item.category,
      description !== undefined ? description : item.description,
      budget_min !== undefined ? budget_min : item.budget_min,
      budget_max !== undefined ? budget_max : item.budget_max,
      id
    )

    const updated = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新求购信息失败' })
  }
})

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body

    if (!['open', 'closed', 'fulfilled'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态' })
      return
    }

    const item = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(id) as any
    if (!item) {
      res.status(404).json({ success: false, error: '求购信息不存在' })
      return
    }
    if (item.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权修改此求购信息' })
      return
    }

    db.prepare("UPDATE wanted_items SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
    const updated = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新求购状态失败' })
  }
})

export default router
