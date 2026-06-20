import { Router, type Response } from 'express'
import db from '../database.js'
import { optionalAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/hot', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(_req.query.limit as string) || 20))
    const tags = db.prepare(
      'SELECT id, name, use_count, created_at FROM tags ORDER BY use_count DESC, name ASC LIMIT ?'
    ).all(limit)
    res.json({ success: true, data: tags })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取热门标签失败' })
  }
})

router.get('/suggest', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const keyword = (req.query.keyword as string || '').trim()
    if (!keyword) {
      res.json({ success: true, data: [] })
      return
    }
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10))
    const tags = db.prepare(
      'SELECT id, name, use_count FROM tags WHERE name LIKE ? ORDER BY use_count DESC, name ASC LIMIT ?'
    ).all(`%${keyword}%`, limit)
    res.json({ success: true, data: tags })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取标签建议失败' })
  }
})

router.get('/:name/materials', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tagName = decodeURIComponent(req.params.name as string)
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 12))
    const sort = req.query.sort as string || 'latest'
    const offset = (page - 1) * pageSize

    const tag = db.prepare('SELECT * FROM tags WHERE name = ?').get(tagName) as any
    if (!tag) {
      res.status(404).json({ success: false, error: '标签不存在' })
      return
    }

    let orderBy = 'm.created_at DESC'
    if (sort === 'hot' || sort === 'popular') orderBy = 'm.view_count DESC, m.created_at DESC'
    if (sort === 'latest') orderBy = 'm.created_at DESC'

    const countRow = db.prepare(
      `SELECT COUNT(*) as total FROM materials m
       JOIN material_tags mt ON m.id = mt.material_id
       JOIN tags t ON mt.tag_id = t.id
       WHERE t.name = ? AND m.is_active = 1`
    ).get(tagName) as { total: number }

    const materials = db.prepare(
      `SELECT m.*, u.username, u.avatar FROM materials m
       JOIN material_tags mt ON m.id = mt.material_id
       JOIN tags t ON mt.tag_id = t.id
       JOIN users u ON m.user_id = u.id
       WHERE t.name = ? AND m.is_active = 1
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    ).all(tagName, pageSize, offset) as any[]

    const materialIds = materials.map(m => m.id)
    let imagesMap: Record<number, any[]> = {}
    let specsMap: Record<number, any[]> = {}
    let tagsMap: Record<number, any[]> = {}

    if (materialIds.length > 0) {
      const placeholders = materialIds.map(() => '?').join(',')
      const images = db.prepare(`SELECT * FROM material_images WHERE material_id IN (${placeholders})`).all(...materialIds) as any[]
      images.forEach(img => {
        if (!imagesMap[img.material_id]) imagesMap[img.material_id] = []
        imagesMap[img.material_id].push(img)
      })

      const specs = db.prepare(`SELECT * FROM material_specs WHERE material_id IN (${placeholders})`).all(...materialIds) as any[]
      specs.forEach(spec => {
        if (!specsMap[spec.material_id]) specsMap[spec.material_id] = []
        specsMap[spec.material_id].push(spec)
      })

      const tags = db.prepare(
        `SELECT t.id, t.name, mt.material_id FROM tags t
         JOIN material_tags mt ON t.id = mt.tag_id
         WHERE mt.material_id IN (${placeholders})
         ORDER BY t.use_count DESC, t.name ASC`
      ).all(...materialIds) as any[]
      tags.forEach(t => {
        if (!tagsMap[t.material_id]) tagsMap[t.material_id] = []
        tagsMap[t.material_id].push({ id: t.id, name: t.name })
      })
    }

    const items = materials.map(m => ({
      ...m,
      images: imagesMap[m.id] || [],
      specs: specsMap[m.id] || [],
      tags: tagsMap[m.id] || []
    }))

    res.json({
      success: true,
      data: {
        tag: { id: tag.id, name: tag.name, use_count: tag.use_count, created_at: tag.created_at },
        items,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取标签材料列表失败' })
  }
})

export default router
