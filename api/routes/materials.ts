import { Router, type Response } from 'express'
import { parse } from 'csv-parse'
import { stringify } from 'csv-stringify'
import db, { addPoints } from '../database.js'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

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

function syncMaterialTags(materialId: number, tagNames: string[]) {
  const uniqueTags = [...new Set(tagNames.map(t => t.trim()).filter(t => t.length > 0))].slice(0, 5)

  db.prepare('DELETE FROM material_tags WHERE material_id = ?').run(materialId)

  for (const tagName of uniqueTags) {
    const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(tagName) as any
    let tagId: number
    if (existing) {
      tagId = existing.id
      db.prepare('UPDATE tags SET use_count = use_count + 1 WHERE id = ?').run(tagId)
    } else {
      const result = db.prepare('INSERT INTO tags (name, use_count) VALUES (?, 1)').run(tagName)
      tagId = Number(result.lastInsertRowid)
    }
    db.prepare('INSERT OR IGNORE INTO material_tags (material_id, tag_id) VALUES (?, ?)').run(materialId, tagId)
  }
}

function recountTagUsage() {
  const tags = db.prepare('SELECT id FROM tags').all() as { id: number }[]
  for (const tag of tags) {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM material_tags WHERE tag_id = ?').get(tag.id) as { cnt: number }
    db.prepare('UPDATE tags SET use_count = ? WHERE id = ?').run(count.cnt, tag.id)
  }
}

router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const category = req.query.category as string
    const keyword = req.query.keyword as string
    const tag = req.query.tag as string
    const sort = req.query.sort as string || 'latest'
    const minPrice = parseFloat(req.query.minPrice as string)
    const maxPrice = parseFloat(req.query.maxPrice as string)
    const canSwap = req.query.canSwap as string
    const offset = (page - 1) * pageSize

    let whereClause = 'WHERE m.is_active = 1'
    const params: any[] = []
    let joinClause = ''

    if (tag) {
      joinClause = 'JOIN material_tags mt ON m.id = mt.material_id JOIN tags t ON mt.tag_id = t.id'
      whereClause += ' AND t.name = ?'
      params.push(tag)
    }
    if (category) {
      whereClause += ' AND m.category = ?'
      params.push(category)
    }
    if (keyword) {
      whereClause += ' AND (m.title LIKE ? OR m.description LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (!isNaN(minPrice)) {
      whereClause += ' AND m.price >= ?'
      params.push(minPrice)
    }
    if (!isNaN(maxPrice)) {
      whereClause += ' AND m.price <= ?'
      params.push(maxPrice)
    }
    if (canSwap === 'true' || canSwap === '1') {
      whereClause += ' AND m.is_swappable = 1'
    }

    let orderBy = 'm.is_pinned DESC, m.created_at DESC'
    if (sort === 'price_asc' || sort === 'price') orderBy = 'm.is_pinned DESC, m.price ASC'
    if (sort === 'price_desc') orderBy = 'm.is_pinned DESC, m.price DESC'
    if (sort === 'popular') orderBy = 'm.is_pinned DESC, m.view_count DESC'
    if (sort === 'swap') orderBy = 'm.is_pinned DESC, m.is_swappable DESC, m.created_at DESC'
    if (sort === 'latest') orderBy = 'm.is_pinned DESC, m.created_at DESC'

    const countRow = db.prepare(`SELECT COUNT(DISTINCT m.id) as total FROM materials m ${joinClause} ${whereClause}`).get(...params) as { total: number }

    const materials = db.prepare(
      `SELECT DISTINCT m.*, u.username, u.avatar FROM materials m ${joinClause} JOIN users u ON m.user_id = u.id ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    const materialIds = materials.map(m => m.id)
    let imagesMap: Record<number, any[]> = {}
    let specsMap: Record<number, any[]> = {}

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
    }

    const tagsMap = getTagsForMaterials(materialIds)

    const items = materials.map(m => ({
      ...m,
      images: imagesMap[m.id] || [],
      specs: specsMap[m.id] || [],
      tags: tagsMap[m.id] || []
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
    res.status(500).json({ success: false, error: '获取材料列表失败' })
  }
})

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    db.prepare('UPDATE materials SET view_count = view_count + 1 WHERE id = ?').run(id)

    const material = db.prepare(
      'SELECT m.*, u.username, u.avatar, u.credit_score FROM materials m JOIN users u ON m.user_id = u.id WHERE m.id = ?'
    ).get(id) as any

    if (!material) {
      res.status(404).json({ success: false, error: '材料不存在' })
      return
    }

    const images = db.prepare('SELECT * FROM material_images WHERE material_id = ? ORDER BY sort_order').all(id)
    const specs = db.prepare('SELECT * FROM material_specs WHERE material_id = ?').all(id)
    const tagsMap = getTagsForMaterials([id])

    res.json({
      success: true,
      data: {
        ...material,
        images,
        specs,
        tags: tagsMap[id] || []
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取材料详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, category, description, price, is_swappable, images, specs, tags } = req.body
    if (!title || !category) {
      res.status(400).json({ success: false, error: '标题和分类不能为空' })
      return
    }

    const result = db.prepare(
      'INSERT INTO materials (user_id, title, category, description, price, is_swappable) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, title, category, description || '', price || 0, is_swappable !== undefined ? (is_swappable ? 1 : 0) : 1)

    const materialId = Number(result.lastInsertRowid)

    const insertImage = db.prepare('INSERT INTO material_images (material_id, url, sort_order) VALUES (?, ?, ?)')
    if (Array.isArray(images)) {
      images.forEach((img: { url: string }, i: number) => {
        insertImage.run(materialId, img.url, i)
      })
    }

    const insertSpec = db.prepare('INSERT INTO material_specs (material_id, key, value) VALUES (?, ?, ?)')
    if (Array.isArray(specs)) {
      specs.forEach((spec: { key: string; value: string }) => {
        insertSpec.run(materialId, spec.key, spec.value)
      })
    }

    if (Array.isArray(tags)) {
      syncMaterialTags(materialId, tags)
    }

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(materialId) as any
    const tagsMap = getTagsForMaterials([materialId])

    addPoints(req.user!.id, 20, 'publish_material', `发布材料「${title}」+20积分`, String(materialId))

    res.status(201).json({
      success: true,
      data: {
        ...material,
        tags: tagsMap[materialId] || []
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建材料失败' })
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as any

    if (!material) {
      res.status(404).json({ success: false, error: '材料不存在' })
      return
    }
    if (material.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权修改此材料' })
      return
    }

    const { title, category, description, price, is_swappable, is_active, images, specs, tags } = req.body

    db.prepare(
      `UPDATE materials SET title = ?, category = ?, description = ?, price = ?, is_swappable = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      title || material.title,
      category || material.category,
      description !== undefined ? description : material.description,
      price !== undefined ? price : material.price,
      is_swappable !== undefined ? (is_swappable ? 1 : 0) : material.is_swappable,
      is_active !== undefined ? (is_active ? 1 : 0) : material.is_active,
      id
    )

    if (Array.isArray(images)) {
      db.prepare('DELETE FROM material_images WHERE material_id = ?').run(id)
      const insertImage = db.prepare('INSERT INTO material_images (material_id, url, sort_order) VALUES (?, ?, ?)')
      images.forEach((img: { url: string }, i: number) => {
        insertImage.run(id, img.url, i)
      })
    }

    if (Array.isArray(specs)) {
      db.prepare('DELETE FROM material_specs WHERE material_id = ?').run(id)
      const insertSpec = db.prepare('INSERT INTO material_specs (material_id, key, value) VALUES (?, ?, ?)')
      specs.forEach((spec: { key: string; value: string }) => {
        insertSpec.run(id, spec.key, spec.value)
      })
    }

    if (Array.isArray(tags)) {
      db.prepare('DELETE FROM material_tags WHERE material_id = ?').run(id)
      recountTagUsage()
      syncMaterialTags(id, tags)
    }

    const updated = db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as any
    const tagsMap = getTagsForMaterials([id])
    res.json({
      success: true,
      data: {
        ...updated,
        tags: tagsMap[id] || []
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新材料失败' })
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as any

    if (!material) {
      res.status(404).json({ success: false, error: '材料不存在' })
      return
    }
    if (material.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权删除此材料' })
      return
    }

    db.prepare('DELETE FROM materials WHERE id = ?').run(id)
    recountTagUsage()
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除材料失败' })
  }
})

