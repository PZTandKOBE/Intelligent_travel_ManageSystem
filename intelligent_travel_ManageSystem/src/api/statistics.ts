// src/api/statistics.ts
// 注意：这是一个模拟接口，用于在后端未提供统计 API 时展示演示数据

/**
 * 模拟延迟
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 获取仪表盘聚合数据
 * 包含：基础指标卡片、趋势图数据、排行榜数据
 */
export const getDashboardStatsAPI = async () => {
  // 模拟网络请求延迟
  await delay(800)

  return {
    code: 0,
    data: {
      // 1. 顶部核心指标卡片 (对应需求：对话统计、浏览量)
      overview: {
        totalUsers: 12580,      // 总用户数
        activeUsersToday: 863,  // 今日日活
        totalConversations: 45210, // 总会话数
        totalRecommendations: 3205 // 累计推荐次数
      },

      // 2. 趋势图数据 (对应需求：用户行为分析 - 近7日流量)
      trafficTrend: {
        dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        pv: [1200, 1350, 1400, 1100, 1600, 2100, 2300], // 浏览量
        uv: [500, 600, 650, 480, 700, 950, 1100]        // 访客数
      },

      // 3. 热门非遗项目排行 (对应需求：推荐效果 - 热门项目)
      topProjects: [
        { name: '广绣', count: 1250 },
        { name: '粤剧', count: 980 },
        { name: '醒狮', count: 850 },
        { name: '凉茶制作', count: 620 },
        { name: '剪纸', count: 540 }
      ],

      // 4. 用户兴趣分布 (对应需求：推荐转化率辅助分析)
      interestDistribution: [
        { value: 40, name: '传统美术' },
        { value: 30, name: '传统技艺' },
        { value: 15, name: '民俗' },
        { value: 10, name: '传统戏剧' },
        { value: 5, name: '其他' }
      ]
    },
    message: 'ok'
  }
}