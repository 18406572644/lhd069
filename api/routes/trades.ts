import { Router, type Response } from 'express'
import db, { addPoints } from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { responder_id, material_id, offer_material_id, type, message } = req.body
    if (!responder_id || !material_id || !type) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id) as any
    if (!material) {
      res.status(404).json({ success: false, error: '材料不存在' })
      return
    }

    const result = db.prepare(
      'INSERT INTO trades (requester_id, responder_id, material_id, offer_material_id, type, status, message) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, responder_id, material_id, offer_material_id || null, type, 'pending', message || '')

    const tradeId = Number(result.lastInsertRowid)

    db.prepare(
      'INSERT INTO messages (user_id, type, title, content, is_read, related_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(responder_id, 'trade', '收到新的交易请求', `${req.user!.username}向您发起了${type === 'swap' ? '交换' : '购买'}请求`, 0, String(tradeId))

    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId)
    res.status(201).json({ success: true, data: trade })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建交易失败' })
  }
})

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const offset = (page - 1) * pageSize

    let whereClause = 'WHERE (t.requester_id = ? OR t.responder_id = ?)'
    const params: any[] = [req.user!.id, req.user!.id]

    if (status) {
      whereClause += ' AND t.status = ?'
      params.push(status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM trades t ${whereClause}`).get(...params) as { total: number }

    const trades = db.prepare(
      `SELECT t.*, m.title as material_title, m.price as material_price,
       om.title as offer_material_title,
       ru.username as requester_name, ru.avatar as requester_avatar,
       re.username as responder_name, re.avatar as responder_avatar
       FROM trades t
       JOIN materials m ON t.material_id = m.id
       LEFT JOIN materials om ON t.offer_material_id = om.id
       JOIN users ru ON t.requester_id = ru.id
       JOIN users re ON t.responder_id = re.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: {
        items: trades,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取交易列表失败' })
  }
})

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body

    if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的交易状态' })
      return
    }

    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as any
    if (!trade) {
      res.status(404).json({ success: false, error: '交易不存在' })
      return
    }

    if (trade.requester_id !== req.user!.id && trade.responder_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权操作此交易' })
      return
    }

    db.prepare("UPDATE trades SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)

    if (status === 'completed') {
      addPoints(trade.requester_id, 50, 'trade_complete', '完成交易 +50积分', String(id))
      addPoints(trade.responder_id, 50, 'trade_complete', '完成交易 +50积分', String(id))
    }

    const notifyUserId = trade.requester_id === req.user!.id ? trade.responder_id : trade.requester_id
    const statusText: Record<string, string> = { accepted: '已接受', rejected: '已拒绝', completed: '已完成', cancelled: '已取消' }

    db.prepare(
      'INSERT INTO messages (user_id, type, title, content, is_read, related_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(notifyUserId, 'trade', '交易状态更新', `交易${statusText[status] || status}`, 0, String(id))

    const updated = db.prepare('SELECT * FROM trades WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新交易状态失败' })
  }
})

router.post('/:id/review', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { rating, comment } = req.body

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: '评分必须在1-5之间' })
      return
    }

    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as any
    if (!trade) {
      res.status(404).json({ success: false, error: '交易不存在' })
      return
    }

    if (trade.status !== 'completed') {
      res.status(400).json({ success: false, error: '只能评价已完成的交易' })
      return
    }

    if (trade.requester_id !== req.user!.id && trade.responder_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权评价此交易' })
      return
    }

    const existingReview = db.prepare('SELECT id FROM reviews WHERE trade_id = ? AND reviewer_id = ?').get(id, req.user!.id) as any
    if (existingReview) {
      res.status(400).json({ success: false, error: '您已经评价过此交易' })
      return
    }

    const revieweeId = trade.requester_id === req.user!.id ? trade.responder_id : trade.requester_id

    const result = db.prepare(
      'INSERT INTO reviews (trade_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user!.id, revieweeId, rating, comment || '')

    addPoints(req.user!.id, 15, 'review', '发表评价 +15积分', String(id))

    res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '评价交易失败' })
  }
})

export default router
