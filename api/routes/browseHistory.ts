import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

const BROWSE_HISTORY_RETENTION_DAYS = parseInt(process.env.BROWSE_HISTORY_RETENTION_DAYS || '30')

const VALID_TARGET_TYPES = ['material', 'work', 'shop']

function cleanupExpiredHistory(userId: number) {
  db.prepare(
    `DELETE FROM browse_history 
     WHERE user_id = ? AND viewed_at < datetime('now', ?)`
  ).run(userId, `-${BROWSE_HISTORY_RETENTION_DAYS} days`)
}

function addBrowseRecord(
  userId: number,
  targetType: string,
  targetId: number,
  title: string,
  coverImage: string = '',
  extraData: string = ''
) {
  cleanupExpiredHistory(userId)

  const existing = db.prepare(
    'SELECT id FROM browse_history WHERE user_id = ? AND target_type = ? AND target_id = ?'
  ).get(userId, targetType, targetId) as { id: number } | undefined

  if (existing) {
    db.prepare(
      `UPDATE browse_history 
       SET title = ?, cover_image = ?, extra_data = ?, viewed_at = datetime('now')
       WHERE id = ?`
    ).run(title, coverImage, extraData, existing.id)
    return existing.id
  } else {
    const result = db.prepare(
      `INSERT INTO browse_history (user_id, target_type, target_id, title, cover_image, extra_data)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, targetType, targetId, title, coverImage, extraData)
    return Number(result.lastInsertRowid)
  }
}

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { target_type, target_id, title, cover_image, extra_data } = req.body

    if (!target_type || !target_id || !title) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    if (!VALID_TARGET_TYPES.includes(target_type)) {
      res.status(400).json({ success: false, error: '无效的目标类型' })
      return
    }

    const id = addBrowseRecord(
      req.user!.id,
      target_type,
      parseInt(target_id),
      title,
      cover_image || '',
      extra_data ? JSON.stringify(extra_data) : ''
    )

    res.json({ success: true, data: { id } })
  } catch (error) {
    res.status(500).json({ success: false, error: '记录浏览历史失败' })
  }
})

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20))
    const targetType = req.query.target_type as string
    const offset = (page - 1) * pageSize

    cleanupExpiredHistory(req.user!.id)

    let whereClause = 'WHERE user_id = ?'
    const params: any[] = [req.user!.id]

    if (targetType && VALID_TARGET_TYPES.includes(targetType)) {
      whereClause += ' AND target_type = ?'
      params.push(targetType)
    }

    const countRow = db.prepare(
      `SELECT COUNT(*) as total FROM browse_history ${whereClause}`
    ).get(...params) as { total: number }

    const records = db.prepare(
      `SELECT * FROM browse_history ${whereClause} ORDER BY viewed_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    const items = records.map(r => ({
      ...r,
      extra_data: r.extra_data ? JSON.parse(r.extra_data) : null
    }))

    res.json({
      success: true,
      data: {
        items,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize),
        retention_days: BROWSE_HISTORY_RETENTION_DAYS
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取浏览历史失败' })
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const record = db.prepare('SELECT * FROM browse_history WHERE id = ?').get(id) as any

    if (!record) {
      res.status(404).json({ success: false, error: '记录不存在' })
      return
    }

    if (record.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权删除此记录' })
      return
    }

    db.prepare('DELETE FROM browse_history WHERE id = ?').run(id)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除记录失败' })
  }
})

router.delete('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { target_type } = req.body

    let whereClause = 'WHERE user_id = ?'
    const params: any[] = [req.user!.id]

    if (target_type && VALID_TARGET_TYPES.includes(target_type)) {
      whereClause += ' AND target_type = ?'
      params.push(target_type)
    }

    db.prepare(`DELETE FROM browse_history ${whereClause}`).run(...params)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '清空浏览历史失败' })
  }
})

export { addBrowseRecord }
export default router
