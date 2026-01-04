import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api', 
  timeout: 10000,
  withCredentials: true, // 关键：允许跨域携带 Cookie
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Session 模式下通常不需要手动加 Token，Cookie 会自动携带
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    // 兼容处理：部分接口直接返回二进制流（如导出文件），没有 code 字段
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return res
    }

    // 假设后端返回 code 0 代表成功
    if (res.code === 0) {
      return res
    } else {
      // 处理特定状态码
      // 40100: 未登录 或 Session 过期
      if (res.code === 40100 || res.code === 401) {
        ElMessage.error('登录已过期，请重新登录')
        // 强制刷新并跳转回登录页，确保清除所有内存状态
        window.location.href = '/login'
        return Promise.reject(new Error(res.message || 'Unauthorized'))
      }

      // 40300: 无权限
      if (res.code === 40300 || res.code === 403) {
        ElMessage.error('您没有权限执行此操作')
        return Promise.reject(new Error(res.message || 'Forbidden'))
      }

      ElMessage.error(res.message || '系统错误')
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  (error: any) => {
    console.error('Request Err:', error)
    // 处理 HTTP 状态码错误（如 404, 500 等网络层面的错误）
    let msg = '请求超时或服务器异常'
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        window.location.href = '/login'
        return Promise.reject(error)
      }
      if (status === 403) msg = '无权访问'
      if (status === 404) msg = '请求资源不存在'
      if (status === 500) msg = '服务器内部错误'
    }
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default service