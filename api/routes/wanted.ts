import { Router, type Response } from 'express'
import db, { addPoints } from '../database.js'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

interface MatchedMaterial {
  id: number
  title: string
  category: string
  description: string
  price: number
  is_swappable: number
  user_id: number
  username: string
  avatar: string
  image_url?: string
  relevance_score: number
}

function matchMaterialsForWanted(wantedId: number): MatchedMaterial[] {
  const wanted = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(wantedId) as any
  if (!wanted) return []

  const { category, title, description, budget_min, budget_max } = wanted
  const budgetMin = budget_min || 0
  const budgetMax = budget_max || 0

  const keywordText = `${title} ${description || ''}`.toLowerCase()
  const keywords = keywordText
    .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter((k: string) => k.length >= 2)

  let whereClause = 'WHERE m.is_active = 1 AND m.category = ?'
  const params: any[] = [category]

  if (budgetMax > 0) {
    whereClause += ' AND m.price <= ?'
    params.push(budgetMax)
  }
  if (budgetMin > 0) {
    whereClause += ' AND m.price >= ?'
    params.push(budgetMin)
  }

  const materials = db.prepare(
    `SELECT m.*, u.username, u.avatar, 
            (SELECT url FROM material_images WHERE material_id = m.id ORDER BY sort_order LIMIT 1) as image_url
     FROM materials m 
     JOIN users u ON m.user_id = u.id 
     ${whereClause}`
  ).all(...params) as any[]

  const scoredMaterials: MatchedMaterial[] = materials.map((m: any) => {
    let score = 0

    score += 30

    const mTitle = m.title.toLowerCase()
    const mDesc = (m.description || '').toLowerCase()

    for (const keyword of keywords) {
      if (mTitle.includes(keyword)) {
        score += 20
      }
      if (mDesc.includes(keyword)) {
        score += 10
      }
    }

    if (budgetMax > 0 && budgetMin > 0) {
      const budgetMid = (budgetMin + budgetMax) / 2
      const priceDiff = Math.abs(m.price - budgetMid)
      const budgetRange = budgetMax - budgetMin || 1
      const priceScore = Math.max(0, 20 - (priceDiff / budgetRange) * 20)
      score += priceScore
    } else if (budgetMax > 0 && m.price <= budgetMax) {
      score += 10
    }

    return {
      ...m,
      relevance_score: Math.round(score * 100) / 100
    }
  })

  scoredMaterials.sort((a, b) => b.relevance_score - a.relevance_score)

  return scoredMaterials.slice(0, 20)
}

function createMatchMessage(wantedId: number, matchedMaterials: MatchedMaterial[]) {
  const wanted = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(wantedId) as any
  if (!wanted) return

  const matchCount = matchedMaterials.length

  if (matchCount === 0) return

  const title = `为您找到 ${matchCount} 个匹配的材料`
  const content = `您发布的求购"${wanted.title}"已匹配到 ${matchCount} 个相关材料，点击查看详情。`

  const relatedData = JSON.stringify({
    type: 'wanted_match',
    wanted_id: wantedId,
    match_count: matchCount
  })

  db.prepare(
    'INSERT INTO messages (user_id, type, title, content, is_read, related_id, extra_data) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(wanted.user_id, 'match', title, content, 0, String(wantedId), relatedData)
}

function getTagsForMaterials(materialIds: number[]): Record<number, any[]> {
  if (materialIds.length === 0) return {}
  const placeholders = materialIds.map(() => '?').join(',')
  const tags = db.prepare(
    `SELECT t.id, t.name, mt.material_id FROM tags t
     JOIN material_tags mt ON t.id = mt.tag_id
     WHERE mt.material_id IN (${placeholders})
     ORDER BY t.use_count DESC, t.name ASC`
  ).all(...materialIds) as any[]
  const tagsMap: Record<number, any[]> = {}
  tags.forEach(t => {
    if (!tagsMap[t.material_id]) tagsMap[t.material_id] = []
    tagsMap[t.material_id].push({ id: t.id, name: t.name })
  })
  return tagsMap
}

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

    const wantedId = Number(result.lastInsertRowid)
    const item = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(wantedId) as any

    const matchedMaterials = matchMaterialsForWanted(wantedId)
    if (matchedMaterials.length > 0) {
      createMatchMessage(wantedId, matchedMaterials)
    }

    addPoints(req.user!.id, 10, 'publish_wanted', `发布求购「${title}」+10积分`, String(wantedId))

    res.status(201).json({ 
      success: true, 
      data: {
        ...item,
        match_count: matchedMaterials.length
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建求购信息失败' })
  }
})

router.get('/:id/matches', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const wanted = db.prepare('SELECT * FROM wanted_items WHERE id = ?').get(id) as any

    if (!wanted) {
      res.status(404).json({ success: false, error: '求购信息不存在' })
      return
    }
    if (wanted.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权查看此求购的匹配结果' })
      return
    }

    const matchedMaterials = matchMaterialsForWanted(id)

    const materialIds = matchedMaterials.map(m => m.id)
    let imagesMap: Record<number, any[]> = {}
    let specsMap: Record<number, any[]> = {}

    if (materialIds.length > 0) {
      const placeholders = materialIds.map(() => '?').join(',')
      const images = db.prepare(`SELECT * FROM material_images WHERE material_id IN (${placeholders}) ORDER BY sort_order`).all(...materialIds) as any[]
      images.forEach(img => {
        if (!imagesMap[img.material_id]) imagesMap[img.material_id] = []
        imagesMap[img.material_id].push(img)
      })

      const specs = db.prepare(`SELECT * FROM material_specs WHERE material_id IN (${placeholders})`).all(...materialIds) as any[]
      specs.forEach(spec => {
        if (!specsMap[spec.material_id]) specsMap[spec.material_id] = []
        specsMap[spec.material_id].push(spec)
      })
    }

    const tagsMap = getTagsForMaterials(materialIds)

    const items = matchedMaterials.map(m => ({
      ...m,
      images: imagesMap[m.id] || [],
      specs: specsMap[m.id] || [],
      tags: tagsMap[m.id] || []
    }))

    res.json({
      success: true,
      data: {
        items,
        total: items.length
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取匹配结果失败' })
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
