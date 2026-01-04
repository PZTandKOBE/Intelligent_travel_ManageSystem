import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

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
    // 在这里可以添加 token，例如：
    // const userStore = useUserStore()
    // if (userStore.token) {
    //   config.headers.Authorization = userStore.token
    // }
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
    // 假设后端返回 code 0 代表成功
    if (res.code === 0) {
      return res
    } else {
      ElMessage.error(res.message || '系统错误')
      
      // 处理特定状态码，比如 40100 未登录
      if (res.code === 40100) {
        // 可以在这里处理登出逻辑，例如重定向到登录页
        // window.location.href = '/login'
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  (error: any) => {
    console.error('Request Err:', error)
    ElMessage.error(error.message || '请求超时')
    return Promise.reject(error)
  }
)

export default service