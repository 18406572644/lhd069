import { Router, type Response } from 'express'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database.js'
import { authMiddleware, type AuthRequest, JWT_SECRET } from '../middleware/auth.js'

const router = Router()

function generateToken(user: { id: number; username: string; email: string }): string {
  return jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: '用户名、邮箱和密码不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email) as { id: number } | undefined
    if (existing) {
      res.status(409).json({ success: false, error: '用户名或邮箱已存在' })
      return
    }

    const password_hash = bcryptjs.hashSync(password, 10)
    const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, password_hash)

    const user = { id: Number(result.lastInsertRowid), username, email }
    const token = generateToken(user)

    res.status(201).json({ success: true, data: { token, user } })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ success: false, error: '邮箱和密码不能为空' })
      return
    }

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
    if (!row) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' })
      return
    }

    const valid = bcryptjs.compareSync(password, row.password_hash)
    if (!valid) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' })
      return
    }

    const user = { id: row.id, username: row.username, email: row.email }
    const token = generateToken(user)
    res.json({ success: true, data: { token, user } })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const row = db.prepare('SELECT id, username, email, avatar, bio, credit_score, is_shop_owner, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    if (!row) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({ success: true, data: row })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

export default router
