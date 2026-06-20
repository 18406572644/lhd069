import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/:id/credit', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const user = db.prepare('SELECT id, username, credit_score, is_shop_owner, created_at FROM users WHERE id = ?').get(id) as any

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const reviewStats = db.prepare(
      'SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM reviews WHERE reviewee_id = ?'
    ).get(id) as { total_reviews: number; avg_rating: number | null }

    res.json({
      success: true,
      data: {
        ...user,
        totalReviews: reviewStats.total_reviews,
        avgRating: reviewStats.avg_rating ? Math.round(reviewStats.avg_rating * 10) / 10 : 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取信用信息失败' })
  }
})

router.get('/:id/reviews', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const offset = (page - 1) * pageSize

    const countRow = db.prepare('SELECT COUNT(*) as total FROM reviews WHERE reviewee_id = ?').get(id) as { total: number }

    const reviews = db.prepare(
      `SELECT r.*, u.username, u.avatar FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewee_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
    ).all(id, pageSize, offset) as any[]

    res.json({
      success: true,
      data: {
        items: reviews,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取评价列表失败' })
  }
})

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, avatar, bio } = req.body

    if (username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user!.id) as any
      if (existing) {
        res.status(409).json({ success: false, error: '用户名已被占用' })
        return
      }
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any

    db.prepare(
      `UPDATE users SET username = ?, avatar = ?, bio = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      username || user.username,
      avatar !== undefined ? avatar : user.avatar,
      bio !== undefined ? bio : user.bio,
      req.user!.id
    )

    const updated = db.prepare('SELECT id, username, email, avatar, bio, credit_score, is_shop_owner, created_at FROM users WHERE id = ?').get(req.user!.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新资料失败' })
  }
})

export default router
