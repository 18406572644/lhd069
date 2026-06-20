import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/my/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    const shop = db.prepare('SELECT * FROM shops WHERE user_id = ?').get(userId) as any
    if (!shop) {
      res.status(404).json({ success: false, error: '您还没有开设店铺' })
      return
    }

    const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials WHERE user_id = ? AND is_active = 1').get(userId) as { count: number }
    const totalViews = db.prepare('SELECT COALESCE(SUM(view_count), 0) as total FROM materials WHERE user_id = ?').get(userId) as { total: number }
    const tradeCount = db.prepare('SELECT COUNT(*) as count FROM trades WHERE responder_id = ? AND status = \'completed\'').get(userId) as { count: number }

    res.json({
      success: true,
      data: {
        shop,
        stats: {
          materialCount: materialCount.count,
          totalViews: totalViews.total,
          completedTrades: tradeCount.count
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取店铺统计失败' })
  }
})

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const shop = db.prepare(
      'SELECT s.*, u.username, u.avatar, u.credit_score FROM shops s JOIN users u ON s.user_id = u.id WHERE s.id = ?'
    ).get(id) as any

    if (!shop) {
      res.status(404).json({ success: false, error: '店铺不存在' })
      return
    }

    const materials = db.prepare(
      'SELECT * FROM materials WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC'
    ).all(shop.user_id) as any[]

    const materialCount = materials.length
    const totalViews = materials.reduce((sum: number, m: any) => sum + m.view_count, 0)
    const completedTrades = db.prepare('SELECT COUNT(*) as count FROM trades WHERE responder_id = ? AND status = \'completed\'').get(shop.user_id) as { count: number }

    res.json({
      success: true,
      data: {
        ...shop,
        materials,
        stats: {
          materialCount,
          totalViews,
          completedTrades: completedTrades.count
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取店铺详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, cover_image } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '店铺名称不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM shops WHERE user_id = ?').get(req.user!.id) as any
    if (existing) {
      res.status(409).json({ success: false, error: '您已经开设了店铺' })
      return
    }

    const result = db.prepare(
      'INSERT INTO shops (user_id, name, description, cover_image) VALUES (?, ?, ?, ?)'
    ).run(req.user!.id, name, description || '', cover_image || '')

    db.prepare('UPDATE users SET is_shop_owner = 1 WHERE id = ?').run(req.user!.id)

    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(Number(result.lastInsertRowid))
    res.status(201).json({ success: true, data: shop })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建店铺失败' })
  }
})

router.put('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, cover_image } = req.body

    const shop = db.prepare('SELECT * FROM shops WHERE user_id = ?').get(req.user!.id) as any
    if (!shop) {
      res.status(404).json({ success: false, error: '店铺不存在' })
      return
    }

    db.prepare(
      'UPDATE shops SET name = ?, description = ?, cover_image = ? WHERE id = ?'
    ).run(
      name || shop.name,
      description !== undefined ? description : shop.description,
      cover_image !== undefined ? cover_image : shop.cover_image,
      shop.id
    )

    const updated = db.prepare('SELECT * FROM shops WHERE id = ?').get(shop.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新店铺失败' })
  }
})

export default router
