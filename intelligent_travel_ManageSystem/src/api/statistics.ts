import request from '@/utils/request'

// 获取首页统计数据 (假设接口)
export const getStatisticsAPI = () => {
  // 如果后端还没有这个接口，可以先由前端 Mock 或暂时留空
  // 这里假设有一个获取总览数据的接口
  return request({
    url: '/statistics/overview', 
    method: 'get'
  })
}