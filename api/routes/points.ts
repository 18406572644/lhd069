import { Router, type Response } from 'express'
import db, { POINTS_LEVELS, POINTS_RULES, ensurePointsAccount, addPoints } from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/check-in', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const today = new Date().toISOString().slice(0, 10)

    const existing = db.prepare('SELECT * FROM check_in_records WHERE user_id = ? AND check_in_date = ?').get(userId, today) as any
    if (existing) {
      res.status(400).json({ success: false, error: '今日已签到' })
      return
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const yesterdayRecord = db.prepare('SELECT * FROM check_in_records WHERE user_id = ? AND check_in_date = ?').get(userId, yesterday) as any

    let consecutiveDays = 1
    if (yesterdayRecord) {
      consecutiveDays = yesterdayRecord.consecutive_days + 1
    }

    let pointsEarned = POINTS_RULES.check_in
    let bonusType = ''

    if (consecutiveDays % 30 === 0) {
      pointsEarned += POINTS_RULES.check_in_30day_bonus
      bonusType = '30day'
    } else if (consecutiveDays % 7 === 0) {
      pointsEarned += POINTS_RULES.check_in_7day_bonus
      bonusType = '7day'
    }

    db.prepare(
      'INSERT INTO check_in_records (user_id, check_in_date, consecutive_days, points_earned, bonus_type) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, today, consecutiveDays, pointsEarned, bonusType)

    const description = bonusType === '30day'
      ? `每日签到 +${POINTS_RULES.check_in}，连续30天额外奖励 +${POINTS_RULES.check_in_30day_bonus}`
      : bonusType === '7day'
      ? `每日签到 +${POINTS_RULES.check_in}，连续7天额外奖励 +${POINTS_RULES.check_in_7day_bonus}`
      : `每日签到 +${POINTS_RULES.check_in}`

    addPoints(userId, pointsEarned, 'check_in', description, '')

    const account = db.prepare('SELECT * FROM points_accounts WHERE user_id = ?').get(userId) as any

    res.json({
      success: true,
      data: {
        points_earned: pointsEarned,
        consecutive_days: consecutiveDays,
        bonus_type: bonusType,
        balance: account.balance,
        level: account.level,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '签到失败' })
  }
})

router.get('/check-in/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const today = new Date().toISOString().slice(0, 10)

    const todayRecord = db.prepare('SELECT * FROM check_in_records WHERE user_id = ? AND check_in_date = ?').get(userId, today) as any

    const latestRecord = db.prepare('SELECT * FROM check_in_records WHERE user_id = ? ORDER BY check_in_date DESC LIMIT 1').get(userId) as any

    let consecutiveDays = 0
    let checkedInToday = false

    if (todayRecord) {
      checkedInToday = true
      consecutiveDays = todayRecord.consecutive_days
    } else if (latestRecord) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      if (latestRecord.check_in_date === yesterday) {
        consecutiveDays = latestRecord.consecutive_days
      }
    }

    const recentRecords = db.prepare(
      'SELECT check_in_date FROM check_in_records WHERE user_id = ? ORDER BY check_in_date DESC LIMIT 30'
    ).all(userId) as { check_in_date: string }[]

    const checkInDates = recentRecords.map((r) => r.check_in_date)

    res.json({
      success: true,
      data: {
        checked_in_today: checkedInToday,
        consecutive_days: consecutiveDays,
        check_in_dates: checkInDates,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取签到状态失败' })
  }
})

router.get('/account', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    ensurePointsAccount(userId)
    const account = db.prepare('SELECT * FROM points_accounts WHERE user_id = ?').get(userId) as any

    const currentLevelIdx = POINTS_LEVELS.findIndex((l) => l.name === account.level)
    const nextLevel = currentLevelIdx < POINTS_LEVELS.length - 1 ? POINTS_LEVELS[currentLevelIdx + 1] : null

    res.json({
      success: true,
      data: {
        balance: account.balance,
        total_earned: account.total_earned,
        total_spent: account.total_spent,
        level: account.level,
        level_info: POINTS_LEVELS[currentLevelIdx],
        next_level: nextLevel,
        progress_to_next: nextLevel
          ? Math.min(100, Math.round(((account.total_earned - POINTS_LEVELS[currentLevelIdx].minPoints) / (nextLevel.minPoints - POINTS_LEVELS[currentLevelIdx].minPoints)) * 100))
          : 100,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取积分账户失败' })
  }
})

router.get('/records', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20))
    const type = req.query.type as string
    const offset = (page - 1) * pageSize

    let countQuery = 'SELECT COUNT(*) as total FROM points_records WHERE user_id = ?'
    let listQuery = 'SELECT * FROM points_records WHERE user_id = ?'
    const params: any[] = [userId]

    if (type && (type === 'earn' || type === 'spend')) {
      countQuery += ' AND type = ?'
      listQuery += ' AND type = ?'
      params.push(type)
    }

    listQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'

    const countRow = db.prepare(countQuery).get(...params) as { total: number }
    const records = db.prepare(listQuery).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: {
        items: records,
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.ceil(countRow.total / pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取积分记录失败' })
  }
})

router.get('/levels', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, data: POINTS_LEVELS })
})

router.get('/rules', async (_req: AuthRequest, res: Response): Promise<void> => {
  const rules = [
    { source: 'check_in', label: '每日签到', amount: POINTS_RULES.check_in },
    { source: 'check_in_7day_bonus', label: '连续7天签到奖励', amount: POINTS_RULES.check_in_7day_bonus },
    { source: 'check_in_30day_bonus', label: '连续30天签到奖励', amount: POINTS_RULES.check_in_30day_bonus },
    { source: 'publish_material', label: '发布材料', amount: POINTS_RULES.publish_material },
    { source: 'publish_wanted', label: '发布求购', amount: POINTS_RULES.publish_wanted },
    { source: 'publish_work', label: '发布作品', amount: POINTS_RULES.publish_work },
    { source: 'trade_complete', label: '完成交易', amount: POINTS_RULES.trade_complete },
    { source: 'review', label: '发表评价', amount: POINTS_RULES.review },
    { source: 'invite_friend', label: '邀请好友', amount: POINTS_RULES.invite_friend },
  ]
  res.json({ success: true, data: rules })
})

router.post('/consume', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { amount, source, description } = req.body

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: '消耗积分数量必须大于0' })
      return
    }

    ensurePointsAccount(userId)
    const account = db.prepare('SELECT * FROM points_accounts WHERE user_id = ?').get(userId) as any

    if (account.balance < amount) {
      res.status(400).json({ success: false, error: '积分余额不足' })
      return
    }

    addPoints(userId, -amount, source || 'consume', description || '积分消耗')

    const updated = db.prepare('SELECT * FROM points_accounts WHERE user_id = ?').get(userId) as any
    res.json({
      success: true,
      data: {
        balance: updated.balance,
        level: updated.level,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '积分消耗失败' })
  }
})

export default router