router.post('/batch-import', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: '请上传CSV文件' })
      return
    }

    const csvContent = req.file.buffer.toString('utf-8')
    const records: any[] = []

    const parser = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    for await (const record of parser) {
      records.push(record)
    }

    const insertMaterial = db.prepare(
      'INSERT INTO materials (user_id, title, category, description, price, is_swappable) VALUES (?, ?, ?, ?, ?, ?)'
    )

    let imported = 0
    const insertMany = db.transaction((items: any[]) => {
      for (const item of items) {
        insertMaterial.run(
          req.user!.id,
          item.title || '',
          item.category || '',
          item.description || '',
          parseFloat(item.price) || 0,
          item.is_swappable === '0' ? 0 : 1
        )
        imported++
      }
    })

    insertMany(records)
    res.json({ success: true, data: { imported } })
  } catch (error) {
    res.status(500).json({ success: false, error: '批量导入失败' })
  }
})

router.get('/batch-export', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const materials = db.prepare(
      'SELECT title, category, description, price, is_swappable, is_active, view_count, created_at FROM materials WHERE user_id = ?'
    ).all(req.user!.id) as any[]

    const stringifier = stringify({
      header: true,
      columns: ['title', 'category', 'description', 'price', 'is_swappable', 'is_active', 'view_count', 'created_at']
    })

    const chunks: Buffer[] = []
    for await (const chunk of stringifier) {
      chunks.push(Buffer.from(chunk))
    }

    for (const m of materials) {
      stringifier.write(m)
    }
    stringifier.end()

    const csvBuffer = Buffer.concat(chunks)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=materials.csv')
    res.send(csvBuffer)
  } catch (error) {
    res.status(500).json({ success: false, error: '批量导出失败' })
  }
})

router.put('/:id/pin', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { pinned } = req.body

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as any
    if (!material) {
      res.status(404).json({ success: false, error: '材料不存在' })
      return
    }
    if (material.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权操作此材料' })
      return
    }

    db.prepare("UPDATE materials SET is_pinned = ?, updated_at = datetime('now') WHERE id = ?").run(pinned ? 1 : 0, id)
    const updated = db.prepare('SELECT * FROM materials WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '置顶操作失败' })
  }
})

export default router
