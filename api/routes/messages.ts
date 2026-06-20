import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const offset = (page - 1) * pageSize

    const countRow = db.prepare('SELECT COUNT(*) as total FROM messages WHERE user_id = ?').get(req.user!.id) as { total: number }
    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0').get(req.user!.id) as { count: number }

    const messages = db.prepare(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(req.user!.id, pageSize, offset) as any[]

    const processedMessages = messages.map(msg => {
      let extra = null
      if (msg.extra_data) {
        try {
          extra = JSON.parse(msg.extra_data)
        } catch {
          extra = null
        }
      }
      return {
        ...msg,
        extra_data: extra
      }
    })

    res.json({
      success: true,
      data: {
        items: processedMessages,
        total: countRow.total,
        unreadCount: unreadCount.count,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取消息列表失败' })
  }
})

router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)

    const message = db.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!message) {
      res.status(404).json({ success: false, error: '消息不存在' })
      return
    }

    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(id)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '标记消息失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id, type, title, content, related_id } = req.body
    if (!user_id || !type || !title) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const result = db.prepare(
      'INSERT INTO messages (user_id, type, title, content, is_read, related_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user_id, type, title, content || '', 0, related_id || '')

    res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建消息失败' })
  }
})

export default router
