export const POINTS_LEVELS = [
  { name: '手工萌新', minPoints: 0, icon: '🌱' },
  { name: '手工爱好者', minPoints: 200, icon: '🌿' },
  { name: '手工达人', minPoints: 500, icon: '🎨' },
  { name: '手工大师', minPoints: 1500, icon: '👑' },
  { name: '手工传奇', minPoints: 5000, icon: '💎' },
]

export const POINTS_RULES: Record<string, number> = {
  check_in: 10,
  publish_material: 20,
  publish_wanted: 10,
  publish_work: 30,
  trade_complete: 50,
  review: 15,
  invite_friend: 100,
  check_in_7day_bonus: 50,
  check_in_30day_bonus: 200,
  publish_post: 25,
  post_like: 1,
  post_comment: 5,
  post_essence: 100,
}

export const POST_CATEGORIES = [
  { value: 'tutorial', label: '手工教程', icon: '📚' },
  { value: 'showcase', label: '作品展示', icon: '🎨' },
  { value: 'review', label: '材料测评', icon: '⭐' },
  { value: 'diary', label: '打卡日记', icon: '📝' },
  { value: 'qa', label: '求助问答', icon: '❓' },
]

export const REPORT_REASONS = [
  { value: 'spam', label: '垃圾广告' },
  { value: 'inappropriate', label: '不适当内容' },
  { value: 'copyright', label: '版权侵犯' },
  { value: 'harassment', label: '骚扰/人身攻击' },
  { value: 'other', label: '其他' },
]

export const COMMUNITY_BADGE_DEFINITIONS = [
  { name: '活跃达人', description: '发布10篇以上帖子', icon: '🔥', requirement_type: 'post_count', requirement_value: 10 },
  { name: '精华达人', description: '获得5篇精华帖', icon: '💎', requirement_type: 'essence_count', requirement_value: 5 },
  { name: '人气王', description: '累计获得1000个点赞', icon: '🌟', requirement_type: 'total_likes', requirement_value: 1000 },
  { name: '热心助人', description: '回复50条评论', icon: '💝', requirement_type: 'comment_count', requirement_value: 50 },
  { name: '社区达人', description: '综合社区贡献第一名', icon: '👑', requirement_type: 'comprehensive', requirement_value: 1 },
]
