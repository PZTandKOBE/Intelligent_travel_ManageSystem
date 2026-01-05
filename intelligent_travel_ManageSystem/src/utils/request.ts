import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

// 递归清洗对象中的空值 (undefined, null, '')
const cleanParams = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data
  }
  // 如果是 FormData，不做处理
  if (data instanceof FormData) {
    return data
  }
  
  if (Array.isArray(data)) {
    return data.map(item => cleanParams(item))
  }

  const newData: any = {}
  for (const key in data) {
    const value = data[key]
    // 过滤掉 undefined, null, 和空字符串
    if (value !== undefined && value !== null && value !== '') {
      newData[key] = cleanParams(value)
    }
  }
  return newData
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api', 
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 自动清洗 data 和 params 中的空值，防止后端查询失败
    if (config.data && typeof config.data === 'object') {
      config.data = cleanParams(config.data)
    }
    if (config.params && typeof config.params === 'object') {
      config.params = cleanParams(config.params)
    }
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
    
    // 二进制流直接返回
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return res
    }

    if (res.code === 0) {
      return res
    } else {
      // 401: 未登录
      if (res.code === 40100 || res.code === 401) {
        ElMessage.error('登录已过期，请重新登录')
        window.location.href = '/login'
        return Promise.reject(new Error('Unauthorized'))
      }
      // 403: 无权限
      if (res.code === 40300 || res.code === 403) {
        ElMessage.error('您没有权限执行此操作')
        return Promise.reject(new Error('Forbidden'))
      }
      
      ElMessage.error(res.message || '系统错误')
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  (error: any) => {
    console.error('Request Err:', error)
    let msg = '请求超时或服务器异常'
    if (error.response) {
      if (error.response.status === 401) {
        window.location.href = '/login'
      }
      if (error.response.status === 404) msg = '接口不存在 (404)'
      if (error.response.status === 500) msg = '服务器内部错误 (500)'
    }
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default service